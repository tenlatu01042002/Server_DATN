const express = require('express');
const router = express.Router();
const dichvuController = require('../controllers/dichvu_controller');
const { upload } = require('../config/common/uploads');


router.get('/', dichvuController.getListorByID)

module.exports = router;


