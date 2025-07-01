const NguoiDungModel = require('../model/nguoidungs');
const CCCDModel = require('../model/cccds');

const nodemailer = require('nodemailer');
const { insertOtp, vertifyOtp } = require('./otp_controllor');
const OtpModel = require('../model/otp');
const OtpGenerator = require('otp-generator')
const bcrypt = require('bcrypt');
const { isValidPassword, isValidEmail } = require('./utils');


// Cấu hình transport cho Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Hoặc dịch vụ email khác
    auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
    },
});

// // Hàm tạo OTP ngẫu nhiên
// function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000); // OTP 6 chữ số
// }


exports.login = async (req, res, next) => {
    const { email, matKhau, deviceToken } = req.query; // Nhận thêm deviceToken từ client

    if (!email) {
        return res.status(401).json({ message: "Chưa nhập Email" });
    }

    try {
        const nguoidung = await NguoiDungModel.findOne({ email: email });
        if (!nguoidung) {
            return res.status(404).json({ message: "Email chưa đăng ký tài khoản!" });
        }

        if (!nguoidung.trangThai) {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị chặn khỏi ứng dụng" });
        }

        if (nguoidung.matKhau !== matKhau) {
            return res.status(401).json({ message: "Mật khẩu chưa đúng" });
        }

        // Cập nhật deviceToken nếu tồn tại
        if (deviceToken) {
            nguoidung.deviceToken = deviceToken;
            await nguoidung.save();
            console.log(`Device token cập nhật cho người dùng: ${nguoidung._id}`);
        }

        nguoidung.matKhau = null; // Không gửi mật khẩu về client

        const CheckXacMinh = await CCCDModel.findOne({ id_NguoiDung: nguoidung._id });

        return res.json({
            status: 200,
            message: "Đăng nhập thành công",
            userId: nguoidung._id,
            xacMinh: CheckXacMinh ? true : false,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Lỗi server");
    }
};


exports.logout = async (req, res, next) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.json({
                message: "Bạn chưa đăng nhập",
            });
        }

        const result = delete req.session.userId;
        console.log('Đăng xuất thành công, session:', req.session); // Debug session
        return res.json({
            status: 200,
            message: "Bạn đã đăng xuất ứng dụng",
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi server");
    }
}

exports.sendOtp = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(404).json({ message: "Email là bắt buộc" });
    }
    if (!email || !isValidEmail(email)) {
        return res.status(404).json({ message: "Email không hợp lệ" });
    }

    const existingUser = await NguoiDungModel.findOne({ email });
    if (existingUser) {
        return res.status(404).json({ message: "Email đã đăng ký tài khoản!" });
    }
    try {
        // Tạo OTP
        const otp = OtpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,  
            specialChars: false,
        })

        // Gửi email OTP
        const mailOptions = {
            from: `Haven Inn Hotel ${process.env.EMAIL}`,
            to: email,
            subject: 'Mã xác thực (OTP) - Haven Inn Hotel',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Chào bạn,</h2>
                    <p>Cảm ơn bạn đã sử dụng dịch vụ của <strong>Haven Inn Hotel</strong>!</p>
                    <p>
                        Mã xác thực (OTP) của bạn là: 
                        <span style="font-weight: bold; font-size: 18px; color: #333;">${otp}</span>
                    </p>
                    <p>
                        Mã này có hiệu lực trong vòng <strong>3 phút</strong>. 
                        Vui lòng không chia sẻ mã này với bất kỳ ai vì lý do bảo mật.
                    </p>
                    <p>
                        Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc liên hệ với chúng tôi để được hỗ trợ.
                    </p>
                    <br>
                    <p>Trân trọng,</p>
                    <p><strong>Đội ngũ Haven Inn Hotel</strong></p>
                </div>
            `,
        };


        await transporter.sendMail(mailOptions);

        // Lưu OTP vào DB
        const savedOtp = await insertOtp(email, otp);

        res.status(200).json({
            message: "OTP đã được gửi tới email của bạn!",
            email: email,
            otpEntry: savedOtp ? 1 : 0, // Trả về thông tin OTP đã lưu
        });
    } catch (error) {
        console.error("Lỗi gửi OTP:", error);
        res.status(500).json({ message: "Gửi OTP thất bại", error: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
        return res.status(404).json({ message: "Email và OTP là bắt buộc" });
    }

    try {

        const otps = await OtpModel.find({ email });

        if (!otps) {
            return res.status(404).json({ message: "OTP đã hết hạn" });
        }

        const lastOtp = otps[otps.length - 1];
        const isValid = await vertifyOtp(otpCode, lastOtp.otp);

        if (!isValid) {
            return res.status(404).json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
        }

        if (isValid && email === lastOtp.email) {
            res.status(200).json({ message: "Xác minh OTP thành công", email: email });
        }

    } catch (error) {
        console.error("Lỗi xác minh OTP:", error);
        res.status(500).json({ message: "Xác minh OTP thất bại", error: error.message });
    }
};

exports.register = async (req, res) => {
    const { email, matKhau, tenNguoiDung } = req.body;

    if (!email || !matKhau || !tenNguoiDung) {
        return res.status(404).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }

    const existingUser = await NguoiDungModel.findOne({ email });
    if (existingUser) {
        return res.status(404).json({ message: "Email đã đăng ký tài khoản!" });
    }

    if(!isValidPassword(matKhau)){
        return res.status(404).json({ message : "Mật khẩu phải it nhất 8 ký tự, bao gồm cả chữ và số"})
    }

    try {
        // Lưu người dùng mới vào cơ sở dữ liệu
        const newUser = new NguoiDungModel({
            email,
            matKhau,
            tenNguoiDung,
        });

        await newUser.save();

        // Nội dung email chào mừng
        const mailOptions = {
            from: `Haven Inn Hotel <${process.env.EMAIL}>`,
            to: email,
            subject: 'Chào mừng đến với Haven Inn Hotel!',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Xin chào, ${tenNguoiDung}!</h2>
                    <p>Chào mừng bạn đến với <strong>Haven Inn Hotel</strong> – giải pháp đặt phòng khách sạn tiện lợi và nhanh chóng.</p>
                    <p>
                        Chúng tôi rất vui được đồng hành cùng bạn trong việc tìm kiếm những trải nghiệm lưu trú hoàn hảo. 
                        Với ứng dụng Haven Inn Hotel, bạn có thể:
                    </p>
                    <ul>
                        <li>Dễ dàng tìm kiếm và đặt phòng tốt nhất tại Haven Inn.</li>
                        <li>Nhận ưu đãi độc quyền chỉ có trên ứng dụng.</li>
                        <li>Quản lý đặt phòng và nhận hỗ trợ 24/7.</li>
                    </ul>
                    <p>
                        Hãy tải ứng dụng ngay bây giờ để bắt đầu hành trình của bạn:
                        <a href="https://play.google.com/store/apps/details?id=com.haveninnhotel" style="color: #4CAF50; text-decoration: none;">Tải ứng dụng trên Google Play</a>
                    </p>
                    <p>
                        Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi. Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi.
                    </p>
                    <br>
                    <p>Trân trọng,</p>
                    <p><strong>Đội ngũ Haven Inn Hotel</strong></p>
                </div>

            `,
        };

        // Gửi email thông báo
        await transporter.sendMail(mailOptions);


        res.status(201).json({
            message: "Đăng ký thành công!",
            email: email,
        });
    } catch (error) {
        console.error("Lỗi khi đăng ký và gửi email:", error);
        res.status(500).json({ message: "Đăng ký thất bại", error: error.message });
    }
};

exports.forgotPass = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(404).json({ message: "Email là bắt buộc" });
        }
        if (!email || !isValidEmail(email)) {
            return res.status(404).json({ message: "Email không hợp lệ" });
        }

        const existingUser = await NguoiDungModel.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "Email chưa đăng ký tài khoản!" });
        }

        // Tạo OTP
        const otp = OtpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        })

        const mailOptions = {
            from: `Haven Inn Hotel <${process.env.EMAIL}>`,
            to: email,
            subject: 'Đặt lại mật khẩu - Haven Inn Hotel',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4CAF50;">Xin chào!</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Haven Inn Hotel.</p>
                    <p>
                        Mã xác thực (OTP) để đặt lại mật khẩu của bạn là: 
                        <span style="font-weight: bold; font-size: 18px; color: #333;">${otp}</span>
                    </p>
                    <p>
                        Mã này có hiệu lực trong vòng <strong>3 phút</strong>. 
                        Vui lòng không chia sẻ mã này với bất kỳ ai vì lý do bảo mật.
                    </p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <br>
                    <p>Trân trọng,</p>
                    <p><strong>Đội ngũ Haven Inn Hotel</strong></p>
                </div>
            `,
        };

        // Lưu OTP vào DB
        await insertOtp(email, otp);


        res.status(200).json({ message: "Vui lòng check mail để nhận OTP (6 số) !", email: email });

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
        res.status(500).json({ message: "Lỗi khi gửi email:", error: error.message });
    }
}

exports.setUpPass = async (req, res, next) => {
    try {
        const { email, matKhauMoi } = req.body;

        // Kiểm tra email và mật khẩu
        if (!email) {
            return res.status(404).json({ message: "Email là bắt buộc" });
        }
        if (!isValidEmail(email)) {
            return res.status(404).json({ message: "Email không hợp lệ" });
        }
        if (!matKhauMoi) {
            return res.status(404).json({ message: "Mật khẩu mới là bắt buộc" });
        }
        if (!isValidPassword(matKhauMoi)) {
            return res.status(404).json({
                message:
                    "Mật khẩu phải có ít nhất 8 ký tự và bao gồm cả chữ và số",
            });
        }

        // Tìm người dùng theo email
        const nguoidung = await NguoiDungModel.findOne({ email });
        if (!nguoidung) {
            return res.status(404).json({ message: "Email chưa đăng ký tài khoản!" });
        }

        // Cập nhật mật khẩu
        nguoidung.matKhau = matKhauMoi; // Nên hash mật khẩu trước khi lưu
        await nguoidung.save();

        return res
            .status(200)
            .json({ message: "Mật khẩu đã được đổi, bạn có thể đăng nhập ngay bây giờ." });
    } catch (error) {
        console.error("Lỗi khi đặt lại mật khẩu:", error);
        res.status(500).json({
            message: "Lỗi khi đặt lại mật khẩu",
            error: error.message,
        });
    }
};

exports.changesPass = async (req, res, next) => {
    const { id } = req.body;
    const { matKhauCu, matKhauMoi } = req.body;
    const nguoidung = await NguoiDungModel.findById(id);
    if (nguoidung != null) {

        if (matKhauCu != nguoidung.matKhau) {
            return res
                .status(404)
                .json({ message: "Mật khẩu không chính xác!" });
        }

        if (matKhauMoi == null || matKhauMoi == undefined) {
            return res
                .status(403)
                .json({ message: "Chưa nhập mật khẩu mới" });
        }

        if(!isValidPassword(matKhauMoi)){
            return res.status(404).json({ message : "Mật khẩu phải it nhất 8 ký tự, bao gồm cả chữ và số"})
        }

        const result = await NguoiDungModel.findByIdAndUpdate(id, { matKhau: matKhauMoi }, { new: true });
        if (result) {
            return res
                .status(200)
                .json({ message: "Đổi mật khẩu thành công, vui lòng đăng nhập lại" });
        } else {
            return res
                .status(404)
                .json({ message: "Đổi mật khẩu không thành công" });
        }
    }
}