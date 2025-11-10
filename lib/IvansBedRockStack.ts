import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'


export class IvansBedRockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'websocket-connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });


    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: connectionsTable.tableName,
      },
    });

    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: connectionsTable.tableName,
      },
    });

    const defaultHandler = new lambda.Function(this, 'DefaultHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'default.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    const messageHandler = new lambda.Function(this, 'MessageHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'message.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        TABLE_NAME: connectionsTable.tableName,
      },
    });

    const webSocketApi = new apigwv2.WebSocketApi(this, 'IvansWebSocketApi', {
      apiName: 'IvansWebSocketApi',
      description: 'WebSocket API for real-time communication',
      routeSelectionExpression: '$request.body.action',
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
      },
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration('DefaultIntegration', defaultHandler),
      },
    });

    webSocketApi.addRoute('sendMessage', {
      integration: new WebSocketLambdaIntegration('SendMessageIntegration', messageHandler),
    });

    const stage = new apigwv2.WebSocketStage(this, 'MyWebSocketStage', {
      webSocketApi,
      stageName: 'dev',
      description: 'Development stage',
      autoDeploy: true,
    });

    const apiGatewayManagementPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:ManageConnections'],
      resources: [
        `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/${stage.stageName}/*`,
      ],
    });

    messageHandler.addToRolePolicy(apiGatewayManagementPolicy);

    //Add additional permissions
    

    // Output the WebSocket URL
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: stage.url,
      description: 'WebSocket API URL',
    });

    new cdk.CfnOutput(this, 'TestCommand', {
    value: `wscat -c ${stage.url}`,
    description: 'Command to test WebSocket API with wscat',
    });

  }
}
