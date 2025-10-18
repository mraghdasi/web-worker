import "./styles.css";

// Number of concurrent workers (based on CPU cores)
const MAX_CONCURRENT_WORKERS = navigator.hardwareConcurrency || 4;

// Optimal chunk size for each worker (smaller chunks for better progress tracking)
const CHUNK_SIZE = 5000000; // 5 million numbers per chunk

function calculatePrimes() {
  const start = parseInt(document.getElementById("start").value, 10);
  const end = parseInt(document.getElementById("end").value, 10);

  if (!isNaN(start) && !isNaN(end)) {
    const startTime = performance.now();

    // Show loading message with progress
    document.getElementById("result").textContent = "Calculating... 0% complete";

    // Create task queue - split range into chunks
    const tasks = [];
    for (let i = start; i <= end; i += CHUNK_SIZE) {
      const chunkStart = i;
      const chunkEnd = Math.min(i + CHUNK_SIZE - 1, end);
      tasks.push({ start: chunkStart, end: chunkEnd });
    }

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let totalPrimesCount = 0;
    let activeWorkers = 0;
    const workerPool = [];

    // Function to process next task from queue
    function processNextTask(worker) {
      if (tasks.length === 0) {
        // No more tasks, terminate this worker
        worker.terminate();
        activeWorkers--;
        return;
      }

      const task = tasks.shift();
      worker.postMessage(task);
    }

    // Function to handle worker completion
    function handleWorkerMessage(worker, e) {
      const { primesCount } = e.data;
      totalPrimesCount += primesCount;
      completedTasks++;

      // Update progress
      const progress = Math.round((completedTasks / totalTasks) * 100);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      document.getElementById("result").textContent =
        `Calculating... ${progress}% complete (${completedTasks}/${totalTasks} chunks)\nElapsed: ${elapsed}s | Workers: ${activeWorkers} | Primes found so far: ${totalPrimesCount.toLocaleString()}`;

      // Check if all tasks are done
      if (completedTasks === totalTasks) {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        document.getElementById("result").textContent =
          `Number of prime numbers between ${start.toLocaleString()} and ${end.toLocaleString()}: ${totalPrimesCount.toLocaleString()}\nCalculated in ${duration} seconds using dynamic worker pool (max ${MAX_CONCURRENT_WORKERS} concurrent workers)\nTotal chunks processed: ${totalTasks}`;

        // Terminate all workers
        workerPool.forEach(w => w.terminate());
      } else {
        // Process next task with this worker
        processNextTask(worker);
      }
    }

    // Create initial worker pool
    const initialWorkers = Math.min(MAX_CONCURRENT_WORKERS, totalTasks);
    for (let i = 0; i < initialWorkers; i++) {
      const worker = new Worker(new URL('./primeWorker.js', import.meta.url));

      worker.addEventListener('message', (e) => handleWorkerMessage(worker, e));

      worker.addEventListener('error', (e) => {
        console.error('Worker error:', e);
        document.getElementById("result").textContent = "Error in calculation.";
        workerPool.forEach(w => w.terminate());
      });

      workerPool.push(worker);
      activeWorkers++;
      processNextTask(worker);
    }
  } else {
    document.getElementById("result").textContent =
      "Please enter valid numbers.";
  }
}

document
  .getElementById("calculatePrimes")
  .addEventListener("click", calculatePrimes);
