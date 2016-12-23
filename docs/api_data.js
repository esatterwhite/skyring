define({ "api": [
  {
    "description": "<p>Create a new time on the cluster</p>",
    "group": "timer",
    "name": "create_timer",
    "type": "post",
    "url": "/timer",
    "title": "Create a new timer",
    "version": "1.0.0",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "timeout",
            "description": "<p>the time in miliseconds before the timer executes</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "data",
            "description": "<p>a data payload to include with the timer when it executes</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "callback",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "callback.transport",
            "description": "<p>The delivery transport to use when executing the timer</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "callback.method",
            "description": "<p>The method of delivery the tranport should use</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "callback.uri",
            "description": "<p>A full uri the transport should send data to</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "curl:",
        "content": "curl -XPOST -H \"Content-Type: application/json\" http://localhost:3000/timer  -d '{\n\"timeout\": 3000,\n\"data\": \"{\\\"name\\\":\\\"Bill\\\"}\",\n\"callback\": {\n  \"method\": \"post\",\n  \"uri\": \"http://mydomain.name/timer/callback\",\n  \"tranport:\"http\"\n}",
        "type": "curl"
      },
      {
        "title": "Node.js:",
        "content": "const http = require('http')\nconst data = JSON.stringify({\n  timeout: 5000,\n  data: {foo: 'bar', bar: 'baz'},\n  callback: {\n    transport: 'http',\n    method: 'post',\n    uri: 'http://mydomain.name/timer/callback\n  }\n})\nconst options = {\n   hostname: 'localhost',\n   port: 3000,\n   path: '/timer',\n   method: 'POST',\n   headers: {\n     'Content-Type': 'application/json',\n     'Content-Length': Buffer.byteLength(data)\n   }\n };\nconst req = http.request(options, (res) => {\n  let data = '';\n  res.on('data', (chunk) => {\n    data += chunk;\n  });\n\n  res.on('end', () => {\n    // done\n  });\n})\nreq.write(data);\nreq.end();",
        "type": "js"
      }
    ],
    "filename": "lib/server/api/post_timer.js",
    "groupTitle": "timer"
  },
  {
    "description": "<p>Deletes a timer</p>",
    "group": "timer",
    "name": "delete_timer",
    "type": "delete",
    "url": "/timer/:id",
    "title": "Delete a timer",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "id",
            "description": "<p>Users unique ID.</p>"
          }
        ]
      }
    },
    "version": "1.0.0",
    "examples": [
      {
        "title": "curl:",
        "content": "curl -XDELETE -H \"Content-Type: application/json\" http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45",
        "type": "curl"
      },
      {
        "title": "Node.js:",
        "content": "const http = require('http')\nconst options = {\n   hostname: 'localhost',\n   port: 3000,\n   path: '/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45',\n   method: 'DELETE',\n   headers: {\n     'Content-Type': 'application/json',\n   }\n };\nconst req = http.request(options, (res) => {\n  res.on('end', () => {\n    // done\n  });\n})\nreq.end();",
        "type": "js"
      }
    ],
    "filename": "lib/server/api/delete_timer.js",
    "groupTitle": "timer"
  },
  {
    "description": "<p>Update a new time on the cluster</p>",
    "group": "timer",
    "name": "put_timer",
    "type": "put",
    "url": "/timer/:id",
    "title": "Update a new timer in place",
    "version": "1.0.0",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "timeout",
            "description": "<p>the time in miliseconds before the timer executes</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "data",
            "description": "<p>a data payload to include with the timer when it executes</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "callback",
            "description": ""
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "callback.transport",
            "description": "<p>The delivery transport to use when executing the timer</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "callback.method",
            "description": "<p>The method of delivery the tranport should use</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "callback.uri",
            "description": "<p>A full uri the transport should send data to</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "curl:",
        "content": "curl -XPUT -H \"Content-Type: application/json\" http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45  -d '{\n\"timeout\": 3000,\n\"data\": \"{\\\"name\\\":\\\"Bill\\\"}\",\n\"callback\": {\n  \"method\": \"post\",\n  \"uri\": \"http://mydomain.name/timer/callback\",\n  \"tranport:\"http\"\n}",
        "type": "curl"
      },
      {
        "title": "Node.js:",
        "content": "const http = require('http')\nconst data = JSON.stringify({\n  timeout: 5000,\n  data: {foo: 'bar', bar: 'baz'},\n  callback: {\n    transport: 'http',\n    method: 'post',\n    uri: 'http://mydomain.name/timer/callback\n  }\n})\nconst options = {\n   hostname: 'localhost',\n   port: 3000,\n   path: '/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45',\n   method: 'POST',\n   headers: {\n     'Content-Type': 'application/json',\n     'Content-Length': Buffer.byteLength(data)\n   }\n };\nconst req = http.request(options, (res) => {\n  let data = '';\n  res.on('data', (chunk) => {\n    data += chunk;\n  });\n\n  res.on('end', () => {\n    // done\n  });\n})\nreq.write(data);\nreq.end();",
        "type": "js"
      }
    ],
    "filename": "lib/server/api/put_timer.js",
    "groupTitle": "timer"
  }
] });