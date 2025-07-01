const express = require('express');
const router = express.Router();
const hotroController = require('../controllers/hotro_web_controller');

// Route để lấy danh sách hoặc theo ID người dùng
router.get('/', hotroController.getListOrByID);



// Route để cập nhật hỗ trợ
router.put('/put/:id', hotroController.suaHotro);



module.exports = router;
