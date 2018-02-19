'use strict'

const http = require('http')
let count = 0
const server = http.createServer((req, res) => {
  res.writeHead(204)
  res.end('')
  console.log(++count)
})

server.listen(process.env.PORT || 4000)
