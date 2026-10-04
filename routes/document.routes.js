const router = require('express').Router();
const { requireAuth: auth } = require('../middleware/auth.middleware');
const controller = require('../controllers/document.controller');

router.get('/', auth, controller.list);
router.get('/:id', auth, controller.get);
router.post('/', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
