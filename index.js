const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());
var expressWs = require('express-ws')(app);
const clientsByURL = {};

let serverStartDate = new Date();
let stats = {
  websocket: {
    totalClients: 0,
    totalMessages: 0
  },
  apiLyrics: {
    numRequests: 0,
    num404requests: 0
  }
};

// Define WebSocket route
app.ws('/websocket/:url', (ws, req) => {
  const urlParam = req.params.url;

  // Store WebSocket client in the object based on URL
  if (!clientsByURL[urlParam]) {
    clientsByURL[urlParam] = [];
  };
  clientsByURL[urlParam].push(ws);
  stats.websocket.totalClients++;


  ws.on('message', (msg) => {
    // Broadcast received message to all clients connected to the same URL
    if (clientsByURL[urlParam]) {
      clientsByURL[urlParam].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          messageandclients = {msg: msg, members: clientsByURL[urlParam].length};
          client.send(JSON.stringify(messageandclients));
          stats.websocket.totalMessages++;
        };
      });
    };
  });

  ws.on('close', () => {
    // Remove WebSocket client from the object when connection is closed
    if (clientsByURL[urlParam]) {
      clientsByURL[urlParam] = clientsByURL[urlParam].filter((client) => client !== ws);
      if (clientsByURL[urlParam].length === 0) {
        delete clientsByURL[urlParam];
      };
    };
  });
});

const agent = new https.Agent({
  rejectUnauthorized: false // Ignore SSL certificate validation (use with caution)
});

// Define a simple route
app.get('/', (req, res) => {
  // Use a relative path to specify the location of index.html
  const indexPath = './index.html';

  // Send the index.html file as the response
  res.sendFile(indexPath, { root: __dirname });
});

app.get('/api-lyrics/:req', (req, res) => {
    axios.get(`https://api.textyl.co/api/lyrics?q=${req.params.req}`, { httpsAgent: agent })
        .then(response => {
          // Handle successful response
          const jsonData = response.data;
          stats.apiLyrics.numRequests++;
          res.json(jsonData);
        })
        .catch(error => {
          // Handle errors
          if (error.response.status == 404) {
            res.json({"Response": "No lyrics found, sorry buddy :("});
            stats.apiLyrics.num404requests++;
            return;
          };
          console.error('Error fetching data:', error);
          res.send("504 Server Error");
    });
});

app.get('/stats', (req, res) => {
  res.send(`
    <h1>WebSocket</h1>
    <p>Total Clients: ${stats.websocket.totalClients}</p>
    <p>Total Messages: ${stats.websocket.totalMessages}</p>

    <h1>api.textyl.co</h1>
    <p>Number of Requests: ${stats.apiLyrics.numRequests}</p>
    <p>Number of Not Found Lyrics: ${stats.apiLyrics.num404requests}</p>
  `);
});

// Set the server to listen on a specific port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
