const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Drone Beyond Server is Running!')
  })
  
  app.listen(port, () => {
    console.log(`Drone Beyond Server listening at http://localhost:${port}`)
  })