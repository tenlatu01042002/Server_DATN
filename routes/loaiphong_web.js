const express = require('express');
const loaiPhongController = require('../controllers/loaiphong_web_controller');
const { upload } = require('../config/common/uploads');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware('html'));
router.get('/',loaiPhongController.getListorByID)
router.get('/detail/:id',loaiPhongController.getLoaiPhongDetails)
router.post('/post', upload.array('images', 5), loaiPhongController.addLoaiPhong);
router.put('/put/:id', upload.array('images', 5) ,loaiPhongController.suaLoaiPhong)
router.delete('/delete/:id',loaiPhongController.xoaLoaiPhong)

module.exports = router;
