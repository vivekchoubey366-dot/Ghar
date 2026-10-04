const router = require('express').Router();

const controller = require('../controllers/auth.controller');

router.post('/register', controller.register);
router.post('/signup', controller.register);

router.post('/login', controller.login);
router.post('/signin', controller.login);

router.post('/refresh', controller.refresh);

router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

router.post('/verify-email', controller.verifyEmail);

module.exports = router;