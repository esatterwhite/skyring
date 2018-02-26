'use strict'

/**
 * ScyllaDB store for leveldown targeted as a backend for skyring
 * @module @skyring/scylladown
 * @author Eric Satterwhite
 * @requires util
 * @requires debug
 * @requires cassandra-driver
 * @requires abstract-leveldown
 * @requires @skyring/scylladown/lib/iterator
 **/

const {inherits, format} = require('util')
const {Client, types} = require('cassandra-driver')
const {AbstractLevelDOWN} = require('abstract-leveldown')
const ScyllaIterator = require('./iterator')
const slugify = require('./lang/string/slugify')
const debug = require('debug')('skyring:scylladown')

const ERR_NAME_NOTFOUND = 'NotFoundError'
const ERR_NOT_FOUND = 'ENOENT'
const kQuery = Symbol('queries')
const q_opts = { prepare: true }
const JSON_OBJECT = '{}'
const CREATE_KEYSPACE = `

CREATE KEYSPACE
IF NOT EXISTS %s
WITH REPLICATION = {
  'class': 'SimpleStrategy'
, 'replication_factor': %d
}
`
const CREATE_TABLE  = `
CREATE TABLE IF NOT EXISTS %s.%s (
  id text PRIMARY KEY
, value BLOB
)
`

module.exports = ScyllaDown

/**
 * ScyllaDB Leveldown backend for levelup
 * @class ScyllaDown
 * @extends AbstractLevelDOWN
 * @alias module:@skyring/scylladown
 * @params {String} location The name of a the database table
 * the db instance is responsible for
 **/
function ScyllaDown(location) {

  if (!(this instanceof ScyllaDown)) return new ScyllaDown(location)

  AbstractLevelDOWN.call(this, location)
  this.keyspace = null
  this.client = null
  this.table = slugify(location)
  this[kQuery] = {
    insert: null
  , update: null
  , get: null
  , del: null
  }
}

inherits(ScyllaDown, AbstractLevelDOWN)

/**
 * Called to open a connection to the scylla cluster
 * @method module:@skyring/scylladown#_open
 * @param {Object} [options] Additional options for scylla
 * @param {String[]} [options.contactPoints=['127.0.0.1']] An array of known scylladb instances to connect to
 * @param {String} [options.keyspace=skyring] Keyspace to operate under
 * @param {Number} [options.replicas=1] Number of replicas per keysapce
 **/
ScyllaDown.prototype._open = function _open(opts = {}, cb) {
  const {
    contactPoints = ['127.0.0.1']
  , keyspace = 'skyring'
  , replicas = 1
  } = opts

  debug('contact points: ', contactPoints)
  debug('keyspace', keyspace)
  debug('replicas', replicas)

  this.client = new Client({
    contactPoints: contactPoints
  })

  this.keyspace = keyspace

  this[kQuery] = {
    get: `
      SELECT value FROM ${this.table}
      WHERE id = ?
    `
  , put: `
      UPDATE ${this.table}
      SET value = ?
      WHERE id = ?
    `
  , del: `
      DELETE FROM ${this.table}
      WHERE id = ?
    `
  , insert: `
      INSERT INTO ${this.table} (
        id, value
      ) VALUES (?, ?)
    `
  }

  this.client.connect((err) => {
    if (err) return cb(err)
    this._keyspace(replicas, (err) => {
      if (err) return cb(err)
      this.client.keyspace = keyspace
      return this._table((err) => {
        if (err) return cb(err)
        return cb(null, this)
      })
    })
  })
}

/**
 * Fetches a record by primary key
 * @method module:@skyring/scylladown#_get
 * @param {String} key The key to look up
 * @param {Object} [options] query specific options
 * @param {Function} callback function to be called when the query has finished
 **/
ScyllaDown.prototype._get = function _get(key, options, cb) {
  const query = this[kQuery].get
  this.client.execute(query, [key], q_opts, (err, res) => {
    if (err) return cb(err)
    if (!res.rows.length) {
      const error = new Error('Key Not Found')
      error.name = ERR_NAME_NOTFOUND
      error.code = ERR_NOT_FOUND
      return cb(error, undefined)
    }
    const strigify = options.asBuffer === false
    const value = res.rows[0].value
    return cb(null, strigify ? value.toString('utf8') : value)
  })
}

/**
 * Inserts or updates a specific record
 * @method module:@skyring/scylladown#_put
 * @param {String} key The key to insert / operate
 * @param {String} value The value to write
 * @param {Object} [options] query specific options
 * @param {Boolean} [options.insert=false] If true, the driver will issue an insert rather than update
 * @param {Function} callback function to be called when the query has finished
 **/
ScyllaDown.prototype._put = function _put(key, value, options, cb) {
  if (options.insert) return this._insert(key, value, options, cb)

  const _value = Buffer.isBuffer(value) ? value : Buffer.from(value)
  const query = this[kQuery].put
  this.client.execute(query, [_value, key], q_opts, cb)
}

ScyllaDown.prototype._insert = function _insert(key, value, options, cb) {
  const query = this[kQuery].insert
  const _value = Buffer.isBuffer(value) ? value : Buffer.from(value)
  const values = [
    key
  , _value
  ]
  debug('insert', query, values, value)
  this.client.execute(query, values, q_opts, cb)
}


/**
 * Removes a specific record
 * @method module:@skyring/scylladown#del
 * @param {String} key The key to insert / operate
 * @param {Object} [options] query specific options
 * @param {Boolean} [options.insert=false] If true, the driver will issue an insert rather than update
 * @param {Function} callback function to be called when the query has finished
 **/
ScyllaDown.prototype._del = function _del(key, options, cb) {
  const query = this[kQuery].del
  this.client.execute(query, [key], q_opts, cb)
}

/**
 * Performs multiple updates or deletes as a single operaton
 * @method module:@skyring/scylladown#_batch
 * @param {Operation[]} operations to perform
 * @param {Object} [options] query specific options
 * @param {Function} callback function to be called when the query has finished
 **/
ScyllaDown.prototype._batch = function _batch(arr, options, cb) {
  const ops = arr.map((op) => {
    switch(op.type) {
      case 'del':
        return {
          query: this[kQuery].del
        , params: [op.key]
        }
      case 'put':
        return {
          query: this[kQuery].put
        , params: [op.value, op.key]
        }
    }
  })

  if (!ops.length) return setImmediate(cb)
  this.client.batch(ops, cb)
}

ScyllaDown.prototype._iterator = function _iterator(options) {
  return new ScyllaIterator(this, options)
}

ScyllaDown.prototype._keyspace = function _keyspace(replicas = 1, cb) {
  const query = format(CREATE_KEYSPACE, this.keyspace, replicas)
  debug('creating keyspace %s - replicas %s', this.keyspace, replicas)
  this.client.execute(query, cb)
}

ScyllaDown.prototype._table = function _table(cb) {
  const query = format(CREATE_TABLE, this.keyspace, this.table)
  debug('creating data table', this.table)
  this.client.execute(query, cb)
}

/**
 * Represents a single operations inside of a batch
 * @typedef {Object} Operation
 * @property {String} type the operation to perform (`put`|`del`)
 * @property {String} key The Key to perform the operation on
 * @property {String} [value] A value for put operations
 **/
