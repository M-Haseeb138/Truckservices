require('dotenv').config();
const mongoose = require('mongoose');
const RateService = require('../services/rateService');

mongoose.connect(process.env.MONGODB_URL)
  .then(async () => {
    console.log('Connected to MongoDB');
    await RateService.initializeDefaultRates();
    console.log('Default rates initialized successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
  });