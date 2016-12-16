'use strict'

exports.Router = require('./router');
exports.Route = require('./route');


exports.load = function() {
  const routes = require('./routes')
  const router = new exports.Router();
  
  Object.keys(routes)
        .forEach((name) => {
          const item = routes[name];
          const route = router.route(
            item.path
          , item.method
          , item.handler
          );

          item.middleware && route.before( item.middleware );
        })

	return router;
}
