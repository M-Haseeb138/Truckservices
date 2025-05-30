const axios = require('axios');
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

class LocationService {


  static async geocodeAddress(address) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
      );

      console.log(`Geocoding response for "${address}":`, response.data); 

      if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        throw new Error(`Geocoding error for "${address}": ${response.data.status}`);
      }

      const result = response.data.results[0];
      return {
        name: result.formatted_address,
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        }
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
  static async getPlaceSuggestions(input) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}`
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Place API error: ${response.data.status}`);
      }

      return response.data.predictions.map(prediction => ({
        description: prediction.description,
        placeId: prediction.place_id
      }));
    } catch (error) {
      console.error('Place suggestion error:', error);
      throw error;
    }
  }
  static async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_API_KEY}`
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Place details error: ${response.data.status}`);
      }

      const result = response.data.result;
      return {
        name: result.name,
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        }
      };
    } catch (error) {
      console.error('Place details error:', error);
      throw error;
    }
  } 
  static async calculateRoute(origin, destination) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      );

      console.log('Distance Matrix API Response:', response.data); // Add this logging

      // Validate response structure
      if (!response.data || response.data.status !== 'OK') {
        throw new Error(`API error: ${response.data?.status || 'No response data'}`);
      }

      if (!response.data.rows || response.data.rows.length === 0) {
        throw new Error('No route rows available');
      }

      const row = response.data.rows[0];
      if (!row.elements || row.elements.length === 0) {
        throw new Error('No route elements available');
      }

      const element = row.elements[0];
      if (element.status !== 'OK') {
        throw new Error(`Route element error: ${element.status}`);
      }

      if (!element.distance || !element.duration) {
        throw new Error('Missing distance or duration data');
      }

      return {
        distance: element.distance.value / 1000, // convert to km
        duration: element.duration.text,
        distanceText: element.distance.text
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      throw new Error(`Failed to calculate route: ${error.message}`);
    }
  }
  static async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding API error: ${response.data.status}`);
      }

      // Return the formatted address from the first result
      return response.data.results[0].formatted_address;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Return coordinates as fallback address
      return `${lat}, ${lng}`;
    }
  }
}

module.exports = LocationService;