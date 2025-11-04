const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL (используй переменные окружения!)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ========== ЭНДПОИНТЫ ДЛЯ ВС ==========

// Получить все ВС в статусе AOG
app.get('/api/aircraft/aog', async (req, res) => {
  try {
    // Запрос объединяет актуальный статус из aircraft с деталями из status_history
    const result = await pool.query(`
      SELECT a.*, sh.start_time, sh.description
      FROM aircraft a
      INNER JOIN status_history sh ON a.id = sh.aircraft_id
      WHERE a.current_status = 'AOG'
      AND sh.end_time IS NULL
      ORDER BY sh.start_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить полную информацию по одному ВС (для карточки)
app.get('/api/aircraft/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Основная информация о ВС
    const aircraftResult = await pool.query('SELECT * FROM aircraft WHERE id = $1', [id]);
    // История статусов
    const statusHistoryResult = await pool.query('SELECT * FROM status_history WHERE aircraft_id = $1 ORDER BY start_time DESC', [id]);
    // Критические ограничения
    const criticalLimitsResult = await pool.query('SELECT * FROM critical_limits WHERE aircraft_id = $1 AND is_resolved = FALSE', [id]);
    // Формы ТО
    const maintenanceFormsResult = await pool.query('SELECT * FROM maintenance_forms WHERE aircraft_id = $1', [id]);

    res.json({
      aircraft: aircraftResult.rows[0],
      statusHistory: statusHistoryResult.rows,
      criticalLimits: criticalLimitsResult.rows,
      maintenanceForms: maintenanceFormsResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить информацию о ВС (например, бортовой номер или модель)
app.patch('/api/aircraft/:id', async (req, res) => {
  const { id } = req.params;
  const { tail_number, model } = req.body;
  try {
    const result = await pool.query(
      'UPDATE aircraft SET tail_number = $1, model = $2 WHERE id = $3 RETURNING *',
      [tail_number, model, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить новую запись в историю статусов
app.post('/api/aircraft/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, start_time, description } = req.body;
  try {
    // 1. Закрываем предыдущий активный статус
    await pool.query(
      `UPDATE status_history SET end_time = NOW() WHERE aircraft_id = $1 AND end_time IS NULL`,
      [id]
    );
    // 2. Добавляем новую запись
    const newStatus = await pool.query(
      `INSERT INTO status_history (aircraft_id, status, start_time, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, status, start_time, description]
    );
    // 3. Обновляем текущий статус в таблице aircraft
    await pool.query(
      `UPDATE aircraft SET current_status = $1 WHERE id = $2`,
      [status, id]
    );
    res.json(newStatus.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Эндпоинты для CRUD операций с critical_limits и maintenance_forms будут похожими.

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is running on port 5000');
});
