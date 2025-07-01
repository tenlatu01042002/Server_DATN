const PhongModel = require('../model/phongs');
const LoaiPhongModel = require('../model/loaiphongs');
const ChiTietHoaDonModel = require('../model/chitiethoadons');


exports.getListorByIdorIdPhong = async (req, res, next) => {
    try {
        const { trangThai } = req.query; // Lấy trạng thái từ query params
        const loaiphongs = await LoaiPhongModel.find();

        // Tạo bộ lọc phòng dựa trên trạng thái
        let filter = {};
        if (trangThai !== undefined && trangThai !== '') {
            filter.trangThai = parseInt(trangThai, 10);
        }

        const phongs = await PhongModel.find(filter)
            .populate({
                path: 'id_LoaiPhong',
                select: 'tenLoaiPhong',
            })
            .lean();

        // await PhongModel.updateMany({ trangThai : 0})

        // Lấy chi tiết hóa đơn liên quan đến các phòng và trạng thái hóa đơn là 0 hoặc 1
        const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_Phong: { $in: phongs.map(p => p._id) } })
            .populate({
                path: 'id_HoaDon',
                select: 'ngayNhanPhong ngayTraPhong trangThai',
                match: { trangThai: { $in: [0, 1] } }, // Chỉ lấy hóa đơn có trạng thái 0 hoặc 1
            })
            .lean();

        for (const phong of phongs) {
            // Tìm chi tiết hóa đơn phù hợp với phòng
            const chiTiet = chiTietHoaDons.find(ct => String(ct.id_Phong) === String(phong._id));
            if (chiTiet && chiTiet.id_HoaDon) {
                phong.ngayNhanPhong = chiTiet.id_HoaDon.ngayNhanPhong;
                phong.ngayTraPhong = chiTiet.id_HoaDon.ngayTraPhong;
            } else {
                phong.ngayNhanPhong = null;
                phong.ngayTraPhong = null;
            }


            // Nếu phòng đang dọn dẹp (giả sử trạng thái 3), đặt setTimeout để chuyển trạng thái về 0 sau 15 phút
            if (phong.trangThai === 3) {
                setTimeout(async () => {
                    try {
                        await PhongModel.updateOne({ _id: phong._id }, { trangThai: 0 });
                    } catch (error) {
                        console.error(`Lỗi khi cập nhật trạng thái phòng ${phong._id}:`, error.message);
                    }
                }, 15 * 60 * 1000); // 15 phút
            }
        }

        const message = req.session.message;
        delete req.session.message;

        res.render('../views/phong/phongs', {
            message: message || null,
            phongs: phongs,
            loaiphongs: loaiphongs,
            trangThai: trangThai || '', // Truyền giá trị trạng thái vào view
        });
    } catch (error) {
        console.error(error);
        res.render('../views/phong/phongs', {
            message: 'Lỗi khi lấy dữ liệu',
            phongs: [],
            loaiphongs: [],
            trangThai: trangThai || '', // Truyền giá trị trạng thái vào view ngay cả khi lỗi
        });
    }
};

exports.addPhong = async (req, res, next) => {
    try {
        const data = req.body;
        const Existorphong = await PhongModel.findOne({soPhong : data.soPhong});
        if(Existorphong){
            req.session.message = "Số phòng đã tồn tại!";
            return res.redirect('/web/phongs');
        }

        const phong = new PhongModel({
            soPhong: data.soPhong,
            id_LoaiPhong: data.id_LoaiPhong,
            VIP: data.VIP,
            trangThai: data.trangThai,
        })

        await phong.save();

        req.session.message = "Thêm thành công!";
        // Trả về kết quả
        res.redirect('/web/phongs');

    } catch (error) {
        console.error(error);
        res.render('../views/phong/phongs', {
            message: 'Lỗi khi lấy dữ liệu',
            phongs: [],
        });
    }
}

exports.suaPhong = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const phong = await PhongModel.findOne({_id : id});
        if(phong.trangThai !== 0 && phong.trangThai !== 3){
            req.session.message = "Phòng có khách đặt không thể sửa!";
            // Trả về kết quả
            return res.redirect('/web/phongs');
        }
        // Sử dụng findByIdAndUpdate để tìm và cập nhật dữ liệu
        await PhongModel.findByIdAndUpdate(id, data, { new: true });

        req.session.message = "Sửa thành công!";
        // Trả về kết quả
        res.redirect('/web/phongs');

    } catch (error) {
        console.error(error);
        res.render('../views/phong/phongs', {
            message: 'Lỗi khi lấy dữ liệu',
            loaiphongs: [],
        });
    }
}

exports.xoaPhong = async (req, res, next) => {
    try {
        const { id } = req.params;
        await PhongModel.findByIdAndDelete(id); // Xóa phòng
        req.session.message = 'Xóa thành công';
        res.redirect('/web/phongs'); // Điều hướng lại danh sách phòng
    } catch (error) {
        console.error(error);
        req.session.message = 'Lỗi khi xóa phòng';
        res.redirect('/web/phongs');
    }
}

exports.getTrangThai = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lấy thông tin trạng thái của phòng từ database
        const chiTietHoaDons = await ChiTietHoaDonModel.find({ id_Phong: id })
            .populate({
                path: 'id_HoaDon',
                select: 'ngayNhanPhong ngayTraPhong trangThai',
                match: { trangThai: { $in: [0, 1] } }, // Chỉ lấy hóa đơn có trạng thái 0 hoặc 1
            })
            .lean();

        // Tạo một mảng ngày từ ngày nhận phòng đến ngày trả phòng
        const calendarData = chiTietHoaDons
            .map(chiTiet => {
                // Kiểm tra nếu id_HoaDon là null
                if (!chiTiet.id_HoaDon) {
                    console.warn(`Chi tiết hóa đơn ${chiTiet._id} không có id_HoaDon liên kết.`);
                    return []; // Bỏ qua phần tử này
                }

                const startDate = new Date(chiTiet.id_HoaDon.ngayNhanPhong);
                const endDate = new Date(chiTiet.id_HoaDon.ngayTraPhong);
                const events = [];

                // Thêm các ngày từ ngày nhận phòng đến ngày trả phòng vào mảng events
                for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
                    events.push({
                        title: 'Có khách', // Hoặc thay đổi tên sự kiện theo ý bạn
                        start: new Date(date),
                        end: new Date(date),
                        description: 'Phòng đã được đặt',
                        color: 'red' // Màu sắc sự kiện (có thể thay đổi)
                    });
                }

                return events;
            })
            .flat(); // Dùng flat() để làm phẳng mảng nếu có nhiều phòng

        console.log('====================================');
        console.log(chiTietHoaDons);
        console.log('====================================');
        res.json(calendarData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu trạng thái phòng' });
    }
};

