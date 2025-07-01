const ChiTietHoaDonModel = require('../model/chitiethoadons');
const PhongModel = require('../model/phongs');
const LoaiPhongModel = require('../model/loaiphongs');

exports.getListorByIDHoaDon = async (req, res, next) => {
    try {
        const { id_HoaDon } = req.query;

        if (!id_HoaDon) {
            return res.status(400).send({ message: 'Vui lòng cung cấp id_HoaDon' });
        }

        // Lấy danh sách chi tiết hóa đơn dựa trên id_HoaDon
        const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_HoaDon }).sort({ createdAt: -1 });

        if (chiTietHoaDons.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy chi tiết hóa đơn nào' });
        }

        // Lấy danh sách id_Phong từ chi tiết hóa đơn
        const idPhongList = chiTietHoaDons.map(item => item.id_Phong);

        // Truy vấn danh sách phòng từ PhongModel
        const phongs = await PhongModel.find({ _id: { $in: idPhongList } });

        // Ghép dữ liệu chi tiết hóa đơn với thông tin phòng
        const result = chiTietHoaDons.map(chiTiet => {
            const phong = phongs.find(p => p._id.toString() === chiTiet.id_Phong.toString());
            return {
                ...chiTiet.toObject(),
                soPhong: phong.soPhong || null, // Thêm thông tin phòng, nếu không tìm thấy thì để null
            };
        });

        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy dữ liệu", error: error.message });
    }
};


exports.addChiTietHoaDon = async (req, res, next) => {
    try {
        const data = req.body;

        // Kiểm tra nếu không có id_HoaDon
        if (!data.id_HoaDon) {
            return res.status(403).json({ message: "Chưa tạo id hóa đơn" });
        }

        // Kiểm tra xem cặp id_Phong và id_HoaDon đã tồn tại chưa
        const existingChiTiet = await ChiTietHoaDonModel.findOne({
            id_Phong: data.id_Phong,
            id_HoaDon: data.id_HoaDon,
        });

        if (existingChiTiet) {
            return res.status(400).json({ 
                message: "Phòng này đã tồn tại trong hóa đơn" 
            });
        }

        // Lấy thông tin phòng từ id_Phong
        const phong = await PhongModel.findById(data.id_Phong);
        if (!phong) {
            return res.status(404).json({ message: "Không tìm thấy phòng với id_Phong đã cung cấp" });
        }

        // Lấy thông tin loại phòng từ id_LoaiPhong
        const loaiPhong = await LoaiPhongModel.findById(phong.id_LoaiPhong);
        if (!loaiPhong) {
            return res.status(404).json({ message: "Không tìm thấy loại phòng với id_LoaiPhong của phòng" });
        }

        const tongTien = phong.VIP && data.buaSang 
        ? loaiPhong.giaTien + 450000 
        :  phong.VIP ? loaiPhong.giaTien + 300000 
        : (data.buaSang ? loaiPhong.giaTien + 150000 : loaiPhong.giaTien);
        
        // Tạo mới chi tiết hóa đơn
        const chitiethoadon = new ChiTietHoaDonModel({
            id_Phong: data.id_Phong,
            id_HoaDon: data.id_HoaDon,
            soLuongKhach: 1,
            giaPhong: loaiPhong.giaTien, // Nếu là phòng VIP thì lấy giá VIP, ngược lại giá thường
            buaSang: data.buaSang || false, // Mặc định là false nếu không được cung cấp
            tongTien : tongTien,
        });

        // Lưu chi tiết hóa đơn vào database
        const result = await chitiethoadon.save();

        // Trả về kết quả
        res.json({
            status: 200,
            message: "Thêm chi tiết hóa đơn thành công",
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi thêm chi tiết hóa đơn", error: error.message });
    }
};

