import { Pool } from 'pg';

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/kairos',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database helper functions
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', error);
    throw error;
  }
}

// Initialize database tables
export async function initDatabase() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        clearance VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    // Create operations table
    await query(`
      CREATE TABLE IF NOT EXISTS operations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        start_date DATE,
        personnel INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create threats table
    await query(`
      CREATE TABLE IF NOT EXISTS threats (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        level VARCHAR(50) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        actor VARCHAR(255),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create assets table
    await query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        capabilities TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create licenses table
    await query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(255) UNIQUE NOT NULL,
        client VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        expiry DATE NOT NULL,
        features TEXT[],
        seats INTEGER NOT NULL,
        cost INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User management functions
export async function createUser(username: string, passwordHash: string, role: string, clearance: string) {
  const result = await query(
    'INSERT INTO users (username, password_hash, role, clearance) VALUES ($1, $2, $3, $4) RETURNING *',
    [username, passwordHash, role, clearance]
  );
  return result.rows[0];
}

export async function getUserByUsername(username: string) {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

export async function updateUserLastLogin(username: string) {
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = $1', [username]);
}

// Operation management functions
export async function createOperation(title: string, description: string, status: string, priority: string, type: string, location: string, startDate: string, personnel: number) {
  const result = await query(
    'INSERT INTO operations (title, description, status, priority, type, location, start_date, personnel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [title, description, status, priority, type, location, startDate, personnel]
  );
  return result.rows[0];
}

export async function getOperations(status?: string) {
  let queryText = 'SELECT * FROM operations';
  const params: any[] = [];
  
  if (status && status !== 'all') {
    queryText += ' WHERE status = $1';
    params.push(status);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, params);
  return result.rows;
}

// Threat management functions
export async function createThreat(title: string, description: string, level: string, severity: string, category: string, actor: string, location: string) {
  const result = await query(
    'INSERT INTO threats (title, description, level, severity, category, actor, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [title, description, level, severity, category, actor, location]
  );
  return result.rows[0];
}

export async function getThreats(level?: string) {
  let queryText = 'SELECT * FROM threats';
  const params: any[] = [];
  
  if (level && level !== 'all') {
    queryText += ' WHERE level = $1';
    params.push(level);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, params);
  return result.rows;
}

// Asset management functions
export async function createAsset(name: string, description: string, status: string, type: string, location: string, capabilities: string[]) {
  const result = await query(
    'INSERT INTO assets (name, description, status, type, location, capabilities) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, description, status, type, location, capabilities]
  );
  return result.rows[0];
}

export async function getAssets(type?: string) {
  let queryText = 'SELECT * FROM assets';
  const params: any[] = [];
  
  if (type && type !== 'all') {
    queryText += ' WHERE type = $1';
    params.push(type);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, params);
  return result.rows;
}

// License management functions
export async function createLicense(licenseKey: string, client: string, type: string, status: string, expiry: string, features: string[], seats: number, cost: number) {
  const result = await query(
    'INSERT INTO licenses (license_key, client, type, status, expiry, features, seats, cost) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [licenseKey, client, type, status, expiry, features, seats, cost]
  );
  return result.rows[0];
}

export async function getLicenses(type?: string) {
  let queryText = 'SELECT * FROM licenses';
  const params: any[] = [];
  
  if (type && type !== 'all') {
    queryText += ' WHERE type = $1';
    params.push(type);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, params);
  return result.rows;
}