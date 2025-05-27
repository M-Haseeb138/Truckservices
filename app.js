const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieparser = require('cookie-parser');
const cors = require("cors");
const WebSocket = require('ws');
const http = require('http'); // <-- Add this line
const jwt = require('jsonwebtoken'); // <-- Required for token verification

dotenv.config();
const app = express();
connectDB();

const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};



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
app.use('/api/tracking', require('./routes/trackingRoutes'));

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const server = http.createServer(app);

// Start HTTP server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// WebSocket server setup
const wss = new WebSocket.Server({ server });
const adminClients = new Set();

// In app.js after WebSocket server setup
// In app.js after WebSocket server setup
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Admin subscribes to track a driver
            if (data.type === 'admin-track-driver' && data.token) {
                try {
                    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                    if (decoded.role !== 'admin') throw new Error('Unauthorized');
                    
                    ws.tracksDriver = data.driverId;
                    ws.send(JSON.stringify({ type: 'tracking-authorized' }));
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
                    ws.close();
                }
            }
            
            // Driver updates location
            if (data.type === 'driver-location-update' && data.token) {
                try {
                    const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
                    if (decoded.role !== 'driver') throw new Error('Unauthorized');
                    
                    const { lat, lng } = data;
                    const address = await LocationService.reverseGeocode(lat, lng);
                    
                    // Update driver's location in database
                    await User.findByIdAndUpdate(decoded.userId, {
                        currentLocation: {
                            coordinates: { lat, lng },
                            address,
                            timestamp: new Date()
                        }
                    });
                    
                    // Broadcast to admin clients tracking this driver
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN && client.tracksDriver === decoded.userId) {
                            client.send(JSON.stringify({
                                type: 'location-update',
                                driverId: decoded.userId,
                                location: { coordinates: { lat, lng }, address }
                            }));
                        }
                    });
                    
                    ws.send(JSON.stringify({ type: 'location-update-success' }));
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', message: error.message }));
                }
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});


