const express = require('express');
const router = express.Router();

const amThucController = require('../controllers/amthuc_controller');

router.get('/', amThucController.getList);
router.get('/getbyid', amThucController.getById);

module.exports = router;
