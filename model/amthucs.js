const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AmThucModel = new Schema({
    tenNhaHang: { type: String, required: true },
    hinhAnh: { type: String },  // Lưu danh sách URL ảnh
    hinhAnhID: { type: String },  // Lưu id ảnh
    moTa: { type: String },
    menu: { type: [String] },  // Lưu URL của file menu
    menuIDs: { type: [String] },  // Lưu id
    gioMoCua: { type: String },  // Giờ mở cửa
    gioDongCua: { type: String },  // Giờ đóng cửa
    hotline : { type : String},
    viTri : { type : String}
}, {
    timestamps: true
});

module.exports = mongoose.model('AmThuc', AmThucModel);
