const mongoose = require("mongoose");

const connect = async () => {
    try{
        await mongoose.connect(process.env.DB_URI);
        console.log('connect success')
    }catch(err){
        console.log(err);
        console.log('connect fail')
    }
}

module.exports = {connect}