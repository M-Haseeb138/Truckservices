const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieparser = require('cookie-parser');
const cors = require("cors");

dotenv.config();
const app = express();
connectDB();

const corsOptions = {
    origin: [
        'http://localhost:5173', // Vite Dev server
        'https://yourfrontenddomain.com' // your production frontend domain if you have it
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};



// Other Middlewares
app.use(cookieparser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors(corsOptions));


// Routes 
app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/driver', require('./routes/driverRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/adminauth', require('./routes/AdminAuthRoutes'));





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 server is runing on port ${PORT}`);
})