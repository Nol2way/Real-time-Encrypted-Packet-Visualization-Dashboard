import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../data.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 🛡️ 1. สร้างตารางพื้นฐาน
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    ip_subnet TEXT DEFAULT '*',
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address TEXT,
    device_info TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    message TEXT,
    severity TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS packets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    src_ip TEXT,
    src_port INTEGER,
    dst_ip TEXT,
    dst_port INTEGER,
    protocol TEXT,
    size INTEGER,
    tls_version TEXT,
    info TEXT
  );
`);

// 🛡️ 2. Migration: บังคับเพิ่มคอลัมน์ที่ขาดหายไปทีละอัน
const addColumn = (table, col, type) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
    console.log(`[Database] เพิ่มคอลัมน์ ${col} ใน ${table} สำเร็จ`);
  } catch (e) {
    // ถ้ามีอยู่แล้วจะเกิด error ซึ่งเราจะข้ามไป
  }
};

addColumn('users', 'password_hash', 'TEXT');
addColumn('users', 'role', "TEXT DEFAULT 'user'");
addColumn('users', 'status', "TEXT DEFAULT 'active'");
addColumn('users', 'created_at', "DATETIME DEFAULT CURRENT_TIMESTAMP");
addColumn('users', 'last_login_ip', 'TEXT');
addColumn('users', 'last_login_device', 'TEXT');
addColumn('packets', 'country', 'TEXT');
addColumn('packets', 'city', 'TEXT');

// 🛡️ 3. จัดการ Admin เริ่มต้น
const defaultHash = bcrypt.hashSync('admin', 10);
const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
if (!admin) {
  db.prepare("INSERT INTO users (username, password_hash, role, ip_subnet, status) VALUES ('admin', ?, 'admin', '*', 'active')").run(defaultHash);
} else {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin', status = 'active' WHERE username = 'admin'").run(defaultHash);
}

// --- API Methods (ดึงข้อมูลแบบปลอดภัย) ---

export const getUserByUsername = (username) => db.prepare("SELECT * FROM users WHERE username = ?").get(username);

export const getUserById = (id) => {
  // ดึงทั้งหมดมาก่อนเพื่อเลี่ยงปัญหา no such column
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!user) return null;
  // ลบ password_hash ออกก่อนส่งกลับ
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const getUsers = () => {
  const users = db.prepare("SELECT * FROM users").all();
  return users.map(({ password_hash, ...u }) => u);
};

export const createUser = (username, password, role = 'user', ipSubnet = '*') => {
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (username, password_hash, role, ip_subnet) VALUES (?, ?, ?, ?)").run(username, hash, role, ipSubnet);
  return result.lastInsertRowid;
};

export const updateUser = (id, role, ipSubnet, password = null, status = 'active') => {
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET role = ?, ip_subnet = ?, password_hash = ?, status = ? WHERE id = ?").run(role, ipSubnet, hash, status, id);
  } else {
    db.prepare("UPDATE users SET role = ?, ip_subnet = ?, status = ? WHERE id = ?").run(role, ipSubnet, status, id);
  }
};

export const deleteUser = (id) => {
  db.prepare("DELETE FROM login_logs WHERE user_id = ?").run(id);
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
};

export const logUserLogin = (userId, ip, device) => {
  try {
    db.prepare("UPDATE users SET last_login_ip = ?, last_login_device = ? WHERE id = ?").run(ip, device, userId);
    db.prepare("INSERT INTO login_logs (user_id, ip_address, device_info) VALUES (?, ?, ?)").run(userId, ip, device);
  } catch (e) {}
};

export const getLoginLogs = (userId = null) => {
  if (userId) return db.prepare("SELECT * FROM login_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50").all(userId);
  return db.prepare("SELECT l.*, u.username FROM login_logs l JOIN users u ON l.user_id = u.id ORDER BY l.timestamp DESC LIMIT 100").all();
};

export const getAlerts = (limit = 50) => db.prepare("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?").all(limit);

export const insertAlert = (type, message, severity) => db.prepare("INSERT INTO alerts (type, message, severity) VALUES (?, ?, ?)").run(type, message, severity);

export const markAlertAsRead = (id) => db.prepare("UPDATE alerts SET is_read = 1 WHERE id = ?").run(id);

export const insertPacketBatch = db.transaction((packets) => {
  const stmt = db.prepare(`INSERT INTO packets (timestamp, src_ip, src_port, dst_ip, dst_port, protocol, size, tls_version, info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const p of packets) stmt.run(p.timestamp, p.src_ip, p.src_port, p.dst_ip, p.dst_port, p.protocol, p.size, p.tls_version, p.info);
});

export const getPackets = (limit = 1000) => db.prepare("SELECT * FROM packets ORDER BY timestamp DESC LIMIT ?").all(limit);

export const getPacketsForUser = (ipSubnet, limit = 1000) => {
  if (ipSubnet === '*') return getPackets(limit);
  return db.prepare("SELECT * FROM packets WHERE src_ip LIKE ? OR dst_ip LIKE ? ORDER BY timestamp DESC LIMIT ?").all(`%${ipSubnet}%`, `%${ipSubnet}%`, limit);
};

export default db;
