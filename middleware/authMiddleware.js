const authMiddleware = (responseType = 'html') => {
    return (req, res, next) => {
        if (!req.session.userId) {
            if (responseType === 'json') {
                return res.status(401).send({ message: "Bạn cần đăng nhập để sử dụng" });
            }
            return res.render('error', { message: "Bạn cần đăng nhập để sử dụng" });
        }
        next();
    };
};

module.exports = authMiddleware;
