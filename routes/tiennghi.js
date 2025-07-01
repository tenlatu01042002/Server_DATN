const express = require('express');
const router = express.Router();
const tienNghiController = require("../controllers/tiennghi_controller");
const { upload } = require('../config/common/uploads');

router.get('/',tienNghiController.getListorByID)


module.exports = router;


