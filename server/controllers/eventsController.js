const pool = require('../database/db');
const { findBestCommonSlots } = require('../utils/timeSlotAlgorithm');

// Tworzenie wydarzenia
const createEvent = async (req, res) => {
  const { title, description, group_id, location, duration_minutes, participant_ids = [] } = req.body;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest członkiem grupy (jeśli podano group_id)
    if (group_id) {
      const memberCheck = await pool.query(
          'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
          [group_id, userId]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Nie jesteś członkiem tej grupy' });
      }
    }

    // Utwórz wydarzenie
    const eventResult = await pool.query(
        'INSERT INTO events (title, description, group_id, created_by, location, duration_minutes, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [title, description, group_id, userId, location, duration_minutes, 'planning']
    );

    const event = eventResult.rows[0];

    // Dodaj uczestników
    let participantIdsToAdd = [];

    // Jeśli jest grupa, dodaj wszystkich członków jako uczestników
    if (group_id) {
      const membersResult = await pool.query(
          'SELECT user_id FROM group_members WHERE group_id = $1',
          [group_id]
      );
      participantIdsToAdd = membersResult.rows.map(row => row.user_id);
    } else if (participant_ids && participant_ids.length > 0) {
      // Jeśli nie ma grupy, użyj podanych participant_ids
      participantIdsToAdd = [...participant_ids];
    }

    // Upewnij się że twórca jest zawsze uczestnikiem
    if (!participantIdsToAdd.includes(userId)) {
      participantIdsToAdd.push(userId);
    }

    // Dodaj uczestników do wydarzenia
    if (participantIdsToAdd.length > 0) {
      console.log(`📝 Dodawanie ${participantIdsToAdd.length} uczestników do wydarzenia ${event.id}`);
      const participantPromises = participantIdsToAdd.map(participantId =>
          pool.query(
              'INSERT INTO event_participants (event_id, user_id, status) VALUES ($1, $2, $3)',
              [event.id, participantId, participantId === userId ? 'accepted' : 'invited']
          )
      );
      await Promise.all(participantPromises);
      console.log(`✅ Dodano uczestników do wydarzenia ${event.id}`);
    } else {
      console.warn(`⚠️ Brak uczestników do dodania dla wydarzenia ${event.id}`);
    }

    // Wyślij powiadomienia (pomiń twórcę)
    if (participantIdsToAdd.length > 0) {
      const notificationPromises = participantIdsToAdd
          .filter(id => id !== userId)
          .map(participantId =>
              pool.query(
                  'INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
                  [participantId, 'event_invitation', 'Nowe zaproszenie na wydarzenie',
                    `Zostałeś zaproszony na wydarzenie: ${title}`, 'event', event.id]
              )
          );
      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      message: 'Wydarzenie zostało utworzone',
      event
    });
  } catch (error) {
    console.error('Błąd tworzenia wydarzenia:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobieranie wydarzeń użytkownika
const getUserEvents = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
        `SELECT e.*, ep.status as participation_status,
              u.username as created_by_username,
              (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
       FROM events e
       JOIN event_participants ep ON e.id = ep.event_id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE ep.user_id = $1
       ORDER BY e.created_at DESC`,
        [userId]
    );

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Błąd pobierania wydarzeń:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

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