const express = require('express');
const loaiPhongController = require('../controllers/loaiphong_controller');
const { upload } = require('../config/common/uploads');
const router = express.Router();

router.get('/',loaiPhongController.getListorByID)
router.get('/detail/:id',loaiPhongController.getLoaiPhongDetail)

module.exports = router;
