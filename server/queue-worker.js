// Queue Worker Thread - Processes concurrent queue operations
const { parentPort } = require('worker_threads');

parentPort.on('message', async (msg) => {
  try {
    const { taskId, data, type } = msg;
    
    // Simulate different types of concurrent operations
    let result;
    switch (type) {
      case 'processToken':
        result = await processToken(data);
        break;
      case 'updateQueue':
        result = await updateQueue(data);
        break;
      case 'notifyPatient':
        result = await notifyPatient(data);
        break;
      case 'assignDoctor':
        result = await assignDoctor(data);
        break;
      default:
        result = await defaultTask(data);
    }

    parentPort.postMessage({
      type: 'complete',
      taskId,
      result,
      completedAt: new Date()
    });
  } catch (err) {
    parentPort.postMessage({
      type: 'error',
      error: err.message
    });
  }
});

// Simulate token processing
async function processToken(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const token = Math.floor(Math.random() * 9000) + 1000;
      resolve({ token, patientId: data.patientId, status: 'processed' });
    }, Math.random() * 300);
  });
}

// Simulate queue update
async function updateQueue(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ queueLength: data.count, lastUpdated: new Date() });
    }, Math.random() * 200);
  });
}

// Simulate patient notification
async function notifyPatient(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ patientId: data.patientId, notified: true, method: 'SMS' });
    }, Math.random() * 250);
  });
}

// Simulate doctor assignment
async function assignDoctor(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams'];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      resolve({ patientId: data.patientId, assignedDoctor: doctor });
    }, Math.random() * 350);
  });
}

// Default task
async function defaultTask(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, status: 'completed' });
    }, Math.random() * 300);
  });
}
