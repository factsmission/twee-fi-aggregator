const config = require('./config');
const WebSocket = require('ws');
var rdf = require('rdflib');
var webClient = require('solid-web-client')(rdf);
var request = require('request');


function checkIfNew(obj, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].websocket === obj.websocket && array[i].webpage === obj.webpage) {
            return false;
        }
    }
    return true;
}

function subscribe (ws, container) {
    var ws = new WebSocket(ws);

    console.log("Init ws for " + container);
    ws.on('message', function incoming(data) {
        console.log("Message coming!");
        if (data.slice(0, 3) === 'pub') {
            getAllReviews(data.substring(4));
        }
        console.log(data);
    });

    console.log("Subscribing to " + container);
    ws.on('open', function open() {
        ws.send('sub ' + container);
    });
}

function loadIntoCLDI (RDFIRI) {
    console.log("Loading into CLDI " + RDFIRI);
    var query = "LOAD <" + RDFIRI + "> INTO GRAPH <" + config.graph + ">";
    request("http://" + config.cldi.username + ":" + config.cldi.password + "@" + config.cldi.baseUrl + "/sparql?query=" + query, function (error, response, body) {
        if (error) {
            console.error("[ERR] Failed to load data into CLDI!");
            console.error(error);
        }
    });
};

function getAllReviewsPerUser (twitterUser) {
    webClient.get(twitterUser).then(function (response) {
        response.resource.contentsUris.forEach(function(tweet) {
            webClient.get(tweet).then(function (response) {
                response.resource.contentsUris.forEach(function(tweetRDF) {
                    loadIntoCLDI(tweetRDF);
                });
            });
        });
    });
}

function getAllReviews (container) {
    webClient.get(container).then(function (response) {
        response.resource.contentsUris.forEach(function(twitterUser) {
            getAllReviewsPerUser(twitterUser);
        });
    });
}

function getUserList () {
    console.log("GET users list")
    request({
        url: config.users,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    }, function(error, response, body){
        if (error) {
            console.error(error);
        }

        if (response.statusCode == 200) {
            console.log('GOT users list');
            var newList;
            try {
                newList = JSON.parse(body);
                for (var i = 0; i < newList.length; i++) {
                    if (checkIfNew(newList[i], subscribersList)) {
                        subscribersList.push(newList[i]);
                        console.log("Added a new user!");
                        console.log(newList[i]);

                        subscribe(newList[i].websocket, newList[i].webpage);
                        getAllReviews(newList[i].webpage);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            console.error('ERR ' + response.statusCode);
        }
    });
}

var subscribersList = [];

getUserList();
setInterval(function(){
    getUserList();
}, 60000*5);
