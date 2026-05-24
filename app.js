
(() => {
  'use strict';
  const WORD_POOL = [
    'HACK', 'BYPASS', 'OVERRIDE', 'ACCESS', 'DECRYPT',
    'FIREWALL', 'PROXY', 'KERNEL', 'EXPLOIT', 'BREACH',
    'PAYLOAD', 'INJECT', 'ROOTKIT', 'CIPHER', 'TOKEN',
    'VÉDELEM', 'RIASZTÓ', 'KULCS', 'JELSZÓ', 'BELÉPÉS',
    'KAMERA', 'SZERVER', 'HÁLÓZAT', 'KÓDOLÁS', 'BETÖRÉS',
    'VAULT', 'SYSTEM', 'REBOOT', 'DAEMON', 'SCRIPT',
    'BINARY', 'MODULE', 'SOCKET', 'UPLOAD', 'STREAM',
    'KIBERBIZTONSÁG', 'TITKOSÍTÁS', 'HACKERTÁMADÁS', 'VÉDŐPAJZS',
    'ADATHALÁSZAT', 'BEHATOLÁSTESZT', 'ZSAROLÓVÍRUS', 'FELHŐSZOLGÁLTATÁS',
    'SKIBIDI', 'TUNGTUNGSAHUR', 'SIXSEVEN', 'MEGSZENTSÉGTELENÍTHETETLENSÉGESKEDÉSEITEKÉRT'
  ];
  const WIRE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
  const WIRE_LABELS_LEFT = ['A1', 'B2', 'C3', 'D4', 'E5'];
  const WIRE_LABELS_RIGHT = ['α', 'β', 'γ', 'δ', 'ε'];
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const DOM = {
    matrixCanvas: $('#matrix-rain'),
    levelIndicator: $('#level-indicator'),
    scoreDisplay: $('#score-display'),
    livesContainer: $('#lives-container'),
    soundToggle: $('#sound-toggle'),
    consoleLog: $('#console-log'),
    arenaTitle: $('#arena-title'),
    arena: $('#arena'),
    wirePuzzle: $('#wire-puzzle'),
    wireLeft: $('#wire-left'),
    wireRight: $('#wire-right'),
    wireSvg: $('#wire-svg'),
    hackInput: $('#hack-input'),
    inputArea: $('#input-area'),
    progressLabel: $('#progress-label'),
    progressFill: $('#progress-fill'),
    overlayMenu: $('#overlay-menu'),
    overlayLevel: $('#overlay-level'),
    overlayWin: $('#overlay-win'),
    overlayGameover: $('#overlay-gameover'),
    levelTransitionText: $('#level-transition-text'),
    finalScore: $('#final-score'),
    gameoverScore: $('#gameover-score'),
    btnStart: $('#btn-start'),
    btnRestartLose: $('#btn-restart-lose'),
    symbolPuzzle: $('#symbol-puzzle'),
    symbolTargetChar: $('#symbol-target-char'),
    symbolGrid: $('#symbol-grid'),
    mazePuzzle: $('#maze-puzzle'),
    mazeCanvas: $('#maze-canvas'),
  };
  const MAX_LIVES = 3;
  const state = {
    activeLevel: 0,      
    score: 0,
    lives: MAX_LIVES,    
    maxLives: MAX_LIVES,
    solvedCount: 0,
    targetCount: 10,     
    entities: [],        
    spawnTimer: 0,
    spawnInterval: 2200, 
    fallSpeed: 0.6,      
    lastFrame: 0,
    animFrame: null,
    soundEnabled: true,
    timerRemaining: 0,
    wireSelected: null,
    wireConnections: [],
    wireCorrectMap: [],
    symbolTarget: '',
    symbolGridTimer: null,
    symbolRefreshRate: 1500,
    symbolProcessing: false,
    maze: {
      ctx: null,
      player: { x: 50, y: 350, size: 20 },
      target: { x: 530, y: 30, width: 40, height: 40 },
      enemies: [],
      keys: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false }
    }
  };
  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playSound(type) {
    if (!state.soundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      switch (type) {
        case 'type': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }
        case 'success': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'fail': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }
        case 'wire': {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.setValueAtTime(800, now + 0.05);
          osc.frequency.setValueAtTime(1000, now + 0.1);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }
        case 'alarm': {
          for (let i = 0; i < 3; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now + i * 0.15);
            osc.frequency.setValueAtTime(440, now + i * 0.15 + 0.075);
            gain.gain.setValueAtTime(0.08, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.14);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.15);
          }
          break;
        }
        case 'levelup': {
          [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            gain.gain.setValueAtTime(0.1, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.22);
          });
          break;
        }
        case 'victory': {
          [523, 659, 784, 1047, 1319].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.12, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.42);
          });
          break;
        }
      }
    } catch (e) {  }
  }
  function initMatrixRain() {
    const canvas = DOM.matrixCanvas;
    const ctx = canvas.getContext('2d');
    let w, h, columns, drops;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      columns = Math.floor(w / 18);
      drops = Array.from({ length: columns }, () => Math.random() * h / 16);
    }
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    function draw() {
      ctx.fillStyle = 'rgba(6, 8, 13, 0.15)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#00ff41';
      ctx.font = '14px monospace';
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 18, drops[i] * 16);
        if (drops[i] * 16 > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    draw();
  }
  const LOG_CLASSES = { info: 'info', success: 'success', warn: 'warn', error: 'error', system: 'system', hack: 'hack' };
  function logMessage(text, type = 'info') {
    const el = document.createElement('div');
    el.className = `log-line ${LOG_CLASSES[type] || 'info'}`;
    const time = new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.innerHTML = `<span class="timestamp">[${time}]</span> ${text}`;
    DOM.consoleLog.appendChild(el);
    DOM.consoleLog.scrollTop = DOM.consoleLog.scrollHeight;
    while (DOM.consoleLog.children.length > 80) {
      DOM.consoleLog.removeChild(DOM.consoleLog.firstChild);
    }
  }
  function bootSequence() {
    const lines = [
      { t: 'Initializing NEM_BANKRABLÓ terminal v3.7.1...', type: 'system', delay: 0 },
      { t: 'Loading exploit modules... [OK]', type: 'info', delay: 400 },
      { t: 'Connecting to proxy chain: 7 nodes...', type: 'info', delay: 800 },
      { t: '→ Tor → VPN → Satellite → Coffee Machine → VPN', type: 'hack', delay: 1100 },
      { t: 'Connection routed through 14 countries.', type: 'success', delay: 1500 },
      { t: 'TARGET ACQUIRED: Erste Bank, Mátészalka', type: 'warn', delay: 1900 },
      { t: 'Scanning security infrastructure...', type: 'info', delay: 2300 },
      { t: '4 CCTV cameras detected. All ACTIVE.', type: 'error', delay: 2700 },
      { t: 'Hack modules loaded. Awaiting operator command.', type: 'system', delay: 3100 },
      { t: '"Én határozottan NEM vagyok bankrabló." — nem bankrabló', type: 'hack', delay: 3500 },
    ];
    lines.forEach(line => {
      setTimeout(() => logMessage(line.t, line.type), line.delay);
    });
  }
  function renderLives() {
    DOM.livesContainer.innerHTML = '';
    for (let i = 0; i < state.maxLives; i++) {
      const span = document.createElement('span');
      span.className = 'life-icon' + (i < state.lives ? ' alive' : ' dead');
      span.textContent = i < state.lives ? '🟢' : '💀';
      DOM.livesContainer.appendChild(span);
    }
    if (state.lives < state.maxLives && state.lives > 0) {
      DOM.livesContainer.classList.add('shake');
      setTimeout(() => DOM.livesContainer.classList.remove('shake'), 400);
    }
  }
  function loseLife() {
    state.lives--;
    renderLives();
    playSound('fail');
    if (state.lives <= 0) {
      logMessage(`💀 Minden életed elfogyott! RIASZTÁS!`, 'error');
      gameOver();
    } else {
      logMessage(`⚠ Hiba! Maradék életek: ${'🟢'.repeat(state.lives)}${'💀'.repeat(state.maxLives - state.lives)} [${state.lives}/${state.maxLives}]`, 'warn');
    }
  }
  function addScore(points) {
    state.score += points;
    DOM.scoreDisplay.textContent = `SCORE: ${state.score}`;
  }
  function updateProgress() {
    DOM.progressLabel.textContent = `Progress: ${state.solvedCount} / ${state.targetCount}`;
    DOM.progressFill.style.width = (state.solvedCount / state.targetCount * 100) + '%';
  }
  function setCameraState(camNum, camState) {
    const card = $(`#cam-${camNum}`);
    const status = $(`#cam-status-${camNum}`);
    const content = card.querySelector('.cam-content');
    card.classList.remove('hacked');
    status.classList.remove('active', 'hacking', 'hacked');
    switch (camState) {
      case 'active':
        status.classList.add('active');
        status.textContent = 'ACTIVE';
        content.textContent = 'LIVE FEED ▣';
        break;
      case 'hacking':
        status.classList.add('hacking');
        status.textContent = 'HACKING...';
        content.textContent = '⟨ BREACH IN PROGRESS ⟩';
        break;
      case 'hacked':
        card.classList.add('hacked');
        status.classList.add('hacked');
        status.textContent = 'OFFLINE';
        content.textContent = '■ NO SIGNAL ■';
        break;
    }
  }
  function generateMathExpression() {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * a) + 1;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        break;
    }
    return { display: `${a} ${op} ${b}`, answer: answer.toString() };
  }
  function spawnEntity() {
    const arenaRect = DOM.arena.getBoundingClientRect();
    const entity = {
      id: Date.now() + Math.random(),
      y: 0,
      speed: state.fallSpeed + Math.random() * 0.3,
    };
    if (state.activeLevel === 3) {
      entity.value = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];
      entity.answer = entity.value;
      entity.type = 'word';
    } else if (state.activeLevel === 5) {
      const expr = generateMathExpression();
      entity.value = expr.display;
      entity.answer = expr.answer;
      entity.type = 'math';
    }
    const el = document.createElement('div');
    el.className = `falling-entity ${entity.type === 'math' ? 'math' : ''}`;
    el.textContent = entity.value;
    el.dataset.entityId = entity.id;
    el.style.top = '0px';
    DOM.arena.appendChild(el);
    const entityWidth = el.getBoundingClientRect().width || el.offsetWidth || 150;
    const safeMaxX = arenaRect.width - entityWidth - 20;
    let leftPos = 10;
    if (safeMaxX > 10) {
      leftPos = Math.random() * safeMaxX + 10;
    }
    el.style.left = leftPos + 'px';
    entity.element = el;
    state.entities.push(entity);
  }
  function removeEntity(entity, reason) {
    entity.element.classList.add(reason); 
    setTimeout(() => {
      if (entity.element.parentNode) {
        entity.element.parentNode.removeChild(entity.element);
      }
    }, 500);
    state.entities = state.entities.filter(e => e.id !== entity.id);
  }
  function initWirePuzzle() {
    DOM.wireLeft.innerHTML = '';
    DOM.wireRight.innerHTML = '';
    DOM.wireSvg.innerHTML = '';
    state.wireConnections = [];
    state.wireSelected = null;
    const shuffled = [...Array(5).keys()];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    state.wireCorrectMap = shuffled;
    for (let i = 0; i < 5; i++) {
      const port = document.createElement('div');
      port.className = 'wire-port';
      port.dataset.side = 'left';
      port.dataset.index = i;
      port.dataset.color = 'cyan';
      port.textContent = WIRE_LABELS_LEFT[i];
      port.addEventListener('mousedown', () => onWirePortClick('left', i));
      port.addEventListener('click', () => onWirePortClick('left', i));
      DOM.wireLeft.appendChild(port);
    }
    for (let i = 0; i < 5; i++) {
      const colorIdx = shuffled[i]; 
      const port = document.createElement('div');
      port.className = 'wire-port';
      port.dataset.side = 'right';
      port.dataset.index = i;
      port.dataset.color = 'cyan';
      port.dataset.matchesLeft = colorIdx; 
      port.textContent = WIRE_LABELS_RIGHT[i];
      port.addEventListener('mouseup', () => onWirePortClick('right', i));
      port.addEventListener('click', () => onWirePortClick('right', i));
      DOM.wireRight.appendChild(port);
    }
    DOM.wirePuzzle.classList.add('active');
    DOM.inputArea.style.display = 'none';
  }
  function onWirePortClick(side, index) {
    const isConnected = state.wireConnections.some(c =>
      (side === 'left' && c.leftIdx === index) ||
      (side === 'right' && c.rightIdx === index)
    );
    if (isConnected) return;
    if (side === 'left') {
      DOM.wireLeft.querySelectorAll('.wire-port').forEach(p => p.classList.remove('selected'));
      state.wireSelected = index;
      DOM.wireLeft.children[index].classList.add('selected');
      playSound('type');
      let tempLine = DOM.wireSvg.querySelector('.active-draw');
      if (!tempLine) {
        tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('class', 'active-draw');
        tempLine.style.stroke = '#00d4ff';
        DOM.wireSvg.appendChild(tempLine);
      }
      const svgRect = DOM.wireSvg.getBoundingClientRect();
      const lr = DOM.wireLeft.children[index].getBoundingClientRect();
      const x1 = lr.right - svgRect.left;
      const y1 = lr.top + lr.height / 2 - svgRect.top;
      tempLine.setAttribute('x1', x1);
      tempLine.setAttribute('y1', y1);
      tempLine.setAttribute('x2', x1);
      tempLine.setAttribute('y2', y1);
    } else if (side === 'right' && state.wireSelected !== null) {
      const leftIdx = state.wireSelected;
      const rightPort = DOM.wireRight.children[index];
      const matchesLeft = parseInt(rightPort.dataset.matchesLeft);
      const tempLine = DOM.wireSvg.querySelector('.active-draw');
      if (tempLine) tempLine.remove();
      if (matchesLeft === leftIdx) {
        const color = 'cyan';
        state.wireConnections.push({ leftIdx, rightIdx: index, color });
        DOM.wireLeft.children[leftIdx].classList.remove('selected');
        DOM.wireLeft.children[leftIdx].classList.add('connected');
        rightPort.classList.add('connected');
        drawWire(leftIdx, index, color);
        state.wireSelected = null;
        playSound('wire');
        addScore(20);
        logMessage(`🔌 Kábel ${WIRE_LABELS_LEFT[leftIdx]} → ${WIRE_LABELS_RIGHT[index]} sikeresen összekötve!`, 'success');
        state.solvedCount = state.wireConnections.length;
        state.targetCount = 5;
        updateProgress();
        if (state.wireConnections.length === 5) {
          setTimeout(() => {
            levelComplete();
          }, 600);
        }
      } else {
        logMessage(`✖ Hibás csatlakozás! Próbáld újra!`, 'error');
        DOM.wireLeft.children[leftIdx].classList.remove('selected');
        state.wireSelected = null;
        playSound('fail');
      }
    }
  }
  function drawWire(leftIdx, rightIdx, color) {
    const leftPort = DOM.wireLeft.children[leftIdx];
    const rightPort = DOM.wireRight.children[rightIdx];
    const svgRect = DOM.wireSvg.getBoundingClientRect();
    const lr = leftPort.getBoundingClientRect();
    const rr = rightPort.getBoundingClientRect();
    const x1 = lr.right - svgRect.left;
    const y1 = lr.top + lr.height / 2 - svgRect.top;
    const x2 = rr.left - svgRect.left;
    const y2 = rr.top + rr.height / 2 - svgRect.top;
    const colorMap = {
      red: '#ff4444',
      blue: '#4488ff',
      green: '#44ff44',
      yellow: '#ffcc00',
      purple: '#aa44ff',
      cyan: '#00d4ff',
    };
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.style.stroke = colorMap[color] || '#00ff41';
    DOM.wireSvg.appendChild(line);
  }
  function onWireMouseMove(e) {
    if (state.wireSelected === null) return;
    const tempLine = DOM.wireSvg.querySelector('.active-draw');
    if (!tempLine) return;
    const svgRect = DOM.wireSvg.getBoundingClientRect();
    const x2 = e.clientX - svgRect.left;
    const y2 = e.clientY - svgRect.top;
    tempLine.setAttribute('x2', x2);
    tempLine.setAttribute('y2', y2);
  }
  const SYMBOLS = ['Ω', 'Σ', 'Δ', 'Φ', 'Ψ', 'Λ', 'Γ', 'Θ', 'Ξ', 'Π', 'Ж', 'Ѱ', 'Ѧ', 'Ø', 'µ', '§'];
  function initSymbolPuzzle() {
    state.solvedCount = 0;
    state.targetCount = 5;
    DOM.symbolPuzzle.classList.add('active');
    DOM.inputArea.style.display = 'none';
    updateProgress();
    nextSymbolRound();
  }
  function nextSymbolRound() {
    if (state.activeLevel !== 1) return;
    state.symbolTarget = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    DOM.symbolTargetChar.textContent = state.symbolTarget;
    renderSymbolGrid();
    state.symbolProcessing = false;
    clearTimeout(state.symbolGridTimer);
    state.symbolGridTimer = setTimeout(() => {
      playSound('type');
      nextSymbolRound();
    }, state.symbolRefreshRate);
  }
  function renderSymbolGrid() {
    DOM.symbolGrid.innerHTML = '';
    let others = [];
    while (others.length < 24) {
      let r = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      if (r !== state.symbolTarget) others.push(r);
    }
    let gridSymbols = [...others, state.symbolTarget];
    gridSymbols.sort(() => Math.random() - 0.5);
    gridSymbols.forEach(sym => {
      let cell = document.createElement('div');
      cell.className = 'symbol-cell';
      cell.textContent = sym;
      cell.onclick = () => handleSymbolClick(sym, cell);
      DOM.symbolGrid.appendChild(cell);
    });
  }
  function handleSymbolClick(sym, cell) {
    if (state.activeLevel !== 1) return;
    if (state.symbolProcessing) return;
    if (sym === state.symbolTarget) {
      state.symbolProcessing = true;
      clearTimeout(state.symbolGridTimer);
      cell.classList.add('correct');
      playSound('success');
      state.solvedCount++;
      addScore(30);
      updateProgress();
      if (state.solvedCount >= state.targetCount) {
        logMessage(`✓ Anomália analizálva! Rendszer feloldva!`, 'success');
        DOM.symbolPuzzle.classList.remove('active');
        setTimeout(() => levelComplete(), 500);
      } else {
        setTimeout(nextSymbolRound, 300);
      }
    } else {
      cell.classList.add('wrong');
      playSound('fail');
      loseLife();
    }
  }
  function initMazePuzzle() {
    DOM.mazePuzzle.classList.add('active');
    DOM.inputArea.style.display = 'none';
    state.maze.ctx = DOM.mazeCanvas.getContext('2d');
    DOM.mazeCanvas.width = 600;
    DOM.mazeCanvas.height = 400;
    state.maze.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    resetMazeRound();
    state.solvedCount = 0;
    state.targetCount = 5;
    updateProgress();
    window.addEventListener('keydown', onMazeKeyDown);
    window.addEventListener('keyup', onMazeKeyUp);
  }
  function resetMazeRound() {
    state.maze.player = { x: 30, y: 180, width: 16, height: 16 };
    state.maze.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
    state.maze.target = {
      x: 540,
      y: Math.floor(Math.random() * 340) + 20,
      width: 30,
      height: 30
    };
    state.maze.enemies = [];
    for (let i = 0; i < 6; i++) {
      state.maze.enemies.push({
        x: 100 + i * 70,
        y: Math.random() * 350,
        width: 18,
        height: 18,
        speedX: 0,
        speedY: (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 2.5)
      });
    }
    for (let i = 0; i < 4; i++) {
      state.maze.enemies.push({
        x: Math.random() * 300 + 100,
        y: 40 + i * 90,
        width: 18,
        height: 18,
        speedX: (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 2.5),
        speedY: 0
      });
    }
    for (let i = 0; i < 2; i++) {
      state.maze.enemies.push({
        x: 200 + i * 150,
        y: Math.random() * 300 + 50,
        width: 18,
        height: 18,
        speedX: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random()),
        speedY: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random())
      });
    }
  }
  function cleanupMazePuzzle() {
    DOM.mazePuzzle.classList.remove('active');
    window.removeEventListener('keydown', onMazeKeyDown);
    window.removeEventListener('keyup', onMazeKeyUp);
  }
  function onMazeKeyDown(e) {
    if (state.activeLevel !== 2) return;
    if (state.maze.keys.hasOwnProperty(e.key)) {
      state.maze.keys[e.key] = true;
      e.preventDefault();
    }
  }
  function onMazeKeyUp(e) {
    if (state.activeLevel !== 2) return;
    if (state.maze.keys.hasOwnProperty(e.key)) {
      state.maze.keys[e.key] = false;
      e.preventDefault();
    }
  }
  function updateMaze(delta) {
    const p = state.maze.player;
    const speed = 0.18 * delta;
    if (state.maze.keys.ArrowUp) p.y -= speed;
    if (state.maze.keys.ArrowDown) p.y += speed;
    if (state.maze.keys.ArrowLeft) p.x -= speed;
    if (state.maze.keys.ArrowRight) p.x += speed;
    p.x = Math.max(0, Math.min(600 - p.width, p.x));
    p.y = Math.max(0, Math.min(400 - p.height, p.y));
    for (let e of state.maze.enemies) {
      e.x += e.speedX * (delta / 16);
      e.y += e.speedY * (delta / 16);
      if (e.y < 0 || e.y > 400 - e.height) e.speedY *= -1;
      if (e.x < 80 || e.x > 520 - e.width) e.speedX *= -1;
      if (p.x < e.x + e.width && p.x + p.width > e.x &&
        p.y < e.y + e.height && p.y + p.height > e.y) {
        p.x = 30; p.y = 180;
        loseLife();
      }
    }
    const t = state.maze.target;
    if (p.x < t.x + t.width && p.x + p.width > t.x &&
      p.y < t.y + t.height && p.y + p.height > t.y) {
      state.solvedCount++;
      addScore(40);
      updateProgress();
      if (state.solvedCount >= state.targetCount) {
        cleanupMazePuzzle();
        setTimeout(() => levelComplete(), 500);
      } else {
        resetMazeRound();
      }
    }
  }
  function drawMaze() {
    const ctx = state.maze.ctx;
    ctx.clearRect(0, 0, 600, 400);
    const t = state.maze.target;
    ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.fillRect(t.x, t.y, t.width, t.height);
    ctx.strokeStyle = '#00d4ff';
    ctx.strokeRect(t.x, t.y, t.width, t.height);
    ctx.fillStyle = '#ff2244';
    for (let e of state.maze.enemies) {
      ctx.fillRect(e.x, e.y, e.width, e.height);
    }
    const p = state.maze.player;
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }
  function updateTimerUI() {
    const timerSecEl = $('#wire-timer-sec');
    if (!timerSecEl) return;
    const seconds = Math.max(0, state.timerRemaining / 1000).toFixed(2);
    timerSecEl.textContent = seconds;
    const timerEl = $('#wire-timer');
    if (!timerEl) return;
    if (state.timerRemaining < 10000) {
      timerEl.style.color = 'var(--neon-pink)';
      timerEl.style.animationDuration = '0.3s';
    } else {
      timerEl.style.color = 'var(--neon-red)';
      timerEl.style.animationDuration = '1s';
    }
  }
  function gameLoop(timestamp) {
    if (state.activeLevel < 1 || state.activeLevel > 5) return;
    if (!state.lastFrame) state.lastFrame = timestamp;
    const delta = timestamp - state.lastFrame;
    state.lastFrame = timestamp;
    if (state.activeLevel === 4) {
      state.timerRemaining -= delta;
      updateTimerUI();
      if (state.timerRemaining <= 0) {
        state.timerRemaining = 0;
        logMessage('🚨 SZABOTÁZS IDŐKORLÁT TÚLLÉPVE! Riasztó bekapcsolt!', 'error');
        gameOver();
        return;
      }
      state.animFrame = requestAnimationFrame(gameLoop);
      return;
    }
    if (state.activeLevel === 1) {
      state.animFrame = requestAnimationFrame(gameLoop);
      return;
    }
    if (state.activeLevel === 2) {
      updateMaze(delta);
      drawMaze();
      state.animFrame = requestAnimationFrame(gameLoop);
      return;
    }
    state.spawnTimer += delta;
    if (state.spawnTimer >= state.spawnInterval) {
      state.spawnTimer = 0;
      if (state.entities.length < 5) {
        spawnEntity();
      }
    }
    const arenaH = DOM.arena.getBoundingClientRect().height;
    for (let i = state.entities.length - 1; i >= 0; i--) {
      const e = state.entities[i];
      e.y += e.speed * (delta / 16);
      e.element.style.top = e.y + 'px';
      if (e.y > arenaH - 50) {
        removeEntity(e, 'missed');
        logMessage(`✖ MISSED: "${e.value}" — Firewall reinforced!`, 'error');
        loseLife();
      }
    }
    state.animFrame = requestAnimationFrame(gameLoop);
  }
  function handleInput() {
    const input = DOM.hackInput.value.trim().toUpperCase();
    if (!input) return;
    let found = false;
    for (const entity of state.entities) {
      if (entity.answer.toUpperCase() === input) {
        found = true;
        removeEntity(entity, 'destroyed');
        playSound('success');
        addScore(10);
        state.solvedCount++;
        updateProgress();
        logMessage(`✓ CRACKED: "${entity.value}" — Firewall weakened!`, 'success');
        if (state.solvedCount >= state.targetCount) {
          DOM.hackInput.value = '';
          setTimeout(() => levelComplete(), 500);
          return;
        }
        break;
      }
    }
    if (!found) {
      playSound('fail');
      DOM.hackInput.classList.add('wrong');
      setTimeout(() => DOM.hackInput.classList.remove('wrong'), 300);
    } else {
      DOM.hackInput.classList.add('correct');
      setTimeout(() => DOM.hackInput.classList.remove('correct'), 300);
    }
    DOM.hackInput.value = '';
  }
  function startLevel(level) {
    state.activeLevel = level;
    state.solvedCount = 0;
    state.maxLives = (level === 3 || level === 5) ? 1 : MAX_LIVES;
    state.lives = state.maxLives;
    state.entities = [];
    state.spawnTimer = 0;
    state.lastFrame = 0;
    DOM.arena.querySelectorAll('.falling-entity').forEach(el => el.remove());
    DOM.wirePuzzle.classList.remove('active');
    renderLives();
    DOM.inputArea.style.display = 'flex';
    switch (level) {
      case 1:
        state.targetCount = 5;
        DOM.levelIndicator.textContent = 'LEVEL 1 — ANOMALY SCAN';
        DOM.arenaTitle.textContent = '🔍 Szimbólum Kereső';
        DOM.inputArea.style.display = 'none';
        setCameraState(1, 'hacking');
        logMessage('━━━ LEVEL 1: ANOMALY DETECTION ━━━', 'system');
        logMessage('Keresd meg a CÉLPONT szimbólumot a rácsban!', 'hack');
        initSymbolPuzzle();
        break;
      case 2:
        state.targetCount = 3;
        DOM.levelIndicator.textContent = 'LEVEL 2 — DATA ROUTING';
        DOM.arenaTitle.textContent = '🕹️ Adatcsomag Irányítás';
        DOM.inputArea.style.display = 'none';
        setCameraState(2, 'hacking');
        logMessage('━━━ LEVEL 2: DATA ROUTING ━━━', 'system');
        logMessage('Irányítsd a zöld csomagot a célpontig (NYILAKKAL)!', 'hack');
        initMazePuzzle();
        break;
      case 3:
        state.targetCount = 10;
        state.spawnInterval = 1700;
        state.fallSpeed = 0.8;
        DOM.levelIndicator.textContent = 'LEVEL 3 — FIREWALL BYPASS';
        DOM.arenaTitle.textContent = '🛡️ Tűzfal Kulcsszó Bypass';
        DOM.hackInput.placeholder = 'Írd be a szót...';
        setCameraState(3, 'hacking');
        logMessage('━━━ LEVEL 3: FIREWALL KEYWORD BYPASS ━━━', 'system');
        logMessage('Kulcsszavak esnek lefelé gyorsan! Írd be őket időben!', 'hack');
        break;
      case 4:
        state.targetCount = 5;
        state.timerRemaining = 30000;
        DOM.levelIndicator.textContent = 'LEVEL 4 — WIRE BYPASS';
        DOM.arenaTitle.textContent = '🔌 Hardver Drót Bypass';
        DOM.inputArea.style.display = 'none';
        setCameraState(4, 'hacking');
        logMessage('━━━ LEVEL 4: HARDWARE WIRE BYPASS ━━━', 'system');
        logMessage('Kösd össze a megfelelő portokat vakon tippelgetve!', 'hack');
        initWirePuzzle();
        break;
      case 5:
        state.targetCount = 10;
        state.spawnInterval = 2000;
        state.fallSpeed = 0.65;
        DOM.levelIndicator.textContent = 'LEVEL 5 — CRYPTO LOCK';
        DOM.arenaTitle.textContent = '🧮 Aritmetikai Kódtörés';
        DOM.hackInput.placeholder = 'Írd be az eredményt...';
        logMessage('━━━ LEVEL 5: ARITHMETIC CRYPTOGRAPHY ━━━', 'system');
        logMessage('Főtartomány (Vault) elérése. Számold ki a kifejezéseket!', 'hack');
        break;
    }
    updateProgress();
    if (level === 3 || level === 5) {
      DOM.hackInput.focus();
    }
    state.animFrame = requestAnimationFrame(gameLoop);
  }
  function showLevelTransition(text, callback) {
    DOM.levelTransitionText.textContent = text;
    DOM.overlayLevel.classList.add('active');
    playSound('levelup');
    setTimeout(() => {
      DOM.overlayLevel.classList.remove('active');
      if (callback) callback();
    }, 2000);
  }
  function levelComplete() {
    if (state.animFrame) {
      cancelAnimationFrame(state.animFrame);
      state.animFrame = null;
    }
    state.entities.forEach(e => {
      if (e.element.parentNode) e.element.parentNode.removeChild(e.element);
    });
    state.entities = [];
    switch (state.activeLevel) {
      case 1:
        setCameraState(1, 'hacked');
        logMessage('✅ CAM-01 (Entrance) OFFLINE!', 'success');
        showLevelTransition('🛡️ ANOMALY DETECTED ►► NEXT: DATA ROUTING', () => {
          startLevel(2);
        });
        break;
      case 2:
        setCameraState(2, 'hacked');
        showLevelTransition('🕹️ DATA ROUTED ►► NEXT: FIREWALL BYPASS', () => {
          startLevel(3);
        });
        break;
      case 3:
        setCameraState(3, 'hacked');
        logMessage('✅ CAM-03 (Vault Hallway) OFFLINE!', 'success');
        showLevelTransition('🔄 FIREWALL BYPASSED ►► NEXT: WIRE BYPASS', () => {
          startLevel(4);
        });
        break;
      case 4:
        setCameraState(4, 'hacked');
        logMessage('✅ CAM-04 (Inner Vault) OFFLINE!', 'success');
        showLevelTransition('🧠 WIRE BYPASSED ►► NEXT: VAULT CRYPTO LOCK', () => {
          startLevel(5);
        });
        break;
      case 5:
        logMessage('✅ VAULT MAINFRAME HACKED!', 'success');
        logMessage('"A matek mindig is az erősségem volt... na jó, nem." — nem bankrabló', 'hack');
        setTimeout(() => gameWin(), 800);
        break;
    }
  }
  function gameWin() {
    state.activeLevel = 4;
    playSound('victory');
    DOM.finalScore.textContent = `FINAL SCORE: ${state.score}`;
    DOM.overlayWin.classList.add('active');
    logMessage('═══════════════════════════════════════', 'system');
    logMessage('ALL CAMERAS OFFLINE. SYSTEM COMPROMISED.', 'success');
    logMessage('"Nem voltam itt. Ez nem történt meg." — nem bankrabló', 'hack');
  }
  function gameOver() {
    state.activeLevel = 5;
    if (state.animFrame) {
      cancelAnimationFrame(state.animFrame);
      state.animFrame = null;
    }
    playSound('alarm');
    DOM.gameoverScore.textContent = `SCORE: ${state.score}`;
    DOM.overlayGameover.classList.add('active');
    logMessage('═══════════════════════════════════════', 'system');
    logMessage('🚨 ALARM ACTIVATED! INTRUDER DETECTED!', 'error');
    logMessage('"Én nem voltam! Kérdezzék a macskát!" — nem bankrabló', 'hack');
  }
  function resetGame() {
    $$('.overlay').forEach(o => o.classList.remove('active'));
    state.activeLevel = 0;
    state.score = 0;
    state.maxLives = MAX_LIVES;
    state.lives = MAX_LIVES;
    state.solvedCount = 0;
    state.entities = [];
    state.wireConnections = [];
    state.wireSelected = null;
    if (state.animFrame) {
      cancelAnimationFrame(state.animFrame);
      state.animFrame = null;
    }
    DOM.arena.querySelectorAll('.falling-entity').forEach(el => el.remove());
    DOM.wirePuzzle.classList.remove('active');
    DOM.inputArea.style.display = 'flex';
    DOM.scoreDisplay.textContent = 'SCORE: 0';
    renderLives();
    DOM.levelIndicator.textContent = 'LEVEL 0 — STANDBY';
    DOM.arenaTitle.textContent = 'Hack Terminal';
    DOM.progressFill.style.width = '0%';
    DOM.progressLabel.textContent = 'Progress: 0 / 10';
    DOM.hackInput.value = '';
    for (let i = 1; i <= 4; i++) setCameraState(i, 'active');
    DOM.consoleLog.innerHTML = '';
  }
  function startGame() {
    resetGame();
    bootSequence();
    setTimeout(() => {
      showLevelTransition('🔍 LEVEL 1: ANOMALY SCAN', () => {
        startLevel(1);
      });
    }, 3600);
  }
  DOM.hackInput.addEventListener('keydown', (e) => {
    playSound('type');
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInput();
    }
  });
  DOM.btnStart.addEventListener('click', () => {
    initAudio();
    DOM.overlayMenu.classList.remove('active');
    startGame();
  });
  DOM.btnRestartLose.addEventListener('click', () => {
    location.reload();
  });
  DOM.soundToggle.addEventListener('click', () => {
    initAudio();
    state.soundEnabled = !state.soundEnabled;
    DOM.soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
  });
  DOM.wirePuzzle.addEventListener('mousemove', onWireMouseMove);
  DOM.wirePuzzle.addEventListener('click', (e) => {
    if (!e.target.classList.contains('wire-port')) {
      state.wireSelected = null;
      DOM.wireLeft.querySelectorAll('.wire-port').forEach(p => p.classList.remove('selected'));
      const tempLine = DOM.wireSvg.querySelector('.active-draw');
      if (tempLine) tempLine.remove();
    }
  });
  document.addEventListener('click', () => {
    if (state.activeLevel !== 2 && DOM.hackInput) {
      DOM.hackInput.focus();
    }
  });
  initMatrixRain();
})();
