const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    console.log('Received event ', event);

    // The body field of the event in a proxy integration is a raw string.
    // In order to extract meaningful values, we need to first parse this string
    // into an object. A more robust implementation might inspect the Content-Type
    // header first and use a different parsing strategy based on that value.

    //TODO change to take distance into account
    var params = {
        TableName: "Airports",
        IndexName: 'countryCode-index',
        ExpressionAttributeValues: {
            ":countryCode": "US"
        },
        KeyConditionExpression: "countryCode = :countryCode",
        Limit: 50
    };
    ddb.query(params, function(err, data) {
        if (err) {
            console.log(err);
            errorResponse(err.message, context.awsRequestId, callback);
        }
        else {
            if (data.Items) {
                //TODO change to pick random item in the response
                var airport = data.Items[Math.floor(Math.random()*data.Items.length)];
                //airport = data.Items[0];
                callback(null, {
                    statusCode:201,
                    body: JSON.stringify({
                        AirportName: airport.name,
                        AirportCode: airport.icao,
                        //TODO make function to calculate
                        DistanceFromOrigin: 200,
                        Country: airport.Country
                    }),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
            else {
                errorResponse('No airports found within the selected radius.', context.awsRequestId, callback);
            }
            console.log('response from dynamo: ', data)
        }
    });
};

function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}