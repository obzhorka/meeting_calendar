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
// Pobieranie szczegółów wydarzenia
const getEventDetails = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest uczestnikiem
    const participantCheck = await pool.query(
        'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Nie jesteś uczestnikiem tego wydarzenia' });
    }

    // Pobierz szczegóły wydarzenia
    const eventResult = await pool.query(
        `SELECT e.*, u.username as created_by_username, u.full_name as created_by_full_name,
              g.name as group_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN groups g ON e.group_id = g.id
       WHERE e.id = $1`,
        [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    // Pobierz uczestników
    const participantsResult = await pool.query(
        `SELECT u.id, u.username, u.email, u.full_name, ep.status
       FROM event_participants ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.event_id = $1
       ORDER BY ep.created_at ASC`,
        [eventId]
    );

    // Pobierz proponowane terminy
    const timeSlotsResult = await pool.query(
        `SELECT pts.*, u.username as proposed_by_username,
              (SELECT COUNT(*) FROM time_slot_votes WHERE time_slot_id = pts.id AND vote = 'yes') as yes_votes,
              (SELECT COUNT(*) FROM time_slot_votes WHERE time_slot_id = pts.id AND vote = 'no') as no_votes,
              (SELECT COUNT(*) FROM time_slot_votes WHERE time_slot_id = pts.id AND vote = 'maybe') as maybe_votes
       FROM proposed_time_slots pts
       LEFT JOIN users u ON pts.proposed_by = u.id
       WHERE pts.event_id = $1
       ORDER BY yes_votes DESC, pts.start_time ASC`,
        [eventId]
    );

    // Pobierz propozycje lokalizacji
    const locationsResult = await pool.query(
        `SELECT lp.*, u.username as proposed_by_username,
              (SELECT COUNT(*) FROM location_votes WHERE location_proposal_id = lp.id AND vote = 'yes') as yes_votes,
              (SELECT COUNT(*) FROM location_votes WHERE location_proposal_id = lp.id AND vote = 'no') as no_votes
       FROM location_proposals lp
       LEFT JOIN users u ON lp.proposed_by = u.id
       WHERE lp.event_id = $1
       ORDER BY yes_votes DESC, lp.created_at DESC`,
        [eventId]
    );

    const event = eventResult.rows[0];
    event.participants = participantsResult.rows;
    event.proposed_time_slots = timeSlotsResult.rows;
    event.location_proposals = locationsResult.rows;

    res.json({ event });
  } catch (error) {
    console.error('Błąd pobierania szczegółów wydarzenia:', error);
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

// Znajdź wspólne terminy dla wydarzenia
const findCommonTimeSlotsForEvent = async (req, res) => {
  const { eventId } = req.params;
  const { start_date, end_date, preferences } = req.body;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest uczestnikiem
    const participantCheck = await pool.query(
        'SELECT * FROM event_participants WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Nie jesteś uczestnikiem tego wydarzenia' });
    }

    // Pobierz wydarzenie
    const eventResult = await pool.query(
        'SELECT * FROM events WHERE id = $1',
        [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    }

    const event = eventResult.rows[0];

    // Pobierz uczestników którzy zaakceptowali
    const participantsResult = await pool.query(
        'SELECT user_id FROM event_participants WHERE event_id = $1 AND status IN ($2, $3)',
        [eventId, 'accepted', 'maybe']
    );

    const participantIds = participantsResult.rows.map(row => row.user_id);

    if (participantIds.length === 0) {
      return res.status(400).json({ error: 'Brak uczestników do analizy' });
    }

    // Pobierz dostępność wszystkich uczestników
    const availabilityResult = await pool.query(
        `SELECT * FROM user_availability 
       WHERE user_id = ANY($1)
       AND start_time >= $2 
       AND end_time <= $3
       ORDER BY start_time ASC`,
        [participantIds, start_date, end_date]
    );

    // Użyj algorytmu do znalezienia wspólnych terminów
    const commonSlots = findBestCommonSlots(availabilityResult.rows, {
      startDate: start_date,
      endDate: end_date,
      durationMinutes: event.duration_minutes,
      preferences: preferences || {},
      maxResults: 20
    });

    res.json({
      commonSlots,
      participantCount: participantIds.length
    });
  } catch (error) {
    console.error('Błąd znajdowania wspólnych terminów:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Dodanie proponowanego terminu
const proposeTimeSlot = async (req, res) => {
  const { eventId } = req.params;
  const { start_time, end_time } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
        'INSERT INTO proposed_time_slots (event_id, start_time, end_time, proposed_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [eventId, start_time, end_time, userId]
    );

    res.status(201).json({
      message: 'Termin został zaproponowany',
      timeSlot: result.rows[0]
    });
  } catch (error) {
    console.error('Błąd proponowania terminu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Głosowanie na termin
const voteOnTimeSlot = async (req, res) => {
  const { timeSlotId } = req.params;
  const { vote } = req.body; // yes, no, maybe
  const userId = req.user.userId;

  try {
    // Sprawdź czy głos już istnieje
    const existingVote = await pool.query(
        'SELECT * FROM time_slot_votes WHERE time_slot_id = $1 AND user_id = $2',
        [timeSlotId, userId]
    );

    if (existingVote.rows.length > 0) {
      // Aktualizuj głos
      await pool.query(
          'UPDATE time_slot_votes SET vote = $1 WHERE time_slot_id = $2 AND user_id = $3',
          [vote, timeSlotId, userId]
      );
    } else {
      // Dodaj nowy głos
      await pool.query(
          'INSERT INTO time_slot_votes (time_slot_id, user_id, vote) VALUES ($1, $2, $3)',
          [timeSlotId, userId, vote]
      );
    }

    res.json({ message: 'Głos został zapisany' });
  } catch (error) {
    console.error('Błąd głosowania:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};