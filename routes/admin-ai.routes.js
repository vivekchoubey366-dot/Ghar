const router = require('express').Router();
const controller = require('../controllers/admin-ai.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
router.use(auth, admin);
router.get('/modules', controller.modules);
router.get('/usage', controller.usage);
module.exports = router;
