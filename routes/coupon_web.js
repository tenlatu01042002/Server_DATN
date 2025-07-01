const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon_web_controller');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware('html'));
router.get('/', couponController.getCoupons);

router.post('/post', couponController.addCoupon);

router.put('/put/:id', couponController.editCoupon);

router.delete('/delete/:id', couponController.deleteCoupon);

module.exports = router;
