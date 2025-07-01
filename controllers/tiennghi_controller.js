const fs = require('fs');
const TienNghiModel = require('../model/tiennghis');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id) {
            filter._id = id;
        }

        const tiennghis = await TienNghiModel.find(filter);
        
        if (tiennghis.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }        

        res.send(tiennghis);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }
};
