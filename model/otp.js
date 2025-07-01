const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OtpModel = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    time: { 
        type: Date, 
        default: Date.now, 
        expires: 180 // 180 seconds (3 minutes)
    }
});

module.exports = mongoose.model('otp', OtpModel);
