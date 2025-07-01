// routes/danhgia.js
const express = require('express');
const router = express.Router();

// Import controller và middleware
const danhgiaController = require('../controllers/danhgia_web_controller');
const authMiddleware = require('../middleware/authMiddleware');

// middleware kiểm tra auth (nếu cần thiết, có thể mở dòng này)
router.use(authMiddleware('html'));

// Lấy danh sách các loại phòng
router.get('/', danhgiaController.getListLoaiPhong);

// Lấy chi tiết loại phòng và bình luận của nó
router.get('/:id', danhgiaController.getDanhGiaByLoaiPhong);

// Cập nhật trạng thái bình luận (ẩn/hiện)
router.put('/put/:id', danhgiaController.updateReviewStatus);

module.exports = router;
