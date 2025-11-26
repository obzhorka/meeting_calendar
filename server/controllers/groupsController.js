const pool = require('../../../../Downloads/meeting-scheduler/server/database/db');

// Tworzenie grupy
const createGroup = async (req, res) => {
  const { name, description, memberIds = [] } = req.body;
  const userId = req.user.userId;

  try {
    // Utwórz grupę
    const groupResult = await pool.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, userId]
    );

    const group = groupResult.rows[0];

    // Dodaj twórcy jako administratora
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [group.id, userId, 'admin']
    );

    // Dodaj innych członków
    if (memberIds.length > 0) {
      const memberPromises = memberIds.map(memberId => 
        pool.query(
          'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
          [group.id, memberId, 'member']
        )
      );
      await Promise.all(memberPromises);

      // Wyślij powiadomienia do nowych członków
      const notificationPromises = memberIds.map(memberId =>
        pool.query(
          'INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [memberId, 'group_invitation', 'Dodano do grupy', 
           `Zostałeś dodany do grupy: ${name}`, 'group', group.id]
        )
      );
      await Promise.all(notificationPromises);
    }

    res.status(201).json({ 
      message: 'Grupa została utworzona',
      group 
    });
  } catch (error) {
    console.error('Błąd tworzenia grupy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobieranie grup użytkownika
const getUserGroups = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT g.*, gm.role, u.username as created_by_username,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       JOIN users u ON g.created_by = u.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Błąd pobierania grup:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Pobieranie szczegółów grupy
const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest członkiem grupy
    const memberCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Nie jesteś członkiem tej grupy' });
    }

    // Pobierz szczegóły grupy
    const groupResult = await pool.query(
      `SELECT g.*, u.username as created_by_username, u.full_name as created_by_full_name
       FROM groups g
       JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Grupa nie znaleziona' });
    }

    // Pobierz członków grupy
    const membersResult = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, gm.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.role DESC, gm.joined_at ASC`,
      [groupId]
    );

    const group = groupResult.rows[0];
    group.members = membersResult.rows;

    res.json({ group });
  } catch (error) {
    console.error('Błąd pobierania szczegółów grupy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Dodawanie członka do grupy
const addGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId: newMemberId } = req.body;
  const userId = req.user.userId;

  console.log(`👥 Próba dodania członka: groupId=${groupId}, newMemberId=${newMemberId}, requestingUser=${userId}`);

  try {
    // Sprawdź czy użytkownik jest administratorem grupy
    const adminCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = $3',
      [groupId, userId, 'admin']
    );

    if (adminCheck.rows.length === 0) {
      console.warn(`⚠️ Użytkownik ${userId} nie jest administratorem grupy ${groupId}`);
      return res.status(403).json({ error: 'Tylko administrator może dodawać członków' });
    }

    // Sprawdź czy użytkownik już jest członkiem
    const memberCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, newMemberId]
    );

    if (memberCheck.rows.length > 0) {
      console.warn(`⚠️ Użytkownik ${newMemberId} już jest członkiem grupy ${groupId}`);
      return res.status(400).json({ error: 'Użytkownik już jest członkiem grupy' });
    }

    // Dodaj członka
    console.log(`➕ Dodawanie użytkownika ${newMemberId} do grupy ${groupId}`);
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
      [groupId, newMemberId, 'member']
    );

    // Wyślij powiadomienie
    const groupResult = await pool.query('SELECT name FROM groups WHERE id = $1', [groupId]);
    const groupName = groupResult.rows[0].name;

    console.log(`📬 Wysyłanie powiadomienia do użytkownika ${newMemberId}`);
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [newMemberId, 'group_invitation', 'Dodano do grupy', 
       `Zostałeś dodany do grupy: ${groupName}`, 'group', groupId]
    );

    console.log(`✅ Członek ${newMemberId} został dodany do grupy ${groupId}`);
    res.status(201).json({ message: 'Członek został dodany do grupy' });
  } catch (error) {
    console.error('❌ Błąd dodawania członka:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Usuwanie członka z grupy
const removeGroupMember = async (req, res) => {
  const { groupId, memberId } = req.params;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest administratorem lub usuwa siebie
    const adminCheck = await pool.query(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = $3',
      [groupId, userId, 'admin']
    );

    if (adminCheck.rows.length === 0 && userId !== parseInt(memberId)) {
      return res.status(403).json({ error: 'Brak uprawnień do usunięcia członka' });
    }

    // Usuń członka
    const result = await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *',
      [groupId, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Członek nie znaleziony w grupie' });
    }

    res.json({ message: 'Członek został usunięty z grupy' });
  } catch (error) {
    console.error('Błąd usuwania członka:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// Usuwanie grupy
const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.userId;

  try {
    // Sprawdź czy użytkownik jest twórcą grupy
    const groupCheck = await pool.query(
      'SELECT * FROM groups WHERE id = $1 AND created_by = $2',
      [groupId, userId]
    );

    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Tylko twórca może usunąć grupę' });
    }

    // Usuń grupę (kaskadowo usuną się członkowie i związane dane)
    await pool.query('DELETE FROM groups WHERE id = $1', [groupId]);

    res.json({ message: 'Grupa została usunięta' });
  } catch (error) {
    console.error('Błąd usuwania grupy:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addGroupMember,
  removeGroupMember,
  deleteGroup
};

