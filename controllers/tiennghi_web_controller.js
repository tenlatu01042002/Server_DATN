const fs = require('fs');
const TienNghiModel = require('../model/tiennghis');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");

exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id) {
            filter._id = id;
        }

        const tiennghis = await TienNghiModel.find(filter);

        if (tiennghis.length === 0) {
            res.render('../views/tiennghi/tiennghis.ejs');
            req.session.message = 'Chưa có tiện nghi nào';
        }

        const message = req.session.message; // Lấy thông báo từ session
        delete req.session.message; // Xóa thông báo sau khi đã sử dụng

        res.render('../views/tiennghi/tiennghis', { message: message || null, tiennghis });
    } catch (error) {
        console.error(error);
        res.render('../views/tiennghi/tiennghis.ejs');
        req.session.message = 'Lỗi hiển thị tiện nghi';
    }
};

exports.addTienNghi = async (req, res, next) => {
    console.log("Req Files :", req.file);

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

        const tiennghi = new TienNghiModel({
            ...req.body,
            image: imageUrl || '',
            imageId: imageId || '',
        });

        await tiennghi.save(); // Lưu vào cơ sở dữ liệu

        req.session.message = "Thêm tiện nghi thành công!";
        res.redirect('/web/tiennghis'); // Chuyển hướng về danh sách

    } catch (error) {
        console.error('Error:', error);
        res.render('../views/tiennghi/tiennghis.ejs');
        req.session.message = 'Lỗi khi thêm tiện nghi';
    }
};

exports.suaTienNghi = async (req, res, next) => {
    console.log("Files:", req.file);

    try {
        const data = req.body;
        const { id } = req.params;
        const file = req.file;

        const TienNghi = await TienNghiModel.findOne({ _id: id });

        if (TienNghi == null) {
            res.render('../views/tiennghi/tiennghis.ejs');
            req.session.message = 'Tiện nghi không tồn tại';
        }

        let imageUrl = TienNghi.image;
        let imageId = TienNghi.imageId; // Lưu public_id của ảnh chính

        if (imageId) {
            await deleteFromCloudinary(imageId)
        }
        if (file) {
            const result = await uploadToCloudinary(file.path); // Upload lên Cloudinary
            imageUrl = result.secure_url;
            imageId = result.public_id;
            await fs.promises.unlink(file.path); // Xóa file tạm sau khi upload
        }

        await TienNghiModel.findByIdAndUpdate(id, {
            ...req.body,
            image: data.image || imageUrl,
            imageId: data.imageId || imageId
        }, { new: true })

        req.session.message = "Sửa tiện nghi thành công!";
        res.redirect('/web/tiennghis'); // Chuyển hướng về danh sách

    } catch (error) {
        console.error('Error:', error);
        res.render('../views/tiennghi/tiennghis.ejs');
        req.session.message = 'Lỗi khi sửa tiện nghi';
    }
};

exports.xoaTienNghi = async (req, res, next) => {

    try {
        const { id } = req.params;

        const TienNghi = await TienNghiModel.findOne({ _id: id });

        if (TienNghi == null) {
            res.render('../views/tiennghi/tiennghis.ejs');
            req.session.message = 'Tiện nghi không tồn tại';
        }

        let imageId = TienNghi.imageId; // Lưu public_id của ảnh chính

        if (imageId) {
            await deleteFromCloudinary(imageId)
        }

        await TienNghiModel.findByIdAndDelete({ _id: id })

        req.session.message = "Xóa tiện nghi thành công!";
        res.redirect('/web/tiennghis'); // Chuyển hướng về danh sách

    } catch (error) {
        console.error('Error:', error);
        res.render('../views/tiennghi/tiennghis.ejs');
        req.session.message = 'Lỗi khi sửa tiện nghi';
    }
};


