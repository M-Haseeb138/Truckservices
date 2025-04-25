const mongoose = require('mongoose');

const connectDB = async ()=>{
    try {
        mongoose.set('strictQuery',false);
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        process.exit(1);  
    }
};
module.exports = connectDB;