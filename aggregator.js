const config = require('./config');
const WebSocket = require('ws');
var rdf = require('rdflib');
var webClient = require('solid-web-client')(rdf);
var request = require('request');

const ws = new WebSocket(config.ws);

ws.on('message', function incoming(data) {
    console.log("Message coming!");
    if (data.slice(0, 3) === 'pub') {
        getAllReviews(data.substring(4));
    }
    console.log(data);
});

function subscribe (container) {
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
            //subscribe(twitterUser);
            getAllReviewsPerUser(twitterUser);
        });
    });
}

subscribe(config.https);
getAllReviews(config.https);
