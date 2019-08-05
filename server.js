const express = require('express')
const app = express()
const PORT = 8080
const cors = require('cors')
var bodyParser = require('body-parser');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

const backendApis = require('./routes/backendApis/backendApis')

app.use(cors())

app.listen(PORT, () => {
  console.log("Start server with port : " + PORT)
})

app.use('/backend', backendApis)