The start up process in each Skyring server includes a discovery phase referred to as the `bootstrap` phase.

The `bootstrap` process is the process of each of the designated **seed** nodes coming online and discovering each other. 
Once all of the seed nodes successfully comes one line, the clusters is considered to be `bootstrapped` and the `HTTP` server 
will start up. Once the ring has been bootstrapped it will continue to function even if the seed node go down. However, new 
node will be able to join the ring until all of the seeds have come back online.

**NOTE** It is highly recommended that seeds get a static IP address or you will have to continually re-configure you clusters. 
While not a requirement, each skyring instance should be on it's own host machine.

### Seed Nodes

Seed nodes are used by other nodes in the cluster to determine the topology of the cluster. Besides that, they are the same as 
non-seed nodes. A Cluster must have one ore more seeds to function. When creating a new `Skyring` node, you specify cluster seeds 
with the `seeds` property, command line flag, or environment variable. Seeds must be in the format of `<IP ADDRESS>:<PORT>`. A hostname 
can be used in place of an IP address, but it must be resolvable by DNS. All nodes in the cluster, seeds or not, must have the same seed 
configuration. 


#### Command Line Flags

```bash
$ skyring run --seeds=10.50.0.5:3456 --seeds=10.60.0.5:3456
```

#### Environment Variables

```bash
$ seeds=10.50.0.5:3456,10.60.0.5:3456 skyring run
```

#### Server Configuration

```javascript
const Skyring = require('skyring')
const server = new Skyring({
  seeds: ['10.50.0.5:3456', '10.60.0.5:3456']
})
```

### Skyring Channel Configuration

Each Skyring node uses an internal communication channel to talk to to the other seed nodes in the cluster during the `bootstrap` process. 
You must make sure that one of the listed `seeds` matches the channel configuration of one of the nodes. 

#### Single node cluster

It is possible to `bootstrap` a single node cluster by specifying one seed node and configuring the internal node configuration match

```javascript
const Skyring = require('skyring')
const server = new Skyring({
  seeds: ['127.0.0.1:3456']
, node: {
    host: '127.0.0.1'
  , port: 3456
  , app: 'dev'
  }
})

server.listen(3000, null, null, () => {
  console.log('skyring bootstrapped')
})
```

This will start a skyring node with a communication channel listing on port `3456` of localhost, and looking for a seed node on the same port. So, 
this node bootstraps itself, and starts the `HTTP` server

#### Two node cluster

Similarly to bootstrap a two ring cluster, each server instance must list all seed nodes.


```javascript
// Node 1
const Skyring = require('skyring')
const server = new Skyring({
  seeds: ['127.0.0.1:3455', '127.0.0.1:3456']
, node: {
    host: '127.0.0.1'
  , port: 3455
  , app: 'dev'
  }
})

server.listen(3000, null, null, () => {
  console.log('skyring bootstrapped')
})
```

```javascript
// Node 2
const Skyring = require('skyring')
const server = new Skyring({
  seeds: ['127.0.0.1:3455', '127.0.0.1:3456']
, node: {
    host: '127.0.0.1'
  , port: 3456
  , app: 'dev'
  }
})

server.listen(3001, null, null, () => {
  console.log('skyring bootstrapped')
})
```

In this Example, we start two seeds on `localhost` ports `3455` and `3456`. Each one is configured to find itself and the other node in the cluster. 
Once the initial cluster `bootstrap` is complete and the seeds are online, we can start adding additional nodes to the ring cluster.

#### Add Non-Seed Nodes

To add additional server instances, we just start more services pointed at the 2 `seed` nodes with `node` configuration and a unused port for the 
`HTTP` server

```javascript
// Node 3
const Skyring = require('skyring')
const server = new Skyring({
  seeds: ['127.0.0.1:3455', '127.0.0.1:3456']
, node: {
    host: '127.0.0.1'
  , port: 3457
  , app: 'dev'
  }
})

server.listen(3002, null, null, () => {
  console.log('server 3 ready')
})
```

```javascript
// Node 4
const Skyring = require('skyring')
const server = new Skyring({
  seeds: ['127.0.0.1:3455', '127.0.0.1:3456']
, node: {
    host: '127.0.0.1'
  , port: 3458
  , app: 'dev'
  }
})

server.listen(3003, null, null, () => {
  console.log('Server 4 ready')
})
```
