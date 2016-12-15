'use strict'

exports.Router = require('./router');
exports.Route = require('./route');


exports.load = function() {
  const post_timer = require('./routes/post_timer');
  const router = new exports.Router();

  const route = router.route(
    post_timer.path
  , post_timer.method
  , post_timer.handler
  )
  route.before( post_timer.middleware )
	return router;
}
