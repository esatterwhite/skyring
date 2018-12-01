v8.0.3
------

* timer: be sure to flush the nats connection before closing. Fixes issue where timers may be lost during a rebalance

v8.0.2
------

* middleware: fix proxy middle ware to always set location header

v8.0.1
------

* revert needle back to request. fixes issue where transport callback not being called

v8.0.0
------

* [BREAKING] remove deprecated server#load function. Calling it will be an error
* replace request with needle. Http transport now uses needle
* replace level package w/ levelup + leveldown explicitly
* remove quay specific build
* bump docker image to use node 8.12


v7.0.1
------

* timer: corrects bug that would reset a timer during a rebalance
* pkg: fix a broken dependency in package-lock
* ci: fixes the travis build so PR builds will pass github checks

v7.0.0
------

* timer api will return a 400 if the timeout exeeds 2147483647

v6.1.0
------

* updates local deps to address security exploits

v6.0.0
------
* timer validator enforces an upper timeout limit of 2147483647 - 400 response will be returned if exceeded.

v5.0.3
------
* Fixes a rash bug from invalid error reference in http transport

v5.0.2
------
* replaces level w/ direct use of levelup so the swappable backend works
* added dep - encoding-down for auto value encoding

v5.0.1
------
* Update level@2.0.0
* Update debug@3.1.0
* Update seeli@5.0.0
* Update Docker image to use node 8.7

v5.0.0
------
* Adds cluster wide events over nats
* DEPRECATE: deprecates the remove function on timers class
* Adds success / failure methods on timer class for acknowledging timer execution
* shutdown will skip rebalance if node is last in cluster

v4.4.1
------
* Fix docker auto build on quay

v4.4.0
------
* Doc updates
* include package-lock
* minor dependancy updates

v4.3.0
-------
* test: moves test harness out of the docker setup - c25f5c5bc7
* timers: setup storage before nats to allow errors to bubble - dc88b48eed
* tansports: fixes named function checks

v4.2.0
------
* Transports can define a shutdown handler

v4.1.0
------
* Allows for custom transports

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
