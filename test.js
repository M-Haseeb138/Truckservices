// existing locationservices code
// const axios = require('axios');
// const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// class LocationService {
//  // services/locationService.js
// static async geocodeAddress(address) {
//     try {
//         if (!GOOGLE_API_KEY) {
//             throw new Error('Google Maps API key is missing');
//         }

//         const response = await axios.get(
//             `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
//         );

//         if (response.data.status === 'REQUEST_DENIED') {
//             throw new Error(`Google Maps API error: ${response.data.error_message || 'Access denied'}`);
//         }

//         if (response.data.status !== 'OK') {
//             throw new Error(`Geocoding failed: ${response.data.status}`);
//         }

//         const location = response.data.results[0].geometry.location;
//         const formattedAddress = response.data.results[0].formatted_address;

//         return {
//             coordinates: {
//                 lat: location.lat,
//                 lng: location.lng
//             },
//             address: formattedAddress
//         };
//     } catch (error) {
//         console.error('Geocoding error:', error);
//         throw new Error(`Failed to geocode address: ${error.message}`);
//     }
// }
//   // Calculate route distance and duration
//   static async calculateRoute(origin, destination) {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_API_KEY}`
//       );

//       if (response.data.status !== 'OK') {
//         throw new Error(`Distance Matrix API error: ${response.data.status}`);
//       }

//       const element = response.data.rows[0].elements[0];
//       if (element.status !== 'OK') {
//         throw new Error(`Route calculation failed: ${element.status}`);
//       }

//       return {
//         distance: element.distance.value / 1000, // convert to km
//         duration: element.duration.text
//       };
//     } catch (error) {
//       console.error('Route calculation error:', error);
//       throw error;
//     }
//   }

//   // Reverse geocode coordinates to get address
//   static async reverseGeocode(lat, lng) {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
//       );

//       if (response.data.status !== 'OK') {
//         throw new Error(`Reverse geocoding failed: ${response.data.status}`);
//       }

//       return response.data.results[0].formatted_address;
//     } catch (error) {
//       console.error('Reverse geocoding error:', error);
//       throw error;
//     }
//   }
// }

// module.exports = LocationService;