const nguoiDungModel = require('../model/nguoidungs');
const HoadonModel = require('../model/hoadons');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");
const fs = require('fs');

const ChiTietHoaDonModel = require('../model/chitiethoadons');
const NguoiDungCouponModel = require('../model/nguoidungcoupons');
const { formatDate } = require('./utils');

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id) {
            filter._id = id;
        }

        const nguoidungs = await nguoiDungModel.find(filter);

        if (nguoidungs.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }

        res.send(nguoidungs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }
};

exports.addNguoiDung = async (req, res, next) => {
    console.log("Files received in addNguoiDung:", req.file);

    try {
        let imageUrl = '';
        let imageId = ''; // Lưu public_id của ảnh chính

        const file = req.file; // Xử lý file upload
        if (file) {
            const result = await uploadToCloudinary(file.path); // Upload lên Cloudinary
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path); // Xóa file tạm sau khi upload
        }

        const data = req.body;

        // Kiểm tra số điện thoại
        if (!data.soDienThoai || data.soDienThoai.length !== 10 || isNaN(data.soDienThoai)) {
            return res.status(400).json({ message: "Số điện thoại chưa hợp lệ (10 số)" });
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        const existingUser = await nguoiDungModel.findOne({ soDienThoai: data.soDienThoai });
        if (existingUser) {
            return res.status(400).json({ message: "Số điện thoại đã được đăng ký tài khoản khác" });
        }

        // Tạo tài khoản người dùng mới
        const nguoidung = new nguoiDungModel({
            ...req.body,
            hinhAnh: imageUrl || '',
            hinhAnhID: imageId || '',
        });

        const result = await nguoidung.save(); // Lưu vào cơ sở dữ liệu
        res.json({ status: 200, message: "Đăng ký thành công", data: result });

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Lỗi khi xử lý đăng ký người dùng', error });
    }
};

exports.suaNguoiDung = async (req, res, next) => {
    console.log("Files received in addNguoiDung:", req.file);

    try {
        const data = req.body;
        const { id } = req.params;
        const file = req.file;

        const user = await nguoiDungModel.findOne({ _id : id });

        if(user.soDienThoai !== data.soDienThoai){
            const checkSDT = await nguoiDungModel.findOne({ soDienThoai: data.soDienThoai }); 

            if (checkSDT) {
                return res.status(303).send({ message: 'Số điện thoại đã được liên kết tài khoản khác' });
            }
        }
        
        let imageUrl = user.hinhAnh;
        let imageId = user.hinhAnhID; // Lưu public_id của ảnh chính
  
        if (file) {
            if (imageId) {
                await deleteFromCloudinary(imageId)
            }
            const result = await uploadToCloudinary(file.path); // Upload lên Cloudinary
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path); // Xóa file tạm sau khi upload
        }

        const result = await nguoiDungModel.findByIdAndUpdate(id, {
            ...req.body,
            hinhAnh: data.hinhAnh || imageUrl,
            hinhAnhID: data.hinhAnhID || imageId
        }, { new: true })
        res.json({ status: 200, message: "Cập nhật thông tin thành công", data: result });

    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Lỗi khi xử lý sửa thông tin người dùng', error });
    }
};



exports.PhongbyIdNguoidung = async (req, res, next) => {
    try {
        const { id } = req.params;
        const today = new Date();

        // Tìm người dùng
        const nguoidung = await nguoiDungModel.findById(id);
        if (!nguoidung) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Lấy danh sách hóa đơn của người dùng trong khoảng ngày hiện tại
        const hoadons = await HoadonModel.find({
            id_NguoiDung: id,
            trangThai : 0
        });

        if (!hoadons.length) {
            return res.status(200).json({ message: 'Không có phòng nào trong khoảng thời gian hiện tại' });
        }

        // Lấy danh sách ID hóa đơn
        const hoadonIds = hoadons.map(hoadon => hoadon._id);

        // Tìm các chi tiết hóa đơn liên quan đến các hóa đơn này
        const chiTietHoaDons = await ChiTietHoaDonModel.find({
            id_HoaDon: { $in: hoadonIds }
        })
            .populate({
                path: 'id_Phong',
                populate: { path: 'id_LoaiPhong', model: 'loaiphong' } // Populate thêm loại phòng
            });

        if (!chiTietHoaDons.length) {
            return res.status(200).json({ message: 'Không tìm thấy chi tiết hóa đơn nào liên quan.' });
        }

        // Trả về danh sách phòng
        const danhSachPhong = chiTietHoaDons.map(cthd => {
            const phong = cthd.id_Phong;
            const loaiPhong = phong.id_LoaiPhong;

            return {
                phong: {
                    _id: phong._id,
                    soPhong: phong.soPhong,
                    loaiPhong: loaiPhong ? {
                        _id: loaiPhong._id,
                        tenLoaiPhong: loaiPhong.tenLoaiPhong,
                        moTa: loaiPhong.moTa,
                        giaTien: loaiPhong.giaTien,
                        hinhAnh: loaiPhong.hinhAnh
                    } : null,
                    VIP: phong.VIP,
                },
                soLuongKhach: cthd.soLuongKhach,
                giaPhong: cthd.giaPhong,
                buaSang: cthd.buaSang,
                ngayNhanPhong: hoadons.find(hd => String(hd._id) === String(cthd.id_HoaDon)).ngayNhanPhong,
                ngayTraPhong: hoadons.find(hd => String(hd._id) === String(cthd.id_HoaDon)).ngayTraPhong,
            };
        });

        res.status(200).json(chiTietHoaDons);

    } catch (error) {
        console.error('Error fetching rooms by user ID:', error);
        res.status(500).json({ message: 'Lỗi server', error });
    }
};

exports.getMyCoupon = async (req, res) => {
    try {
        const { id } = req.params

        if (id === null || id === undefined) {
            return res.status(404).json({ message: 'Vui lòng cung cấp id người dùng.' });
        }

        const mycoupon = await NguoiDungCouponModel.find({ id_NguoiDung: id, trangThai: true })
            .populate('id_Coupon', 'maGiamGia giamGia giamGiaToiDa dieuKienToiThieu ngayHetHan');

        if (!mycoupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá nào cho bạn.' });
        }

        const coupons = mycoupon.map(cp => {
            const coupon = cp.id_Coupon; // Lấy dữ liệu từ trường populate
            if (!coupon) return null; // Trường hợp coupon bị null

            return {
                maGiamGia: coupon.maGiamGia,
                giamGia: coupon.giamGia,
                giamGiaToiDa: coupon.giamGiaToiDa,
                dieuKienToiThieu: coupon.dieuKienToiThieu,
                ngayHetHan: formatDate(coupon.ngayHetHan),
                id_Coupon: coupon._id // Để theo dõi mã giảm giá của người dùng
            };
        }).filter(Boolean); // Loại bỏ các giá trị null (nếu có)

        // Trả về danh sách mã giảm giá
        return res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
}


