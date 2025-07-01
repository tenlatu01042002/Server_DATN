const HoTroModel = require('../model/hotros');
const ThongBaoModel = require("../model/thongbaos");
const NguoiDungModel = require("../model/nguoidungs");
const socket = require('../socket');

exports.getListorByIdUser = async (req, res, next) => {
    try {
        const { id_NguoiDung } = req.query;

        // Xây dựng filter từ query parameters
        let filter = {};
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }

        const hotros = await HoTroModel.find(filter).sort({ createdAt: -1 });

        if (hotros.length === 0) {
            return res.status(404).json({ status: 404, message: "Không tìm thấy hỗ trợ nào" });
        }

        res.status(200).json({ status: 200, message: "Lấy danh sách thành công", data: hotros });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Lỗi khi lấy dữ liệu", error: error.message });
    }
};

exports.addHoTro = async (req, res, next) => {
    try {
        const data = req.body;
        const hotro = new HoTroModel({
            id_NguoiDung: data.id_NguoiDung,
            vanDe: data.vanDe,
            trangThai: 0, // Trạng thái 0: Chưa xử lý
        })

        const result = await hotro.save();

        if (result) {
            // Thông báo cho người dùng
            const thongBaoNguoiDung = new ThongBaoModel({
                id_NguoiDung: data.id_NguoiDung,
                tieuDe: "Yêu cầu hỗ trợ thành công!",
                noiDung: `Vấn đề "${data.vanDe}" của bạn đã được gửi đến quản lý khách sạn. 
Xin vui lòng chờ phản hồi từ quản lý trong vài phút tới. 
Xin cảm ơn!.`,
                ngayGui: new Date(),
            });

            await thongBaoNguoiDung.save();

            const user = await NguoiDungModel.findOne({_id : data.id_NguoiDung})

            // Thông báo cho quản lý
            const thongBaoQuanLy = new ThongBaoModel({
                tieuDe: `${user.tenNguoiDung} : Yêu cầu hỗ trợ!`,
                noiDung: `Khách hàng ${user.tenNguoiDung} vừa yêu cầu hỗ trợ với vấn đề: "${data.vanDe}". 
Vui lòng kiểm tra và phản hồi!.`,
                ngayGui: new Date(),
                avatar: user.hinhAnh,
            });

            await thongBaoQuanLy.save();

            // Sử dụng WebSocket để gửi thông báo
            const io = socket.getIO(); // Lấy đối tượng io từ socket.js

            // Gửi thông báo đến người dùng
            io.to(data.id_NguoiDung).emit('new-notification', {
                id_NguoiDung: data.id_NguoiDung,
                message: "Bạn vừa yêu cầu hỗ trợ!",
                type: "success",
                thongBaoData: thongBaoNguoiDung,
            });

            // Gửi thông báo đến quản lý (tùy thuộc vào cách định danh phòng của quản lý, ví dụ "admin-room")
            io.to("admin-room").emit('new-notification', {
                message: `Yêu cầu hỗ trợ mới từ khách hàng ${user.tenNguoiDung}!`,
                type: "info",
                thongBaoData: {
                    avatar: user.hinhAnh,
                    tieuDe: thongBaoQuanLy.tieuDe,
                    noiDung: thongBaoQuanLy.noiDung,
                    ngayGui: thongBaoQuanLy.ngayGui,
                },
            });
            

            res.status(200).json({ status: 200, message: "Thêm hỗ trợ thành công", data: result });
        } else {
            res.status(400).json({ status: 400, message: "Thêm hỗ trợ thất bại", data: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Lỗi khi thêm dữ liệu", error: error.message });
    }
};

