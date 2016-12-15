'use strict';
const timer = require('../../timer')
module.exports = {
  path: '/timer'
, method: 'POST'
, middleware: [require('./middleware/proxy')]
, handler: (req, res, cb) => {
		const id = req.$.headers['x-timer-id']
		timer.create(id, req.$.body, (err) => {
			if (err) return cb(err)
			res.$.set('location', `/timer/${id}`)
			cb()
		})
	}
}
