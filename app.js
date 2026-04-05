/* ── App.js – Up the River Score Tracker ── */

// ── State ────────────────────────────────────────────────────────────────────

let state = {
  players: [],        // [{name}]
  maxCards: 10,
  hands: [],          // [10,9,…,1,2,…,10]
  currentHandIndex: 0,
  phase: 'predicting',  // 'predicting' | 'tricks'
  predictions: [],    // per player, current hand
  handHistory: [],    // [{cardCount, predictions, tricks, scores}]
};

// ── Setup ─────────────────────────────────────────────────────────────────────

let playerCount = 2;

function initSetup() {
  renderPlayerNames();
  updateRemoveBtn();
}

function renderPlayerNames() {
  const list = document.getElementById('player-name-list');
  const existing = list.querySelectorAll('input[type=text]');
  const values = Array.from(existing).map(i => i.value);

  list.innerHTML = '';
  for (let i = 0; i < playerCount; i++) {
    const row = document.createElement('div');
    row.className = 'player-name-row';
    row.innerHTML = `
      <label for="pname-${i}">Player ${i + 1}</label>
      <input type="text" id="pname-${i}" placeholder="Player ${i + 1}"
             maxlength="20" autocomplete="off" />`;
    list.appendChild(row);
    const input = row.querySelector('input');
    if (values[i] !== undefined) input.value = values[i];
  }
}

function addPlayer() {
  if (playerCount >= 10) return;
  playerCount++;
  document.getElementById('player-count-display').textContent = playerCount;
  renderPlayerNames();
  updateRemoveBtn();
}

function removePlayer() {
  if (playerCount <= 2) return;
  playerCount--;
  document.getElementById('player-count-display').textContent = playerCount;
  renderPlayerNames();
  updateRemoveBtn();
}

function updateRemoveBtn() {
  document.getElementById('remove-player-btn').disabled = playerCount <= 2;
}

// ── Game Init ─────────────────────────────────────────────────────────────────

function generateHands(maxCards) {
  const down = [];
  for (let i = maxCards; i >= 1; i--) down.push(i);
  const up = [];
  for (let i = 2; i <= maxCards; i++) up.push(i);
  return [...down, ...up];
}

function startGame() {
  const maxCardsInput = document.getElementById('max-cards');
  const maxCards = Math.max(1, Math.min(30, parseInt(maxCardsInput.value) || 10));

  const nameInputs = document.querySelectorAll('#player-name-list input[type=text]');
  const players = Array.from(nameInputs).map((el, i) => ({
    name: el.value.trim() || `Player ${i + 1}`,
  }));

  if (players.length < 2) {
    alert('You need at least 2 players.');
    return;
  }

  state = {
    players,
    maxCards,
    hands: generateHands(maxCards),
    currentHandIndex: 0,
    phase: 'predicting',
    predictions: new Array(players.length).fill(''),
    handHistory: [],
  };

  showScreen('game-screen');
  renderGame();
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * Score for a single hand:
 *   Correct prediction → tricks won + 10 bonus
 *   Wrong prediction   → tricks won only
 */
function calcHandScore(prediction, tricks) {
  const p = parseInt(prediction);
  const t = parseInt(tricks);
  if (p === t) return t + 10;
  return t;
}

function totalScore(playerIndex) {
  return state.handHistory.reduce((sum, h) => sum + h.scores[playerIndex], 0);
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderGame() {
  renderHandInfo();
  renderScoreTable();
  renderInputSection();
}

function renderHandInfo() {
  const idx = state.currentHandIndex;
  const total = state.hands.length;
  const cardCount = state.hands[idx];

  document.getElementById('hand-label').textContent =
    `Hand ${idx + 1} of ${total}`;
  document.getElementById('cards-label').textContent =
    `${cardCount} card${cardCount !== 1 ? 's' : ''}`;
}

function renderScoreTable() {
  const table = document.getElementById('score-table');
  const { players, hands, handHistory, currentHandIndex, phase } = state;
  const completedHands = handHistory.length;

  // ── Header ──
  let headerHtml = '<thead><tr><th>Player</th>';
  for (let h = 0; h < hands.length; h++) {
    const isCompleted = h < completedHands;
    const isCurrent   = h === currentHandIndex;
    const cls = isCurrent ? ' col-current' : '';
    headerHtml += `<th class="${cls}">${hands[h]}🃏</th>`;
  }
  headerHtml += '<th class="col-total">Total</th></tr></thead>';

  // ── Body ──
  let bodyHtml = '<tbody>';
  for (let p = 0; p < players.length; p++) {
    bodyHtml += `<tr><td>${escHtml(players[p].name)}</td>`;

    for (let h = 0; h < hands.length; h++) {
      const isCompleted = h < completedHands;
      const isCurrent   = h === currentHandIndex;
      const cls = isCurrent ? ' col-current' : '';

      if (isCompleted) {
        const hist = handHistory[h];
        const score = hist.scores[p];
        const pred  = hist.predictions[p];
        const tricks = hist.tricks[p];
        const bonus  = pred === tricks;
        const runningTotal = handHistory
          .slice(0, h + 1)
          .reduce((s, hh) => s + hh.scores[p], 0);
        bodyHtml += `<td class="${cls}">
          <span class="${bonus ? 'cell-bonus' : ''}">${runningTotal}</span>
          <span class="cell-detail">${pred}→${tricks}${bonus ? ' ✓' : ''}</span>
        </td>`;
      } else if (isCurrent) {
        bodyHtml += `<td class="${cls}">—</td>`;
      } else {
        bodyHtml += `<td class="${cls}"></td>`;
      }
    }

    bodyHtml += `<td class="col-total">${totalScore(p)}</td>`;
    bodyHtml += '</tr>';
  }
  bodyHtml += '</tbody>';

  table.innerHTML = headerHtml + bodyHtml;

  // Scroll current column into view (desktop helper)
  const currentTh = table.querySelector('th.col-current');
  if (currentTh) {
    currentTh.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
  }
}

function renderInputSection() {
  const { players, hands, currentHandIndex, phase } = state;
  const cardCount = hands[currentHandIndex];

  if (phase === 'predicting') {
    document.getElementById('input-title').textContent = 'Enter Predictions';
    document.getElementById('input-desc').textContent =
      `Each player predicts how many tricks they will win this hand (${cardCount} cards dealt).`;
    document.getElementById('action-btn').textContent = 'Lock In Predictions →';
  } else {
    document.getElementById('input-title').textContent = 'Enter Tricks Won';
    document.getElementById('input-desc').textContent =
      `Enter the actual number of tricks each player won (total must equal ${cardCount}).`;
    document.getElementById('action-btn').textContent = 'Calculate Scores →';
  }

  const container = document.getElementById('player-inputs');
  container.innerHTML = '';

  players.forEach((player, i) => {
    const row = document.createElement('div');
    row.className = 'player-input-row';

    let extra = '';
    if (phase === 'tricks' && state.predictions[i] !== '') {
    extra = `<span class="cell-detail">Predicted: ${escHtml(String(state.predictions[i]))}</span>`;
    }

    row.innerHTML = `
      <label for="input-${i}">${escHtml(player.name)}${extra}</label>
      <input type="number" id="input-${i}"
             min="0" max="${cardCount}"
             placeholder="0"
             inputmode="numeric"
             value="" />`;
    container.appendChild(row);

    // Restore saved value if editing
    const input = row.querySelector('input');
    if (phase === 'tricks' && state.tricks && state.tricks[i] !== undefined && state.tricks[i] !== '') {
      input.value = state.tricks[i];
    }
  });

  document.getElementById('total-warning').classList.add('hidden');
}

// ── Actions ───────────────────────────────────────────────────────────────────

function handleAction() {
  const { players, hands, currentHandIndex, phase } = state;
  const cardCount = hands[currentHandIndex];
  const inputs = document.querySelectorAll('#player-inputs input[type=number]');
  const values = Array.from(inputs).map(el => el.value.trim());

  // Validate all filled in
  if (values.some(v => v === '')) {
    showWarning('Please enter a value for every player.');
    return;
  }

  const nums = values.map(Number);
  if (nums.some(n => isNaN(n) || n < 0)) {
    showWarning('All values must be 0 or greater.');
    return;
  }

  if (phase === 'predicting') {
    state.predictions = nums;
    state.phase = 'tricks';
    state.tricks = new Array(players.length).fill('');
    renderGame();
    document.querySelector('#player-inputs input')?.focus();

  } else {
    // Validate tricks sum
    const sum = nums.reduce((a, b) => a + b, 0);
    if (sum !== cardCount) {
      showWarning(
        `Total tricks won (${sum}) must equal the number of cards dealt (${cardCount}). Please adjust.`
      );
      return;
    }

    // Calculate scores for this hand
    const scores = nums.map((tricks, i) =>
      calcHandScore(state.predictions[i], tricks)
    );

    state.handHistory.push({
      cardCount,
      predictions: [...state.predictions],
      tricks: [...nums],
      scores,
    });

    state.currentHandIndex++;

    if (state.currentHandIndex >= state.hands.length) {
      showResults();
    } else {
      state.phase = 'predicting';
      state.predictions = new Array(players.length).fill('');
      state.tricks = undefined;
      renderGame();
      document.querySelector('#player-inputs input')?.focus();
    }
  }
}

function showWarning(msg) {
  const el = document.getElementById('total-warning');
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ── Results ───────────────────────────────────────────────────────────────────

function showResults() {
  const { players } = state;
  const totals = players.map((p, i) => ({ name: p.name, score: totalScore(i) }));
  totals.sort((a, b) => b.score - a.score);

  const maxScore = totals[0].score;
  const medals = ['🥇', '🥈', '🥉'];

  let html = '<h2>Final Scores</h2>';
  totals.forEach((t, rank) => {
    const isWinner = t.score === maxScore;
    html += `
      <div class="result-row ${isWinner ? 'winner' : ''}">
        <span class="result-rank">${medals[rank] || `${rank + 1}.`}</span>
        <span class="result-name">${escHtml(t.name)}</span>
        <span class="result-score">${t.score}</span>
      </div>`;
  });

  document.getElementById('final-results').innerHTML = html;
  showScreen('results-screen');
}

// ── New Game ──────────────────────────────────────────────────────────────────

function newGame() {
  showScreen('setup-screen');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', initSetup);
