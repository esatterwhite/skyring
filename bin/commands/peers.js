'use strict';

const os = require('os')
    , url = require('url')
    , seeli = require('seeli')
    , Table = require('cli-table')
    , config = require('keef')
    , Server = require('../../lib/server')
    ;
const colors = {
  alive: seeli.green
, faulty: seeli.red
, leave: seeli.cyan
, suspect: seeli.yello
, tombstone: seeli.grey
}
module.exports = new seeli.Command({
  description: 'List connected peers in a ring cluster'
, usage: []
, flags: {}
, run: (cmd, data, done) => {
    const server = new Server()
    const port = config.get('channel:port')
    server.on('bootstrap', () => {
      const table = new Table({
        head: ['Node', 'Port', 'Status']
      })
      const members = server._node._ring.membership.membersByAddress
      setTimeout(() => {
        for ( let key in members ) {
          const status = members[key].status
          const addr = key.startsWith('tchannel://') ? key : `tchannel://${key}`
          const uri = url.parse(addr)
          if (uri.port == port) continue
          table.push( [seeli.bold(uri.hostname), uri.port, colors[status](status) ])
        }
        setImmediate(() => {
          table.sort((a, b) => {
            return a[1] > b[1]
          })
          server.close(() => {
            done(null, table.toString())
          })
        })
      }, 100)
    })
    server.listen(config.get('port'))
  }
})
