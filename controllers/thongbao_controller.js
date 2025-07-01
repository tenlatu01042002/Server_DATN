const ThongBaoModel = require('../model/thongbaos')

// API Lấy tất cả thông báo từ DB
exports.getAllNotifications = async (req, res, next) => {
    try {
        const notifications = await ThongBaoModel.find({ id_NguoiDung : null }).sort({ ngayGui: -1 });
        res.status(200).json({ status: 200, notifications });
    } catch (error) {
        console.error('Lỗi khi lấy thông báo:', error);
        res.status(500).json({ status: 500, message: 'Lỗi server', error: error.message });
    }
};


// API Lấy tất cả thông báo từ DB cho nguoi dùng
exports.getListorByidNguoiDung = async (req, res, next) => {
    try {
        const { id_NguoiDung } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }
        const thongbaos = await ThongBaoModel.find(filter).sort({ createdAt: -1 });

        if (thongbaos.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }

        res.send(thongbaos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
}

// Controller để cập nhật trạng thái thông báo
exports.updateThongBaoStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID của thông báo
        const thongBao = await ThongBaoModel.findByIdAndUpdate(id, { trangThai: false }, { new: true });

        if (!thongBao) {
            return res.status(404).json({ status: 404, message: "Thông báo không tồn tại" });
        }

        res.status(200).json({ status: 200, message: "Cập nhật trạng thái thành công", data: thongBao });
    } catch (error) {
        res.status(500).json({ status: 500, message: "Lỗi khi cập nhật trạng thái", error: error.message });
    }
};

