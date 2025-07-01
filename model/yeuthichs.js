const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const YeuThichModel = new Schema({
    id_LoaiPhong : {type: Schema.Types.ObjectId, ref: 'loaiphong', required: true},
    id_NguoiDung : {type: Schema.Types.ObjectId, ref: 'nguoidung', required : true},
})

module.exports = mongoose.model("yeuthich",YeuThichModel);