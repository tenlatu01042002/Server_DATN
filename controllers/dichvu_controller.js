const fs = require('fs');
const DichVuModel = require('../model/dichvus');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id) {
            filter._id = id;
        }

        const dichvus = await DichVuModel.find(filter);
        
        if (dichvus.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }        

        res.send(dichvus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }
};

