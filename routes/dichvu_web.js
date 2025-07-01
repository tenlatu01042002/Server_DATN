const express = require('express');
const router = express.Router();
const dichVuController = require('../controllers/dichvu_web_controller');
const { upload } = require('../config/common/uploads');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware('html'));

router.get('/', dichVuController.getListorByID);
router.post('/post', upload.single('hinhAnh'), dichVuController.addDichVu);
router.put('/put/:id', upload.single('hinhAnh'), dichVuController.suaDichVu);
router.delete('/delete/:id', dichVuController.xoaDichVu);


module.exports = router;
