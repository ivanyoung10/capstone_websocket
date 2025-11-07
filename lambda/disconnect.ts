const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

interface DisconnectEvent {
    requestContext: {
        connectionId: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface DDBItem {
    connectionId: string;
    timestamp: number;
}

interface DeleteParams {
    TableName: string;
    Key: {
        connectionId: string;
    };
}

interface HandlerResponse {
    statusCode: number;
    body: string;
}


exports.handler = async (event: DisconnectEvent): Promise<HandlerResponse> => {
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    console.error('Missing TABLE_NAME environment variable');
    return { statusCode: 500, body: 'Server misconfiguration: TABLE_NAME not set' };
  }

  // connectionId comes from API Gateway WebSocket requestContext.connectionId
  const connectionId = event.requestContext?.connectionId;
  if (!connectionId) {
    console.error('Missing connectionId on event.requestContext');
    return { statusCode: 400, body: 'Bad Request: missing connectionId' };
  }

  const deleteParams: DeleteParams = {
    TableName: tableName,
    Key: {
      connectionId: connectionId, // narrowed to string by the check above
    },
  };

  try {
    await ddb.delete(deleteParams).promise();
    return { statusCode: 200, body: 'Disconnected.' };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
  }
}
