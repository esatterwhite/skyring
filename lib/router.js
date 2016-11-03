'use strict';
const {Router} = require('call')
const router = new Router()
const routes = require('./routes')
const LIST = '/timer'
const DETAIL = '/timer/{timer_id}'

module.exports = router;

router.add({ method: 'post', path: LIST })
router.add({ method: 'delete', path: DETAIL })
router.add({ method: 'put', path: DETAIL })

router.cache = new Map();
router.cache.set( `post:${LIST}`,   routes.post_list )
router.cache.set( `delete:${DETAIL}`, routes.delete_detail )
router.cache.set( `put:${DETAIL}`, routes.put_detail )

