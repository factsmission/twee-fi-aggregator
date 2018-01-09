# Twee-Fi Aggregator

The Twee-Fi Aggregator opens a websocket to the Solid account specified in `config.js`
and waits for messages. When a `pub` message arrives it loads all the triples regarding
Twee-Fi stored so far.

You need to set inside `config.js`:
* the https link to a Solid account
* the Named Graph
* the baseUrl of a CLDI instance

## Install
```
npm install
```

## Run
```
node aggregator.js
```
