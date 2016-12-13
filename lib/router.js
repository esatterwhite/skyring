'use strict';
const {Router} = require('call')
    , routes   = require('./routes')
    , router   = new Router()
    , LIST     = '/timer'
    , DETAIL   = '/timer/{timer_id}'
    ;

module.exports = router;

router.add({ method: 'post',   path: LIST });
router.add({ method: 'delete', path: DETAIL });
router.add({ method: 'put',    path: DETAIL });

router.cache = new Map();
router.cache.set( `post:${LIST}`,     routes.post_list );
router.cache.set( `delete:${DETAIL}`, routes.delete_detail );
router.cache.set( `put:${DETAIL}`,    routes.put_detail );

