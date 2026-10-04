const router = require('express').Router();

const { optionalAuth } = require('../middleware/auth.middleware');
const controller = require('../controllers/search.controller');

router.get('/', optionalAuth, controller.search);

module.exports = router;