var express = require('express');
var router = express.Router();

var amthucRouter = require('./amthuc');
var chitiethoadonRouter = require('./chitiethoadon');
var couponRouter = require('./coupon');
var danhgiaRouter = require('./danhgia');
var dichvuRouter = require('./dichvu');
var hoadonRouter = require('./hoadon');
var hotroRouter = require('./hotro');
var loaiphongRouter = require('./loaiphong');
var loginRouter = require('./login');
var nguoidungRouter = require('./nguoidung');
var phongRouter = require('./phong');
var thongbaoRouter = require('./thongbao');
var tiennghiRouter = require('./tiennghi');
var tiennghiphongRouter = require('./tiennghiphong');
var YeuThichRouter = require('./yeuthich');
var CCCDRouter = require('./cccd');


router.use('/amthucs', amthucRouter);
router.use('/chitiethoadons', chitiethoadonRouter);
router.use('/coupons', couponRouter);
router.use('/danhgias', danhgiaRouter);
router.use('/dichvus', dichvuRouter);
router.use('/hoadons', hoadonRouter);
router.use('/hotros', hotroRouter);
router.use('/loaiphongs', loaiphongRouter);
router.use('/auth', loginRouter);
router.use('/nguoidungs', nguoidungRouter);
router.use('/phongs', phongRouter);
router.use('/thongbaos', thongbaoRouter);
router.use('/tiennghis', tiennghiRouter);
router.use('/tiennghiphongs', tiennghiphongRouter);
router.use('/yeuthichs', YeuThichRouter);
router.use('/cccd', CCCDRouter);

module.exports = router;
