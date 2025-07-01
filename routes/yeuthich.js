const express = require('express');
const router = express.Router();

const yeuThichController = require('../controllers/yeuthich_controller')

router.get('/', yeuThichController.getListLoaiPhongByidNguoiDung);
router.get('/list', yeuThichController.getList);
router.post('/post', yeuThichController.addYeuThich);
router.put('/put/:id', yeuThichController.suaYeuThich);
router.delete('/delete/:id_LoaiPhong/:id_NguoiDung', yeuThichController.xoaYeuThich);

module.exports = router;