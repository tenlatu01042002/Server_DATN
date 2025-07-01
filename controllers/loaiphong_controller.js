const LoaiPhongModel = require('../model/loaiphongs');
const TienNghiPhongModel = require('../model/tiennghiphongs');
const DanhGiaModel = require('../model/danhgias');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");
const fs = require('fs');

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;
        
        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id) {
            filter._id = id;
        }
        const loaiphongs = await LoaiPhongModel.find(filter).sort({ createdAt: -1 });

        if (loaiphongs.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }

        res.send(loaiphongs);

    
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }
};


exports.getLoaiPhongDetail = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra nếu có id
        if (!id) {
            return res.status(400).send({ message: 'Thiếu id loại phòng' });
        }

        // Truy vấn thông tin loại phòng
        const loaiphong = await LoaiPhongModel.findById(id);
        if (!loaiphong) {
            return res.status(404).send({ message: 'Không tìm thấy loại phòng' });
        }

        // Truy vấn thông tin tiện nghi cho loại phòng này
        const tienNghiPhongs = await TienNghiPhongModel.find({ id_LoaiPhong: id })
            .populate({
                path: 'id_TienNghi',
                select: 'tenTienNghi image', // Lấy tên tiện nghi và hình ảnh
            });

        const tienNghiResult = tienNghiPhongs.map(item => ({
            tenTienNghi: item.id_TienNghi?.tenTienNghi,
            image: item.id_TienNghi?.image,
            moTa: item.moTa
        }));

        // Truy vấn đánh giá cho loại phòng này
        const danhgias = await DanhGiaModel.find({ id_LoaiPhong: id }).sort({ createdAt: -1 });

        // Nếu có đánh giá, trả về thông tin loại phòng cùng tiện nghi và đánh giá
        res.send({
            loaiPhong: loaiphong,
            tienNghi: tienNghiResult,
            danhGia: danhgias
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }
};
