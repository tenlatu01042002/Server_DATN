const admin = require('../config/firebase-admin'); 


function formatCurrencyVND(amount) {
    const number = parseFloat(amount);
    if (!isNaN(number)) {
        return number.toLocaleString('vi-VN');
    } else {
        return 'Invalid amount';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);

    // Lấy ngày, tháng, năm từ đối tượng Date
    const day = String(date.getDate()).padStart(2, '0'); // Đảm bảo có 2 chữ số
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng được tính từ 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// Hàm kiểm tra định dạng email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex kiểm tra email
    return emailRegex.test(email);
}

// Hàm kiểm tra mật khẩu hợp lệ
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,}$/; // Ít nhất 8 ký tự, bao gồm cả chữ và số
    return passwordRegex.test(password);
};


// Hàm gửi thông báo qua Firebase
const sendFirebaseNotification = async (userToken, title, body, data = {}) => {
  const message = {
    notification: { title, body },
    data,
    token: userToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent Firebase message:', response);
  } catch (error) {
    console.error('Error sending Firebase message:', error);
  }
};

module.exports = { formatCurrencyVND, formatDate, isValidEmail, isValidPassword, sendFirebaseNotification };