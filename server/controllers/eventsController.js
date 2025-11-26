const pool = require('../database/db');
const { findBestCommonSlots } = require('../utils/timeSlotAlgorithm');


// Dodanie propozycji lokalizacji
const proposeLocation = async (req, res) => {
  const { eventId } = req.params;
  const { location_name, address } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'INSERT INTO location_proposals (event_id, location_name, address, proposed_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [eventId, location_name, address, userId]
    );

    res.status(201).json({ 
      message: 'Lokalizacja została zaproponowana',
      location: result.rows[0]
    });
  } catch (error) {
    console.error('Błąd proponowania lokalizacji:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};
