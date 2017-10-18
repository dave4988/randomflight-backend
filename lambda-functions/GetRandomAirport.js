const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    console.log('Received event ', event);

    // The body field of the event in a proxy integration is a raw string.
    // In order to extract meaningful values, we need to first parse this string
    // into an object. A more robust implementation might inspect the Content-Type
    // header first and use a different parsing strategy based on that value.

    //get data for return object here

    var randomAirport = getRandomAirport('test', 'test');
    console.log('Airport returned: ', randomAirport);


    //TODO turn this into a .then() in the above statement. look at unicorn example
    callback(null, {
        statusCode: 201,
        body: JSON.stringify({
            AirportName: randomAirport.AirportName,
            AirportCode: randomAirport.AirportCode,
            DistanceFromOrigin: randomAirport.DistanceFromOrigin,
            Country: randomAirport.Country,
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
};

// This is where you would implement logic to find the optimal unicorn for
// this ride (possibly invoking another Lambda function as a microservice.)
// For simplicity, we'll just pick a unicorn at random.
function findUnicorn(pickupLocation) {
    console.log('Finding unicorn for ', pickupLocation.Latitude, ', ', pickupLocation.Longitude);
    return fleet[Math.floor(Math.random() * fleet.length)];
}

function getRandomAirport(originAirport, maxMilesFromOrigin) {
    //TODO get this from DB
    const airport = [
        {
            AirportName: 'Ronald Reagan National Airport',
            AirportCode: 'KDCA',
            DistanceFromOrigin: '800',
            Country: 'United States of America',
        }
    ];
    return airport;
}

function toUrlString(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

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