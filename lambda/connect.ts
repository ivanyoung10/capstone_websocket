const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

type ConnectEvent = {
    requestContext: {
        connectionId: string;
        [key: string]: any;
    };
    [key: string]: any;
}

type DDBItem = {
    connectionId: string;
    timestamp: number;
}

type PutParams = {
    TableName: string;
    Item: DDBItem;
}

type HandlerResponse = {
    statusCode: number;
    body: string;
}

exports.handler = async (event: ConnectEvent): Promise<HandlerResponse> => {
    const connectionId: string = event.requestContext.connectionId;
    
    const putParams: PutParams = {
        TableName: process.env.TABLE_NAME!,
        Item: {
            connectionId: connectionId,
            timestamp: Date.now(),
        },
    };

    try {
        await (ddb.put(putParams).promise() as Promise<any>);
        return { statusCode: 200, body: 'Connected.' };
    } catch (err: any) {
        console.error('Error:', err);
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
};
