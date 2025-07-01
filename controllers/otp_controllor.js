const OtpModel = require('../model/otp');
const bcrypt = require('bcrypt');

exports.insertOtp = async (email, otp) => {
    try {
        // Kiểm tra xem otp có phải là chuỗi không
        if (typeof otp !== 'string') {
            throw new Error('OTP phải là một chuỗi');
        }

        const salt = await bcrypt.genSalt(10); // Tạo salt với 10 vòng
        const hashOtp = await bcrypt.hash(otp, salt); // Mã hóa OTP

        const otpEntry = new OtpModel({
            email,
            otp: hashOtp
        });

        const savedOtp = await otpEntry.save(); // Lưu OTP vào DB
        return savedOtp; // Trả về thông tin OTP đã lưu thành công
    } catch (error) {
        console.log("Lỗi khi lưu OTP:", error);
        throw error; // Ném lỗi ra ngoài để xử lý tại chỗ gọi
    }
};


exports.vertifyOtp = async (otp, hashOtp) => {
    try {
        const isValid = await bcrypt.compare(otp, hashOtp);

        return isValid;
    } catch (error) {
        console.log("Lỗi khi xác thực OTP:", error);
        throw error;
    }
};
