const express = require('express');
const axios = require('axios');
const https = require('https');
const { log } = require('console');

const app = express();

const agent = new https.Agent({
  rejectUnauthorized: false // Ignore SSL certificate validation (use with caution)
});

// Define a simple route
app.get('/', (req, res) => {
    res.sendFile("index.html");
});

app.get('/lyrics-api/:req', (req, res) => {
    axios.get(`https://api.textyl.co/api/lyrics?q=${req.params.req}`, { httpsAgent: agent })
        .then(response => {
          // Handle successful response
          const jsonData = JSON.stringify(response.data);
          console.log(jsonData);
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
