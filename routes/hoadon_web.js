const express = require('express');
const router = express.Router();

const hoaDonController = require('../controllers/hoadon_web_controller')
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware('html'));
router.get('/',hoaDonController.getListorByIdUserorStatus);
router.get('/detail/:id',hoaDonController.getDetailAPI);
router.put('/update-status/:id', hoaDonController.updateTrangThai);

module.exports = router;