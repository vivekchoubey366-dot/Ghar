const router = require('express').Router();

const { requireAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/application.controller');

router.get('/', requireAuth, controller.list);
router.get('/:id', requireAuth, controller.get);
router.post('/', requireAuth, controller.create);
router.patch('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;