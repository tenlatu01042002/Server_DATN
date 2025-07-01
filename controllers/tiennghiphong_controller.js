const TienNghiPhongModel = require('../model/tiennghiphongs')

exports.getListorByIDLoaiPhong = async (req, res, next) => {
    try {
        const { id_LoaiPhong } = req.query;

        if (!id_LoaiPhong) {
            return res.status(400).send({ message: 'Thiếu id_LoaiPhong' });
        }

        // Truy vấn dữ liệu với populate để lấy thông tin từ bảng `tiennghi`
        const tienNghiPhongs = await TienNghiPhongModel.find({ id_LoaiPhong })
            .populate({
                path: 'id_TienNghi',
                select: 'tenTienNghi image', // Lấy tên tiện nghi và hình ảnh
            });

        if (tienNghiPhongs.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy tiện nghi cho loại phòng này' });
        }

        // Chỉ lấy các trường cần thiết: tên tiện nghi, hình ảnh và mô tả
        const result = tienNghiPhongs.map(item => ({
            tenTienNghi: item.id_TienNghi?.tenTienNghi,
            image: item.id_TienNghi?.image,
            moTa: item.moTa
        }));

        res.send(tienNghiPhongs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }
};
