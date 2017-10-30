const AWS = require('aws-sdk');
//TODO figure out the difference between these two
const ddb = new AWS.DynamoDB.DocumentClient();
const ddbbase = new AWS.DynamoDB();
const GeographicLib = require("geographiclib");
const geod = GeographicLib.Geodesic.WGS84;

exports.handler = (event, context, callback) => {

    //console.log('Received event ', event);
    // The body field of the event in a proxy integration is a raw string.
    // In order to extract meaningful values, we need to first parse this string
    // into an object. A more robust implementation might inspect the Content-Type
    // header first and use a different parsing strategy based on that value.
    console.log('event body:',event.body);
    const requestBody = JSON.parse(event.body);
    const origin = requestBody.origin;
    const radius = requestBody.maxMilesFromOrigin;

    //Get requested origin airport
    //TODO maybe put this into two chained lambda functions?
    var originLat;
    var originLon;
    var bounds;
    var params = {
        AttributesToGet: [
            "latitude",
            "longitude"
        ],
        TableName: "Airports",
        Key : {
            "icao" : {
                "S" : origin
            }
        }
    };
    ddbbase.getItem(params, function(err, data) {
        if (err) {
            console.log(err);
            errorResponse(err.message, context.awsRequestId, callback);
        }
        else {
            originLat = data.Item.latitude.N;
            originLon = data.Item.longitude.N;
            console.log("origin lat: ",originLat," origin lon: ",originLon);
            bounds = getBounds(originLat, originLon, radius);
            //console.log('bounds:',bounds);
            var params = {
                TableName: "Airports",
                ExpressionAttributeValues: {
                    ":NorthWestBoundLat": parseFloat(bounds.NorthWestBoundLat),
                    ":NorthWestBoundLon": parseFloat(bounds.NorthWestBoundLon),
                    ":SouthEastBoundLat": parseFloat(bounds.SouthEastBoundLat),
                    ":SouthEastBoundLon": parseFloat(bounds.SouthEastBoundLon)
                },
                FilterExpression: "(latitude between :SouthEastBoundLat and :NorthWestBoundLat) and (longitude between :NorthWestBoundLon and :SouthEastBoundLon)"
            };
            ddb.scan(params, function(err, data) {
                if (err) {
                    console.log(err);
                    errorResponse(err.message, context.awsRequestId, callback);
                }
                else {
                    //console.log("returned from dynamo: ", data);
                    if (data.Items.length > 0) {
                        var airport = data.Items[Math.floor(Math.random()*data.Items.length)];
                        console.log('airport selected: ', airport)
                        callback(null, {
                            statusCode:201,
                            body: JSON.stringify({
                                AirportName: airport.name,
                                AirportCode: airport.icao,
                                Country: airport.countryName,
                                City: airport.city,
                                State: airport.stateCode,
                                Classification: airport.classification
                            }),
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                            },
                        });
                    }
                    else {
                        errorResponse('No airports found within the selected radius.', context.awsRequestId, callback);
                    }
                }
            });
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

//TODO there's some wonkiness here. maybe use N, S, E, and W instead of just NW and SE?
//for some reason putting in number too high breaks the function
function getBounds(lat, lon, radiusInMiles) {
    radius = milesToKm(radiusInMiles);
    //TODO get rid of magic numbers
    var northWestBound = geod.Direct(lat, lon, 315, radius * 1000);
    var southEastBound = geod.Direct(lat, lon, 135, radius * 1000);
    console.log("The northWestBound is (" + northWestBound.lat2.toFixed(8) + ", " + northWestBound.lon2.toFixed(8) + ").");
    console.log("The southEastBound is (" + southEastBound.lat2.toFixed(8) + ", " + southEastBound.lon2.toFixed(8) + ").");
    return {
        NorthWestBoundLat: northWestBound.lat2.toFixed(8),
        NorthWestBoundLon: northWestBound.lon2.toFixed(8),
        SouthEastBoundLat: southEastBound.lat2.toFixed(8),
        SouthEastBoundLon: southEastBound.lon2.toFixed(8)
    }
}

function milesToKm(miles) {
    return miles * 1.609344;
}