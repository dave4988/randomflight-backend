/*********************************
Simple Demo for loading files into
DynamoDB.
**********************************/
 
//package to read json files
var jsonfile = require('jsonfile');
//AWS node sdk
var AWS = require('aws-sdk');
 
//need to update region in config
AWS.config.update({
    region: "us-east-1",
    accessKeyId: "xxx",
    secretAccessKey: "xxx"
});
 
//create a doc client to allow using JSON directly
var docClient = new AWS.DynamoDB();
 
//prepared JSON file
//[{ ... }, { ... }]
var placeFile = "airports.json";
var placeArray = jsonfile.readFileSync(placeFile);
 
//utility function to create a single put request
function getPlace(index){
    var airportToDelete = placeArray[index];
    console.log("icao: ", airportToDelete.icao);
    return {
        "TableName": 'Airports',
        "Key" : {
            "icao": {
                "S" : airportToDelete.icao
            }
        }
    };
}
 
//recursive function to save one place at a time
function deletePlaces(index){
    if(index == placeArray.length){
        console.log("saved all.");
        return;
    }
 
    var params = getPlace(index);
    var airportToDelete = placeArray[index];
    //spit out what we are saving for sanity
    console.log(JSON.stringify(params));
    //use the client to execute put request.
    if (airportToDelete.classification > 3 && airportToDelete.icao) {
        docClient.deleteItem(params, function(err, data) {
            if (err) {
                console.log("ERROR:");
                console.log(err);
            }
            else {
                console.log("deleted!",params.Key.icao.S);
            }
            index += 1;
            //save the next place on the list
            //with half a second delay
            setTimeout(function(){
                deletePlaces(index);
            }, 200);
        });
    }
    else {
        console.log('did not delete item because it was category 1-3 or didnt have icao');
        index += 1;
        deletePlaces(index);
    }
}
 
//start saving from index - 0
deletePlaces(0);