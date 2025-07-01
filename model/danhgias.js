const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DanhGiaModel = new Schema({
    id_NguoiDung: { type: Schema.Types.ObjectId, ref: 'nguoidung', required: true },
    id_LoaiPhong: { type: Schema.Types.ObjectId, ref: 'loaiphong', required: true },
    soDiem: { type: Number, required: true, min: 0, max: 10 }, 
    binhLuan: { type: String, maxlength: 500 } ,
    trangThai:{type: Boolean,required: true , default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('danhgia', DanhGiaModel);
