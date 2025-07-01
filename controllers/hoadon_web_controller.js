const HoadonModel = require('../model/hoadons');
const ChiTietHoaDonModel = require('../model/chitiethoadons');
const CouponModel = require('../model/coupons')
const PhongModel = require('../model/phongs')
const User = require('../model/nguoidungs')
const { formatCurrencyVND, formatDate } = require('./utils');
const socket = require('../socket');
const ThongBaoModel = require('../model/thongbaos');
const { sendFirebaseNotification } = require('./utils');

exports.getListorByIdUserorStatus = async (req, res, next) => {
    try {
        const { id_NguoiDung, trangThai } = req.query;

        // Xây dựng điều kiện lọc
        let filter = {};
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }

        // Lọc theo trạng thái hóa đơn nếu có
        if (trangThai !== undefined && trangThai !== '') {
            filter.trangThai = parseInt(trangThai, 10); // Đảm bảo giá trị là số
        }

        // Lấy danh sách hóa đơn theo điều kiện
        const hoadons = await HoadonModel.find(filter)
            .populate('id_NguoiDung', 'tenNguoiDung')
            .sort({ createdAt: -1 });

        if (hoadons.length === 0) {
            res.render('../views/hoadon/hoadons', {
                hoadons: [],
                trangThai: trangThai || '', // Truyền trạng thái vào view
                message: 'Không tìm thấy hóa đơn nào.',
            });
            return;
        }

        // Lấy chi tiết hóa đơn song song
        const results = await Promise.all(
            hoadons.map(async (hoadon) => {
                // Tính số đêm đặt phòng
                let soDem = Math.ceil(
                    (new Date(hoadon.ngayTraPhong) - new Date(hoadon.ngayNhanPhong)) /
                    (1000 * 60 * 60 * 24)
                );

                // Tìm chi tiết hóa đơn
                const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_HoaDon: hoadon._id });

                if (!chiTietHoaDons.length) {
                    return { ...hoadon.toObject(), tongPhong: 0, tongKhach: 0, tongTien: 0 };
                }

                // Tính tổng số phòng, khách và tiền
                hoadon.tongPhong = chiTietHoaDons.length;
                hoadon.tongKhach = chiTietHoaDons.reduce((total, item) => total + item.soLuongKhach, 0);

                // Thêm mã hóa đơn từ 8 ký tự cuối của _id
                const maHoaDon = hoadon._id.toString().slice(-8);

                return {
                    ...hoadon.toObject(),
                    createdAt: formatDate(hoadon.createdAt),
                    ngayThanhToan: hoadon.ngayThanhToan ? formatDate(hoadon.ngayThanhToan) : '',
                    ngayNhanPhong: formatDate(hoadon.ngayNhanPhong),
                    ngayTraPhong: formatDate(hoadon.ngayTraPhong),
                    maHoaDon,
                    soDem,
                    tongTien: formatCurrencyVND(hoadon.tongTien),
                };
            })
        );

        // Render kết quả
        const message = req.session.message || null;
        delete req.session.message;

        res.render('../views/hoadon/hoadons', {
            hoadons: results,
            trangThai: trangThai || '', // Duy trì trạng thái lọc
            message,
        });
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.render('../views/hoadon/hoadons', {
            hoadons: [],
            trangThai: trangThai || '', // Truyền trạng thái vào view ngay cả khi lỗi
            message: 'Lỗi khi lấy dữ liệu.',
        });
    }
};

exports.getDetailAPI = async (req, res) => {
    try {
        const { id } = req.params;

        // Tìm hóa đơn và chi tiết
        const hoadon = await HoadonModel.findById(id)
            .populate('id_NguoiDung', 'tenNguoiDung email')
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

        res.json({ error: false, hoadon });
    } catch (error) {
        console.error('Error fetching invoice details:', error);
        res.status(500).json({ error: true, message: 'Lỗi khi lấy chi tiết hóa đơn.' });
    }
};

// Hàm cập nhật trạng thái hóa đơn và đồng bộ trạng thái phòng
exports.updateTrangThai = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;

        const newTrangThai = parseInt(trangThai, 10);
        if (isNaN(newTrangThai)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ.' });
        }

        const hoadon = await HoadonModel.findById(id);
        const chiTiets = await ChiTietHoaDonModel.find({ id_HoaDon: id }).populate('id_Phong', 'trangThai');
        if (!chiTiets) {
            return res.status(404).json({ success: false, message: 'Chi tiết hóa đơn không tồn tại.' });
        }

        const validTransitions = {
            1: [0, 2], // "Đã thanh toán" -> "Nhận phòng" hoặc "Hủy"
            0: [3],    // "Đã nhận phòng" -> "Đã trả phòng"
        };

        if (
            validTransitions[hoadon.trangThai] &&
            !validTransitions[hoadon.trangThai].includes(newTrangThai)
        ) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ để cập nhật.' });
        }

        hoadon.trangThai = newTrangThai;
        await hoadon.save();

        const updatePhongStatus = async (status) => {
            await Promise.all(
                chiTiets.map(async (item) => {
                    await PhongModel.updateOne(
                        { _id: item.id_Phong },
                        { trangThai: status }
                    );
                })
            );
        };

        if (newTrangThai === 0) {
            await updatePhongStatus(1);
        } else if (newTrangThai === 2) {
            await updatePhongStatus(0);
        } else if (newTrangThai === 3) {
            await updatePhongStatus(3);
            setTimeout(async () => {
                try {
                    await updatePhongStatus(0);
                } catch (error) {
                    console.error('Error updating status after 15 minutes:', error.message);
                }
            }, 0.5 * 60 * 1000);
        }

        const maHoaDon = hoadon._id.toString().slice(-8);
        const io = require('../socket').getIO();

        if (newTrangThai === 2 || newTrangThai === 0 || newTrangThai === 3) {
            const thongBaoData = new ThongBaoModel({
                id_NguoiDung: hoadon.id_NguoiDung,
                tieuDe: newTrangThai === 2 ? 'Đơn đặt phòng của bạn đã bị hủy!' :
                    newTrangThai === 0 ? 'Nhận phòng thành công!' : 'Trả phòng thành công!',
                noiDung: newTrangThai === 2 ?
                    `Mã hóa đơn : ${maHoaDon} - Tổng tiền : ${formatCurrencyVND(hoadon.tongTien)} VND.\n` +
                    `Bạn vui lòng liên hệ với chúng tôi qua hotline 0367.974.725 để được hỗ trợ hoàn trả lại tiền đặt phòng!`
                    : `Mã hóa đơn : ${maHoaDon} - Tổng tiền : ${formatCurrencyVND(hoadon.tongTien)} VND`,
                ngayGui: new Date(),
            });

            await thongBaoData.save();

            const sockets = await io.in(hoadon.id_NguoiDung.toString()).fetchSockets();
            const rooms = io.sockets.adapter.rooms;

            // Kiểm tra các room và các socket trong room
            for (const [room, sockets] of rooms) {
                console.log(`Room: ${room}, Sockets: ${Array.from(sockets.keys())}`);
            }

            // Gửi thông báo tới người dùng nếu socket tồn tại
            if (sockets.length > 0) {
                io.to(hoadon.id_NguoiDung.toString()).emit('new-notification', {
                    id_NguoiDung: hoadon.id_NguoiDung,
                    message: thongBaoData.tieuDe,
                    type: 'success',
                    thongBaoData,
                });
            } else {
                // Gửi thông báo qua Firebase nếu không có socket online
                const user = await User.findById(hoadon.id_NguoiDung);
                if (user && user.deviceToken) {
                    await sendFirebaseNotification(
                        user.deviceToken,
                        thongBaoData.tieuDe,
                        thongBaoData.noiDung,
                        { voucherId: id }
                    );
                }
            }
        }


        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công.',
            hoadon,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống.', error: error.message });
    }
};
