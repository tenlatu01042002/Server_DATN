var express = require('express');
var router = express.Router();

var loginRouter = require('./login_web');
var dichVuRouter = require('./dichvu_web');
var tienNghiRouter = require('./tiennghi_web');
var amThucRouter = require('./amthuc_web');
var hoTroRouter = require('./hotro_web');
var loaiphongRouter = require('./loaiphong_web');
var phongRouter = require('./phong_web');
var nguoidungRouter = require('./nguoidung_web');
var hoadonRouter = require('./hoadon_web');
var couponRouter = require('./coupon_web');
var danhgiaRouter = require('./danhgia_web');
var guiVoucherRouter = require('./guivoucher_web');
var thongBaoRouter = require('./thongbao');

router.use('/auth', loginRouter);
router.use('/dichvus', dichVuRouter);
router.use('/tiennghis', tienNghiRouter);
router.use('/amthucs', amThucRouter);
router.use('/hotros', hoTroRouter);
router.use('/loaiphongs', loaiphongRouter);
router.use('/phongs', phongRouter);
router.use('/nguoidungs', nguoidungRouter);
router.use('/danhgias', danhgiaRouter);
router.use('/coupons', couponRouter);
router.use('/guivouchers', guiVoucherRouter);
router.use('/hoadons', hoadonRouter);
router.use('/thongbaos', thongBaoRouter);


const thongKeController = require('../controllers/thongke_controller');

const authMiddleware = require('../middleware/authMiddleware');
// Route để render trang dashboard
router.get('/home', authMiddleware('html'), thongKeController.getDashboardData);


module.exports = router;