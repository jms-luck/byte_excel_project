// Advanced Concurrent Queue Processing with Worker Threads
// This module handles concurrent processing of queue operations

const { Worker } = require('worker_threads');
const path = require('path');

class ConcurrentQueueProcessor {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;
    this.completedTasks = 0;
    this.failedTasks = 0;
    this.initializeWorkers();
  }

  // Initialize worker thread pool
  initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(path.join(__dirname, 'queue-worker.js'));
      
      worker.on('message', (msg) => {
        if (msg.type === 'complete') {
          this.completedTasks++;
          console.log(`✅ Task ${msg.taskId} completed by worker ${msg.workerId}`);
        }
      });

      worker.on('error', (err) => {
        this.failedTasks++;
        console.error(`❌ Worker error:`, err);
      });

      this.workers.push({ id: i, worker, busy: false });
    }
  }

  // Add task to concurrent queue
  async addTask(task) {
    this.taskQueue.push(task);
    this.processQueue();
  }

  // Process queue with concurrent workers
  processQueue() {
    while (this.taskQueue.length > 0) {
      const availableWorker = this.workers.find(w => !w.busy);
      
      if (!availableWorker) {
        break; // All workers busy
      }

      const task = this.taskQueue.shift();
      availableWorker.busy = true;
      this.activeWorkers++;

      availableWorker.worker.postMessage({
        taskId: task.id,
        data: task.data,
        type: task.type
      });

      availableWorker.worker.once('message', (msg) => {
        availableWorker.busy = false;
        this.activeWorkers--;
        console.log(`✅ Worker ${availableWorker.id} finished task ${task.id}`);
        this.processQueue(); // Process next task in queue
      });
    }
  }

  // Get processor statistics
  getStats() {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers,
      taskQueueSize: this.taskQueue.length,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      totalProcessed: this.completedTasks + this.failedTasks
    };
  }

  // Terminate all workers
  async terminate() {
    for (const { worker } of this.workers) {
      await worker.terminate();
    }
    console.log('🛑 All workers terminated');
  }
}

module.exports = ConcurrentQueueProcessor;
