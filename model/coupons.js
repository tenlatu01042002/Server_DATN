const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CouponModel = new Schema({
    maGiamGia : { type : String , required : true, unique : true},
    giamGia : { type : Number, required : true},
    giamGiaToiDa : { type : Number},
    dieuKienToiThieu : { type : Number},
    ngayBatDau : { type : String},
    ngayHetHan : { type : String},
    trangThai : { type : Number}, // còn hạn, hết hạn
},{
    timestamps : true
})

module.exports = mongoose.model('coupon',CouponModel)