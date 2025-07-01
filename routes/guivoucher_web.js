const express = require('express');
const router = express.Router();
const { listVouchers, sendVoucherPage, sendVoucherToUsers,searchUsersForVoucher } = require('../controllers/guicoupon_web_controller');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware('html'));
// Hiển thị danh sách voucher
router.get('/', listVouchers);

router.get('/:id',searchUsersForVoucher );
// Hiển thị trang gửi voucher cho từng voucher
router.get('/:id', sendVoucherPage);

// Xử lý gửi voucher cho người dùng
router.post('/post/:id', sendVoucherToUsers);

module.exports = router;
