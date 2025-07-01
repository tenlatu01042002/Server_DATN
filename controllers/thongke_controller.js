const AmThucModel = require('../model/amthucs');
const TienNghiModel = require('../model/tiennghis');
const PhongModel = require('../model/phongs');
const LoaiPhongModel = require('../model/loaiphongs');
const ChiTietHoaDonModel = require('../model/chitiethoadons');
const NguoiDungModel = require('../model/nguoidungs');
const HoTroModel = require('../model/hotros');
const HoadonModel = require('../model/hoadons');
const CouponModel = require('../model/coupons');
const DichVuModel = require('../model/dichvus');
const DanhGiaModel = require('../model/danhgias');
const { formatCurrencyVND } = require('./utils');

exports.getDashboardData = async (req, res, next) => {
    try {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Tính toán tổng số và doanh thu
        const [
            totalAmThuc,
            totalTienNghi,
            totalPhong,
            totalPhongTrong,
            totalLoaiPhong,
            totalChiTietHoaDon,
            totalNguoiDung,
            totalHoTro,
            totalHoaDon,
            totalCoupon,
            totalDichVu,
            totalDanhGia,
            hoTroChuaXuLy,
            hoaDonChuaXuLy,
            hoaDonBiHuy,
            tongDoanhThuHoaDon,
            doanhThuThang,
            topKhachHang,
            topLoaiPhong
        ] = await Promise.all([
            AmThucModel.countDocuments(),
            TienNghiModel.countDocuments(),
            PhongModel.countDocuments(),
            PhongModel.countDocuments({ trangThai: 0 }),
            LoaiPhongModel.countDocuments(),
            ChiTietHoaDonModel.countDocuments(),
            NguoiDungModel.countDocuments({ chucVu: { $ne: 2 } }),
            HoTroModel.countDocuments(),
            HoadonModel.countDocuments(),
            CouponModel.countDocuments(),
            DichVuModel.countDocuments(),
            DanhGiaModel.countDocuments(),
            HoTroModel.countDocuments({ trangThai: 0 }),
            HoadonModel.countDocuments({ trangThai: 1 }),
            HoadonModel.countDocuments({ trangThai: 2 }),
            HoadonModel.aggregate([
                { $match: { trangThai: { $ne: 2 } } },
                { $group: { _id: null, total: { $sum: "$tongTien" } } }
            ]),
            HoadonModel.aggregate([
                {
                    $match: {
                        trangThai: { $ne: 2 },
                        ngayThanhToan: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: "$tongTien" } } }
            ]),
            getTop10KhachHang(),
            getTop10LoaiPhong()
        ]);

        const tongDoanhThuHoaDons = tongDoanhThuHoaDon.length > 0 ? tongDoanhThuHoaDon[0].total : 0;
        const doanhThuThangs = doanhThuThang.length > 0 ? doanhThuThang[0].total : 0;

        const results = {
            totalAmThuc,
            totalTienNghi,
            totalPhong,
            totalPhongTrong,
            totalLoaiPhong,
            totalChiTietHoaDon,
            totalNguoiDung,
            totalHoTro,
            totalHoaDon,
            totalCoupon,
            totalDichVu,
            totalDanhGia,
            hoTroChuaXuLy,
            hoaDonChuaXuLy,
            hoaDonBiHuy,
            tongDoanhThuHoaDon: formatCurrencyVND(tongDoanhThuHoaDons),
            doanhThuThang: formatCurrencyVND(doanhThuThangs),
            topKhachHang,
            topLoaiPhong
        };

        const message = req.session.message || null;
        delete req.session.message;

        const rawData = await getBieuDoData();
        const processedData = processBieuDoData(rawData);
        // console.log(" doan thu ", processedData.doanhThuTheoThang)
        // console.log(" luot dat ", processedData.luotDatLoaiPhong)
        res.render('home', {
            results,
            bieuDoData: processedData.doanhThuTheoThang,
            luotDatLoaiPhong: processedData.luotDatLoaiPhong, // Dữ liệu biểu đồ tròn
            message,
            topKhachHang,
            topLoaiPhong
        });
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu dashboard:", error);
        res.render('home', {
            results: {}, // Trả về object rỗng khi có lỗi
            message: 'Lỗi khi lấy dữ liệu.'
        });
    }
};


const getBieuDoData = async () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // Ngày đầu tiên của năm
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1); // Ngày đầu tiên của năm tiếp theo

    const bieuDoData = await HoadonModel.aggregate([
        {
            $match: {
                trangThai: { $ne: 2 }, // Chỉ lấy hóa đơn đã hoàn thành
                ngayThanhToan: { $gte: startOfYear, $lt: endOfYear }, // Lọc theo năm hiện tại
            },
        },
        {
            $lookup: {
                from: "chitiethoadons", // Tên collection chi tiết hóa đơn
                localField: "_id",
                foreignField: "id_HoaDon",
                as: "chiTietHoaDon",
            },
        },
        { $unwind: "$chiTietHoaDon" }, // Tách chi tiết hóa đơn thành từng dòng
        {
            $lookup: {
                from: "phongs", // Tên collection phòng
                localField: "chiTietHoaDon.id_Phong",
                foreignField: "_id",
                as: "phong",
            },
        },
        { $unwind: "$phong" }, // Tách thông tin phòng
        {
            $lookup: {
                from: "loaiphongs", // Tên collection loại phòng
                localField: "phong.id_LoaiPhong",
                foreignField: "_id",
                as: "loaiPhong",
            },
        },
        { $unwind: "$loaiPhong" }, // Tách thông tin loại phòng
        {
            $group: {
                _id: {
                    month: { $month: "$ngayThanhToan" }, // Gom nhóm theo tháng
                    loaiPhong: "$loaiPhong.tenLoaiPhong", // Gom nhóm theo tên loại phòng
                },
                doanhThu: { $sum: "$chiTietHoaDon.tongTien" }, // Tính tổng doanh thu
                soLuotDat: { $sum: 1 }, // Tính tổng lượt đặt
            },
        },
        {
            $sort: { "_id.month": 1 }, // Sắp xếp theo tháng tăng dần
        },
    ]);

    // console.log("Kết quả sau $group:", JSON.stringify(bieuDoData, null, 2));

    return bieuDoData;
};

const processBieuDoData = (bieuDoData) => {
    const processedData = {
        doanhThuTheoThang: {}, // Dữ liệu cho biểu đồ doanh thu
        luotDatLoaiPhong: {}, // Dữ liệu cho biểu đồ tròn
    };

    bieuDoData.forEach((item) => {
        const { month, loaiPhong } = item._id;

        // Xử lý doanh thu theo tháng
        if (!processedData.doanhThuTheoThang[loaiPhong]) {
            processedData.doanhThuTheoThang[loaiPhong] = Array(12).fill(0);
        }
        processedData.doanhThuTheoThang[loaiPhong][month - 1] = item.doanhThu;

        // Tính tổng số lượt đặt cho mỗi loại phòng
        if (!processedData.luotDatLoaiPhong[loaiPhong]) {
            processedData.luotDatLoaiPhong[loaiPhong] = 0;
        }
        processedData.luotDatLoaiPhong[loaiPhong] += item.soLuotDat;
    });

    return processedData;
};


const getTop10KhachHang = async () => {
    const topKhachHang = await HoadonModel.aggregate([
        {
            $match: {
                trangThai: { $ne: 2 }, 
            },
        },
        {
            $group: {
                _id: "$id_NguoiDung", // Gom nhóm theo ID người dùng
                soLanDatPhong: { $sum: 1 }, // Đếm số lần đặt phòng
            },
        },
        {
            $sort: { soLanDatPhong: -1 }, // Sắp xếp theo số lần đặt giảm dần
        },
        {
            $limit: 10, // Lấy top 10 khách hàng
        },
        {
            $lookup: {
                from: "nguoidungs", // Tên collection người dùng
                localField: "_id",
                foreignField: "_id",
                as: "thongTinNguoiDung",
            },
        },
        {
            $unwind: "$thongTinNguoiDung", // Tách thông tin người dùng
        },
        {
            $project: {
                _id: 0,
                idNguoiDung: "$_id",
                tenNguoiDung: "$thongTinNguoiDung.tenNguoiDung", // Lấy tên người dùng
                email: "$thongTinNguoiDung.email",
                soLanDatPhong: 1, // Số lần đặt phòng
            },
        },
    ]);

    return topKhachHang;
};

const getTop10LoaiPhong = async () => {
    const topLoaiPhong = await DanhGiaModel.aggregate([
        {
            $match: { trangThai: true }, // Chỉ lấy đánh giá có trạng thái hợp lệ
        },
        {
            $group: {
                _id: "$id_LoaiPhong", // Gom nhóm theo ID loại phòng
                soLuongDanhGia: { $sum: 1 }, // Đếm số lượt đánh giá
                diemTrungBinh: { $avg: "$soDiem" }, // Tính điểm trung bình
            },
        },
        {
            $lookup: {
                from: "loaiphongs", // Kết nối với collection LoaiPhong
                localField: "_id",
                foreignField: "_id",
                as: "loaiPhong",
            },
        },
        {
            $unwind: "$loaiPhong", // Tách thông tin loại phòng
        },
        {
            $project: {
                _id: 0,
                idLoaiPhong: "$_id", // ID loại phòng
                tenLoaiPhong: "$loaiPhong.tenLoaiPhong", // Tên loại phòng
                giaTien: "$loaiPhong.giaTien", // Giá tiền loại phòng
                soLuongDanhGia: 1, // Số lượt đánh giá
                diemTrungBinh: { $round: ["$diemTrungBinh", 2] }, // Làm tròn điểm trung bình đến 2 chữ số
            },
        },
        {
            $sort: { diemTrungBinh: -1, soLuongDanhGia: -1 }, // Sắp xếp theo điểm trung bình và số lượt đánh giá
        },
        {
            $limit: 10, // Giới hạn lấy top 10
        },
    ]);

    return topLoaiPhong;
};
