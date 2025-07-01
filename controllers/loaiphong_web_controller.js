const LoaiPhongModel = require('../model/loaiphongs');
const TienNghiModel = require('../model/tiennghis');
const TienNghiPhongModel = require('../model/tiennghiphongs');
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/common/uploads");
const fs = require('fs');
const PhongModel = require('../model/phongs'); // Đường dẫn đến model phong
const { formatCurrencyVND } = require('./utils');


exports.getListorByID = async (req, res, next) => {
    try {
        const { id } = req.query;

        let filter = {};
        if (id) filter._id = id;

        const tiennghis = await TienNghiModel.find({}); // Lấy danh sách tiện nghi
        const loaiphongs = await LoaiPhongModel.find(filter).sort({ createdAt: -1 });

        if (loaiphongs.length === 0) {
            return res.render('../views/loaiphong/loaiphongs', {
                message: 'Không tìm thấy loại phòng',
                loaiphongs: []
            });
        }

        const phongCounts = await PhongModel.aggregate([
            { $group: { _id: "$id_LoaiPhong", totalPhong: { $sum: 1 } } }
        ]);

        const loaiphongsWithExtras = await Promise.all(
            loaiphongs.map(async (loaiphong) => {
                const loaiphongObj = loaiphong.toObject();
        
                // Lấy chi tiết các tiện nghi liên kết
                const tienNghiDetails = await TienNghiPhongModel.find({ id_LoaiPhong: loaiphong._id })
                    .populate('id_TienNghi', 'tenTienNghi')
                    .lean();
        
                const formattedGiaTien = formatCurrencyVND(loaiphong.giaTien);
        
                // Chuyển dữ liệu tiện nghi thành danh sách và mô tả
                const tienNghi = tienNghiDetails.map((detail) => detail.id_TienNghi._id.toString());

                const moTaTienNghi = tienNghiDetails.reduce((acc, detail) => {
                    acc[detail.id_TienNghi._id] = detail.moTa || "";
                    return acc;
                }, {});
        
                return {
                    ...loaiphongObj,
                    giaTien: loaiphong.giaTien,
                    tienNghi,
                    moTaTienNghi,
                    totalPhong: phongCounts.find(
                        (count) => count._id.toString() === loaiphong._id.toString()
                    )?.totalPhong || 0
                };
            })
        );
        
            
        const message = req.session.message;
        delete req.session.message;

        res.render('../views/loaiphong/loaiphongs', {
            message: message || null,
            loaiphongs: loaiphongsWithExtras,
            tiennghis
        });
    } catch (error) {
        console.error(error);
        res.render('../views/loaiphong/loaiphongs', {
            message: 'Lỗi khi lấy dữ liệu',
            loaiphongs: []
        });
    }
};




exports.addLoaiPhong = async (req, res) => {
    try {
        const imageUrls = [];
        const imageIds = []; // Mảng lưu public_id của ảnh chính

        // Truy cập đúng trường images trong req.files
        const images = req.files.filter(file => file.fieldname === 'images');

        // Kiểm tra và xử lý từng file trong mảng images
        if (images.length > 0) {  // Kiểm tra nếu có file images
            for (const file of images) {
                const filePath = file.path;
                const result = await uploadToCloudinary(filePath); // Upload ảnh
                imageUrls.push(result.secure_url);  // Lưu URL ảnh
                imageIds.push(result.public_id);    // Lưu public_id của ảnh
                await fs.promises.unlink(filePath);  // Xóa file đã upload
            }
        }

        // Tạo đối tượng mới cho LoaiPhong
        const newLoaiPhong = new LoaiPhongModel({
            ...req.body,
            hinhAnh: imageUrls,
            hinhAnhIDs: imageIds,
            // tienNghi: selectedTienNghi, // Lưu danh sách tiện nghi đã chọn
        });

        // Lưu vào database
        await newLoaiPhong.save();


        // Kiểm tra và xử lý tiện nghi
        const selectedTienNghi = Array.isArray(req.body.tienNghi)
            ? req.body.tienNghi
            : req.body.tienNghi ? [req.body.tienNghi] : []; // Đảm bảo luôn là mảng
        const moTaTienNghi = req.body.motaTienNghi || {}; // Đảm bảo luôn là đối tượng

        console.log("Received data:", req.body);
        console.log("Selected tiện nghi:", selectedTienNghi);
        console.log("Mô tả tiện nghi:", moTaTienNghi);


        if (selectedTienNghi.length > 0) {
            for (const tienNghiId of selectedTienNghi) {
                if (!tienNghiId) continue; // Bỏ qua giá trị null hoặc undefined

                const newTienNghiPhong = new TienNghiPhongModel({
                    id_LoaiPhong: newLoaiPhong._id,
                    id_TienNghi: tienNghiId,
                    moTa: moTaTienNghi[tienNghiId] || "", // Lấy mô tả hoặc để trống
                });
                await newTienNghiPhong.save();
            }
        }




        // Đưa thông báo và chuyển hướng về trang loaiphongs
        req.session.message = "Thêm loại phòng thành công!";
        res.redirect('/web/loaiphongs');
    } catch (error) {
        console.error('Error uploading files:', error);
        res.render('../views/loaiphong/loaiphongs', {
            message: 'Lỗi khi thêm loại phòng.',
            loaiphongs: []
        });
    }
};


exports.suaLoaiPhong = async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm loại phòng theo ID
        const loaiphong = await LoaiPhongModel.findById(id);
        if (!loaiphong) {
            return res.render('../views/loaiphong/loaiphongs', {
                message: 'Không tìm thấy loại phòng',
                loaiphongs: []
            });
        }

        // Khởi tạo giá trị hình ảnh từ loại phòng hiện tại
        let imageUrls = loaiphong.hinhAnh || [];
        let imageIds = loaiphong.hinhAnhIDs || [];

        // Lọc file upload mới
        const images = req.files.filter(file => file.fieldname === 'images');
        console.log("New images:", images); // Log kiểm tra ảnh mới

        if (images.length > 0) {
            // Xóa các ảnh cũ trên Cloudinary
            for (const publicId of imageIds) {
                await deleteFromCloudinary(publicId);
            }

            // Reset giá trị URL và public_id
            imageUrls = [];
            imageIds = [];

            // Upload các file mới lên Cloudinary
            for (const file of images) {
                const filePath = file.path;
                const result = await uploadToCloudinary(filePath); // Upload ảnh
                imageUrls.push(result.secure_url);  // Lưu URL ảnh
                imageIds.push(result.public_id);    // Lưu public_id ảnh
                await fs.promises.unlink(filePath);  // Xóa file đã upload
            }
        }

        // Cập nhật loại phòng
        await LoaiPhongModel.findByIdAndUpdate(
            id,
            {
                ...req.body,
                hinhAnh: imageUrls || loaiphong.hinhAnh,
                hinhAnhIDs: imageIds || loaiphong.hinhAnhIDs,
            },
            { new: true } // Trả về đối tượng đã cập nhật
        );

        // Xử lý tiện nghi và mô tả
        const selectedTienNghi = Array.isArray(req.body.tienNghi) ? req.body.tienNghi : [req.body.tienNghi];
        const moTaTienNghi = req.body.motaTienNghi || {}; // Dữ liệu mô tả từ form

        await TienNghiPhongModel.deleteMany({ id_LoaiPhong: id }); // Xóa tiện nghi cũ

        for (const tienNghiId of selectedTienNghi) {
            const newTienNghiPhong = new TienNghiPhongModel({
                id_LoaiPhong: req.params.id,
                id_TienNghi: tienNghiId,
                moTa: moTaTienNghi[tienNghiId] || "", // Lấy mô tả
            });
            await newTienNghiPhong.save();
        }


        // Trả về kết quả
        req.session.message = "Sửa thành công!";
        // Trả về kết quả
        res.redirect('/web/loaiphongs');
    } catch (error) {
        console.error('Error uploading files:', error);
        res.render('../views/loaiphong/loaiphongs', {
            message: 'Lỗi khi lấy dữ liệu',
            loaiphongs: []
        });
    }
};

exports.xoaLoaiPhong = async (req, res) => {
    try {
        const id = req.params.id;
        const LoaiPhong = await LoaiPhongModel.findById(id);

        // Kiểm tra xem món ăn có ảnh hay không
        if (LoaiPhong) {
            const imageIds = LoaiPhong.hinhAnhIDs;  // Lấy public_id ảnh chính

            // Xóa các ảnh khỏi Cloudinary
            if (imageIds && imageIds.length > 0) {
                for (const publicId of imageIds) {
                    await deleteFromCloudinary(publicId);
                }
            }

            // if (LoaiPhong.hinhAnhIDs.length > 0) {
            //     await Promise.all(LoaiPhong.hinhAnhIDs.map(id => deleteFromCloudinary(id)));
            // }
        }

        await LoaiPhongModel.findByIdAndDelete(id);
        req.session.message = "Xóa thành công!";
        res.redirect('/web/loaiphongs');
    } catch (error) {
        res.render('../views/loaiphong/loaiphongs', {
            message: 'Lỗi khi lấy dữ liệu',
            loaiphongs: []
        });
    }
};


exports.getLoaiPhongDetails = async (req, res) => {
    try {
        // Lấy thông tin loại phòng theo ID
        const { id } = req.params;  // ID loại phòng được truyền từ frontend
        const loaiPhong = await LoaiPhongModel.findById(id);

        if (!loaiPhong) {
            return res.status(404).send("LoaiPhong not found");
        }

        // Lấy thông tin tiện nghi cho loại phòng này
        const tienNghiPhong = await TienNghiPhongModel.find({ id_LoaiPhong: id })
            .populate('id_TienNghi'); // Lấy thông tin tiện nghi từ TienNghiModel

        // Lấy danh sách phòng theo id_LoaiPhong
        const phongList = await PhongModel.find({ id_LoaiPhong: id });

        // Nếu không có tiện nghi cho loại phòng
        const tienNghiDetails = tienNghiPhong.map(item => ({
            tenTienNghi: item.id_TienNghi.tenTienNghi,
            image: item.id_TienNghi.image,
            moTa: item.moTa,
        }));

        // Chuyển đổi trạng thái và VIP của phòng
        const phongListDetails = phongList.map(phong => ({
            soPhong: phong.soPhong,
            VIP: phong.VIP, // Chuyển VIP từ boolean thành chuỗi
            trangThai: phong.trangThai,
        }));

        // Trả về thông tin loại phòng, tiện nghi và hệ thống phòng
        res.json({
            tenLoaiPhong: loaiPhong.tenLoaiPhong,
            giuong: loaiPhong.giuong,
            soLuongKhach: loaiPhong.soLuongKhach,
            dienTich: loaiPhong.dienTich,
            giaTien: formatCurrencyVND(loaiPhong.giaTien),
            moTa: loaiPhong.moTa,
            hinhAnh: loaiPhong.hinhAnh,
            tienNghi: tienNghiDetails,  // Danh sách tiện nghi
            phongList: phongListDetails,  // Danh sách phòng đã chuyển trạng thái
        });
    } catch (error) {
        console.error('Error fetching loaiPhong details:', error);
        res.status(500).send('Internal Server Error');
    }
};

