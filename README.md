# Skyring

A distributed reliable timer service providing similar functionality to using `setTimeout`. 
`Skyring` servers are clustered  into a *hashring* using consistent hashing to partition timers to specific nodes in the ring.  Skyring exposes a simple HTTP API That allows to you create and cancel timers. Timer execution comes in to the form of an HTTP webhook ( more transports to come )
