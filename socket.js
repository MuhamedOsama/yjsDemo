const WebSocket = require('ws');
const http = require('http');
const wss = new WebSocket.Server({ noServer: true });
const utils = require('y-websocket/bin/utils');
const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const setupWSConnection = utils.setupWSConnection;
const { MongodbPersistence } = require('y-mongodb');
const collection = 'yjs-transactions';
const uri = 'mongodb://localhost:27017';
const ldb = new MongodbPersistence(uri, collection);
const port = 1234;
const Y = require('yjs');
mongoose.connect('mongodb://localhost:27017/test');

const YjsDocument = mongoose.model('YjsDocument', {
  roomId: Schema.Types.String,
  Data: Schema.Types.Mixed,
});
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('okay');
});

/*
 Persistence must have the following signature:
{ bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise }
*/
utils.setPersistence({
  bindState: async (docName, ydoc) => {
    // Here you listen to granular document updates and store them in the database
    // You don't have to do this, but it ensures that you don't lose content when the server crashes
    // See https://github.com/yjs/yjs#Document-Updates for documentation on how to encode
    // document updates
    const persistedYdoc = await ldb.getYDoc(docName);
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    ldb.storeUpdate(docName, newUpdates);
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
    ydoc.on('update', async (update) => {
      console.log(ydoc.getArray('Todos').toJSON());
      ldb.storeUpdate(docName, update);
    });
  },
  writeState: (string, doc) => {
    console.log('write state');
    // This is called when all connections to the document are closed.
    // In the future, this method might also be called in intervals or after a certain number of updates.
    return new Promise(async (resolve) => {
      await YjsDocument.findOneAndUpdate(
        { roomId: doc.name },
        {
          roomdId: doc.name,
          Data: doc.getArray('Todos').toJSON(),
        },
        { upsert: true }
      );
      // await YjsDocument.updateOne({ roomId: doc.name }, d);
      // console.log('state promise resolve');
      // When the returned Promise resolves, the document will be destroyed.
      // So make sure that the document really has been written to the database.
      console.log('save final doc');
      resolve();
    });
  },
});

wss.on('connection', setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  // You may check auth of request here..
  /**
   * @param {any} ws
   */
  const handleAuth = (ws) => {
    wss.emit('connection', ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

server.listen(port);

console.log('running on port', port);
