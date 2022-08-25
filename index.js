const WebSocket = require('ws');
const http = require('http');
const wss = new WebSocket.Server({ noServer: true });
const utils = require('y-websocket/bin/utils');
const { WebsocketProvider } = require('y-websocket');
const ws = require('ws');
const { MongodbPersistence } = require('y-mongodb');
const location = 'mongodb://localhost:27017';
const collection = 'yjs-transactions';
const ldb = new MongodbPersistence(location, collection);

const setupWSConnection = utils.setupWSConnection;
const Y = require('yjs');
const doc = new Y.Doc();
const wsProvider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-roomname',
  doc,
  { WebSocketPolyfill: ws }
);

const port = 4000;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

wss.on('connection', setupWSConnection);
server.on('upgrade', (request, socket, head) => {
  const handleAuth = (ws) => {
    wss.emit('connection', ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

wsProvider.awareness.setLocalState({ syncServerOnline: true });
utils.getPersistence().bindState('Todos', doc);
utils.setPersistence({
  bindState: async (docName, ydoc) => {
    console.log('binding state');
    const persistedYdoc = await ldb.getYDoc(docName);
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    ldb.storeUpdate(docName, newUpdates);
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
    ydoc.on('update', async (update) => {
      ldb.storeUpdate(docName, update);
    });
  },
  writeState: async (docName, ydoc) => {
    console.log('writing state');
    // This is called when all connections to the document are closed.
    // In the future, this method might also be called in intervals or after a certain number of updates.
    return new Prosime((resolve) => {
      // When the returned Promise resolves, the document will be destroyed.
      // So make sure that the document really has been written to the database.
      resolve();
    });
  },
});

server.listen(port);
