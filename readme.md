# 🏥 Government Hospital Queue Management System (Advanced Workflow)

This project implements a **real-world hospital queue system** using:

* Triage-based priority
* Per-doctor queues
* Multi-department routing
* Real-time updates

---

# 🚀 Tech Stack

* Frontend: React
* Backend: Node.js + Express
* Queue Engine: Redis (Sorted Sets)
* Database: MongoDB
* Real-time: Socket.IO

---

# 🧠 System Overview

The system follows **real hospital workflow**:

```text
Triage → Department → Doctor Queue → Consultation → Lab/Pharmacy → Exit
```

---

# ⚙️ Step-by-Step Execution Flow

---

## 🟢 STEP 1: Patient Entry

* Patient logs in / registers
* Provides symptoms

```text
Input:
- Name
- Age
- Symptoms
```

---

## 🚨 STEP 2: Triage (Priority Assignment)

Assign priority based on condition:

| Condition | Priority |
| --------- | -------- |
| Emergency | 1        |
| Urgent    | 2        |
| Normal    | 3        |

```javascript
const getPriority = (type) => {
  if (type === "emergency") return 1;
  if (type === "urgent") return 2;
  return 3;
};
```

---

## 🏥 STEP 3: Department Routing

Patient is routed to department:

| Symptoms     | Department |
| ------------ | ---------- |
| Heart issues | Cardiology |
| Fever        | General    |
| Injury       | Orthopedic |

```javascript
const getDepartment = (symptom) => {
  if (symptom.includes("heart")) return "cardiology";
  if (symptom.includes("fever")) return "general";
  return "general";
};
```

---

## 👨‍⚕️ STEP 4: Doctor Assignment

Assign doctor with **least queue load**:

```javascript
const assignDoctor = async (doctors) => {
  let bestDoctor = null;
  let minQueue = Infinity;

  for (let doc of doctors) {
    const len = await redis.zcard(`queue:doctor:${doc}`);
    if (len < minQueue) {
      minQueue = len;
      bestDoctor = doc;
    }
  }
  return bestDoctor;
};
```

---

## 🎟️ STEP 5: Token Generation

```javascript
const token = await redis.incr("token:counter");
```

---

## ➕ STEP 6: Add Patient to Doctor Queue

```javascript
const addToQueue = async (doctorId, patient, priority) => {
  const key = `queue:doctor:${doctorId}`;
  const timestamp = Date.now();

  const score = priority * 1e13 + timestamp;

  const data = JSON.stringify({
    token: patient.token,
    patientId: patient.id,
    priority,
    doctorId,
    time: timestamp
  });

  await redis.zadd(key, score, data);
};
```

---

## 🔄 STEP 7: Real-Time Queue Update

Using Socket.IO:

```javascript
io.emit("queue_update", {
  doctorId,
  queueLength: await redis.zcard(`queue:doctor:${doctorId}`)
});
```

---

## 🧑‍⚕️ STEP 8: Doctor Calls Next Patient

```javascript
const getNextPatient = async (doctorId) => {
  const result = await redis.zpopmin(`queue:doctor:${doctorId}`);

  if (!result.length) return null;

  return JSON.parse(result[0].value);
};
```

---

## 🚨 STEP 9: Emergency Override

Emergency queue:

```bash
queue:emergency
```

Doctor checks:

```javascript
let patient = await redis.zpopmin("queue:emergency");

if (!patient) {
  patient = await redis.zpopmin(`queue:doctor:${doctorId}`);
}
```

---

## 🧪 STEP 10: Post Consultation Routing

After doctor:

* Lab Queue
* Pharmacy Queue

```bash
queue:lab
queue:pharmacy
```

---

## 💊 STEP 11: Lab / Pharmacy Handling

Same queue logic applies:

```javascript
await redis.zadd("queue:lab", score, patientData);
await redis.zpopmin("queue:lab");
```

---

## 📄 STEP 12: Store Patient History

Store in MongoDB:

```javascript
await PatientHistory.create({
  patientId,
  doctorId,
  diagnosis,
  prescription
});
```

---

## ⏱️ STEP 13: Waiting Time Calculation

```javascript
waitingTime = position * avgConsultTime;
```

---

## 🔚 STEP 14: Exit Flow

* Patient receives:

  * Prescription
  * Reports
  * Medicine

---

# 🔁 Complete Flow

```text
Patient Login
   ↓
Triage (priority assigned)
   ↓
Department Routing
   ↓
Doctor Assignment
   ↓
Token Generated
   ↓
Added to Doctor Queue (Redis)
   ↓
Doctor Calls Next Patient
   ↓
Consultation
   ↓
Lab / Pharmacy Queue (if needed)
   ↓
History Stored (MongoDB)
   ↓
Exit
```

---

# 🏗️ Queue Types Used

| Queue           | Purpose             |
| --------------- | ------------------- |
| queue:doctor:id | Doctor consultation |
| queue:emergency | Emergency override  |
| queue:lab       | Lab tests           |
| queue:pharmacy  | Medicine            |

---

# 🏆 Best Practices

* ✅ Use Redis Sorted Sets for priority queues
* ✅ Separate queue per doctor
* ✅ Use emergency override
* ✅ Use MongoDB for history
* ✅ Use Socket.IO for live updates

---

# ⚡ Summary

* Multi-queue system → Real hospital model
* Priority-based queue → Efficient handling
* Real-time updates → Better UX
* Scalable architecture → Production ready

---

## 👨‍💻 Author

Developed by **Meenachi Sundaresan**

---
