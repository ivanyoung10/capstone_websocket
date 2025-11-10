import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

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
    
    const putParams = {
        TableName: process.env.TABLE_NAME!,
        Item: {
            connectionId: { S: connectionId },
            timestamp: { N: Date.now().toString() },
        },
    };

    try {
        await ddb.send(new PutItemCommand(putParams));
        return { statusCode: 200, body: 'Connected.' };
    } catch (err: any) {
        console.error('Error:', err);
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
};