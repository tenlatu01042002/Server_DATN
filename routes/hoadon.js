const express = require('express');
const router = express.Router();

const hoaDonController = require('../controllers/hoadon_controller')

// Middleware xử lý JSON mà không yêu cầu header Content-Type
// router.use((req, res, next) => {
//     let data = '';
//     req.on('data', chunk => {
//         data += chunk;
//     });
//     req.on('end', () => {
//         try {
//             req.body = JSON.parse(data || '{}'); // Parse dữ liệu JSON
//         } catch (error) {
//             req.body = {}; // Nếu không phải JSON hợp lệ
//         }
//         next();
//     });
// });

router.get('/',hoaDonController.getListorByIdUserorStatus);
router.get('/chitiet/:id',hoaDonController.getDetailAPI);
router.get('/history/',hoaDonController.getLichSuDatPhong);
router.post('/post',hoaDonController.addHoaDon);
router.put('/huy/:id',hoaDonController.huyHoaDon);

module.exports = router;