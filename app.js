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
wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      // Driver authentication
      if (data.type === 'driver-auth') {
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
        if (decoded.role !== 'driver') throw new Error('Unauthorized');
        ws.driverId = decoded.userId;
        ws.send(JSON.stringify({ type: 'auth-success' }));
        return;
      }
      
      // Location update from driver
      if (data.type === 'location-update' && ws.driverId) {
        const { bookingId, lat, lng } = data;
        
        // Update in database
        const booking = await TruckBooking.findOneAndUpdate(
          { _id: bookingId, assignedDriverId: ws.driverId },
          {
            currentLocation: {
              coordinates: { lat, lng },
              timestamp: new Date()
            },
            $push: {
              locationHistory: {
                coordinates: { lat, lng },
                timestamp: new Date()
              }
            }
          },
          { new: true }
        );
        
        // Broadcast to all clients tracking this booking
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && 
              client.trackingBookingId === bookingId) {
            client.send(JSON.stringify({
              type: 'location-update',
              location: booking.currentLocation,
              progress: calculateProgress(booking)
            }));
          }
        });
      }
      
      // Customer subscription
      if (data.type === 'track-booking') {
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
        const booking = await TruckBooking.findOne({
          _id: data.bookingId,
          $or: [
            { userId: decoded.userId },
            { assignedDriverId: decoded.userId }
          ]
        });
        if (!booking) throw new Error('Unauthorized');
        ws.trackingBookingId = data.bookingId;
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });
});
