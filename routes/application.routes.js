const router = require('express').Router();
const controller = require('../controllers/application.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, controller.list);
router.get('/:id', auth, controller.get);
router.post('/', auth, controller.create);
router.patch('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
