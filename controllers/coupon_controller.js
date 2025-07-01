const CouponModel = require('../model/coupons')

exports.getListorByidNguoiDung = async (req, res, next) => {
    try {
        const { id_NguoiDung } = req.query;

        // Xây dựng điều kiện lọc dựa trên các tham số có sẵn
        let filter = {};
        if (id_NguoiDung) {
            filter.id_NguoiDung = id_NguoiDung;
        }
        
        const coupons = await CouponModel.find(filter).sort({ createdAt: -1 });

        if (coupons.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy' });
        }


        res.send(coupons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Error fetching data", error: error.message });
    }

}
