const YeuThichModel = require('../model/yeuthichs')
const LoaiPhongModel = require('../model/loaiphongs');

exports.getList = async (req, res, next) =>{
    const yeuthichs = await YeuThichModel.find();
    return res.send(yeuthichs)
}

exports.getListLoaiPhongByidNguoiDung = async (req, res, next) => {
    try {
        const { id_NguoiDung } = req.query;

        if (!id_NguoiDung) {
            return res.status(400).send({ message: 'Vui lòng cung cấp id_NguoiDung' });
        }

        // Lấy danh sách yêu thích theo id_NguoiDung
        const yeuThichs = await YeuThichModel.find({ id_NguoiDung }).select('id_LoaiPhong');

        if (yeuThichs.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy yêu thích nào' });
        }

        // Lấy danh sách id_LoaiPhong
        const idLoaiPhongList = yeuThichs.map(item => item.id_LoaiPhong);

        // Truy vấn danh sách loại phòng từ LoaiPhongModel
        const loaiPhongs = await LoaiPhongModel.find({ _id: { $in: idLoaiPhongList } });

        if (loaiPhongs.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy loại phòng nào' });
        }

        res.send(loaiPhongs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy dữ liệu", error: error.message });
    }
};


exports.addYeuThich = async (req, res, next) => {
    try {
        const data = req.body;
        

        // Kiểm tra sự tồn tại của đánh giá trùng lặp
        const existingReview = await YeuThichModel.findOne({
            id_NguoiDung: data.id_NguoiDung,
            id_LoaiPhong: data.id_LoaiPhong
        });

        if (existingReview) {
            return res.json({
                status: 303,
                msg: "Loại phòng này bạn đã thêm vào yêu thích",
            });
        }

        const yeuthich = new YeuThichModel({
            id_LoaiPhong: data.id_LoaiPhong,
            id_NguoiDung: data.id_NguoiDung,
        })

        const result = await yeuthich.save();

        if (result) {
            res.json({
                status: 200,
                msg: "Đã thêm loại phòng vào yêu thích",
                data: result
            })
        } else {
            res.json({
                status: 400,
                msg: "Add fail",
                data: []
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}

exports.suaYeuThich = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Sử dụng findByIdAndUpdate để tìm và cập nhật dữ liệu
        const result = await YeuThichModel.findByIdAndUpdate(id, data, { new: true });

        if (result) {
            res.json({
                status: 200,
                msg: "Update success",
                data: result
            })
        } else {
            res.json({
                status: 400,
                msg: "Update fail",
                data: []
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}

exports.xoaYeuThich = async (req, res, next) => {
    try {
        // Lấy id_LoaiPhong và id_NguoiDung từ URL params
        // const userId = req.session.userId;
        const phongId = req.params.id_LoaiPhong;
        const userId = req.params.id_NguoiDung;

        console.log("id_LoaiPhong:", phongId);
        console.log("id_NguoiDung:", userId);

        // Tìm và xóa tài liệu theo điều kiện
        const result = await YeuThichModel.findOneAndDelete({ id_LoaiPhong: phongId, id_NguoiDung: userId });
        
        if (result) {
            res.json({
                "status": "200",
                "msg": "Đã xóa yêu thích khỏi danh sách",
                "data": result
            });
        } else {
            res.json({
                "status": "400",
                "msg": "Delete fail",
                "data": []
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}