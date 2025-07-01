
const express = require('express');
const router = express.Router();
const { upload } = require('../config/common/uploads');  // Middleware upload file
const amThucController = require('../controllers/amthuc_web_controller');  // Controller chứa logic xử lý
const authMiddleware = require('../middleware/authMiddleware');  // Middleware xác thực quyền

// Middleware kiểm tra quyền người dùng (có thể kiểm tra session hoặc token)
router.use(authMiddleware('html'));  // Áp dụng authMiddleware cho tất cả các route của phần ẩm thực

// Route lấy danh sách món ăn và render lên trang
router.get('/', amThucController.getListOrByID);  // Render danh sách món ăn

// Route thêm món ăn (POST, sử dụng upload cho hình ảnh và menu)
router.post('/post', 
    upload.fields([{ name: 'images', maxCount: 1 }, { name: 'menu', maxCount: 5 }]), 
    amThucController.addAmThuc  // Xử lý thêm món ăn
);

// Route sửa món ăn (PUT, sử dụng upload cho hình ảnh và menu)
router.put('/put/:id', 
    upload.fields([{ name: 'images', maxCount: 1 }, { name: 'menu', maxCount: 5 }]), 
    amThucController.suaAmThuc  // Xử lý sửa món ăn theo ID
);

// Route xóa món ăn (DELETE)
router.delete('/delete/:id', amThucController.deleteAmThuc);  // Xử lý xóa món ăn theo ID

module.exports = router;
