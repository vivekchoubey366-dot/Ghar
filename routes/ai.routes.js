const router = require('express').Router();
const controller = require('../controllers/ai.controller');
const auth = require('../middleware/auth.middleware');
router.get('/modules', auth, controller.execute);
router.post('/:module', auth, controller.execute);
router.get('/:module', auth, controller.execute);
module.exports = router;
