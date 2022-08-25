const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const ws = require('ws');

const doc = new Y.Doc();
const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-map-array-room',
  doc,
  { WebSocketPolyfill: ws }
);

wsProvider.on('status', (event) => {
  console.log(event.status, 'from pusher'); // logs "connected" or "disconnected"
});
const yarr = doc.getArray('my-map-array');
let mymap = new Y.Map();
mymap.set('id', 1);
mymap.set('content', 'my content');
yarr.push(mymap);
console.log(mymap.toJSON());
console.log(yarr.toJSON());
// const mymap = doc.getMap();
// mymap.set('id', 1);
// mymap.set('content', 'example content');
// yarr.insert(0, [mymap]);
