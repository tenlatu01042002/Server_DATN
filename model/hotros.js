const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HoTroModel = new Schema({
    id_NguoiDung: { type: Schema.Types.ObjectId, ref: 'nguoidung' },
    vanDe : { type : String , required : true},
    trangThai : { type : Number, default : 0},// 0 : chua xu ly, 1 : dang xu ly, 2 : da xu ly
    phanHoi:{type: String}
},{
    timestamps : true
})

module.exports = mongoose.model('hotro',HoTroModel)