const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const TienNghiPhongModel = new Schema({
    id_LoaiPhong : {type: Schema.Types.ObjectId, ref: 'loaiphong', required: true},
    id_TienNghi : {type: Schema.Types.ObjectId, ref: 'tiennghi', required : true},
    moTa : { type : String}
})

module.exports = mongoose.model("tiennghiphong",TienNghiPhongModel);