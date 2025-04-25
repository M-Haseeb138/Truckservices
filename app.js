const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieparser = require('cookie-parser');
const cors = require("cors");

dotenv.config();
const app = express();
connectDB();


// Other Middlewares
app.use(cookieparser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',  
    credentials: true                 
}));


// Routes 
app.use('/Authentication', require('./routes/userRoutes'));






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 server is runing on port ${PORT}`);
})