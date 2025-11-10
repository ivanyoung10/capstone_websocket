import * as cdk from 'aws-cdk-lib';

type DefaultEvent = {
    body: string
}

exports.handler = async (event: DefaultEvent) => {
  console.log('Default route called:', JSON.stringify(event, null, 2));
  return { statusCode: 200, body: 'Default route.' };
};
