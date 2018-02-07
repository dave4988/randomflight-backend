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
    accessKeyId: "xxxx",
    secretAccessKey: "xxxx"
});
 
//create a doc client to allow using JSON directly
var docClient = new AWS.DynamoDB.DocumentClient();
 
//prepared JSON file
//[{ ... }, { ... }]
var placeFile = "airports.json";
var placeArray = jsonfile.readFileSync(placeFile);
 
//utility function to create a single put request
function getPlace(index){
    var aiportToSave = placeArray[index];
    //console.log("icao: ", aiportToSave.icao);
    return {
        "TableName": 'Airports',
        "Item": placeArray[index],
        "Key": {
            "icao": {
                "S" : aiportToSave.icao
            }
        }
    };
}
 
//recursive function to save one place at a time
function savePlaces(index){
    if(index == placeArray.length){
        console.log("saved all.");
        return;
    }
 
    var params = getPlace(index);
    var airportToSave = placeArray[index];
    //spit out what we are saving for sanity
    //console.log(JSON.stringify(params));
    console.log(airportToSave.icao ? "next up: " + airportToSave.icao : "next up: n/a");
    //use the client to execute put request.
    if (airportToSave.classification <= 3 && airportToSave.icao) {
        docClient.put(params, function(err, data) {
            if (err) {
                console.log("ERROR:");
                console.log(err);
            }
            else {
                console.log("added!",params.Key.icao.S);
            }
            index += 1;
            //save the next place on the list
            //with half a second delay
            setTimeout(function(){
                savePlaces(index);
            }, 500);
        });
    }
    else {
        console.log('did not add airport because it was category 1-3 or didnt have icao');
        index += 1;
        savePlaces(index);
    }
}
 
//start saving from index - 0
savePlaces(0);
