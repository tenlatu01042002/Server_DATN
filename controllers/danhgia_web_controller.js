// controllers/danhgiaController.js
const RoomType = require('../model/loaiphongs');
const DanhGia = require('../model/danhgias');


exports.getListLoaiPhong = async (req, res) => {
    try {
        const roomTypes = await RoomType.find();
        
        for (let i = 0; i < roomTypes.length; i++) {
            const roomType = roomTypes[i];

            // Lấy tất cả bình luận liên quan đến loại phòng, không phân biệt trạng thái
            const allReviews = await DanhGia.find({ id_LoaiPhong: roomType._id });

            // Tính số lượng bình luận và điểm trung bình dựa trên tất cả các bình luận
            roomType.soLuongDanhGia = allReviews.length;
            roomType.diemTrungBinh = allReviews.length > 0
                ? (allReviews.reduce((sum, review) => sum + review.soDiem, 0) / allReviews.length).toFixed(1)
                : 0;

            // Cập nhật mức độ đánh giá dựa trên điểm trung bình
            roomType.danhGia = roomType.diemTrungBinh >= 9
                ? 'Tuyệt vời'
                : roomType.diemTrungBinh >= 7
                ? 'Tốt'
                : roomType.diemTrungBinh >= 5
                ? 'Bình thường'
                : roomType.diemTrungBinh >= 3
                ? 'Tệ'
                : 'Rất tệ';
        }

        const message = req.session.message; // Lấy thông báo từ session
        delete req.session.message; // Xóa thông báo sau khi đã sử dụng

        // Chuyển message nếu có
        res.render('../views/danhgia/danhgias', { roomTypes, message: message || null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải danh sách loại phòng');
    }
};


exports.getDanhGiaByLoaiPhong = async (req, res) => {
    const roomId = req.params.id;
    try {
        // Lấy thông tin loại phòng
        const roomType = await RoomType.findById(roomId);
        if (!roomType) {
            return res.status(404).send('Không tìm thấy loại phòng');
        }

        // Lấy danh sách bình luận từ bảng DanhGia theo id loại phòng
        const reviews = await DanhGia.find({ id_LoaiPhong: roomId }).populate('id_NguoiDung', 'tenNguoiDung');

        // Render view với thông tin loại phòng và bình luận
        res.render('../views/danhgia/chitietdanhgias', { roomType, reviews, message: "Bình luận đã được tải thành công" });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi tải bình luận');
    }
};


exports.updateReviewStatus = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { trangThai } = req.body;

        const review = await DanhGia.findById(reviewId);
        review.trangThai = trangThai;
        await review.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi khi cập nhật trạng thái bình luận');
    }
};


