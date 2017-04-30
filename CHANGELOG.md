v4.0.0
------
* Support crash recovery of timers
* dependency on level w/ plugable backends. leveldown for disk, memdown for memory
* new configuration options for leveldb storage
* replaces mocha with tap

v3.3.2
------
* fixes a bug in nats lib where callback was never called - preventing a shutdown

v3.3.0
------
* fixes a bug where http transports would fail if not cased
* Updated documentation

v3.1.0
------
* Modifies the project to allow global install
* bin script w/ commands
* main process changes CWD so imports work

v3.0.0
------
* Migrates the timer module into a class - can run multiple servers in isolated clusters
* Validators for modification request - validates payload before handler is called
* Code climate integration

v2.0.0
------
* Replaces Redis for nats
* tests run against a nats cluster

v1.0.0
------
* initial implementation
* Initial timer API - POST, PUT, DELETE
