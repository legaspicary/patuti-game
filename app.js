const express = require('express')
const path = require('path');
const app = express()
const port = 3000

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})

const url = process.env.APP_URL || 'http://localhost/';

app.listen(port, () => {
  console.log(`Patuti game listening at ${url}${port}`)
})