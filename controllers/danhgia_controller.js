const DanhGiaModel = require('../model/danhgias')

exports.getListorByIdUserorIdLPhong = async (req, res, next) => {
    try {
        const { id_NguoiDung, id_LoaiPhong } = req.query; // Lấy từ query parameters

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }
        if (id_LoaiPhong) {
            filter.id_LoaiPhong = id_LoaiPhong;
        }

        // Lấy danh sách đánh giá theo điều kiện lọc
        const danhgias = await DanhGiaModel.find(filter).sort({ createdAt: -1 }).populate('id_NguoiDung', 'hinhAnh tenNguoiDung');
        if (danhgias.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }

        // Format kết quả nếu cần
        const formattedDanhgias = danhgias.map(danhgia => ({
            _id: danhgia._id,
            id_LoaiPhong: danhgia.id_LoaiPhong,
            binhLuan: danhgia.binhLuan,
            soDiem: danhgia.soDiem,
            createdAt: danhgia.createdAt,
            hinhAnh: danhgia.id_NguoiDung.hinhAnh, // Lấy avatar từ người dùng
            tenNguoiDung: danhgia.id_NguoiDung.tenNguoiDung // Lấy ten người dùng
        }));

        res.send(formattedDanhgias);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}

exports.addDanhGia = async (req, res, next) => {
    try {
        const data = req.body;

        // Kiểm tra điểm đánh giá hợp lệ
        const diem = data.soDiem;
        if (diem < 0 || diem > 10) {
            return res.json({
                status: 303,
                msg: "Điểm đánh giá phải từ 0 - 10",
            });
        }

        // Kiểm tra sự tồn tại của đánh giá trùng lặp
        const existingReview = await DanhGiaModel.findOne({
            id_NguoiDung: data.id_NguoiDung,
            id_LoaiPhong: data.id_LoaiPhong
        });

        if (existingReview) {
            return res.json({
                status: 303,
                msg: "Người dùng đã đánh giá phòng này",
            });
        }

        // Tạo đánh giá mới nếu không có đánh giá trùng lặp
        const danhgia = new DanhGiaModel({
            id_NguoiDung: data.id_NguoiDung,
            id_LoaiPhong: data.id_LoaiPhong,
            soDiem: data.soDiem,
            binhLuan: data.binhLuan,
        });

        const result = await danhgia.save();

        if (result) {
            res.json({
                status: 200,
                msg: "Add success",
                data: result
            });
        } else {
            res.json({
                status: 400,
                msg: "Add fail",
                data: []
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}

exports.suaDanhGia = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Sử dụng findByIdAndUpdate để tìm và cập nhật dữ liệu
        const result = await DanhGiaModel.findByIdAndUpdate(id, data, { new: true });

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

