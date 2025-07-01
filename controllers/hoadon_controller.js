const HoadonModel = require('../model/hoadons');
const ChiTietHoaDonModel = require('../model/chitiethoadons')
const HoTroModel = require('../model/hotros');
const PhongModel = require('../model/phongs')
const DanhGiaModel = require('../model/danhgias')
const User = require('../model/nguoidungs')
const NguoiDungCouponModel = require('../model/nguoidungcoupons');
const { formatDate, formatCurrencyVND } = require('./utils');
const ThongBaoModel = require('../model/thongbaos');
const socket = require('../socket');
const moment = require('moment');
const { sendFirebaseNotification } = require('./utils');


exports.getListorByIdUserorStatus = async (req, res, next) => {
    try {
        const { id, id_NguoiDung, trangThai } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};

        if (id) {
            filter._id = id;
        }
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }
        // Lọc theo `trangThai` nếu có, nhưng kiểm tra trạng thái khác 3
        if (trangThai) {
            const trangThaiInt = parseInt(trangThai, 10); // Đảm bảo kiểu số
            filter.trangThai = trangThaiInt; // Lọc chính xác trạng thái được yêu cầu
        } else {
            // Mặc định lấy tất cả hóa đơn có trạng thái khác 3
            filter.trangThai = { $ne: 3 }; // MongoDB operator để kiểm tra "khác"
        }

        // Tìm hóa đơn theo điều kiện lọc
        const hoadons = await HoadonModel.find(filter).sort({ createdAt: -1 });

        if (hoadons.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy hóa đơn' });
        }

        // Lặp qua từng hóa đơn và lấy chi tiết
        const results = [];
        for (let hoadon of hoadons) {
            // Lấy chi tiết hóa đơn liên quan đến id_HoaDon
            const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_HoaDon: hoadon._id });

            if (chiTietHoaDons.length > 0) {
                // Tổng số phòng là số lượng phòng trong chi tiết hóa đơn
                hoadon.tongPhong = chiTietHoaDons.length;

                // Tổng số khách là tổng soLuongKhach trong chi tiết hóa đơn
                hoadon.tongKhach = chiTietHoaDons.reduce((total, item) => total + item.soLuongKhach, 0);

                hoadon.ngayThanhToan = hoadon.trangThai === 1 ? formatDate(hoadon.updatedAt) : ''

                // Cập nhật vào hóa đơn
                results.push({
                    ...hoadon.toObject(),
                    chitiet: chiTietHoaDons
                });
            }
        }

        // Trả về kết quả
        res.send(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
};


exports.addHoaDon = async (req, res, next) => {
    try {
        // Lấy các thông tin cần thiết từ body
        const { ...hoaDonData } = req.body;

        if (!hoaDonData.chiTiet || !Array.isArray(hoaDonData.chiTiet) || hoaDonData.chiTiet.length === 0) {
            return res.status(400).json({
                message: "Dữ liệu chi tiết hóa đơn không hợp lệ.",
            });
        }

        // Định dạng ngày
        const ngayNhanPhong = moment(hoaDonData.ngayNhanPhong, "DD/MM/YYYY").format("YYYY-MM-DD");
        const ngayTraPhong = moment(hoaDonData.ngayTraPhong, "DD/MM/YYYY").format("YYYY-MM-DD");

        // Chuyển đổi ngày thành đối tượng Date nếu cần tính toán
        const ngayNhanPhongDate = new Date(ngayNhanPhong);
        const ngayTraPhongDate = new Date(ngayTraPhong);

        // Tính số đêm
        const soDem = Math.max(1, (ngayTraPhongDate - ngayNhanPhongDate) / (1000 * 60 * 60 * 24));

        // Kiểm tra trạng thái từng phòng trước khi thêm
        const chiTietHoaDon = [];
        const soPhongDaDat = [];
        for (const item of hoaDonData.chiTiet) {
            const phong = await PhongModel.findOne({ _id: item.id_Phong });

            if (!phong) {
                return res.status(400).json({
                    message: `Phòng với ID ${item.id_Phong} không tồn tại.`
                });
            }

            if (phong.trangThai !== 0) { // Kiểm tra trạng thái phòng
                return res.status(400).json({
                    message: `Phòng ${phong.soPhong} không khả dụng.`
                });
            }

            soPhongDaDat.push(phong.soPhong);

            // Nếu phòng hợp lệ, thêm vào chi tiết hóa đơn
            chiTietHoaDon.push({
                id_Phong: item.id_Phong,
                id_HoaDon: null, // Sẽ cập nhật sau khi tạo hóa đơn
                soLuongKhach: item.soLuongKhach,
                giaPhong: item.giaPhong,
                buaSang: item.buaSang,
                tongTien: item.giaPhong * soDem
            });
        }

        // Kiểm tra và xử lý mã giảm giá
        let id_Coupon = hoaDonData.id_Coupon;
        if (id_Coupon !== "") {
            await NguoiDungCouponModel.updateOne(
                { _id: id_Coupon },
                { trangThai: false }
            );
        } else {
            id_Coupon = null;
        }

        // Tạo hóa đơn
        const hoadon = new HoadonModel({
            ...hoaDonData,
            id_Coupon: id_Coupon,
            ngayNhanPhong, // Lưu ngày định dạng yyyy/MM/dd vào DB
            ngayTraPhong,
        });

        await hoadon.save();

        // Gắn ID hóa đơn vào chi tiết hóa đơn và lưu chi tiết
        chiTietHoaDon.forEach(item => (item.id_HoaDon = hoadon._id));
        await ChiTietHoaDonModel.insertMany(chiTietHoaDon);

        // Cập nhật trạng thái phòng thành "2" (đã đặt)
        await Promise.all(
            chiTietHoaDon.map(item =>
                PhongModel.updateOne({ _id: item.id_Phong }, { trangThai: 2 })
            )
        );

        // Thêm mã hóa đơn từ 8 ký tự cuối của _id
        const maHoaDon = hoadon._id.toString().slice(-8);

        // Gửi thông báo cho người dùng
        const thongBaoData = new ThongBaoModel({
            id_NguoiDung: hoaDonData.id_NguoiDung,
            tieuDe: "Bạn vừa đặt phòng thành công!",
            noiDung: `Thông tin:
  - Mã hóa đơn: ${maHoaDon}
  - Phòng: ${soPhongDaDat}
  - Tổng tiền: ${formatCurrencyVND(hoadon.tongTien)} VNĐ.
  - Từ ${formatDate(hoadon.ngayNhanPhong)} đến ${formatDate(hoadon.ngayTraPhong)}.
  Vui lòng đến nhận phòng đúng giờ theo chính sách nhận phòng tại Haven Inn!`,
            ngayGui: new Date(),
        });

        await thongBaoData.save();

        const io = socket.getIO(); // Lấy đối tượng io từ socket.js
        io.to(hoaDonData.id_NguoiDung).emit('new-notification', {
            id_NguoiDung: hoaDonData.id_NguoiDung,
            message: "Bạn vừa đặt phòng thành công!",
            type: "success",
            thongBaoData,
        });

        res.json({
            status: 200,
            message: "Tạo hóa đơn thành công.",
            data: {
                hoaDonId: hoadon._id,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi tạo hóa đơn.", error: error.message });
    }
};

exports.huyHoaDon = async (req, res) => {
    try {
        const { id } = req.params;

        const hoadon = await HoadonModel.findById(id);

        // Lấy hóa đơn hiện tại
        const chiTiets = await ChiTietHoaDonModel.find({ id_HoaDon: id }).populate('id_Phong', 'trangThai');
        if (!chiTiets) {
            return res.status(404).json({ success: false, message: 'Chi tiết hóa đơn không tồn tại.' });
        }

        // Cập nhật trạng thái hóa đơn
        hoadon.trangThai = 2;
        await hoadon.save();

        // Cập nhật trạng thái phòng dựa trên trạng thái hóa đơn mới
        await Promise.all(
            chiTiets.map(async (item) => {
                await PhongModel.updateOne(
                    { _id: item.id_Phong },
                    { trangThai: 0 }
                );
            })
        );

        // Thêm mã hóa đơn từ 8 ký tự cuối của _id
        const maHoaDon = hoadon._id.toString().slice(-8);

        const thongBaoData = new ThongBaoModel({
            id_NguoiDung: hoadon.id_NguoiDung,
            tieuDe: `Bạn vừa hủy đơn đặt phòng ${maHoaDon}!`,
            noiDung: `Mã hóa đơn : ${maHoaDon} - Tổng tiền : ${formatCurrencyVND(hoadon.tongTien)} VND,
Bạn vui lòng liên hệ với chúng tôi qua hotline 0367.974.725 để được hỗ trợ hoàn trả lại tiền đặt phòng!`,
            ngayGui: new Date(),
        });

        await thongBaoData.save();

        const user = await User.findOne({ _id: hoadon.id_NguoiDung })

        // Thông báo cho quản lý
        const thongBaoQuanLy = new ThongBaoModel({
            tieuDe: `${user.tenNguoiDung} : Vừa hủy đơn đặt phòng: ${maHoaDon}!`,
            noiDung: `Khách hàng ${user.tenNguoiDung} vừa hủy đơn đặt phòng ${maHoaDon}- Tổng tiền : ${formatCurrencyVND(hoadon.tongTien)} VND, 
Vui lòng kiểm tra và phản hồi ở phần hỗ trợ!.`,
            ngayGui: new Date(),
            avatar: user.hinhAnh,
        });

        await thongBaoQuanLy.save();

        const io = socket.getIO();
        const sockets = await io.in(hoadon.id_NguoiDung.toString()).fetchSockets();

        if (sockets.length > 0) {
            // Gửi thông báo qua Socket.IO nếu người dùng online
            io.to(hoadon.id_NguoiDung.toString()).emit('new-notification', {
                id_NguoiDung: hoadon.id_NguoiDung,
                message: `Đơn đặt phòng ${maHoaDon} của bạn đã bị hủy!`,
                type: 'success',
                thongBaoData,
            });
        } else {
            // Gửi thông báo qua Firebase nếu người dùng offline
            const user = await User.findById(hoadon.id_NguoiDung);
            if (user && user.deviceToken) {
                await sendFirebaseNotification(
                    user.deviceToken,
                    'Đơn đặt phòng của bạn đã bị hủy!',
                    `Mã hóa đơn : ${maHoaDon} - Tổng tiền : ${formatCurrencyVND(hoadon.tongTien)} VND,
Bạn vui lòng liên hệ với chúng tôi qua hotline 0367.974.725 để được hỗ trợ hoàn trả lại tiền đặt phòng!`,
                    { voucherId: id }
                );
            }
        }

        // Gửi thông báo đến quản lý (tùy thuộc vào cách định danh phòng của quản lý, ví dụ "admin-room")
        io.to("admin-room").emit('new-notification', {
            message: `${user.tenNguoiDung} : Vừa hủy đơn đặt phòng: ${maHoaDon}!`,
            type: "info",
            thongBaoData: {
                avatar: user.hinhAnh,
                tieuDe: thongBaoQuanLy.tieuDe,
                noiDung: thongBaoQuanLy.noiDung,
                ngayGui: thongBaoQuanLy.ngayGui,
            },
        });

        const hotro = new HoTroModel({
            id_NguoiDung: hoadon.id_NguoiDung,
            vanDe: thongBaoQuanLy.noiDung,
            trangThai: 0, // Trạng thái 0: Chưa xử lý
        })

        await hotro.save();

        res.json({
            success: true,
            message: 'Hủy đơn đặt phòng thành công.',
            hoadon,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống.', error: error.message });
    }
};

exports.getLichSuDatPhong = async (req, res, next) => {
    try {
        const { id, id_NguoiDung, trangThai } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};

        if (id) {
            filter._id = id;
        }
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }
        if (trangThai) {
            const trangThaiInt = parseInt(trangThai, 10); // Đảm bảo kiểu số
            filter.trangThai = trangThaiInt;
        }

        // Tìm hóa đơn theo điều kiện lọc
        const hoadons = await HoadonModel.find(filter).sort({ createdAt: -1 });

        if (hoadons.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy hóa đơn' });
        }

        // Lặp qua từng hóa đơn và lấy chi tiết
        const results = [];
        for (let hoadon of hoadons) {
            // Lấy chi tiết hóa đơn liên quan đến id_HoaDon
            const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_HoaDon: hoadon._id })
                .populate({
                    path: 'id_Phong',
                    select: 'soPhong id_LoaiPhong', // Lấy số phòng và loại phòng
                    populate: {
                        path: 'id_LoaiPhong',
                        select: '_id tenLoaiPhong hinhAnh', // Lấy tên loại phòng
                    },
                })
                .lean();

            if (chiTietHoaDons.length > 0) {
                // Lấy tất cả `id_LoaiPhong` từ các chi tiết
                const id_LoaiPhongList = chiTietHoaDons
                    .map((chitiet) => chitiet.id_Phong?.id_LoaiPhong?._id)
                    .filter((id) => id !== undefined); // Loại bỏ giá trị null hoặc undefined


                const checkDanhGia = await DanhGiaModel.findOne({id_NguoiDung : hoadon.id_NguoiDung, id_LoaiPhong : id_LoaiPhongList[0]})
                let danhGia = false
                if(checkDanhGia){
                    danhGia = true
                }
                // Thêm vào kết quả chính
                results.push({
                    ...hoadon.toObject(),
                    id_LoaiPhong: id_LoaiPhongList[0], // Danh sách các id_LoaiPhong
                    checkDanhGia : danhGia,
                    chitiet: chiTietHoaDons.map((chitiet) => ({
                        ...chitiet,
                        soPhong: chitiet.id_Phong?.soPhong || null,
                        tenLoaiPhong: chitiet.id_Phong?.id_LoaiPhong?.tenLoaiPhong || null,
                        hinhAnh: chitiet.id_Phong?.id_LoaiPhong?.hinhAnh || null,
                    })),
                });
            }
        }

        // Trả về kết quả
        res.send(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
};



exports.getDetailAPI = async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm hóa đơn và chi tiết
        const hoadon = await HoadonModel.findById(id)
            .populate('id_NguoiDung', 'tenNguoiDung email soDienThoai')
            .populate('id_Coupon', 'maGiamGia')
            .lean();

        if (!hoadon) {
            return res.render({ error: true, message: 'Không tìm thấy hóa đơn.' });
        }

        const ngayNhanPhong = new Date(hoadon.ngayNhanPhong);
        const ngayTraPhong = new Date(hoadon.ngayTraPhong);

        if (isNaN(ngayNhanPhong.getTime()) || isNaN(ngayTraPhong.getTime())) {
            return res.status(400).json({
                error: true,
                message: "Ngày nhận hoặc ngày trả không hợp lệ.",
            });
        }

        const soDem = Math.ceil((ngayTraPhong - ngayNhanPhong) / (1000 * 60 * 60 * 24));
        if (soDem <= 0) {
            return res.status(400).json({
                error: true,
                message: "Ngày trả phòng phải sau ngày nhận phòng.",
            });
        }


        const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_HoaDon: hoadon._id })
            .populate({
                path: 'id_Phong',
                select: 'soPhong id_LoaiPhong VIP',
                populate: { path: 'id_LoaiPhong', select: 'tenLoaiPhong giaTien' },
            })
            .lean();


        const ngayThanhToan = hoadon.ngayThanhToan ? formatDate(hoadon.ngayThanhToan) : ''
        console.log('ngay thanh toán : ', ngayThanhToan)
        hoadon.ngayNhanPhong = formatDate(hoadon.ngayNhanPhong);
        hoadon.ngayTraPhong = formatDate(hoadon.ngayTraPhong);
        hoadon.createdAt = formatDate(hoadon.createdAt);
        hoadon.ngayThanhToan = ngayThanhToan;


        // Định dạng dữ liệu trả về
        hoadon.chiTiet = chiTietHoaDons.map((ct) => ({
            soPhong: ct.id_Phong.soPhong,
            tenLoaiPhong: ct.id_Phong.id_LoaiPhong?.tenLoaiPhong || 'Không xác định',
            giaPhong: ct.giaPhong,
            VIP: ct.id_Phong.VIP,
            soLuongKhach: ct.soLuongKhach,
            tongTien: ct.tongTien,
            buaSang: ct.buaSang,
            soDem: soDem
        }));

        res.json(hoadon);
    } catch (error) {
        console.error('Error fetching invoice details:', error);
        res.status(500).json({ error: true, message: 'Lỗi khi lấy chi tiết hóa đơn.' });
    }
};