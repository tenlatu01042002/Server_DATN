const PhongModel = require('../model/phongs');
const LoaiPhongModel = require('../model/loaiphongs');
const ChiTietHoaDonModel = require('../model/chitiethoadons')

exports.getListorByIdorIdPhong = async (req, res, next) => {
    try {
        const { id_LoaiPhong, id } = req.query;

        let filter = {};
        if (id) {
            filter._id = id
        }
        if (id_LoaiPhong) {
            filter.id_LoaiPhong = id_LoaiPhong
        } else {

        }
        const phongs = await PhongModel.find(filter).sort({ createdAt: -1 });

        if (phongs.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }

        res.send(phongs);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}

exports.getCheck = async (req, res, next) => {
    try {
        const { id_LoaiPhong, ngayNhanPhong, ngayTraPhong } = req.query;

        // Kiểm tra điều kiện ngày nhận và ngày trả phòng
        if (!ngayNhanPhong || !ngayTraPhong) {
            return res.status(400).json({ message: "Cần cung cấp ngày nhận và ngày trả phòng." });
        }

        // Đảm bảo ngày tháng đúng định dạng
        const ngayNhan = new Date(ngayNhanPhong);
        const ngayTra = new Date(ngayTraPhong);

        // Kiểm tra ngày trả > ngày nhận
        if (ngayTra <= ngayNhan) {
            return res.status(400).json({ 
                message: "Ngày trả phòng phải lớn hơn ngày nhận phòng." 
            });
        }

        console.log('ngay nhan : ', ngayNhan);
        console.log('ngay tra : ', ngayTra);

        // Tạo bộ lọc cho loại phòng nếu có
        let filter = {};
        if (id_LoaiPhong) {
            filter.id_LoaiPhong = id_LoaiPhong;
        }

        // Lấy danh sách phòng dựa trên bộ lọc
        const phongs = await PhongModel.find(filter).sort({ createdAt: -1 });

        if (phongs.length === 0) {
            return res.status(404).send({ message: "Không tìm thấy phòng." });
        }

        // Kiểm tra trạng thái của từng phòng
        const updatedPhongs = await Promise.all(
            phongs.map(async (phong) => {
                // Tìm hóa đơn có phòng này và kiểm tra ngày nhận/trả phòng    
                const isBooked = await ChiTietHoaDonModel.findOne({
                    id_Phong: phong._id,
                })
                    .populate({
                        path: 'id_HoaDon',
                        match: {
                            $or: [
                                {
                                    ngayNhanPhong: { $lte: ngayNhan },
                                    ngayTraPhong: { $gte: ngayNhan },
                                },
                                {
                                    ngayNhanPhong: { $lte: ngayTra },
                                    ngayTraPhong: { $gte: ngayTra },
                                },
                            ],
                            trangThai: { $in: [0, 1] }, // Chỉ xét hóa đơn đã thanh toán, đã nhận phòng
                        },
                    });

                if (isBooked?.id_HoaDon) {
                    phong.trangThai = 1;
                    console.log(phong.soPhong, "Phòng đã được đặt.");
                } else {
                    phong.trangThai = 0;
                    console.log(phong.soPhong, "Phòng còn trống.");
                }

                return {
                    ...phong.toObject(),
                };
            })
        );

        // Trả về kết quả
        res.send(updatedPhongs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách phòng.", error: error.message });
    }
};




