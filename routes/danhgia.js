const express = require('express');
const router = express.Router();

const danhGiaController = require('../controllers/danhgia_controller')

router.get('/', danhGiaController.getListorByIdUserorIdLPhong);
router.post('/post', danhGiaController.addDanhGia);
router.put('/put/:id', danhGiaController.suaDanhGia);

module.exports = router;