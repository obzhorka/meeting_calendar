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

// Głosowanie na lokalizację
const voteOnLocation = async (req, res) => {
  const { locationId } = req.params;
  const { vote } = req.body; // yes, no
  const userId = req.user.userId;

  try {
    const existingVote = await pool.query(
      'SELECT * FROM location_votes WHERE location_proposal_id = $1 AND user_id = $2',
      [locationId, userId]
    );

    if (existingVote.rows.length > 0) {
      await pool.query(
        'UPDATE location_votes SET vote = $1 WHERE location_proposal_id = $2 AND user_id = $3',
        [vote, locationId, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO location_votes (location_proposal_id, user_id, vote) VALUES ($1, $2, $3)',
        [locationId, userId, vote]
      );
    }

    res.json({ message: 'Głos został zapisany' });
  } catch (error) {
    console.error('Błąd głosowania na lokalizację:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};