const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Định nghĩa schema cho bảng liên kết giữa người dùng và coupon
const NguoiDungCouponModel = new Schema({
    id_NguoiDung: {
        type: Schema.Types.ObjectId, // Dùng ObjectId để tham chiếu đến người dùng
        ref: 'nguoidung', // 'User' là tên của mô hình người dùng của bạn
        required: true // Trường này là bắt buộc
    },
    id_Coupon: {
        type: Schema.Types.ObjectId, // Dùng ObjectId để tham chiếu đến coupon
        ref: 'coupon', // 'Coupon' là tên của mô hình coupon của bạn
        required: true // Trường này là bắt buộc
    },
    trangThai: {
        type: Boolean,
        default: true // Mặc định trạng thái là true (chưa dùng)
    }
});


module.exports = mongoose.model('nguoidungcoupon', NguoiDungCouponModel);
