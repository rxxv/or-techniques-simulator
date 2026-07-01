/* ============================================================
   OR Techniques Interactive Simulator – app.js
   Covers:
     1. Hungarian Algorithm (Assignment Problem)
     2. Northwest Corner Rule (Transportation)
     3. Least Cost Cell (Transportation)
     4. Vogel's Approximation Method (Transportation)
     5. Sequencing Problem (Johnson's Algorithm)
   ============================================================ */

'use strict';

// ─── ROUTER ──────────────────────────────────────────────────────────────────
const pages = ['home', 'hungarian', 'nwcr', 'lcc', 'vam', 'sequencing'];
let currentPage = 'home';

function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById(`nav-${page}`)?.classList.add('active');
  currentPage = page;
  if (page === 'home') {
    buildHome();
  }
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    navigate(btn.dataset.page);
    // close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function cloneMatrix(m) { return m.map(r => [...r]); }

function makeMatrix(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

function renderAlert(type, msg) {
  return `<div class="alert alert-${type}"><span>${msg}</span></div>`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function colorsFor(n) {
  const palette = [
    '#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b',
    '#ec4899','#ef4444','#22d3ee','#a78bfa','#34d399'
  ];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}

// ─── GSAP ANIMATIONS ─────────────────────────────────────────────────────────
function animateSteps(containerSelector) {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(
    `${containerSelector} .step-card`,
    { opacity: 0, y: 24, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
  );
}

function animateResult(selector) {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(
    selector,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
  );
}

function showToast(msg, type = 'success') {
  if (typeof Toastify === 'undefined') return;
  const bg = type === 'success' ? '#ffffff' : '#ffffff';
  const borderLeft = type === 'success' ? '4px solid var(--success)' : '4px solid var(--danger)';
  Toastify({
    text: msg, duration: 3500, gravity: 'bottom', position: 'right',
    style: { background: bg, borderRadius: '6px', fontFamily: "'Plus Jakarta Sans',sans-serif",
             fontSize: '0.85rem', fontWeight: '700', padding: '12px 20px',
             boxShadow: '4px 4px 0px rgba(42,62,89,0.1)', border: '1px solid var(--border)',
             borderLeft, color: '#1c1f24' },
    stopOnFocus: true
  }).showToast();
}

// ─── CHART.JS COST CHART ─────────────────────────────────────────────────────
let _costChartInstance = null;
function renderCostChart(canvasId, labels, data, colors) {
  if (typeof Chart === 'undefined') return;
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  if (_costChartInstance) { _costChartInstance.destroy(); _costChartInstance = null; }
  _costChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#505663', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#e3ded5' } },
        y: { ticks: { color: '#505663', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: '#e3ded5' } }
      }
    }
  });
}

// ─── LENIS SMOOTH SCROLL ─────────────────────────────────────────────────────
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

// ─── TIPPY TOOLTIPS ──────────────────────────────────────────────────────────
function initTooltips() {
  if (typeof tippy === 'undefined') return;
  // Nav items
  tippy('[data-page="hungarian"]', { content: 'Optimal assignment — minimise total cost', theme: 'light', placement: 'right', delay: [300, 0] });
  tippy('[data-page="nwcr"]',      { content: 'Quick initial BFS — ignores costs', theme: 'light', placement: 'right', delay: [300, 0] });
  tippy('[data-page="lcc"]',       { content: 'Greedy BFS — always picks cheapest cell', theme: 'light', placement: 'right', delay: [300, 0] });
  tippy('[data-page="vam"]',       { content: 'Penalty-based BFS — near-optimal result', theme: 'light', placement: 'right', delay: [300, 0] });
  tippy('[data-page="sequencing"]',{ content: 'Johnson\'s rule — minimise makespan on 2 machines', theme: 'light', placement: 'right', delay: [300, 0] });
}

function attachSolveTip(selector, content) {
  if (typeof tippy === 'undefined') return;
  const el = document.querySelector(selector);
  if (el) tippy(el, { content, theme: 'light', placement: 'top' });
}

// ─── COUNTUP ANIMATED NUMBERS ────────────────────────────────────────────────
function animateCount(elementId, endVal, prefix = '', suffix = '', decimals = 0) {
  if (typeof CountUp === 'undefined' || typeof CountUp.CountUp === 'undefined') return;
  const el = document.getElementById(elementId);
  if (!el) return;
  const cu = new CountUp.CountUp(elementId, endVal, {
    startVal: 0, duration: 1.4, useEasing: true, useGrouping: true,
    prefix, suffix, decimalPlaces: decimals
  });
  if (!cu.error) cu.start();
}

function buildHome() {
  const el = $('page-home');
  el.innerHTML = `
    <div class="hero-section">
      <div class="hero-badge"><span></span> Interactive Simulator · 5 Techniques</div>
      <h1>Operational Research<br>Techniques</h1>
      <p>Step-by-step solver and visualiser for core OR methods. Input your own data or use built-in examples.</p>
    </div>
    <div class="technique-cards">
      <div class="technique-card" onclick="navigate('hungarian')" style="--card-gradient: var(--primary)">
        <div class="tc-icon"><i data-lucide="git-merge"></i></div>
        <div class="tc-tag" style="background:rgba(42,62,89,0.06);color:var(--primary);border-color:rgba(42,62,89,0.15)">Assignment</div>
        <h3>Hungarian Algorithm</h3>
        <p>Optimally assign <em>n</em> workers to <em>n</em> jobs minimising total cost via row/column reduction.</p>
        <span class="tc-arrow">→</span>
      </div>
      <div class="technique-card" onclick="navigate('nwcr')" style="--card-gradient: var(--accent)">
        <div class="tc-icon"><i data-lucide="compass"></i></div>
        <div class="tc-tag" style="background:rgba(91,112,101,0.06);color:var(--accent2);border-color:rgba(91,112,101,0.15)">Transportation</div>
        <h3>NW Corner Rule</h3>
        <p>Initial feasible solution starting from the top-left (north-west) corner of the cost matrix.</p>
        <span class="tc-arrow">→</span>
      </div>
      <div class="technique-card" onclick="navigate('lcc')" style="--card-gradient: var(--success)">
        <div class="tc-icon"><i data-lucide="coins"></i></div>
        <div class="tc-tag" style="background:rgba(62,111,81,0.06);color:var(--success);border-color:rgba(62,111,81,0.15)">Transportation</div>
        <h3>Least Cost Cell</h3>
        <p>Greedy method allocating to the cheapest available cell at each step to reduce initial cost.</p>
        <span class="tc-arrow">→</span>
      </div>
      <div class="technique-card" onclick="navigate('vam')" style="--card-gradient: var(--warning)">
        <div class="tc-icon"><i data-lucide="trending-up"></i></div>
        <div class="tc-tag" style="background:rgba(176,122,60,0.06);color:var(--warning);border-color:rgba(176,122,60,0.15)">Transportation</div>
        <h3>Vogel's Approximation</h3>
        <p>Penalty-based method giving near-optimal initial BFS using opportunity cost differences.</p>
        <span class="tc-arrow">→</span>
      </div>
      <div class="technique-card" onclick="navigate('sequencing')" style="--card-gradient: var(--secondary)">
        <div class="tc-icon"><i data-lucide="clock"></i></div>
        <div class="tc-tag" style="background:rgba(204,90,55,0.06);color:var(--secondary);border-color:rgba(204,90,55,0.15)">Sequencing</div>
        <h3>Johnson's Algorithm</h3>
        <p>Optimal n-job 2-machine sequencing minimising total makespan using Johnson's rule.</p>
        <span class="tc-arrow">→</span>
      </div>
    </div>
    <div class="separator"></div>
    <div class="grid-3" style="gap:16px;margin-top:0">
      <div class="card" style="text-align:center">
        <div style="font-size:2rem;margin-bottom:8px;color:var(--primary)"><i data-lucide="check-square" style="width:36px;height:36px;stroke-width:1.5"></i></div>
        <div style="font-weight:700;color:var(--text)">Step-by-Step</div>
        <div class="fs-sm text-muted mt-8">Every iteration animated with colour-coded highlights</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:2rem;margin-bottom:8px;color:var(--secondary)"><i data-lucide="edit-3" style="width:36px;height:36px;stroke-width:1.5"></i></div>
        <div style="font-weight:700;color:var(--text)">Custom Input</div>
        <div class="fs-sm text-muted mt-8">Enter your own matrix size and cost values</div>
      </div>
      <div class="card" style="text-align:center">
        <div style="font-size:2rem;margin-bottom:8px;color:var(--accent)"><i data-lucide="bar-chart-2" style="width:36px;height:36px;stroke-width:1.5"></i></div>
        <div style="font-weight:700;color:var(--text)">Instant Results</div>
        <div class="fs-sm text-muted mt-8">Optimal cost, assignments, and Gantt charts</div>
      </div>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. HUNGARIAN ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────
function buildHungarian() {
  const el = $('page-hungarian');
  el.innerHTML = `
    <div class="page-header">
      <div class="breadcrumb">🏠 Home <span>›</span> Assignment Problem</div>
      <h1>Hungarian Algorithm</h1>
      <p>Solves the assignment problem optimally. Reduces cost matrix through row minima, column minima, and line-covering to find zero-cost assignments.</p>
    </div>
    <div class="grid-2" style="gap:24px">
      <div class="card">
        <div class="card-title">Configuration</div>
        <div class="input-row">
          <div class="form-group">
            <label class="form-label">Matrix Size (n×n)</label>
            <select class="form-select" id="h-size">
              <option value="3">3 × 3</option>
              <option value="4" selected>4 × 4</option>
              <option value="5">5 × 5</option>
              <option value="6">6 × 6</option>
            </select>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-outline btn-sm" onclick="hGenMatrix()">Generate Matrix</button>
          <button class="btn btn-secondary btn-sm" onclick="hLoadExample()">Load Example</button>
        </div>
        <div id="h-matrix-container" class="mt-16"></div>
        <div class="btn-group" id="h-solve-btns" style="display:none">
          <button class="btn btn-primary" id="h-solve-btn" onclick="hungarianSolve()">▶ Solve Step-by-Step</button>
          <button class="btn btn-secondary btn-sm" onclick="hungarianReset()">Reset</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Algorithm Guide</div>
        <div style="font-size:0.83rem;color:var(--text2);line-height:1.8">
          <div style="display:flex;flex-direction:column;gap:10px">
            ${['Subtract row minimum from each row','Subtract column minimum from each column','Cover all zeros with minimum lines','If lines = n → optimal; else augment zeros','Repeat until all zeros are covered','Make optimal assignment'].map((s,i)=>`
              <div style="display:flex;gap:10px;align-items:flex-start">
                <div style="min-width:24px;height:24px;border-radius:50%;background:rgba(99,102,241,0.2);color:var(--primary2);font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center;">${i+1}</div>
                <span>${s}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
    <div id="h-steps" class="steps-container"></div>
    <div id="h-result"></div>
  `;
  hLoadExample();
}

let hMatrix = [];

function hGenMatrix() {
  const n = parseInt($('h-size').value);
  hMatrix = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 15) + 1));
  hRenderInput();
}

function hLoadExample() {
  // Classic 4x4 example
  hMatrix = [
    [9, 2, 7, 8],
    [6, 4, 3, 7],
    [5, 8, 1, 8],
    [7, 6, 9, 4]
  ];
  $('h-size').value = '4';
  hRenderInput();
}

function hRenderInput() {
  const n = hMatrix.length;
  const workerLabels = Array.from({ length: n }, (_, i) => `W${i + 1}`);
  const jobLabels = Array.from({ length: n }, (_, i) => `J${i + 1}`);
  let html = `<div class="matrix-container"><table class="matrix-table"><thead><tr><th></th>${jobLabels.map(j => `<th>${j}</th>`).join('')}</tr></thead><tbody>`;
  for (let i = 0; i < n; i++) {
    html += `<tr><th>${workerLabels[i]}</th>`;
    for (let j = 0; j < n; j++) {
      html += `<td><input class="cell-input" id="hc-${i}-${j}" type="number" value="${hMatrix[i][j]}" min="0" max="99" onchange="hMatrix[${i}][${j}]=+this.value" /></td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  $('h-matrix-container').innerHTML = html;
  $('h-solve-btns').style.display = 'flex';
  $('h-steps').innerHTML = '';
  $('h-result').innerHTML = '';
}

function hungarianReset() {
  $('h-steps').innerHTML = '';
  $('h-result').innerHTML = '';
}

function hungarianSolve() {
  const n = hMatrix.length;
  // Read current values from inputs
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    hMatrix[i][j] = +($(`hc-${i}-${j}`)?.value ?? hMatrix[i][j]);
  }
  const stepsEl = $('h-steps');
  stepsEl.innerHTML = '';
  $('h-result').innerHTML = '';

  let mat = cloneMatrix(hMatrix);
  const steps = [];

  // Step 1: Row reduction
  const rowMins = mat.map(r => Math.min(...r));
  const mat1 = mat.map((r, i) => r.map(v => v - rowMins[i]));
  steps.push({ title: 'Step 1 – Row Reduction', exp: 'Subtract the minimum value of each row from all elements in that row.', mat: mat1, rowMins });

  // Step 2: Column reduction
  let mat2 = cloneMatrix(mat1);
  const colMins = Array.from({ length: n }, (_, j) => Math.min(...mat2.map(r => r[j])));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) mat2[i][j] -= colMins[j];
  steps.push({ title: 'Step 2 – Column Reduction', exp: 'Subtract the minimum value of each column from all elements in that column.', mat: mat2, colMins });

  // Iterative covering & augmentation
  let current = cloneMatrix(mat2);
  let iteration = 2;
  for (let iter = 0; iter < 10; iter++) {
    const { lines, rowsCovered, colsCovered } = hungarianCover(current, n);
    iteration++;
    if (lines >= n) {
      steps.push({ title: `Step ${iteration} – All Zeros Covered (Lines = ${lines})`, exp: `We need ${n} lines to cover all zeros. We have ${lines}. Proceed to assignment.`, mat: cloneMatrix(current), lines: { rowsCovered, colsCovered } });
      break;
    }
    // Find min uncovered
    let minUncov = Infinity;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (!rowsCovered[i] && !colsCovered[j]) minUncov = Math.min(minUncov, current[i][j]);
    }
    steps.push({ title: `Step ${iteration} – Cover Zeros (Lines = ${lines} < ${n})`, exp: `Only ${lines} lines needed. Minimum uncovered value = ${minUncov}. Subtract from uncovered, add to doubly-covered.`, mat: cloneMatrix(current), lines: { rowsCovered, colsCovered }, minUncov });
    // Augment
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (!rowsCovered[i] && !colsCovered[j]) current[i][j] -= minUncov;
      else if (rowsCovered[i] && colsCovered[j]) current[i][j] += minUncov;
    }
  }

  // Assignment
  const assignment = hungarianAssign(current, n);
  const totalCost = assignment.reduce((s, [i, j]) => s + hMatrix[i][j], 0);
  const finalStep = steps.length + 1;
  steps.push({ title: `Step ${finalStep} – Optimal Assignment`, exp: 'Select one zero from each row and column to make the optimal assignment.', mat: current, assignment });

  // Render all steps
  steps.forEach((s, si) => {
    stepsEl.innerHTML += hungarianRenderStep(s, si + 1, n);
  });

  // Animate steps in
  animateSteps('#h-steps');

  // Result
  const workerLabels = Array.from({ length: n }, (_, i) => `Worker ${i + 1}`);
  const jobLabels = Array.from({ length: n }, (_, i) => `Job ${i + 1}`);
  $('h-result').innerHTML = `
    <div class="result-card">
      <div class="result-title">✅ Optimal Solution Found</div>
      <div class="result-value">Total Cost = <span id="h-cost-display">${totalCost}</span></div>
      <div class="result-detail">Assignments:</div>
      <div class="result-row">
        ${assignment.map(([i, j]) => `
          <div class="result-item">
            <span class="ri-label">${workerLabels[i]}</span>
            <span style="color:var(--text3)">→</span>
            <span class="ri-value">${jobLabels[j]}</span>
            <span class="stat-chip green" style="padding:3px 10px;font-size:0.75rem">Cost: ${hMatrix[i][j]}</span>
          </div>`).join('')}
      </div>
      <div style="margin-top:20px">
        <div style="font-size:0.75rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Cost per Assignment</div>
        <div style="height:140px"><canvas id="h-cost-chart"></canvas></div>
      </div>
    </div>`;
  animateResult('#h-result .result-card');
  showToast(`✅ Optimal assignment found — Total cost: ${totalCost}`);
  // Render chart after DOM update
  setTimeout(() => {
    animateCount('h-cost-display', totalCost);
    const chartLabels = assignment.map(([i,j]) => `W${i+1}→J${j+1}`);
    const chartData   = assignment.map(([i,j]) => hMatrix[i][j]);
    const chartColors = colorsFor(assignment.length);
    renderCostChart('h-cost-chart', chartLabels, chartData, chartColors);
  }, 50);
}

function hungarianCover(mat, n) {
  // Greedy covering heuristic (find max matching using zeros)
  const zeros = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (mat[i][j] === 0) zeros.push([i, j]);
  // Use Hungarian covering: mark rows/cols
  const rowMark = Array(n).fill(false);
  const colMark = Array(n).fill(false);
  // Find assignment first
  const assignment = hungarianAssign(mat, n);
  const assignedRows = new Set(assignment.map(([i]) => i));
  const assignedCols = new Set(assignment.map(([, j]) => j));
  // Mark rows not assigned
  let unmarkedRows = new Set(Array.from({ length: n }, (_, i) => i).filter(i => !assignedRows.has(i)));
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of unmarkedRows) {
      for (let j = 0; j < n; j++) {
        if (mat[r][j] === 0 && !colMark[j]) { colMark[j] = true; changed = true; }
      }
    }
    for (let j = 0; j < n; j++) {
      if (colMark[j]) {
        for (const [ar, aj] of assignment) {
          if (aj === j && !unmarkedRows.has(ar)) { unmarkedRows.add(ar); changed = true; }
        }
      }
    }
  }
  const rowsCovered = Array.from({ length: n }, (_, i) => !unmarkedRows.has(i));
  const colsCovered = colMark;
  const lines = rowsCovered.filter(Boolean).length + colsCovered.filter(Boolean).length;
  return { lines, rowsCovered, colsCovered };
}

function hungarianAssign(mat, n) {
  const match = Array(n).fill(-1);
  function dfs(u, visited) {
    for (let v = 0; v < n; v++) {
      if (mat[u][v] === 0 && !visited[v]) {
        visited[v] = true;
        if (match[v] < 0 || dfs(match[v], visited)) {
          match[v] = u;
          return true;
        }
      }
    }
    return false;
  }
  for (let i = 0; i < n; i++) {
    const visited = Array(n).fill(false);
    dfs(i, visited);
  }
  const result = [];
  for (let j = 0; j < n; j++) {
    if (match[j] >= 0) {
      result.push([match[j], j]);
    }
  }
  return result;
}

function hungarianRenderStep(s, stepNum, n) {
  const workerLabels = Array.from({ length: n }, (_, i) => `W${i + 1}`);
  const jobLabels = Array.from({ length: n }, (_, i) => `J${i + 1}`);
  let tableHTML = `<div class="matrix-container"><table class="matrix-table"><thead><tr><th></th>${jobLabels.map(j => `<th>${j}</th>`).join('')}</tr></thead><tbody>`;
  const assignSet = new Set((s.assignment || []).map(([i, j]) => `${i},${j}`));
  const rcovered = s.lines?.rowsCovered || [];
  const ccovered = s.lines?.colsCovered || [];
  for (let i = 0; i < n; i++) {
    tableHTML += `<tr><th>${workerLabels[i]}</th>`;
    for (let j = 0; j < n; j++) {
      const v = s.mat[i][j];
      let cls = '';
      if (assignSet.size > 0) {
        if (assignSet.has(`${i},${j}`)) cls = 'highlight-cell';
        else {
          const sharesRowOrCol = (s.assignment || []).some(([ai, aj]) => ai === i || aj === j);
          if (sharesRowOrCol) cls = 'crossed-cell';
        }
      } else {
        if (assignSet.has(`${i},${j}`)) cls = 'highlight-cell';
        else if (v === 0) cls = 'zero-cell';
        if (rcovered[i] || ccovered[j]) cls += ' pivot-cell';
      }
      tableHTML += `<td class="${cls}">${v}</td>`;
    }
    tableHTML += `</tr>`;
  }
  tableHTML += `</tbody></table></div>`;

  let extra = '';
  if (s.rowMins) extra = `<div class="result-row mt-8">${s.rowMins.map((m, i) => `<span class="stat-chip blue">Row ${i + 1} min: ${m}</span>`).join('')}</div>`;
  if (s.colMins) extra = `<div class="result-row mt-8">${s.colMins.map((m, j) => `<span class="stat-chip blue">Col ${j + 1} min: ${m}</span>`).join('')}</div>`;
  if (s.minUncov !== undefined) extra += `<div class="mt-8"><span class="stat-chip yellow">Min uncovered: ${s.minUncov}</span></div>`;

  return `
    <div class="step-card">
      <div class="step-header"><div class="step-number">${stepNum}</div><div class="step-title">${s.title}</div></div>
      <div class="step-body">
        <div class="step-explanation">${s.exp}</div>
        ${tableHTML}${extra}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRANSPORTATION SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function buildTransportInputUI(prefix, title, subtitle, solverFn, exampleFn) {
  const el = $(`page-${prefix}`);
  el.innerHTML = `
    <div class="page-header">
      <div class="breadcrumb">🏠 Home <span>›</span> Transportation Problem</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
    <div class="grid-2" style="gap:24px">
      <div class="card">
        <div class="card-title">Matrix Configuration</div>
        <div class="input-row">
          <div class="form-group"><label class="form-label">Rows (Sources)</label>
            <select class="form-select" id="${prefix}-rows">
              <option value="2">2</option><option value="3" selected>3</option>
              <option value="4">4</option><option value="5">5</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Columns (Destinations)</label>
            <select class="form-select" id="${prefix}-cols">
              <option value="2">2</option><option value="3">3</option>
              <option value="4" selected>4</option><option value="5">5</option>
            </select>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-outline btn-sm" onclick="${prefix}GenMatrix()">Generate Matrix</button>
          <button class="btn btn-secondary btn-sm" onclick="${prefix}LoadExample()">Load Example</button>
        </div>
        <div id="${prefix}-matrix-container" class="mt-16"></div>
        <div class="btn-group mt-16" id="${prefix}-solve-btns" style="display:none">
          <button class="btn btn-primary" onclick="${solverFn}()" data-tippy-content="Solve the matrix step-by-step">▶ Solve Step-by-Step</button>
          <button class="btn btn-secondary btn-sm" onclick="${prefix}Reset()">Reset</button>
        </div>
      </div>
      <div class="card" id="${prefix}-guide"></div>
    </div>
    <div id="${prefix}-steps" class="steps-container"></div>
    <div id="${prefix}-result"></div>
  `;
  window[exampleFn]();
}

function transportRenderInput(prefix, costs, supply, demand) {
  const m = costs.length, n = costs[0].length;
  const srcLabels = Array.from({ length: m }, (_, i) => `S${i + 1}`);
  const dstLabels = Array.from({ length: n }, (_, j) => `D${j + 1}`);
  let html = `<div class="matrix-container"><table class="matrix-table"><thead>
    <tr><th>Cost</th>${dstLabels.map(d => `<th>${d}</th>`).join('')}<th style="color:var(--accent2)">Supply</th></tr>
  </thead><tbody>`;
  for (let i = 0; i < m; i++) {
    html += `<tr><th>${srcLabels[i]}</th>`;
    for (let j = 0; j < n; j++) {
      html += `<td><input class="cell-input" id="${prefix}c-${i}-${j}" type="number" value="${costs[i][j]}" min="0" max="999" /></td>`;
    }
    html += `<td class="supply-col"><input class="cell-input" id="${prefix}s-${i}" type="number" value="${supply[i]}" min="1" max="999" style="color:var(--accent2)" /></td></tr>`;
  }
  html += `<tr class="demand-row"><th style="color:var(--pink)">Demand</th>`;
  for (let j = 0; j < n; j++) {
    html += `<td><input class="cell-input" id="${prefix}d-${j}" type="number" value="${demand[j]}" min="1" max="999" style="color:var(--pink)" /></td>`;
  }
  html += `<td></td></tr></tbody></table></div>`;
  $(`${prefix}-matrix-container`).innerHTML = html;
  $(`${prefix}-solve-btns`).style.display = 'flex';
  $(`${prefix}-steps`).innerHTML = '';
  $(`${prefix}-result`).innerHTML = '';
}

function transportReadInputs(prefix) {
  const rows = parseInt($(`${prefix}-rows`).value);
  const cols = parseInt($(`${prefix}-cols`).value);
  const costs = makeMatrix(rows, cols);
  const supply = Array(rows).fill(0);
  const demand = Array(cols).fill(0);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    costs[i][j] = +($(`${prefix}c-${i}-${j}`)?.value ?? 0);
  }
  for (let i = 0; i < rows; i++) supply[i] = +($(`${prefix}s-${i}`)?.value ?? 0);
  for (let j = 0; j < cols; j++) demand[j] = +($(`${prefix}d-${j}`)?.value ?? 0);
  // Balance
  const ts = supply.reduce((a, b) => a + b, 0);
  const td = demand.reduce((a, b) => a + b, 0);
  if (ts !== td) {
    let msg = '';
    if (ts > td) {
      msg = `⚠️ Unbalanced problem: Total Supply (${ts}) > Total Demand (${td}). Added a Dummy Destination (D${cols + 1}) with 0 cost to balance.`;
      demand.push(ts - td);
      costs.forEach(r => r.push(0));
    } else {
      msg = `⚠️ Unbalanced problem: Total Supply (${ts}) < Total Demand (${td}). Added a Dummy Source (S${rows + 1}) with 0 cost to balance.`;
      supply.push(td - ts);
      costs.push(Array(costs[0].length).fill(0));
    }
    showToast(msg, 'warning');
  }
  return { costs, supply, demand };
}

function transportRenderAllocation(prefix, alloc, costs, supply, demand, method, stepList) {
  const m = alloc.length, n = alloc[0].length;
  const srcLabels = Array.from({ length: m }, (_, i) => `S${i + 1}`);
  const dstLabels = Array.from({ length: n }, (_, j) => `D${j + 1}`);

  // Render steps
  const stepsEl = $(`${prefix}-steps`);
  stepsEl.innerHTML = '';
  stepList.forEach((s, i) => {
    stepsEl.innerHTML += `
      <div class="step-card">
        <div class="step-header"><div class="step-number">${i + 1}</div><div class="step-title">${s.title}</div></div>
        <div class="step-body">
          <div class="step-explanation">${s.exp}</div>
          ${transportRenderTable(prefix, s.alloc, costs, srcLabels, dstLabels, s.highlighted, s.supply, s.demand)}
        </div>
      </div>`;
  });
  animateSteps(`#${prefix}-steps`);

  // Total cost
  let total = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) total += alloc[i][j] * costs[i][j];

  // Result
  const assignments = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
    if (alloc[i][j] > 0) assignments.push({ src: srcLabels[i], dst: dstLabels[j], qty: alloc[i][j], cost: costs[i][j] });
  }

  $(`${prefix}-result`).innerHTML = `
    <div class="result-card">
      <div class="result-title">✅ ${method} – Initial BFS Found</div>
      <div class="result-value">Total Transportation Cost = <span id="${prefix}-cost-display">${total}</span></div>
      <div class="separator" style="margin:16px 0"></div>
      <div style="font-size:0.8rem;font-weight:600;color:var(--text3);margin-bottom:12px">ALLOCATION DETAILS</div>
      <div class="matrix-container">
        <table class="matrix-table">
          <thead><tr><th>From</th><th>To</th><th>Units</th><th>Unit Cost</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${assignments.map(a => `
              <tr>
                <td>${a.src}</td><td>${a.dst}</td>
                <td class="text-accent fw-700">${a.qty}</td>
                <td>${a.cost}</td>
                <td class="text-success fw-700">${a.qty * a.cost}</td>
              </tr>`).join('')}
            <tr style="border-top:2px solid var(--border2)">
              <td colspan="4" style="text-align:right;font-weight:700;color:var(--text)">Total Cost</td>
              <td class="text-success fw-700">${total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:20px">
        <div style="font-size:0.75rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Cost Breakdown by Route</div>
        <div style="height:150px"><canvas id="${prefix}-cost-chart"></canvas></div>
      </div>
    </div>`;
  animateResult(`#${prefix}-result .result-card`);
  showToast(`✅ ${method} complete — Total cost: ${total}`);
  setTimeout(() => {
    const chartLabels = assignments.map(a => `${a.src}→${a.dst}`);
    const chartData   = assignments.map(a => a.qty * a.cost);
    const chartColors = colorsFor(assignments.length);
    renderCostChart(`${prefix}-cost-chart`, chartLabels, chartData, chartColors);
  }, 50);
}

function transportRenderTable(prefix, alloc, costs, srcLabels, dstLabels, highlighted, supply, demand) {
  const m = alloc.length, n = alloc[0].length;
  let html = `<div class="matrix-container"><table class="matrix-table"><thead>
    <tr><th></th>${dstLabels.map(d => `<th>${d}</th>`).join('')}<th style="color:var(--accent2)">Supply</th></tr>
  </thead><tbody>`;
  for (let i = 0; i < m; i++) {
    html += `<tr><th>${srcLabels[i]}</th>`;
    for (let j = 0; j < n; j++) {
      const isHL = highlighted && highlighted.r === i && highlighted.c === j;
      const isCrossed = alloc[i][j] === 0 && (
        (supply && supply[i] === 0) || 
        (demand && demand[j] === 0)
      );
      let cls = '';
      if (isHL) cls = 'selected-cell';
      else if (alloc[i][j] > 0) cls = 'allocated-cell';
      else if (isCrossed) cls = 'crossed-cell';
      
      html += `<td class="${cls}">`;
      if (alloc[i][j] > 0) {
        html += `<span style="display:block;font-size:0.65rem;color:var(--text3)">${costs[i][j]}</span><strong>${alloc[i][j]}</strong>`;
      } else if (isCrossed) {
        html += `<span style="color:var(--text3);font-weight:700;font-size:0.95rem">✕</span>`;
      } else {
        html += `<span style="color:var(--text3)">${costs[i][j]}</span>`;
      }
      html += `</td>`;
    }
    const sup = supply ? supply[i] : '—';
    html += `<td style="color:var(--accent2);font-weight:700">${sup}</td></tr>`;
  }
  html += `<tr><th style="color:var(--pink)">Demand</th>`;
  for (let j = 0; j < n; j++) {
    const dem = demand ? demand[j] : '—';
    html += `<td style="color:var(--pink);font-weight:700">${dem}</td>`;
  }
  html += `<td></td></tr></tbody></table></div>`;
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. NORTHWEST CORNER RULE
// ─────────────────────────────────────────────────────────────────────────────
let nwcrData = null;

function buildNWCR() {
  buildTransportInputUI('nwcr', 'NW Corner Rule', 'Finds an initial basic feasible solution (BFS) by starting at the top-left corner and allocating as much as possible before moving right or down.', 'nwcrSolve', 'nwcrLoadExample');
  $('nwcr-guide').innerHTML = `
    <div class="card-title">Algorithm Guide</div>
    <div style="font-size:0.83rem;color:var(--text2);line-height:1.8;display:flex;flex-direction:column;gap:10px">
      ${['Start at cell (S1, D1) – the NW corner','Allocate as much as possible (min of supply & demand)','Cross out the exhausted row or column','Move right if supply exhausted; move down if demand exhausted','Repeat until all supply and demand are satisfied'].map((s,i)=>`
        <div style="display:flex;gap:10px"><div style="min-width:24px;height:24px;border-radius:50%;background:rgba(6,182,212,0.2);color:var(--accent2);font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center">${i+1}</div><span>${s}</span></div>`).join('')}
    </div>
    <div class="alert alert-info mt-16"><span>⚡ NWCR gives a quick but not necessarily optimal initial BFS. It ignores cost values entirely.</span></div>`;
}

function nwcrGenMatrix() {
  const m = +$('nwcr-rows').value, n = +$('nwcr-cols').value;
  const costs = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 20) + 1));
  const supply = Array.from({ length: m }, () => Math.floor(Math.random() * 40) + 20);
  const tot = supply.reduce((a, b) => a + b, 0);
  const demand = Array.from({ length: n - 1 }, () => Math.floor(tot / n));
  demand.push(tot - demand.reduce((a, b) => a + b, 0));
  nwcrData = { costs, supply, demand };
  transportRenderInput('nwcr', costs, supply, demand);
}

function nwcrLoadExample() {
  nwcrData = {
    costs: [[2,3,1,5],[7,3,4,6],[8,5,2,3]],
    supply: [120, 80, 80],
    demand: [150, 70, 60, 0] // balanced
  };
  // balance
  const ts = 280, td = 280;
  $('nwcr-rows').value = '3'; $('nwcr-cols').value = '4';
  transportRenderInput('nwcr', nwcrData.costs, nwcrData.supply, nwcrData.demand);
}

function nwcrReset() { $('nwcr-steps').innerHTML = ''; $('nwcr-result').innerHTML = ''; }

function nwcrSolve() {
  const { costs, supply, demand } = transportReadInputs('nwcr');
  const m = supply.length, n = demand.length;
  const alloc = makeMatrix(m, n);
  let sup = [...supply], dem = [...demand];
  let i = 0, j = 0;
  const steps = [];
  const srcLabels = Array.from({ length: m }, (_, k) => `S${k + 1}`);
  const dstLabels = Array.from({ length: n }, (_, k) => `D${k + 1}`);

  while (i < m && j < n) {
    const qty = Math.min(sup[i], dem[j]);
    alloc[i][j] = qty;
    sup[i] -= qty; dem[j] -= qty;
    steps.push({
      title: `Allocate to (${srcLabels[i]}, ${dstLabels[j]})`,
      exp: `min(Supply[${srcLabels[i]}]=${sup[i]+qty}, Demand[${dstLabels[j]}]=${dem[j]+qty}) = <strong>${qty}</strong>. Allocate ${qty} units. Remaining supply: ${sup[i]}, demand: ${dem[j]}.`,
      alloc: cloneMatrix(alloc), highlighted: { r: i, c: j },
      supply: [...sup], demand: [...dem]
    });
    if (sup[i] === 0) i++;
    if (dem[j] === 0) j++;
  }

  transportRenderAllocation('nwcr', alloc, costs, supply, demand, 'Northwest Corner Rule', steps);
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. LEAST COST CELL (LCC)
// ─────────────────────────────────────────────────────────────────────────────
function buildLCC() {
  buildTransportInputUI('lcc', 'Least Cost Cell Method', 'Finds an initial BFS by always allocating to the cell with the lowest cost first. Produces a better initial solution than NWCR.', 'lccSolve', 'lccLoadExample');
  $('lcc-guide').innerHTML = `
    <div class="card-title">Algorithm Guide</div>
    <div style="font-size:0.83rem;color:var(--text2);line-height:1.8;display:flex;flex-direction:column;gap:10px">
      ${['Find the cell with the minimum cost in the entire matrix','Allocate as much as possible to that cell','Eliminate the exhausted row or column','If tied, choose the one that allows larger allocation','Repeat until all supply and demand are met'].map((s,i)=>`
        <div style="display:flex;gap:10px"><div style="min-width:24px;height:24px;border-radius:50%;background:rgba(16,185,129,0.2);color:var(--success);font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center">${i+1}</div><span>${s}</span></div>`).join('')}
    </div>
    <div class="alert alert-success mt-16"><span>💡 LCC gives a better initial BFS than NWCR by considering costs, but may not be optimal.</span></div>`;
}

function lccGenMatrix() {
  const m = +$('lcc-rows').value, n = +$('lcc-cols').value;
  const costs = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 20) + 1));
  const supply = Array.from({ length: m }, () => Math.floor(Math.random() * 40) + 20);
  const tot = supply.reduce((a, b) => a + b, 0);
  const demand = Array.from({ length: n - 1 }, () => Math.floor(tot / n));
  demand.push(tot - demand.reduce((a, b) => a + b, 0));
  transportRenderInput('lcc', costs, supply, demand);
}

function lccLoadExample() {
  $('lcc-rows').value = '3'; $('lcc-cols').value = '4';
  transportRenderInput('lcc',
    [[2,3,1,5],[7,3,4,6],[8,5,2,3]],
    [120, 80, 80],
    [150, 70, 60, 0]
  );
}

function lccReset() { $('lcc-steps').innerHTML = ''; $('lcc-result').innerHTML = ''; }

function lccSolve() {
  const { costs, supply, demand } = transportReadInputs('lcc');
  const m = supply.length, n = demand.length;
  const alloc = makeMatrix(m, n);
  let sup = [...supply], dem = [...demand];
  const elim = { rows: Array(m).fill(false), cols: Array(n).fill(false) };
  const steps = [];
  const srcLabels = Array.from({ length: m }, (_, k) => `S${k + 1}`);
  const dstLabels = Array.from({ length: n }, (_, k) => `D${k + 1}`);
  let stepNum = 1;

  while (true) {
    let minCost = Infinity, br = -1, bc = -1;
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
      if (!elim.rows[i] && !elim.cols[j] && costs[i][j] < minCost) {
        minCost = costs[i][j]; br = i; bc = j;
      }
    }
    if (br === -1) break;
    const qty = Math.min(sup[br], dem[bc]);
    alloc[br][bc] += qty;
    sup[br] -= qty; dem[bc] -= qty;
    let note = '';
    if (sup[br] === 0) { elim.rows[br] = true; note += ` Row ${srcLabels[br]} exhausted.`; }
    if (dem[bc] === 0) { elim.cols[bc] = true; note += ` Column ${dstLabels[bc]} exhausted.`; }
    steps.push({
      title: `Step ${stepNum} – Allocate to (${srcLabels[br]}, ${dstLabels[bc]}) [Cost = ${minCost}]`,
      exp: `Minimum cost cell is (${srcLabels[br]}, ${dstLabels[bc]}) with cost <strong>${minCost}</strong>. Allocate min(${sup[br]+qty}, ${dem[bc]+qty}) = <strong>${qty}</strong>.${note}`,
      alloc: cloneMatrix(alloc), highlighted: { r: br, c: bc },
      supply: [...sup], demand: [...dem]
    });
    stepNum++;
    if (elim.rows.every(Boolean) || elim.cols.every(Boolean)) break;
  }

  transportRenderAllocation('lcc', alloc, costs, supply, demand, 'Least Cost Cell Method', steps);
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. VOGEL'S APPROXIMATION METHOD (VAM)
// ─────────────────────────────────────────────────────────────────────────────
function buildVAM() {
  buildTransportInputUI('vam', "Vogel's Approximation Method", "Penalty-based method that finds a near-optimal BFS by computing opportunity costs (difference between two lowest costs) for each row and column.", 'vamSolve', 'vamLoadExample');
  $('vam-guide').innerHTML = `
    <div class="card-title">Algorithm Guide</div>
    <div style="font-size:0.83rem;color:var(--text2);line-height:1.8;display:flex;flex-direction:column;gap:10px">
      ${['Compute row penalty = 2nd min − min cost for each active row','Compute column penalty = 2nd min − min cost for each active column','Select row/column with highest penalty','Allocate to the minimum cost cell in that row/column','Cross out exhausted row/column and repeat'].map((s,i)=>`
        <div style="display:flex;gap:10px"><div style="min-width:24px;height:24px;border-radius:50%;background:rgba(245,158,11,0.2);color:var(--warning);font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center">${i+1}</div><span>${s}</span></div>`).join('')}
    </div>
    <div class="alert alert-warning mt-16"><span>🏆 VAM typically gives results very close to the optimal solution, often matching MODI/stepping-stone results.</span></div>`;
}

function vamGenMatrix() {
  const m = +$('vam-rows').value, n = +$('vam-cols').value;
  const costs = Array.from({ length: m }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 20) + 1));
  const supply = Array.from({ length: m }, () => Math.floor(Math.random() * 40) + 20);
  const tot = supply.reduce((a, b) => a + b, 0);
  const demand = Array.from({ length: n - 1 }, () => Math.floor(tot / n));
  demand.push(tot - demand.reduce((a, b) => a + b, 0));
  transportRenderInput('vam', costs, supply, demand);
}

function vamLoadExample() {
  $('vam-rows').value = '3'; $('vam-cols').value = '4';
  transportRenderInput('vam',
    [[2,3,1,5],[7,3,4,6],[8,5,2,3]],
    [120, 80, 80],
    [150, 70, 60, 0]
  );
}

function vamReset() { $('vam-steps').innerHTML = ''; $('vam-result').innerHTML = ''; }

function vamPenalty(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted.length < 2 ? 0 : sorted[1] - sorted[0];
}

function vamSolve() {
  const { costs, supply, demand } = transportReadInputs('vam');
  const m = supply.length, n = demand.length;
  const alloc = makeMatrix(m, n);
  let sup = [...supply], dem = [...demand];
  const elimRows = Array(m).fill(false);
  const elimCols = Array(n).fill(false);
  const steps = [];
  const srcLabels = Array.from({ length: m }, (_, k) => `S${k + 1}`);
  const dstLabels = Array.from({ length: n }, (_, k) => `D${k + 1}`);
  let stepNum = 1;

  while (true) {
    const activeRows = Array.from({ length: m }, (_, i) => i).filter(i => !elimRows[i]);
    const activeCols = Array.from({ length: n }, (_, j) => j).filter(j => !elimCols[j]);
    if (!activeRows.length || !activeCols.length) break;

    // Compute row penalties
    const rowPenalties = Array(m).fill(-1);
    const rowCalcLogs = [];
    for (const i of activeRows) {
      const vals = activeCols.map(j => costs[i][j]);
      rowPenalties[i] = vamPenalty(vals);
      const sorted = [...vals].sort((a, b) => a - b);
      if (sorted.length >= 2) {
        rowCalcLogs.push(`Row ${srcLabels[i]}: Costs = [${vals.join(', ')}] ➔ Smallest=${sorted[0]}, 2nd smallest=${sorted[1]} ➔ Penalty = ${sorted[1]} - ${sorted[0]} = <strong>${rowPenalties[i]}</strong>`);
      } else if (sorted.length === 1) {
        rowCalcLogs.push(`Row ${srcLabels[i]}: Cost = [${vals[0]}] ➔ Only 1 cost left ➔ Penalty = <strong>0</strong>`);
      }
    }

    // Compute col penalties
    const colPenalties = Array(n).fill(-1);
    const colCalcLogs = [];
    for (const j of activeCols) {
      const vals = activeRows.map(i => costs[i][j]);
      colPenalties[j] = vamPenalty(vals);
      const sorted = [...vals].sort((a, b) => a - b);
      if (sorted.length >= 2) {
        colCalcLogs.push(`Col ${dstLabels[j]}: Costs = [${vals.join(', ')}] ➔ Smallest=${sorted[0]}, 2nd smallest=${sorted[1]} ➔ Penalty = ${sorted[1]} - ${sorted[0]} = <strong>${colPenalties[j]}</strong>`);
      } else if (sorted.length === 1) {
        colCalcLogs.push(`Col ${dstLabels[j]}: Cost = [${vals[0]}] ➔ Only 1 cost left ➔ Penalty = <strong>0</strong>`);
      }
    }

    // Find max penalty
    let maxPen = -1, isRow = true, penIdx = -1;
    for (const i of activeRows) if (rowPenalties[i] > maxPen) { maxPen = rowPenalties[i]; penIdx = i; isRow = true; }
    for (const j of activeCols) if (colPenalties[j] > maxPen) { maxPen = colPenalties[j]; penIdx = j; isRow = false; }

    // Find min cost cell in selected row/col
    let minCost = Infinity, br = -1, bc = -1;
    if (isRow) {
      for (const j of activeCols) if (costs[penIdx][j] < minCost) { minCost = costs[penIdx][j]; br = penIdx; bc = j; }
    } else {
      for (const i of activeRows) if (costs[i][penIdx] < minCost) { minCost = costs[i][penIdx]; br = i; bc = penIdx; }
    }

    const qty = Math.min(sup[br], dem[bc]);
    alloc[br][bc] += qty;
    sup[br] -= qty; dem[bc] -= qty;
    let note = '';
    if (sup[br] === 0) { elimRows[br] = true; note += ` Row ${srcLabels[br]} exhausted.`; }
    if (dem[bc] === 0) { elimCols[bc] = true; note += ` Col ${dstLabels[bc]} exhausted.`; }

    const penLabel = isRow ? `Row ${srcLabels[penIdx]} (penalty=${maxPen})` : `Column ${dstLabels[penIdx]} (penalty=${maxPen})`;
    
    // Detailed penalty calculation log block
    const penaltyDetailsHtml = `
      <div style="margin-top: 14px; padding: 12px 16px; background: var(--bg2); border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.8rem;">
        <div style="font-weight: 700; color: var(--primary2); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-family:'Plus Jakarta Sans',sans-serif">Penalty Calculations for active lines:</div>
        <div style="margin-bottom: 8px;">
          <strong style="color: var(--secondary); font-family:'Plus Jakarta Sans',sans-serif">Row Penalties:</strong>
          <ul style="margin-left: 18px; list-style-type: disc; margin-top: 4px; color: var(--text2)">
            ${rowCalcLogs.map(log => `<li style="margin-bottom: 3px;">${log}</li>`).join('')}
          </ul>
        </div>
        <div>
          <strong style="color: var(--secondary); font-family:'Plus Jakarta Sans',sans-serif">Column Penalties:</strong>
          <ul style="margin-left: 18px; list-style-type: disc; margin-top: 4px; color: var(--text2)">
            ${colCalcLogs.map(log => `<li style="margin-bottom: 3px;">${log}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    steps.push({
      title: `Step ${stepNum} – ${penLabel} → Allocate to (${srcLabels[br]}, ${dstLabels[bc]})`,
      exp: `Highest penalty: <strong>${penLabel}</strong>. Min cost in that ${isRow?'row':'column'} = <strong>${minCost}</strong> at (${srcLabels[br]}, ${dstLabels[bc]}). Allocate <strong>${qty}</strong> units.${note}${penaltyDetailsHtml}`,
      alloc: cloneMatrix(alloc), highlighted: { r: br, c: bc },
      supply: [...sup], demand: [...dem]
    });
    stepNum++;
  }

  transportRenderAllocation('vam', alloc, costs, supply, demand, "Vogel's Approximation Method", steps);
}

// ─────────────────────────────────────────────────────────────────────────────
//  5. SEQUENCING PROBLEM (JOHNSON'S ALGORITHM)
// ─────────────────────────────────────────────────────────────────────────────
function buildSequencing() {
  const el = $('page-sequencing');
  el.innerHTML = `
    <div class="page-header">
      <div class="breadcrumb">🏠 Home <span>›</span> Sequencing Problem</div>
      <h1>Johnson's Algorithm</h1>
      <p>Finds the optimal sequence of <em>n</em> jobs on 2 machines to minimise total makespan (completion time). Produces a Gantt chart.</p>
    </div>
    <div class="grid-2" style="gap:24px">
      <div class="card">
        <div class="card-title">Job Configuration</div>
        <div class="input-row">
          <div class="form-group">
            <label class="form-label">Number of Jobs</label>
            <select class="form-select" id="seq-jobs">
              <option value="4">4 Jobs</option>
              <option value="5" selected>5 Jobs</option>
              <option value="6">6 Jobs</option>
              <option value="7">7 Jobs</option>
              <option value="8">8 Jobs</option>
            </select>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-outline btn-sm" onclick="seqGenJobs()">Generate Jobs</button>
          <button class="btn btn-secondary btn-sm" onclick="seqLoadExample()">Load Example</button>
        </div>
        <div id="seq-jobs-table" class="mt-16"></div>
        <div class="btn-group mt-16" id="seq-solve-btns" style="display:none">
          <button class="btn btn-primary" onclick="seqSolve()">▶ Solve Step-by-Step</button>
          <button class="btn btn-secondary btn-sm" onclick="seqReset()">Reset</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">Johnson's Rule Guide</div>
        <div style="font-size:0.83rem;color:var(--text2);line-height:1.8;display:flex;flex-direction:column;gap:10px">
          ${['List all jobs with processing time on Machine 1 and Machine 2','Find the job with the smallest processing time (any machine)','If smallest is on M1 → schedule job first; if M2 → schedule last','Remove that job from the list and repeat','Build Gantt chart from the final sequence'].map((s,i)=>`
            <div style="display:flex;gap:10px"><div style="min-width:24px;height:24px;border-radius:50%;background:rgba(236,72,153,0.2);color:var(--pink);font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center">${i+1}</div><span>${s}</span></div>`).join('')}
        </div>
        <div class="alert alert-info mt-16"><span>🎯 Johnson's Algorithm guarantees the minimum makespan for n-job 2-machine scheduling.</span></div>
      </div>
    </div>
    <div id="seq-steps" class="steps-container"></div>
    <div id="seq-result"></div>
    <div id="seq-gantt"></div>
  `;
  seqLoadExample();
}

function seqRenderJobsTable(jobs) {
  let html = `<div class="matrix-container"><table class="matrix-table">
    <thead><tr><th>Job</th><th>Machine 1 (t₁)</th><th>Machine 2 (t₂)</th></tr></thead><tbody>`;
  jobs.forEach((job, i) => {
    html += `<tr>
      <td style="font-weight:700;color:var(--primary2)">J${i + 1}</td>
      <td><input class="cell-input" id="seq-m1-${i}" type="number" value="${job.m1}" min="1" max="99" style="width:70px" /></td>
      <td><input class="cell-input" id="seq-m2-${i}" type="number" value="${job.m2}" min="1" max="99" style="width:70px" /></td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  $('seq-jobs-table').innerHTML = html;
  $('seq-solve-btns').style.display = 'flex';
  $('seq-steps').innerHTML = '';
  $('seq-result').innerHTML = '';
  $('seq-gantt').innerHTML = '';
}

let seqJobs = [];

function seqGenJobs() {
  const n = +$('seq-jobs').value;
  seqJobs = Array.from({ length: n }, () => ({ m1: Math.floor(Math.random() * 12) + 1, m2: Math.floor(Math.random() * 12) + 1 }));
  seqRenderJobsTable(seqJobs);
}

function seqLoadExample() {
  seqJobs = [
    { m1: 5, m2: 2 },
    { m1: 1, m2: 6 },
    { m1: 9, m2: 7 },
    { m1: 3, m2: 8 },
    { m1: 10, m2: 4 }
  ];
  $('seq-jobs').value = '5';
  seqRenderJobsTable(seqJobs);
}

function seqReset() { $('seq-steps').innerHTML = ''; $('seq-result').innerHTML = ''; $('seq-gantt').innerHTML = ''; }

function seqReadJobs() {
  const n = seqJobs.length;
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    m1: +($(`seq-m1-${i}`)?.value ?? seqJobs[i].m1),
    m2: +($(`seq-m2-${i}`)?.value ?? seqJobs[i].m2)
  }));
}

function seqSolve() {
  const jobs = seqReadJobs();
  const n = jobs.length;
  const steps = [];
  let remaining = jobs.map(j => ({ ...j }));
  const front = [], back = [];
  let stepNum = 1;

  while (remaining.length > 0) {
    let minVal = Infinity, minJob = null, onM1 = true;
    for (const job of remaining) {
      if (job.m1 < minVal) { minVal = job.m1; minJob = job; onM1 = true; }
      if (job.m2 < minVal) { minVal = job.m2; minJob = job; onM1 = false; }
    }
    const placement = onM1 ? 'first (M1 is smallest)' : 'last (M2 is smallest)';
    steps.push({
      title: `Step ${stepNum} – Select Job J${minJob.id}`,
      exp: `Minimum processing time = <strong>${minVal}</strong> on Machine <strong>${onM1 ? '1' : '2'}</strong>. Job J${minJob.id} scheduled <strong>${placement}</strong>.`,
      job: minJob, onM1, remaining: remaining.map(j => ({ ...j })),
      front: [...front, ...(onM1 ? [minJob] : [])].map(j => j.id),
      back: [...(onM1 ? [] : [minJob]), ...back].map(j => j.id)
    });
    if (onM1) front.push(minJob); else back.unshift(minJob);
    remaining = remaining.filter(j => j.id !== minJob.id);
    stepNum++;
  }

  const sequence = [...front, ...back];

  // Render steps
  const stepsEl = $('seq-steps');
  stepsEl.innerHTML = '';
  steps.forEach((s, i) => {
    stepsEl.innerHTML += `
      <div class="step-card">
        <div class="step-header"><div class="step-number">${i + 1}</div><div class="step-title">${s.title}</div></div>
        <div class="step-body">
          <div class="step-explanation">${s.exp}</div>
          <div class="flex-center gap-8 mt-8 flex-wrap">
            <span class="stat-chip blue">Remaining Jobs: ${s.remaining.map(j => `J${j.id}`).join(', ')}</span>
            <span class="stat-chip green">Front: [${s.front.map(id=>`J${id}`).join(' → ')}]</span>
            <span class="stat-chip yellow">Back: [${s.back.map(id=>`J${id}`).join(' → ')}]</span>
          </div>
        </div>
      </div>`;
  });
  animateSteps('#seq-steps');

  // Compute Gantt timeline
  const timeline = computeGantt(sequence, jobs);
  const makespan = timeline.m2[timeline.m2.length - 1].end;

  // Result
  $('seq-result').innerHTML = `
    <div class="result-card">
      <div class="result-title">✅ Optimal Sequence Found (Johnson's Algorithm)</div>
      <div class="result-value">Makespan = <span id="seq-makespan-display">${makespan}</span> units</div>
      <div class="result-detail" style="margin-top:8px">
        Optimal Sequence: <strong class="font-mono" style="color:var(--primary2)">${sequence.map(j => `J${j.id}`).join(' → ')}</strong>
      </div>
      <div class="separator" style="margin:16px 0"></div>
      <div class="matrix-container">
        <table class="matrix-table">
          <thead><tr><th>Job</th><th>M1 Start</th><th>M1 End</th><th>M2 Start</th><th>M2 End</th></tr></thead>
          <tbody>
            ${sequence.map((job, k) => `<tr>
              <td style="color:var(--primary2);font-weight:700">J${job.id}</td>
              <td>${timeline.m1[k].start}</td>
              <td class="text-accent">${timeline.m1[k].end}</td>
              <td>${timeline.m2[k].start}</td>
              <td class="text-success fw-700">${timeline.m2[k].end}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  animateResult('#seq-result .result-card');
  showToast(`✅ Johnson's Algorithm complete — Makespan: ${makespan} units`);
  setTimeout(() => animateCount('seq-makespan-display', makespan), 50);

  // Gantt chart
  renderGantt(sequence, timeline, makespan);
}

function computeGantt(sequence, jobs) {
  const m1 = [], m2 = [];
  let m1End = 0, m2End = 0;
  for (const job of sequence) {
    const start1 = m1End;
    const end1 = start1 + job.m1;
    const start2 = Math.max(end1, m2End);
    const end2 = start2 + job.m2;
    m1.push({ start: start1, end: end1 });
    m2.push({ start: start2, end: end2 });
    m1End = end1;
    m2End = end2;
  }
  return { m1, m2 };
}

function renderGantt(sequence, timeline, makespan) {
  const colors = colorsFor(sequence.length);
  const scale = 600 / makespan;

  let m1Bars = '', m2Bars = '';
  sequence.forEach((job, k) => {
    const c = colors[k];
    const m1 = timeline.m1[k];
    const m2 = timeline.m2[k];
    const w1 = (m1.end - m1.start) * scale;
    const x1 = m1.start * scale;
    const w2 = (m2.end - m2.start) * scale;
    const x2 = m2.start * scale;
    m1Bars += `<div class="gantt-bar" style="left:${x1}px;width:${w1}px;background:${c};opacity:0.9">J${job.id}</div>`;
    m2Bars += `<div class="gantt-bar" style="left:${x2}px;width:${w2}px;background:${c};opacity:0.9">J${job.id}</div>`;
  });

  // Tick marks
  const tickInterval = makespan <= 30 ? 5 : makespan <= 60 ? 10 : 20;
  let ticks = '';
  for (let t = 0; t <= makespan; t += tickInterval) {
    ticks += `<div class="gantt-tick" style="position:absolute;left:${t*scale}px">${t}</div>`;
  }

  $('seq-gantt').innerHTML = `
    <div class="card mt-24">
      <div class="card-title">📊 Gantt Chart (Makespan = ${makespan})</div>
      <div class="gantt-container">
        <div style="min-width:660px">
          <div class="gantt-row">
            <div class="gantt-label">Machine 1</div>
            <div class="gantt-bar-container" style="position:relative;height:40px;width:${makespan*scale}px;min-width:600px">${m1Bars}</div>
          </div>
          <div class="gantt-row" style="margin-top:8px">
            <div class="gantt-label">Machine 2</div>
            <div class="gantt-bar-container" style="position:relative;height:40px;width:${makespan*scale}px;min-width:600px">${m2Bars}</div>
          </div>
          <div class="gantt-row" style="margin-top:4px">
            <div class="gantt-label"></div>
            <div style="position:relative;height:20px;width:${makespan*scale}px;min-width:600px">${ticks}</div>
          </div>
        </div>
      </div>
      <div class="flex-center gap-8 flex-wrap mt-16">
        ${sequence.map((job, k) => `<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem"><span style="width:12px;height:12px;border-radius:3px;background:${colors[k]};display:inline-block"></span>J${job.id} (M1:${job.m1}, M2:${job.m2})</span>`).join('')}
      </div>
    </div>`;
}

// ─── INITIALIZE ──────────────────────────────────────────────────────────────
function init() {
  buildHome();
  buildHungarian();
  buildNWCR();
  buildLCC();
  buildVAM();
  buildSequencing();
  navigate('home');
  initLenis();
  initTooltips();
}

document.addEventListener('DOMContentLoaded', init);
