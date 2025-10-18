function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;

  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }

  return true;
}

self.addEventListener('message', (e) => {
  const { start, end } = e.data;
  let primesCount = 0;

  for (let i = start; i <= end; i++) {
    if (isPrime(i)) {
      primesCount += 1;
    }
  }

  self.postMessage({ primesCount, start, end });
});
