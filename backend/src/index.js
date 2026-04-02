import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { 
  getPackets, getPacketsForUser, getUsers, 
  getUserByUsername, createUser, logUserLogin, getUserById,
  updateUser, deleteUser, getAlerts, markAlertAsRead, getLoginLogs,
  insertAlert
} from './database.js';
import batcher from './batcher.js';
import { startSniffing } from './sniffer.js';
import { Reader } from 'maxmind';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UAParser } from 'ua-parser-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_netviz';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Helper: Extract IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress || '';
};

// Middleware: Authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'ไม่พบ Token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Verify Error:', err.message);
      return res.status(403).json({ error: 'Token หมดอายุหรือส่งข้อมูลไม่ถูกต้อง' });
    }
    req.user = decoded;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'ต้องการสิทธิ์แอดมิน' });
  next();
};

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[Auth] พยายามล็อกอิน: ${username}`);
  
  try {
    const user = getUserByUsername(username);

    if (!user) {
      console.log(`[Auth] ไม่พบผู้ใช้: ${username}`);
      return res.status(400).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      console.log(`[Auth] รหัสผ่านผิด: ${username}`);
      return res.status(400).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const ip = getClientIp(req);
    logUserLogin(user.id, ip, 'Web Dashboard');

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, ip_subnet: user.ip_subnet }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log(`[Auth] ล็อกอินสำเร็จ: ${username}`);
    res.json({ 
      token, 
      user: { id: user.id, username: user.username, role: user.role, ip_subnet: user.ip_subnet } 
    });
  } catch (err) {
    console.error('[Auth] Login Crash:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    console.log(`[Auth] ตรวจสอบสถานะผู้ใช้ ID: ${req.user.id}`);
    const user = getUserById(req.user.id);
    if (!user) {
      console.log(`[Auth] ไม่พบข้อมูลผู้ใช้ในฐานข้อมูลสำหรับ ID: ${req.user.id}`);
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' });
    }
    res.json(user);
  } catch (e) {
    console.error('[Auth] /me Crash:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// REST Endpoints
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
  res.json(getUsers());
});

app.get('/api/history', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    res.json(getPackets(1000));
  } else {
    res.json(getPacketsForUser(req.user.ip_subnet, 1000));
  }
});

app.get('/api/alerts', authenticateToken, (req, res) => {
  res.json(getAlerts());
});

app.get('/api/logs', authenticateToken, requireAdmin, (req, res) => {
  res.json(getLoginLogs());
});

// Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Auth error"));
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Auth error"));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  socket.on('subscribe', () => {
    socket.join('live_packets');
  });
});

batcher.on('batch', (packets) => {
  const sockets = io.sockets.sockets;
  sockets.forEach(socket => {
    if (!socket.user) return;
    let filteredBatch = packets;
    if (socket.user.role !== 'admin' && socket.user.ip_subnet && socket.user.ip_subnet !== '*') {
      filteredBatch = packets.filter(p => 
        p.src_ip.includes(socket.user.ip_subnet) || p.dst_ip.includes(socket.user.ip_subnet)
      );
    }
    if (filteredBatch.length > 0) socket.emit('packet_batch', filteredBatch);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[Server] รันอยู่ที่พอร์ต ${PORT}`);
  startSniffing();
});
