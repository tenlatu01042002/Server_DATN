const CouponModel = require('../model/coupons');

// Hàm lấy danh sách coupon
exports.getCoupons = async (req, res, next) => {
    try {
        let coupons = await CouponModel.find().sort({ createdAt: -1 });

        // Lấy giờ hiện tại theo UTC
        const currentDate = new Date(); // UTC thời gian hiện tại

        // Cập nhật trạng thái cho các coupon đã hết hạn
        coupons = await Promise.all(coupons.map(async (coupon) => {
            if (new Date(coupon.ngayHetHan) < currentDate) {
                coupon.trangThai = 1; // Cập nhật thành trạng thái "hết hạn"
                await coupon.save(); // Lưu lại thay đổi vào cơ sở dữ liệu
            }
            else{
                coupon.trangThai = 0; // Cập nhật thành trạng thái "còn hạn"
                await coupon.save();
            }
            return coupon;
        }));

        const message = req.session.message
        req.session.message = null

        res.render('coupon/coupons.ejs', { coupons, message: message ? message : null, formData: null });
    } catch (error) {
        console.error(error);
        res.render('coupons', { message: "Error fetching data", coupons: [] });
    }
};

// Hàm thêm mới coupon
exports.addCoupon = async (req, res, next) => {
    try {
        const data = req.body;

        // Kiểm tra trùng mã giảm giá
        const CheckMaGiamGia = await CouponModel.findOne({ maGiamGia: data.maGiamGia });
        if (CheckMaGiamGia) {
            req.session.message = 'Mã giảm giá không được trùng!'
            return res.redirect('/web/coupons');  
        }

        // Kiểm tra ngày hết hạn để quyết định trạng thái
        let trangThai = 0; // Mặc định trạng thái là chưa sử dụng
        const expirationDate = new Date(data.ngayHetHan); // Chuyển ngày hết hạn thành đối tượng Date
        if (expirationDate < new Date()) {
            trangThai = 2; // Nếu hết hạn, gán trạng thái là hết hạn
        }
        else{
            trangThai=0;
        }
        

        // Tạo mới coupon
        const coupon = new CouponModel({
            maGiamGia: data.maGiamGia,
            giamGia: data.giamGia/100,
            giamGiaToiDa: data.giamGiaToiDa,
            dieuKienToiThieu: data.dieuKienToiThieu,
            ngayBatDau: data.ngayBatDau,
            ngayHetHan: expirationDate.toISOString(), // Chuyển ngày hết hạn thành định dạng ISO string
            trangThai: trangThai,
        });

        const result = await coupon.save();

        if (result) {
            res.redirect('/web/coupons');
        }
    } catch (error) {
        console.error(error);
        res.render('/web/coupons', { message: "Error adding coupon", coupons: [],formData: req.body });
    }
};

// Hàm sửa coupon
exports.editCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

// Kiểm tra trùng mã giảm giá (trừ mã coupon hiện tại)
const CheckMaGiamGia = await CouponModel.findOne({
    maGiamGia: data.maGiamGia,
    _id: { $ne: id } // Tìm coupon trùng mã, ngoại trừ coupon hiện tại
});

if (CheckMaGiamGia) {
    return res.render('coupon/coupons.ejs', {
        message: "Mã giảm giá đã tồn tại. Vui lòng chọn mã khác.",
        coupons: [],
        formData: data 
    });
}

        // Kiểm tra ngày hết hạn để quyết định trạng thái
        let trangThai = data.trangThai;
        const expirationDate = new Date(data.ngayHetHan);
        if (expirationDate < new Date()) {
            trangThai = 2; // Nếu hết hạn, gán trạng thái là hết hạn
        }
        else{
            trangThai=0;
        }

        // Cập nhật coupon trong cơ sở dữ liệu
        const result = await CouponModel.findByIdAndUpdate(id, { 
            ...data, 
            giamGia: data.giamGia/100,
            trangThai, 
            ngayHetHan: expirationDate.toISOString(), // Chuyển ngày hết hạn thành ISO string
        }, { new: true });

        if (result) {
            res.redirect('/web/coupons');
        } else {
            res.render('coupons', { message: "Update failed", coupons: [] });
        }
    } catch (error) {
        console.error(error);
        res.render('coupons', { message: "Error updating coupon", coupons: [] });
    }
};

// Hàm xóa coupon
exports.deleteCoupon = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await CouponModel.findByIdAndDelete(id);
        if (result) {
            res.redirect('/web/coupons');
        } else {
            res.render('coupons', { message: "Không tìm thấy mã giảm giá để xóa", coupons: [] });
        }
    } catch (error) {
        res.render('coupons', { message: "Lỗi hệ thống", coupons: [] });
    }
};
