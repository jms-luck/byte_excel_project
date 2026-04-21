// Advanced Concurrent Operations Example
// Demonstrates real-world scenarios for concurrent processing

require('dotenv').config();
const PQueue = require('p-queue').default;
const ConcurrentQueueProcessor = require('./concurrent-processor');

// Example 1: Using PQueue for concurrent operations
async function examplePQueue() {
  console.log('\n📌 Example 1: PQueue-based Concurrent Operations\n');
  
  const queue = new PQueue({ concurrency: 3 });
  const tasks = [
    { id: 1, name: 'Generate Token', time: 200 },
    { id: 2, name: 'Process Patient', time: 300 },
    { id: 3, name: 'Assign Doctor', time: 150 },
    { id: 4, name: 'Send Notification', time: 100 },
    { id: 5, name: 'Update Queue', time: 250 }
  ];

  console.log(`Adding ${tasks.length} tasks with concurrency=3\n`);

  const promises = tasks.map(task =>
    queue.add(() => simulateTask(task))
  );

  const results = await Promise.all(promises);
  console.log('\n✅ All tasks completed:', results);
}

// Example 2: Using Worker Threads
async function exampleWorkerThreads() {
  console.log('\n\n📌 Example 2: Worker Threads Concurrent Processing\n');
  
  const processor = new ConcurrentQueueProcessor(4); // 4 worker threads

  const workerTasks = [
    { id: 'T1', type: 'processToken', data: { patientId: 'P001' } },
    { id: 'T2', type: 'updateQueue', data: { count: 15 } },
    { id: 'T3', type: 'notifyPatient', data: { patientId: 'P002' } },
    { id: 'T4', type: 'assignDoctor', data: { patientId: 'P003' } },
    { id: 'T5', type: 'processToken', data: { patientId: 'P004' } },
    { id: 'T6', type: 'notifyPatient', data: { patientId: 'P005' } }
  ];

  console.log(`Adding ${workerTasks.length} tasks to worker pool (4 workers)\n`);

  for (const task of workerTasks) {
    await processor.addTask(task);
  }

  // Wait a bit for tasks to complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  const stats = processor.getStats();
  console.log('\n📊 Processor Statistics:');
  console.log(`   - Max Workers: ${stats.maxWorkers}`);
  console.log(`   - Active Workers: ${stats.activeWorkers}`);
  console.log(`   - Task Queue Size: ${stats.taskQueueSize}`);
  console.log(`   - Completed Tasks: ${stats.completedTasks}`);
  console.log(`   - Failed Tasks: ${stats.failedTasks}`);
  console.log(`   - Total Processed: ${stats.totalProcessed}`);

  await processor.terminate();
}

// Example 3: Mixed concurrent operations
async function exampleMixedOperations() {
  console.log('\n\n📌 Example 3: Mixed Concurrent Operations\n');
  
  const queue = new PQueue({ concurrency: 5 });

  const scenarios = [
    {
      name: 'Patient Registration',
      operations: 3,
      time: 200
    },
    {
      name: 'Token Generation',
      operations: 5,
      time: 150
    },
    {
      name: 'Queue Updates',
      operations: 2,
      time: 100
    },
    {
      name: 'Notifications',
      operations: 4,
      time: 175
    }
  ];

  console.log('Simulating hospital operations with concurrent processing:\n');

  const allPromises = [];

  for (const scenario of scenarios) {
    console.log(`📋 ${scenario.name}:`);
    for (let i = 1; i <= scenario.operations; i++) {
      const promise = queue.add(() => 
        simulateTask({
          id: i,
          name: `${scenario.name} #${i}`,
          time: scenario.time
        })
      );
      allPromises.push(promise);
      console.log(`   → Operation ${i} queued`);
    }
    console.log('');
  }

  console.log(`\n⏳ Processing ${allPromises.length} total operations concurrently...\n`);
  const results = await Promise.all(allPromises);
  
  console.log(`\n✅ All operations completed!`);
  console.log(`📊 Total operations: ${results.length}`);
}

// Simulate a task with delay
async function simulateTask(task) {
  return new Promise((resolve) => {
    console.log(`  ▶️  Starting: ${task.name} (${task.time}ms)`);
    setTimeout(() => {
      console.log(`  ✅ Completed: ${task.name}`);
      resolve({
        id: task.id,
        name: task.name,
        status: 'completed',
        duration: task.time
      });
    }, task.time);
  });
}

// Example 4: Concurrent I/O operations
async function exampleConcurrentIO() {
  console.log('\n\n📌 Example 4: Concurrent I/O Operations\n');
  
  const queue = new PQueue({ concurrency: 5 });

  // Simulate concurrent API calls
  const apiCalls = [
    { endpoint: '/api/auth/register', method: 'POST' },
    { endpoint: '/api/queue/token', method: 'POST' },
    { endpoint: '/api/queue/status', method: 'GET' },
    { endpoint: '/api/doctor/dashboard', method: 'GET' },
    { endpoint: '/api/auth/login', method: 'POST' },
    { endpoint: '/api/queue/next', method: 'POST' },
    { endpoint: '/api/health', method: 'GET' }
  ];

  console.log(`Making ${apiCalls.length} concurrent API calls:\n`);

  const promises = apiCalls.map(call =>
    queue.add(async () => {
      console.log(`📡 ${call.method} ${call.endpoint}`);
      await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
      console.log(`✅ ${call.method} ${call.endpoint} - OK`);
      return { status: 200, endpoint: call.endpoint };
    })
  );

  console.log('\n⏳ Waiting for all API calls to complete...\n');
  const results = await Promise.all(promises);

  console.log('\n📊 API Call Results:');
  console.log(`   - Total Calls: ${results.length}`);
  console.log(`   - Successful: ${results.filter(r => r.status === 200).length}`);
  console.log(`   - Concurrency Level: ${queue.concurrency}`);
}

// Example 5: Error handling in concurrent operations
async function exampleErrorHandling() {
  console.log('\n\n📌 Example 5: Error Handling in Concurrent Operations\n');
  
  const queue = new PQueue({ concurrency: 3 });

  const tasks = [
    { id: 1, name: 'Task 1', shouldFail: false },
    { id: 2, name: 'Task 2', shouldFail: true },
    { id: 3, name: 'Task 3', shouldFail: false },
    { id: 4, name: 'Task 4', shouldFail: false },
    { id: 5, name: 'Task 5', shouldFail: true }
  ];

  console.log(`Processing ${tasks.length} tasks (some will fail)\n`);

  const promises = tasks.map(task =>
    queue.add(() => taskWithErrorHandling(task))
  );

  const results = await Promise.allSettled(promises);

  console.log('\n📊 Results Summary:');
  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');

  console.log(`   - Successful: ${successful.length}`);
  console.log(`   - Failed: ${failed.length}`);
  console.log(`   - Total: ${results.length}`);

  failed.forEach((result, index) => {
    console.log(`   ❌ Error ${index + 1}: ${result.reason}`);
  });
}

async function taskWithErrorHandling(task) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (task.shouldFail) {
        console.log(`❌ ${task.name} failed as expected`);
        reject(new Error(`${task.name} intentional failure`));
      } else {
        console.log(`✅ ${task.name} completed successfully`);
        resolve({ id: task.id, status: 'success' });
      }
    }, Math.random() * 300);
  });
}

// Run all examples
async function runAllExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CONCURRENT EXECUTION EXAMPLES');
  console.log('='.repeat(60));

  try {
    await examplePQueue();
    await exampleWorkerThreads();
    await exampleMixedOperations();
    await exampleConcurrentIO();
    await exampleErrorHandling();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL EXAMPLES COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60) + '\n');
  } catch (err) {
    console.error('❌ Error running examples:', err);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  examplePQueue,
  exampleWorkerThreads,
  exampleMixedOperations,
  exampleConcurrentIO,
  exampleErrorHandling
};
