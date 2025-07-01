const express = require('express');
const router = express.Router();
const phongController = require('../controllers/phong_web_controller')
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware('html'));
router.get('/', phongController.getListorByIdorIdPhong);
router.post('/post', phongController.addPhong);
router.put('/put/:id', phongController.suaPhong);
router.delete('/delete/:id', phongController.xoaPhong);

// API để lấy trạng thái phòng cho từng ngày
router.get('/trangThai/:id', phongController.getTrangThai)
module.exports = router;