const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors');

const app = express();
app.use(cors());
var expressWs = require('express-ws')(app);
app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    // expressWs.getWss().clients.forEach(client => {
    //   client.send(msg);
    // });
    ws.send(msg);
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
          res.json(jsonData);
        })
        .catch(error => {
          // Handle errors
          console.error('Error fetching data:', error);
    });
});

// Set the server to listen on a specific port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
