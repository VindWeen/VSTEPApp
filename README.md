# 🎓 VSTEP Practice App

Ứng dụng luyện thi VSTEP trên mobile — hỗ trợ 3 kỹ năng: **Nghe**, **Viết**, **Nói** với AI chấm điểm tự động.

---

## 🛠 Tech Stack

| Layer          | Công nghệ               |
| -------------- | ----------------------- |
| Frontend       | React Native + Expo     |
| Backend        | Node.js + Express       |
| Database       | MongoDB Atlas           |
| AI Scoring     | Groq AI (llama-3.3-70b) |
| Speech-to-Text | Google Cloud STT        |
| Audio Storage  | Cloudinary              |

---

## 🚀 Hướng dẫn setup cho thành viên nhóm

### Yêu cầu

- [Node.js](https://nodejs.org) v18+
- [Expo Go](https://expo.dev/go) trên điện thoại Android/iOS
- Các giá trị `.env` nhận từ team leader qua Zalo/chat nhóm

---

### Bước 1 — Clone repo

```bash
git clone https://github.com/VindWeen/VSTEPApp
cd VSTEPApp
```

---

### Bước 2 — Setup Backend

```bash
cd backend
npm install
```

Copy file env mẫu và điền thông tin:

```bash
cp .env.example .env
```

Mở `backend/.env` và điền các giá trị (nhận từ team leader):

```env
MONGO_URI=<nhận từ team leader>
JWT_SECRET=any_random_string_here
CLOUDINARY_CLOUD_NAME=<nhận từ team leader>
CLOUDINARY_API_KEY=<nhận từ team leader>
CLOUDINARY_API_SECRET=<nhận từ team leader>
GROQ_API_KEY=<nhận từ team leader>
File google-credentials.json <nhận từ team leader>
# Giữ true để test nhanh nếu không muốn lấy AI API/STT thật
MOCK_AI=true
MOCK_STT=true
```

Chạy backend:

```bash
cd backend
npm run dev
```

✅ Backend chạy tại `http://localhost:5000`

---

### Bước 3 — Setup Frontend

Về thư mục gốc và cài dependencies:

```bash
cd ..
npm install
```

Mở `src/services/api.js` và đổi IP thành IP máy tính của bạn:

```js
// Xem IP bằng lệnh: ipconfig tìm dòng IPv4 Address...... x.x.x.x
const BASE_URL = "http://x.x.x.x:5000/api"; // ← đổi IP ở đây
```

> **Lưu ý:** Điện thoại và máy tính phải cùng WiFi.

Chạy Expo:

```bash
npx expo start
```

Mở **Expo Go** trên điện thoại → **Scan QR code** hiện trong terminal.

---

### Bước 4 — Seed dữ liệu mẫu (lần đầu)

```bash
cd backend
npm run seed:listening
```

---

## 🎭 Chế độ Mock (test nhanh không cần API keys)

Trong `backend/.env`, giữ:

```env
MOCK_AI=true    # AI chấm điểm giả (không cần Groq key)
MOCK_STT=true   # Transcript giả (không cần Google STT: google-credentials.json)
```

**Mọi tính năng đều hoạt động** với mock mode — đủ để phát triển và test UI.

---

## ✅ Bật chế độ thật

| Tính năng                | Cần gì                   | Link                                                         |
| ------------------------ | ------------------------ | ------------------------------------------------------------ |
| AI chấm Writing/Speaking | Tạo Groq API key         | [console.groq.com](https://console.groq.com)                 |
| Speech-to-Text Speaking  | Google Cloud credentials | [console.cloud.google.com](https://console.cloud.google.com) |

Sau khi có key:

1. Điền vào `.env`
2. Đổi `MOCK_AI=false` và/hoặc `MOCK_STT=false`
3. Gõ `rs` trong terminal backend để restart

---

## 📁 Cấu trúc project

```
VSTEPApp/
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── controllers/      # Xử lý logic API
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # AI, STT, Cloudinary
│   │   └── middleware/       # Auth, upload
│   ├── .env.example          # Template cấu hình
│   └── package.json
│
└── src/                      # React Native app
    ├── screens/
    │   ├── Auth/             # Đăng nhập / Đăng ký
    │   ├── Listening/        # Nghe + làm bài
    │   ├── Writing/          # Viết + AI chấm
    │   ├── Speaking/         # Ghi âm + AI chấm
    │   └── History/          # Lịch sử kết quả
    ├── navigation/           # Stack + Tab navigator
    ├── services/             # API client (axios)
    └── context/              # AuthContext
```

---

## 🐛 Troubleshooting

**App không kết nối được backend:**

- Kiểm tra điện thoại và máy tính cùng WiFi
- Kiểm tra IP trong `src/services/api.js` đúng chưa (`ipconfig` để xem)
- Kiểm tra backend đang chạy tại port 5000

**Lỗi MongoDB kết nối:**

- Vào MongoDB Atlas → Network Access → Add IP `0.0.0.0/0` (allow all)

**Expo không load được:**

- Thử `npx expo start --clear` để clear cache
