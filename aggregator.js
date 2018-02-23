const config = require('./config');
const WebSocket = require('ws');
var rdf = require('rdflib');
var webClient = require('solid-web-client')(rdf);
var request = require('request');
var adifference = require('array-difference');
require('console-stamp')(console, { pattern: 'yyyy/mm/dd HH:MM:ss.l' });

function subscribe (ws, container) {
    let wsIndex = wsList.push(new WebSocket(ws)) -1;

    console.log("Init ws for " + container);
    wsList[wsIndex].on('message', function incoming(data) {
        console.log("Message coming!");
        console.log(data);
        if (data.slice(0, 3) === 'pub') {
            getAllReviews(data.substring(4));
        }
    });

    console.log("Subscribing to " + container);
    wsList[wsIndex].on('open', function open() {
        this.send('sub ' + container);
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
    if (twitterUser.indexOf('latestReview.ttl') !== -1 ) {
        console.log("XXXXXX")
    } else {
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

                let diff = adifference(newList, subscribersList);

                if (diff.length > 0) {
                    console.log("Found new users!");
                    subscribersList = subscribersList.concat(diff);

                    for (let i = 0; i < diff.length; i++) {
                        console.log(diff[i]);
                        request(diff[i], function (error, response, body) {
                            let webso = response.headers["updates-via"];
                            subscribe(webso, diff[i]);
                            getAllReviews(diff[i]);
                        });
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
var wsList = [];

getUserList();
setInterval(function(){
    getUserList();
}, 10000);
