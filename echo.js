'use strict'

let count = 0
const port = process.env.PORT || 5555
const net = require('net')
const server = net.createServer((socket) => {
  socket.on('data', (chunk) => {
    console.log(`${++count} ` + chunk)
  })
})

process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)
server.listen(port, (err) => {
  if (err) {
    console.log(err)
    process.exitCode = 1
  }
  console.log('server listening')
})
function onSignal() {
  server.close()
}
