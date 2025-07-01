const express = require('express');
const router = express.Router();

const thongKeController = require('../controllers/thongke_controller');

const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware('html'));

router.get('/', thongKeController.getTongThongSo);


module.exports = router;
