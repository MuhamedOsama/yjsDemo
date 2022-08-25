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
  console.log(event.status, 'from listener'); // logs "connected" or "disconnected"
  console.log(doc.guid);
  //   console.log(yarr.toJSON());
});
