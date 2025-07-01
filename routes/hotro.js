const express = require('express');
const router = express.Router();
const hoTroController = require('../controllers/hotro_controller')

router.get('/', hoTroController.getListorByIdUser);
router.post('/post', hoTroController.addHoTro);

module.exports = router; 