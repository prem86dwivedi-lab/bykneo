import express from 'express';
import { searchPlaces, reverseGeocode } from '../services/olamaps.service.js';

const router = express.Router();

/**
 * GET /api/maps/autocomplete
 * Query params: input (string), lat (number, optional), lng (number, optional), radius (number, optional)
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { input, lat, lng, radius } = req.query;
    if (!input || !input.trim()) {
      return res.json({ success: true, predictions: [] });
    }

    let location = null;
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      location = `${lat},${lng}`;
    }

    const predictions = await searchPlaces({
      input: input.trim(),
      location,
      radius: radius ? Number(radius) : 50000
    });

    res.json({
      success: true,
      predictions
    });
  } catch (err) {
    console.error('[Maps Route] Autocomplete error:', err);
    res.status(500).json({ success: false, error: err.message, predictions: [] });
  }
});

/**
 * GET /api/maps/reverse-geocode
 * Query params: lat (number), lng (number)
 */
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng required' });
    }

    const result = await reverseGeocode({
      lat: Number(lat),
      lng: Number(lng)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Maps Route] Reverse geocode error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
