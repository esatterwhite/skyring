'use strict'

const getPort = require('get-port')

module.exports = {
  genPorts, ports
}
const gen = genPorts()
function* genPorts() {
  while (true) {
    yield getPort()
  }
}

function ports(n = 1) {
  const todo = new Array(n)
  for (let x = 0; x < n; x++) {
    const {value} = gen.next()
    todo[x] = value

  }

  return Promise.all(todo)
}
