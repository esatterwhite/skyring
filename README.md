
![skyring](./assets/skyring.png)

# Skyring
A distributed reliable timer service providing similar functionality to using `setTimeout`.
`Skyring` servers are clustered  into a *hashring* using consistent hashing to partition timers to specific nodes in the ring.  Skyring exposes a simple HTTP API That allows to you create and cancel timers. Timer execution comes in to the form of an HTTP webhook ( more transports to come )

# Timer API

A request can be issued to any active node in the cluster. If that node is not responsible for the timer in question,
it will forward the request directly to the node that is keeping network latency to a minimum. This makes `Skyring` very
suitable for high performance, stateless, and distributed enviroments.
The minimum _recommended_ cluster size is 3 nodes, 2 of which being seed or bootstrapping nodes. A cluster of this size can average
between 2K - 5K requests per second.

## Create a timer

##### **POST `/timer`**

**Request**

```bash
curl -i -XPOST http://localhost:8080/timer -d '{
  "timout": 6000,
  "data" : "{\"foo\":\"bar\"}",
  "callback": {
    "transport": "http",
    "method": "post",
    "uri": "http://api.someservice.com/hook/timout"
  }
}'
```

**Response Headers**

For performance considerations, a body is not included in responses. Rather, HTTP headers are used to relay information about timer status.
In the case of a `Create` request, the uri to the timer instance is returned in the `Location` header.

```
HTTP/1.1 201 CREATED
location: /timer/4adb026b-6ef3-44a8-af16-4d6be0343ecf
Date: Fri, 23 Dec 2016 00:19:13 GMT
Connection: keep-alive
Content-Length: 0
```

## Cancel A Timer

#### **DELETE `/timer/:id`**

**Request**

```bash
curl -i -XDELETE http://localhost:8080/timer/4adb026b-6ef3-44a8-af16-4d6be0343ecf
```
**Response Headers**

```
HTTP/1.1 202 Accepted
Date: Fri, 23 Dec 2016 00:22:12 GMT
Connection: keep-alive
Content-Length: 0
```
