# 🏥 Government Hospital Queue Management System

A scalable and real-time queue management system designed for government hospitals to reduce waiting time, manage patient flow efficiently, and improve overall service quality.

---

## 🚀 Tech Stack

* **Frontend:** React, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Queue System:** Redis
* **Database:** MongoDB
* **Real-Time:** Socket.IO
* **Authentication:** JWT
* **Deployment:** Docker / Azure / AWS

---

## 📌 Features

* 🎟️ Token Generation System
* ⏱️ Real-time Queue Updates
* 🧑‍⚕️ Doctor Dashboard
* 👤 Patient Dashboard
* 🚨 Priority Queue (Emergency Handling)
* 📊 Admin Analytics Dashboard
* 🔔 Live Notifications

---

## 📂 Project Structure

```
hospital-queue-system/
│── client/          # React Frontend
│── server/          # Node.js Backend
│── redis/           # Queue logic (optional configs)
│── docs/            # Documentation
│── docker-compose.yml
│── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/hospital-queue-system.git
cd hospital-queue-system
```

---

### 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create a `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Run backend:

```bash
npm start
```

---

### 3️⃣ Setup Frontend

```bash
cd client
npm install
npm start
```

Frontend will run on:

```
http://localhost:3000
```

---

### 4️⃣ Setup Redis

Make sure Redis is installed and running:

```bash
redis-server
```

---

### 5️⃣ Setup MongoDB

* Install MongoDB locally OR
* Use MongoDB Atlas

---

## 🔄 How It Works (Step-by-Step Flow)

1. Patient registers/logs in
2. Patient requests a token
3. Backend stores patient data in MongoDB
4. Token is added to Redis Queue
5. Doctor dashboard fetches next token
6. System updates queue in real-time using Socket.IO
7. Patient receives live updates on their position

---

## 🔌 API Endpoints (Sample)

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Queue

* `POST /api/queue/token`
* `GET /api/queue/status`
* `POST /api/queue/next`

### Doctor

* `GET /api/doctor/dashboard`

---

## 🧠 Future Enhancements

* AI-based waiting time prediction
* Face recognition for patient check-in
* SMS/WhatsApp notifications
* Multi-language support
* Integration with government health systems

---

## 🐳 Docker Setup (Optional)

```bash
docker-compose up --build
```

---

## 📸 Screenshots (Add Later)

* Patient Dashboard
* Doctor Panel
* Admin Analytics

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Developed by **Meenachi Sundaresan**

---
