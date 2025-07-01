const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TienNghiModel = new Schema({
    tenTienNghi : { type : String , required : true},
    image : { type : String},
    imageId : { type : String},
},{
    timestamps : true
})

module.exports = mongoose.model('tiennghi',TienNghiModel)