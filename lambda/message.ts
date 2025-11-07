const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

interface RequestContext {
    domainName: string;
    stage: string;
}

interface LambdaEvent {
    requestContext: RequestContext;
    body: string;
}

interface ConnectionItem {
    connectionId: string;
}

interface ScanResult {
    Items?: ConnectionItem[];
}

exports.handler = async (event: LambdaEvent): Promise<{ statusCode: number; body: string }> => {
    const { domainName, stage } = event.requestContext;
    const apigwManagementApi: any = new (AWS as any).ApiGatewayManagementApi({
        endpoint: `${domainName}/${stage}`,
    });

    // Get all connections
    const scanParams: { TableName: string } = {
        TableName: process.env.TABLE_NAME!,
    };

    let connections: ScanResult;
    try {
        connections = (await ddb.scan(scanParams).promise()) as ScanResult;
    } catch (err: any) {
        console.error('Error scanning connections:', err);
        return { statusCode: 500, body: 'Failed to get connections.' };
    }

    const message = JSON.parse(event.body) as { data: any };
    const postData: string = JSON.stringify({
        action: 'message',
        data: message.data,
        timestamp: Date.now(),
    });

    const postCalls = (connections.Items || []).map(async ({ connectionId }: ConnectionItem) => {
        try {
            await apigwManagementApi
                .postToConnection({ ConnectionId: connectionId, Data: postData })
                .promise();
        } catch (err: any) {
            if (err.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                await ddb.delete({
                    TableName: process.env.TABLE_NAME,
                    Key: { connectionId },
                }).promise();
            } else {
                throw err;
            }
        }
    });

    try {
        await Promise.all(postCalls);
        return { statusCode: 200, body: 'Message sent.' };
    } catch (err: any) {
        console.error('Error sending message:', err);
        return { statusCode: 500, body: 'Failed to send message.' };
    }
};
