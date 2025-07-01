const HotroModel = require('../model/hotros'); // Model hỗ trợ
const socket = require('../socket');
const ThongBaoModel = require('../model/thongbaos');
const NguoiDungModel = require('../model/nguoidungs');
const { sendFirebaseNotification } = require('./utils');
// Lấy danh sách hoặc theo ID


exports.getListOrByID = async (req, res) => {
    try {
        const { id } = req.query;
        const filter = id ? { _id: id } : {};

        // Truy vấn và populate tên người dùng từ bảng nguoidung
        const hotros = await HotroModel.find(filter).populate('id_NguoiDung', 'tenNguoiDung');

        if (hotros.length === 0) {
            return res.render('../views/hotro/hotros', { message: 'Không tìm thấy thông tin hỗ trợ', hotros: [] });
        }

        const message = req.session.message;
        delete req.session.message;

        res.render('../views/hotro/hotros', { message: message || null, hotros });
    } catch (error) {
        console.error(error);
        res.render('../views/hotro/hotros', { message: 'Lỗi khi lấy dữ liệu', hotros: [] });
    }
};



// Lấy thông tin chi tiết của 1 hỗ trợ theo ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.query;
        const hotro = await HotroModel.findOne({ _id: id });

        if (!hotro) {
            req.session.message = 'Không tìm thấy thông tin hỗ trợ!';
            return res.redirect('/web/hotros');
        }

        res.render('../views/hotro/hotro', { hotro }); // Gửi dữ liệu vào view 'edit.ejs'
    } catch (error) {
        req.session.message = 'Lỗi khi tải thông tin hỗ trợ!';
        res.redirect('/web/hotros');
    }
};


// Cập nhật thông tin hỗ trợ
exports.suaHotro = async (req, res) => {
    try {
        const { id } = req.params;
        const hotro = await HotroModel.findById(id);

        if (!hotro) {
            req.session.message = 'Không tìm thấy thông tin hỗ trợ!';
            return res.redirect('/web/hotros');
        }

        const { trangThai: oldTrangThai } = hotro;
        const { trangThai: newTrangThai, phanHoi } = req.body;

        // Cập nhật thông tin hỗ trợ
        await HotroModel.findByIdAndUpdate(id, req.body, { new: true });

        if (oldTrangThai !== newTrangThai) {
            // Gửi thông báo
            const io = socket.getIO();
            const id_NguoiDung = hotro.id_NguoiDung;
            const sockets = await io.in(id_NguoiDung.toString()).fetchSockets();

            // Xác định tiêu đề và nội dung thông báo
            let tieuDe = '';
            let noiDung = '';

            if (newTrangThai == 1) {
                tieuDe = 'Yêu cầu hỗ trợ của bạn đang được xử lý!';
                noiDung = `Vấn đề ${hotro.vanDe} của bạn đang được xử lý.
Phản hồi: ${phanHoi}. 
Xin cảm ơn!`;
            } else if (newTrangThai == 2) {
                tieuDe = 'Yêu cầu hỗ trợ của bạn đã được xử lý!';
                noiDung = `Vấn đề ${hotro.vanDe} đã được xử lý. 
Phản hồi: ${phanHoi}. 
Xin cảm ơn!`;
            }

            // Lưu thông báo vào cơ sở dữ liệu
            const thongBaoData = new ThongBaoModel({
                id_NguoiDung,
                tieuDe,
                noiDung,
                ngayGui: new Date(),
            });
            
            await thongBaoData.save();

            if (sockets.length > 0) {
                // Gửi qua Socket.IO
                io.to(id_NguoiDung.toString()).emit('new-notification', {
                    id_NguoiDung,
                    message: tieuDe,
                    type: 'success',
                    thongBaoData,
                });
            } else {
                // Gửi qua Firebase nếu người dùng offline
                const user = await NguoiDungModel.findById(id_NguoiDung);
                if (user && user.deviceToken) {
                    await sendFirebaseNotification(
                        user.deviceToken,
                        tieuDe,
                        noiDung,
                        { hotroId: String(hotro._id) }
                    );
                }
            }
        }

        req.session.message = 'Cập nhật thông tin hỗ trợ thành công!';
        res.redirect('/web/hotros');
    } catch (error) {
        console.error('Lỗi cập nhật thông tin hỗ trợ:', error);
        req.session.message = 'Lỗi khi cập nhật thông tin hỗ trợ!';
        res.redirect('/web/hotros');
    }
};


