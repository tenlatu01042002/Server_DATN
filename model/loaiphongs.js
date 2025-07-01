const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoaiPhongModel = new Schema({
    tenLoaiPhong : { type : String , required : true},
    giuong : { type : String, required : true},
    soLuongKhach : { type : Number, required : true},
    dienTich : { type : Number, required : true},
    hinhAnh : { type : [String], required : true},
    hinhAnhIDs : { type : [String]},
    giaTien : { type : Number, required : true},
    moTa : { type : String},
    trangThai : { type : Boolean},
},{
    timestamps : true
})

module.exports = mongoose.model('loaiphong',LoaiPhongModel)