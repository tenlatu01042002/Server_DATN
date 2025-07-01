const fs = require('fs');
const DichVuModel = require('../model/dichvus');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        let filter = {};
        if (id) {
            filter._id = id;
        }

        const dichvus = await DichVuModel.find(filter);

        if (dichvus.length === 0) {
            return res.render('../views/dichvu/dichvus', { message: 'Không tìm thấy dịch vụ', dichvus: [] });
        }

        const message = req.session.message; // Lấy thông báo từ session
        delete req.session.message; // Xóa thông báo sau khi đã sử dụng

        res.render('../views/dichvu/dichvus', { message: message || null, dichvus });
    } catch (error) {
        console.error(error);
        res.render('../views/dichvu/dichvus', { message: 'Lỗi khi lấy dữ liệu', dichvus: [] });
    }
};


exports.addDichVu = async (req, res, next) => {
    try {
        let imageUrl = '';
        let imageId = '';

        const file = req.file;
        if (file) {
            const result = await uploadToCloudinary(file.path);
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path);
        }

        const dichvu = new DichVuModel({
            ...req.body,
            hinhAnh: imageUrl || '',
            hinhAnhID: imageId || '',
        });

        await dichvu.save();

        req.session.message = "Thêm dịch vụ thành công!";
        res.redirect('/web/dichvus'); // Chuyển hướng về danh sách
    } catch (error) {
        console.error('Error:', error);
        res.render('../views/dichvu/dichvus', { message: 'Lỗi khi thêm dịch vụ', dichvus: [] });
    }
};

exports.suaDichVu = async (req, res, next) => {
    try {
        const { id } = req.params;
        const file = req.file;

        const DichVu = await DichVuModel.findOne({ _id: id });
        if (!DichVu) {
            return res.render('../views/dichvu/dichvus', { message: 'Dịch vụ không tồn tại', dichvus: [] });
        }

        let imageUrl = DichVu.hinhAnh;
        let imageId = DichVu.hinhAnhID;

        if (imageId) {
            await deleteFromCloudinary(imageId);
        }
        if (file) {
            const result = await uploadToCloudinary(file.path);
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path);
        }

        await DichVuModel.findByIdAndUpdate(id, {
            ...req.body,
            hinhAnh: imageUrl,
            hinhAnhID: imageId,
        }, { new: true });

        req.session.message = "Sửa dịch vụ thành công!";
        res.redirect('/web/dichvus'); // Chuyển hướng về danh sách
    } catch (error) {
        console.error('Error:', error);
        res.render('../views/dichvu/dichvus', { message: 'Lỗi khi sửa dịch vụ', dichvus: [] });
    }
};

exports.xoaDichVu = async (req, res, next) => {
    try {
        const { id } = req.params;

        const DichVu = await DichVuModel.findOne({ _id: id });
        if (!DichVu) {
            return res.render('../views/dichvu/dichvus', { message: 'Dịch vụ không tồn tại', dichvus: [] });
        }

        if (DichVu.hinhAnhID) {
            await deleteFromCloudinary(DichVu.hinhAnhID);
        }

        await DichVuModel.findByIdAndDelete({ _id: id });

        req.session.message = "Xóa dịch vụ thành công!";
        res.redirect('/web/dichvus'); // Chuyển hướng về danh sách
    } catch (error) {
        console.error('Error:', error);
        res.render('../views/dichvu/dichvus', { message: 'Lỗi khi xóa dịch vụ', dichvus: [] });
    }
};
