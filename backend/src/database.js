const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'database.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function migrate() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      description TEXT,
      industry TEXT,
      size TEXT,
      website TEXT,
      membership_start_date TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company_id INTEGER REFERENCES companies(id),
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seed() {
  const database = getDb();

  const existingAdmin = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@cic.ca');
  if (existingAdmin) return;

  const now = new Date();
  const dateAgo = (months) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split('T')[0];
  };

  const insertCompany = database.prepare(`
    INSERT INTO companies (company_name, description, industry, size, membership_start_date, is_approved)
    VALUES (@company_name, @description, @industry, @size, @membership_start_date, @is_approved)
  `);

  const insertUser = database.prepare(`
    INSERT INTO users (email, password_hash, company_id, is_admin)
    VALUES (@email, @password_hash, @company_id, @is_admin)
  `);

  const insertListing = database.prepare(`
    INSERT INTO listings (company_id, title, description, category)
    VALUES (@company_id, @title, @description, @category)
  `);

  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('password123', 10);

  // CIC Admin Co - 5 years ago
  const adminCo = insertCompany.run({
    company_name: 'CIC Admin Co',
    description: 'The administrative company for the CIC network.',
    industry: 'Administration',
    size: 'small',
    membership_start_date: dateAgo(60),
    is_approved: 1,
  });
  insertUser.run({ email: 'admin@cic.ca', password_hash: adminHash, company_id: adminCo.lastInsertRowid, is_admin: 1 });

  // GreenTech Solutions - 2 years ago (Contributor)
  const greentech = insertCompany.run({
    company_name: 'GreenTech Solutions',
    description: 'Sustainable technology solutions for a greener future.',
    industry: 'Technology',
    size: 'medium',
    membership_start_date: dateAgo(24),
    is_approved: 1,
  });
  insertUser.run({ email: 'greentech@example.com', password_hash: userHash, company_id: greentech.lastInsertRowid, is_admin: 0 });

  // EcoVentures Inc - 8 months ago (Participant)
  const eco = insertCompany.run({
    company_name: 'EcoVentures Inc',
    description: 'Eco-friendly ventures driving circular economy.',
    industry: 'Environment',
    size: 'startup',
    membership_start_date: dateAgo(8),
    is_approved: 1,
  });
  insertUser.run({ email: 'eco@example.com', password_hash: userHash, company_id: eco.lastInsertRowid, is_admin: 0 });

  // CircularMaterials Ltd - 4 years ago (Champion)
  const circular = insertCompany.run({
    company_name: 'CircularMaterials Ltd',
    description: 'Leading the way in circular material supply chains.',
    industry: 'Manufacturing',
    size: 'large',
    membership_start_date: dateAgo(48),
    is_approved: 1,
  });
  insertUser.run({ email: 'circular@example.com', password_hash: userHash, company_id: circular.lastInsertRowid, is_admin: 0 });

  // FreshStart Startup - 1 month ago (Explorer)
  const fresh = insertCompany.run({
    company_name: 'FreshStart Startup',
    description: 'A brand new startup exploring sustainable possibilities.',
    industry: 'Technology',
    size: 'startup',
    membership_start_date: dateAgo(1),
    is_approved: 1,
  });
  insertUser.run({ email: 'fresh@example.com', password_hash: userHash, company_id: fresh.lastInsertRowid, is_admin: 0 });

  // Sample listings from Contributor/Champion companies
  insertListing.run({
    company_id: greentech.lastInsertRowid,
    title: 'Green Tech Workshop',
    description: 'Join us for a hands-on workshop on sustainable technology practices.',
    category: 'event',
  });
  insertListing.run({
    company_id: greentech.lastInsertRowid,
    title: 'Collaboration Opportunity: AI for Sustainability',
    description: 'Looking for partners to develop AI-driven sustainability tools.',
    category: 'collaboration',
  });
  insertListing.run({
    company_id: circular.lastInsertRowid,
    title: 'Circular Economy Resource Pack',
    description: 'A comprehensive set of resources for implementing circular economy principles.',
    category: 'resource',
  });
  insertListing.run({
    company_id: circular.lastInsertRowid,
    title: 'Annual CIC Networking Session',
    description: 'Our flagship annual networking session for all CIC members.',
    category: 'session',
  });
}

function initDatabase() {
  migrate();
  seed();
  console.log('Database initialized');
}

module.exports = { getDb, initDatabase };
