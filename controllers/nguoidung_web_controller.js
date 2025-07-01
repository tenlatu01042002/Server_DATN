const nguoiDungModel = require('../model/nguoidungs');
const CCCDModel = require('../model/cccds');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");
const fs = require('fs');

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        // Xây dựng điều kiện lọc
        let filter = { chucVu: 0 };
        if (id) filter._id = id;

        // Lấy danh sách người dùng
        const nguoidungs = await nguoiDungModel.find(filter).lean();

        if (nguoidungs.length === 0) {
            req.session.message = "Không tìm thấy người dùng";
            return res.redirect("/web/nguoidungs");
        }

        // Lấy thông tin CCCD
        const nguoiDungIds = nguoidungs.map(user => user._id);
        const cccds = await CCCDModel.find({ id_NguoiDung: { $in: nguoiDungIds } }).lean();

        // Gắn CCCD vào từng người dùng
        nguoidungs.forEach(user => {
            user.cccd = cccds.find(cccd => String(cccd.id_NguoiDung) === String(user._id)) || null;
        });

        const message = req.session.message || null;
        delete req.session.message;

        res.render('../views/nguoidung/nguoidungs', { nguoidungs, message });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.render('../views/nguoidung/nguoidungs', {
            nguoidungs: [],
            message: 'Lỗi khi lấy dữ liệu',
        });
    }
};

exports.addNguoiDung = async (req, res, next) => {
    try {
        const { file, data } = req.data;

        // Xử lý file upload
        let imageUrl = '', imageId = '';

        if (file) {
            const result = await uploadToCloudinary(file.path);
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path); // Xóa file tạm
        }

        // Kiểm tra số điện thoại hợp lệ
        if (data.soDienThoai.length !== 10 || isNaN(data.soDienThoai)) {
            req.session.message = "Số điện thoại không hợp lệ (10 số).";
            return res.redirect('/web/nguoidungs');
        }

        // Kiểm tra trùng số điện thoại
        const existingSDT = await nguoiDungModel.findOne({ soDienThoai: data.soDienThoai });
        if (existingSDT) {
            req.session.message = "Số điện thoại đã tồn tại.";
            return res.redirect('/web/nguoidungs');
        }

        // Kiểm tra trùng số điện thoại
        const existingUser = await nguoiDungModel.findOne({ email: data.email });
        if (existingUser) {
            req.session.message = "Email đã tồn tại.";
            return res.redirect('/web/nguoidungs');
        }

        // Tạo người dùng mới
        const nguoidung = new nguoiDungModel({
            ...data,
            hinhAnh: imageUrl || '',
            hinhAnhID: imageId || '',
        });
        await nguoidung.save();

        req.session.message = "Thêm người dùng thành công.";
        res.redirect('/web/nguoidungs');
    } catch (error) {
        console.error("Error adding user:", error);
        req.session.message = "Lỗi khi thêm người dùng.";
        res.redirect('/web/nguoidungs');
    }
};


exports.suaNguoiDung = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { file, body: data } = req;

        const nguoidung = await nguoiDungModel.findById(id);
        if (!nguoidung) {
            req.session.message = "Người dùng không tồn tại.";
            return res.redirect('/web/nguoidungs');
        }

        // Xóa ảnh cũ nếu có
        if (nguoidung.hinhAnhID) await deleteFromCloudinary(nguoidung.hinhAnhID);

        // Upload ảnh mới nếu có
        let imageUrl = nguoidung.hinhAnh, imageId = nguoidung.hinhAnhID;
        if (file) {
            const result = await uploadToCloudinary(file.path);
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path);
        }

        // Cập nhật thông tin
        await nguoidung.updateOne({
            ...data,
            hinhAnh: imageUrl,
            hinhAnhID: imageId,
        });

        req.session.message = "Cập nhật thông tin thành công.";
        res.redirect('/web/nguoidungs');
    } catch (error) {
        console.error("Error updating user:", error);
        req.session.message = "Lỗi khi sửa thông tin người dùng.";
        res.redirect('/web/nguoidungs');
    }
};


exports.xoaNguoiDung = async (req, res, next) => {
    try {
        const { id } = req.params;

        const nguoidung = await nguoiDungModel.findById(id);
        if (!nguoidung) {
            req.session.message = "Người dùng không tồn tại.";
            return res.redirect('/web/nguoidungs');
        }

        // Xóa ảnh từ Cloudinary
        if (nguoidung.hinhAnhID) await deleteFromCloudinary(nguoidung.hinhAnhID);

        // Xóa người dùng
        await nguoiDungModel.findByIdAndDelete(id);

        req.session.message = "Xóa người dùng thành công.";
        res.redirect('/web/nguoidungs');
    } catch (error) {
        console.error("Error deleting user:", error);
        req.session.message = "Lỗi khi xóa người dùng.";
        res.redirect('/web/nguoidungs');
    }
};


exports.getDetail = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
        }

        const user = await nguoiDungModel.findById(id).lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const cccd = await CCCDModel.findOne({ id_NguoiDung: id }).lean();
        user.cccd = cccd || null;

        res.json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.block = async (req, res, next) => {
    try {
        const { id, trangThai } = req.query;

        const nguoidung = await nguoiDungModel.findById(id);
        if (!nguoidung) {
            req.session.message = "Người dùng không tồn tại.";
            return res.redirect('/web/nguoidungs');
        }

        // Chuyển trạng thái: nếu trangThai là true thì set thành false, ngược lại set thành true
        const newTrangThai = trangThai === 'true' ? false : true;  

        await nguoiDungModel.findByIdAndUpdate(id, { trangThai: newTrangThai }, { new: true });

        req.session.message = `Trạng thái người dùng ${nguoidung.tenNguoiDung} đã được thay đổi.`;
        res.redirect('/web/nguoidungs');

    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

