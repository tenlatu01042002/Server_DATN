const express = require('express');
const router = express.Router();

const cccd_controller = require('../controllers/cccd_controller');
const { upload } = require('../config/common/uploads');

router.get('/getcccd/:id_NguoiDung', cccd_controller.getCccdByUserId);
router.post('/post',upload.fields([{ name: 'matTruoc', maxCount: 1 }, { name: 'matSau', maxCount: 1 }]), cccd_controller.addCccd);

module.exports = router;