const express = require('express');
const router = express.Router();
const tienNghiPhongController = require('../controllers/tiennghiphong_controller');

router.get('/', tienNghiPhongController.getListorByIDLoaiPhong);

module.exports = router;


