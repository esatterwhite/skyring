# skyring-scylladown

Example skyring cluster using [ScyllaDB] as a storage backend.

```bash
# start Syclla & nats
$ docker-compose up -d

# Start Seed Node 1
$ PORT=3000 DEBUG=* node . --storage:path=skyring-1 --storage:contactPoints=0.0.0.0:9042 --storage:contactPoints=0.0.0.0:9043 --channel:port=3455

# Start Seed Node 2
$ PORT=3001 DEBUG=* node . --storage:path=skyring-2 --storage:contactPoints=0.0.0.0:9042 --storage:contactPoints=0.0.0.0:9043 --channel:port=3456
```

[ScyllaDB]: https://scylladb.com
