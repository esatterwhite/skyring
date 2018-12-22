'use strict'

const Skyring = require('skyring')

const server = new Skyring()

server.listen(process.env.PORT || 3000, (err) => {
  if(err) {
    process.exitCode = 1;
    console.error(err);
    throw err;
  }
  console.log('server listening');
});

function onSignal() {
  server.close(()=>{
    console.log('shutting down');
  });
}
process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
