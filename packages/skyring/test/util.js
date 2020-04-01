'use strict'

const getPort = require('get-port')

module.exports = {
  genPorts, ports
}
const gen = genPorts()
async function* genPorts() {
  while (true) {
    let port = await getPort()
    yield port
  }
}

function ports(n = 1) {
  const todo = new Array(n)
  for (let x = 0; x < n; x++) {
    todo[x] = gen.next().then(res => res.value)
  }

  return Promise.all(todo)
}
