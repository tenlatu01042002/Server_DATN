const fs = require('fs');
const AmThucModel = require('../model/amthucs');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");

exports.getList = async (req, res, next) => {
    try {
        let amthucs = await AmThucModel.find({}).sort({ createdAt: -1 });
        res.send(amthucs);
    } catch (error) {
        res.json({ status: 400, result: error });
    }
};

exports.getById = async (req, res, next) => {
    try {
        const { id } = req.query;

        let amthuc = await AmThucModel.findOne({ _id: id });

        if (!amthuc) {
            return res.status(404).json({ message: "Am Thuc not found" });
        }

        res.json(amthuc );
    } catch (error) {
        res.status(500).json({ message: "Error fetching Am Thuc", error });
    }
};

