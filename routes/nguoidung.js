const express = require('express');
const nguoiDungController = require('../controllers/nguoidung_controller');
const { upload } = require('../config/common/uploads');
const router = express.Router();

router.get('/',nguoiDungController.getListorByID)
router.get('/myroom/:id',nguoiDungController.PhongbyIdNguoidung)
router.get('/mycoupon/:id',nguoiDungController.getMyCoupon)
router.post('/post', upload.single('image') ,nguoiDungController.addNguoiDung)
router.put('/put/:id', upload.single('image') ,nguoiDungController.suaNguoiDung)


module.exports = router;

