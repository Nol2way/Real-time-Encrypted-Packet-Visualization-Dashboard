# 🛡️ EASY Realtime Packets: Realtime Packets

ระบบวิเคราะห์และแสดงผลแพ็กเกจเครือข่ายแบบเรียลไทม์ (Real-time Network Packet Visualization) พร้อมระบบจัดการผู้ใช้งานและรายงาน Forensic ในรูปแบบ Minimalist Dark Theme

## 🚀 วิธีการติดตั้งและรันโปรเจค (Getting Started)

### 1. การเตรียมตัว (Prerequisites)
*   ติดตั้ง [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน 18 ขึ้นไป)
*   โปรเจคนี้รองรับทั้ง Windows, macOS และ Linux

### 2. การติดตั้ง (Installation)

1.  **Clone โปรเจคลงเครื่อง:**
    ```bash
    git clone <your-repository-url>
    cd <project-folder-name>
    ```

2.  **ติดตั้ง Library สำหรับ Backend:**
    ```bash
    cd backend
    npm install
    ```

3.  **ติดตั้ง Library สำหรับ Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### 3. การรันโปรเจค (Running)

คุณต้องเปิด Terminal 2 หน้าต่างเพื่อรันทั้ง Backend และ Frontend พร้อมกัน:

**หน้าต่างที่ 1: รัน Backend**
```bash
cd backend
npm start
```
*ระบบจะสร้างฐานข้อมูล `data.db` และบัญชีผู้ใช้เริ่มต้นให้โดยอัตโนมัติ*

**หน้าต่างที่ 2: รัน Frontend**
```bash
cd frontend
npm run dev
```
*เปิด Browser ไปที่ url ที่โปรแกรมแจ้ง (ปกติคือ `http://localhost:5173`)*

---

## 🔑 ข้อมูลการเข้าสู่ระบบ (Default Credentials)
เมื่อรันระบบครั้งแรก สามารถใช้ข้อมูลนี้เพื่อเข้าสู่ระบบ:
*   **Username:** `admin`
*   **Password:** `admin`

---

## ✨ ฟีเจอร์หลัก (Key Features)
*   **Real-time Monitoring:** ดักจับและแสดงผลทราฟฟิกเครือข่ายแบบสดๆ
*   **Minimalist Dark UI:** หน้าจอสวยงาม สบายตา อ่านง่าย สไตล์โมเดิร์น
*   **User Management:** ระบบจัดการผู้ใช้ แบ่งระดับ Admin/User และกำหนดขอบเขต IP ได้
*   **Data Export:** ส่งออกข้อมูลการวิเคราะห์เป็นไฟล์ CSV และรายงาน Forensic เป็น PDF
*   **Security Alerts:** แจ้งเตือนเมื่อพบโปรโตคอลที่ไม่ปลอดภัย (เช่น SSL 3.0) ในเครือข่าย

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)
*   **Frontend:** React (Vite), Tailwind CSS v4, Lucide Icons, Recharts
*   **Backend:** Node.js, Express, Socket.io
*   **Database:** SQLite (Better-SQLite3)
