const express = require("express");
const router = express.Router();

const authController = require('../controllers/authen_controller')

router.post('/login', authController.login);
router.put('/doimatkhau/:id', authController.changesPass);
router.post('/logout', authController.logout);
router.post('/sendotp', authController.sendOtp);
router.post('/verifyotp', authController.verifyOtp);
router.post('/register', authController.register);
router.post('/forgotpass', authController.forgotPass);
router.post('/setuppass', authController.setUpPass);

module.exports = router;
