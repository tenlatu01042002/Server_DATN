const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon_controller')

router.get('/', couponController.getListorByidNguoiDung);

module.exports = router;