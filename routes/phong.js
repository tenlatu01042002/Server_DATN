const express = require('express');
const router = express.Router();
const phongController = require('../controllers/phong_controller')

router.get('/', phongController.getListorByIdorIdPhong);
router.get('/check/', phongController.getCheck);

module.exports = router;