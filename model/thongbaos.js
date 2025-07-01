const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ThongBaoModel = new Schema({
    id_NguoiDung: { type: Schema.Types.ObjectId, ref: 'nguoidung' },
    tieuDe : { type : String , required : true},
    noiDung : { type : String , required : true},
    ngayGui : { type : Date},
    avatar : { type : String},
    trangThai : { type : Boolean, default : true} // true : chưa đọc , false : đã đọc
},{
    timestamps : true
})

module.exports = mongoose.model('thongbao',ThongBaoModel)