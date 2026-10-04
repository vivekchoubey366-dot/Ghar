const router = require('express').Router();

const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/property.controller');

router.get('/', optionalAuth, controller.list);
router.get('/:id', optionalAuth, controller.get);

router.post('/', requireAuth, controller.create);
router.patch('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;