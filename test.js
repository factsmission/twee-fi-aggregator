const WebSocket = require('ws');
var me = new WebSocket('wss://davide.solidtest.space/public/twee-fi/')

me.on('open', function open() {

  console.log('Done');
});

me.on('message', function incoming(data) {
  console.log(data)
})

me.on('error', function (error) {
  console.error(error);
})
