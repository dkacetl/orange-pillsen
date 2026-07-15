const BIT_COUNT = 256;
let chart = null;
let smallestPregeneratedHashValue = null;

function updateProbability() {
  const d = Number(document.getElementById('difficulty').value);

  const probability = 1 / Math.pow(2, d);

  document.getElementById('probDifficulty').innerHTML = d;
  document.getElementById('probDifficultyPow').innerHTML = d;
  document.getElementById('probPowResult').innerHTML = Math.pow(
    2,
    d,
  ).toLocaleString();
  document.getElementById('probResult').innerHTML = probability;
}

document
  .getElementById('difficulty')
  .addEventListener('input', updateProbability);

updateProbability();

function randomUint32() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

async function run() {
  document.getElementById('stats-panel').style.display = 'block';
  document.getElementById('probBox-panel').style.display = 'block';

  const pregenerateValidCount = Number(
    document.getElementById('pregenerateValidCount').value,
  );

  if (pregenerateValidCount > 0) {
    await pregenerateValidHashes();
  }

  const count = Number(document.getElementById('count').value);

  const difficulty = Number(document.getElementById('difficulty').value);

  const TARGET = 1n << BigInt(256 - difficulty);

  const bitCounts = new Array(BIT_COUNT).fill(0);

  const firstHashes = [];

  let found = 0;

  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const rnd = randomUint32();
    const hashBytes = await sha256(rnd.toString());

    const hashValue = BigInt(
      '0x' +
        Array.from(hashBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
    );

    const isValid =
      hashValue < TARGET &&
      (smallestPregeneratedHashValue === null ||
        hashValue < smallestPregeneratedHashValue);

    if (i < 50) {
      firstHashes.push({
        hashBytes,
        className: isValid ? 'hash-valid' : 'hash-invalid',
      });
    }

    if (isValid) {
      found++;

      for (let byteIndex = 0; byteIndex < 32; byteIndex++) {
        const byte = hashBytes[byteIndex];

        for (let bit = 0; bit < 8; bit++) {
          const bitValue = (byte >> (7 - bit)) & 1;

          const globalBitIndex = byteIndex * 8 + bit;

          if (bitValue === 1) {
            bitCounts[globalBitIndex]++;
          }
        }
      }
    }
  }

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);

  document.getElementById('foundCount').innerHTML = found;
  document.getElementById('elapsedTime').innerHTML = elapsed;
  document.getElementById('successRate').innerHTML = (
    (100 * found) /
    count
  ).toFixed(5);

  drawChart(bitCounts);
  renderHashList(firstHashes);
}

function hashBytesToBinary(hashBytes) {
  return Array.from(hashBytes)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('');
}

function renderHashList(hashList, targetId = 'hashList') {
  document.getElementById(targetId).innerHTML = hashList
    .map(
      ({ hashBytes, className }) =>
        `<span class="${className}">${hashBytesToBinary(hashBytes)}</span>`,
    )
    .join('<br>');
}

async function pregenerateValidHashes() {
  const validCount = Number(
    document.getElementById('pregenerateValidCount').value,
  );

  const difficulty = Number(document.getElementById('difficulty').value);

  const TARGET = 1n << BigInt(256 - difficulty);

  const validHashes = [];

  while (validHashes.length < validCount) {
    const rnd = randomUint32();
    const hashBytes = await sha256(rnd.toString());

    const hashValue = BigInt(
      '0x' +
        Array.from(hashBytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
    );

    if (hashValue < TARGET) {
      validHashes.push({ hashBytes, hashValue, className: 'hash-valid' });
    }
  }

  const smallest = validHashes.reduce((min, current) =>
    current.hashValue < min.hashValue ? current : min,
  );

  smallest.className = 'hash-invalid';

  smallestPregeneratedHashValue = smallest.hashValue;

  renderHashList(validHashes, 'pregenerateValidHashList');
}

async function runExperiments() {
  const experimentCount = Number(
    document.getElementById('experimentCount').value,
  );

  let totalFound = 0;
  let totalElapsed = 0;
  let totalSuccessRate = 0;

  for (let i = 0; i < experimentCount; i++) {
    await run();

    totalFound += Number(document.getElementById('foundCount').innerText);
    totalElapsed += Number(document.getElementById('elapsedTime').innerText);
    totalSuccessRate += Number(
      document.getElementById('successRate').innerText,
    );
  }

  document.getElementById('allExperimentsStats-panel').style.display =
    'block';

  document.getElementById('totalExperiments').innerHTML = experimentCount;
  document.getElementById('totalFoundCount').innerHTML = totalFound;
  document.getElementById('totalElapsedTime').innerHTML =
    totalElapsed.toFixed(2);
  document.getElementById('averageSuccessRate').innerHTML = (
    totalSuccessRate / experimentCount
  ).toFixed(5);
}

function drawChart(values) {
  const canvas = document.getElementById('chart');

  const isEmpty = values.every((v) => v === 0);

  if (isEmpty) {
    if (chart) chart.destroy();
    chart = null;
    canvas.style.display = 'none';
    return;
  }

  canvas.style.display = 'block';

  const labels = [];

  for (let i = 0; i < BIT_COUNT; i++) {
    labels.push(i.toString());
  }

  const safeValues = values.map((v) => (v === 0 ? 0.1 : v));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('chart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Výskyt bitu = 1 (PoW filtrované, log Y)',
          data: safeValues,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          type: 'logarithmic',
          min: 1,
          max: 10000,
          title: {
            display: true,
            text: 'Počet výskytů (log škála)',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Index bitu (0 = MSB, 255 = LSB)',
          },
          ticks: {
            maxTicksLimit: 16,
          },
        },
      },
    },
  });
}
