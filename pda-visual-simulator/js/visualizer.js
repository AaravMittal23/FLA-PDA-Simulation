/**
 * visualizer.js
 * 
 * Rendering and DOM manipulation for the PDA Visual Simulator.
 * Handles SVG state diagrams, input tape, vertical stack, trace table,
 * palindrome mirror comparison, and step information panels.
 */

class Visualizer {
  constructor() {
    this.diagramSVGs = {};
  }

  /**
   * Initializes SVG state diagrams for both Question 1 and Question 2.
   */
  initDiagrams() {
    this.renderMatchingDiagram('diagram-matching');
    this.renderPalindromeDiagram('diagram-palindrome');
  }

  /**
   * Renders the 5-state SVG diagram for Question 1: Matching PDA.
   * States: q0, q1, q2, q3, qf
   * @param {string} containerId 
   */
  renderMatchingDiagram(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Dimensions
    const width = 860;
    const height = 260;
    const yCenter = 150;

    // State coordinates
    const coords = {
      q0: { x: 95, y: yCenter },
      q1: { x: 270, y: yCenter },
      q2: { x: 445, y: yCenter },
      q3: { x: 620, y: yCenter },
      qf: { x: 785, y: yCenter }
    };

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="pda-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Arrow marker default -->
          <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569"/>
          </marker>
          <!-- Arrow marker active/highlighted -->
          <marker id="arrow-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb"/>
          </marker>
          <!-- Filter for state glow -->
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#2563eb" flood-opacity="0.35"/>
          </filter>
        </defs>

        <!-- Start initial arrow into q0 -->
        <g class="transition-group">
          <line x1="25" y1="${yCenter}" x2="65" y2="${yCenter}" stroke="#475569" stroke-width="2.5" marker-end="url(#arrow)"/>
          <text x="35" y="${yCenter - 10}" class="svg-label start-label">Start</text>
        </g>

        <!-- ================= TRANSITIONS ================= -->

        <!-- q0 Self Loop: 0, Z -> XZ and 0, X -> XX -->
        <g id="trans-q0-0-Z" class="svg-transition">
          <path d="M 80,123 C 65,45 125,45 110,123" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="52" y="16" width="90" height="34" rx="4" class="label-bg"/>
          <text x="97" y="30" class="svg-label trans-label" text-anchor="middle">0, Z → XZ</text>
          <text x="97" y="44" class="svg-label trans-label" text-anchor="middle">0, X → XX</text>
        </g>

        <!-- q0 -> q1: 1, X -> YX -->
        <g id="trans-q0-1-X" class="svg-transition">
          <line x1="125" y1="${yCenter}" x2="240" y2="${yCenter}" stroke="#475569" stroke-width="2.2" marker-end="url(#arrow)"/>
          <rect x="145" y="${yCenter - 25}" width="78" height="20" rx="4" class="label-bg"/>
          <text x="184" y="${yCenter - 11}" class="svg-label trans-label" text-anchor="middle">1, X → YX</text>
        </g>

        <!-- q1 Self Loop: 1, Y -> YY -->
        <g id="trans-q1-1-Y" class="svg-transition">
          <path d="M 255,123 C 240,55 300,55 285,123" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="232" y="28" width="76" height="20" rx="4" class="label-bg"/>
          <text x="270" y="42" class="svg-label trans-label" text-anchor="middle">1, Y → YY</text>
        </g>

        <!-- q1 -> q2: 2, Y -> ε -->
        <g id="trans-q1-2-Y" class="svg-transition">
          <line x1="300" y1="${yCenter}" x2="415" y2="${yCenter}" stroke="#475569" stroke-width="2.2" marker-end="url(#arrow)"/>
          <rect x="323" y="${yCenter - 25}" width="70" height="20" rx="4" class="label-bg"/>
          <text x="358" y="${yCenter - 11}" class="svg-label trans-label" text-anchor="middle">2, Y → ε</text>
        </g>

        <!-- q2 Self Loop: 2, Y -> ε -->
        <g id="trans-q2-2-Y" class="svg-transition">
          <path d="M 430,123 C 415,55 475,55 460,123" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="407" y="28" width="70" height="20" rx="4" class="label-bg"/>
          <text x="442" y="42" class="svg-label trans-label" text-anchor="middle">2, Y → ε</text>
        </g>

        <!-- q2 -> q3: 3, X -> ε -->
        <g id="trans-q2-3-X" class="svg-transition">
          <line x1="475" y1="${yCenter}" x2="590" y2="${yCenter}" stroke="#475569" stroke-width="2.2" marker-end="url(#arrow)"/>
          <rect x="498" y="${yCenter - 25}" width="70" height="20" rx="4" class="label-bg"/>
          <text x="533" y="${yCenter - 11}" class="svg-label trans-label" text-anchor="middle">3, X → ε</text>
        </g>

        <!-- q3 Self Loop: 3, X -> ε -->
        <g id="trans-q3-3-X" class="svg-transition">
          <path d="M 605,123 C 590,55 650,55 635,123" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
          <rect x="582" y="28" width="70" height="20" rx="4" class="label-bg"/>
          <text x="617" y="42" class="svg-label trans-label" text-anchor="middle">3, X → ε</text>
        </g>

        <!-- q3 -> qf: ε, Z -> Z -->
        <g id="trans-q3-eps-Z" class="svg-transition">
          <line x1="650" y1="${yCenter}" x2="750" y2="${yCenter}" stroke="#475569" stroke-width="2.2" marker-end="url(#arrow)"/>
          <rect x="665" y="${yCenter - 25}" width="72" height="20" rx="4" class="label-bg"/>
          <text x="701" y="${yCenter - 11}" class="svg-label trans-label" text-anchor="middle">ε, Z → Z</text>
        </g>

        <!-- ================= STATES ================= -->

        <!-- State q0 -->
        <g id="state-q0" class="svg-state" transform="translate(${coords.q0.x}, ${coords.q0.y})">
          <circle cx="0" cy="0" r="28" class="state-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q₀</text>
          <text cx="0" cy="42" class="state-sublabel" text-anchor="middle">Read 0s</text>
        </g>

        <!-- State q1 -->
        <g id="state-q1" class="svg-state" transform="translate(${coords.q1.x}, ${coords.q1.y})">
          <circle cx="0" cy="0" r="28" class="state-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q₁</text>
          <text cx="0" cy="42" class="state-sublabel" text-anchor="middle">Read 1s</text>
        </g>

        <!-- State q2 -->
        <g id="state-q2" class="svg-state" transform="translate(${coords.q2.x}, ${coords.q2.y})">
          <circle cx="0" cy="0" r="28" class="state-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q₂</text>
          <text cx="0" cy="42" class="state-sublabel" text-anchor="middle">Pop Ys (2s)</text>
        </g>

        <!-- State q3 -->
        <g id="state-q3" class="svg-state" transform="translate(${coords.q3.x}, ${coords.q3.y})">
          <circle cx="0" cy="0" r="28" class="state-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q₃</text>
          <text cx="0" cy="42" class="state-sublabel" text-anchor="middle">Pop Xs (3s)</text>
        </g>

        <!-- State qf (Final: double circle) -->
        <g id="state-qf" class="svg-state final-state" transform="translate(${coords.qf.x}, ${coords.qf.y})">
          <circle cx="0" cy="0" r="30" class="state-circle outer-circle"/>
          <circle cx="0" cy="0" r="24" class="state-circle inner-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q_f</text>
          <text cx="0" cy="44" class="state-sublabel" text-anchor="middle">Accept</text>
        </g>
      </svg>
    `;

    container.innerHTML = svg;
  }

  /**
   * Renders the 3-state SVG diagram for Question 2: Palindrome CFG-to-PDA.
   * States: q0, q1, qf
   * @param {string} containerId 
   */
  renderPalindromeDiagram(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 800;
    const height = 300;
    const yCenter = 150;

    const coords = {
      q0: { x: 120, y: yCenter },
      q1: { x: 400, y: yCenter },
      qf: { x: 680, y: yCenter }
    };

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="pda-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arrow-pal" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569"/>
          </marker>
          <marker id="arrow-pal-active" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563eb"/>
          </marker>
        </defs>

        <!-- Start initial arrow into q0 -->
        <g class="transition-group">
          <line x1="40" y1="${yCenter}" x2="88" y2="${yCenter}" stroke="#475569" stroke-width="2.5" marker-end="url(#arrow-pal)"/>
          <text x="50" y="${yCenter - 10}" class="svg-label start-label">Start</text>
        </g>

        <!-- ================= TRANSITIONS ================= -->

        <!-- q0 -> q1: ε, Z -> SZ -->
        <g id="trans-q0-q1-init" class="svg-transition">
          <line x1="152" y1="${yCenter}" x2="368" y2="${yCenter}" stroke="#475569" stroke-width="2.2" marker-end="url(#arrow-pal)"/>
          <rect x="215" y="${yCenter - 25}" width="88" height="20" rx="4" class="label-bg"/>
          <text x="259" y="${yCenter - 11}" class="svg-label trans-label" text-anchor="middle">ε, Z → SZ</text>
        </g>

        <!-- q1 Top Self-Loops: Grammar Expansions -->
        <!-- S -> aSa -->
        <g id="trans-q1-aSa" class="svg-transition">
          <path d="M 382,121 C 330,30 470,30 418,121" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow-pal)"/>
          <rect x="345" y="10" width="110" height="54" rx="4" class="label-bg"/>
          <text x="400" y="26" class="svg-label trans-label" text-anchor="middle">ε, S → aSa</text>
          <text x="400" y="42" class="svg-label trans-label" text-anchor="middle">ε, S → bSb</text>
          <text x="400" y="58" class="svg-label trans-label" text-anchor="middle">ε, S → ε</text>
        </g>

        <!-- Invisible alias anchors for individual transition highlighting -->
        <g id="trans-q1-bSb" class="svg-transition-alias"></g>
        <g id="trans-q1-eps" class="svg-transition-alias"></g>

        <!-- q1 Bottom Self-Loops: Terminal Matches -->
        <g id="trans-q1-match-a" class="svg-transition">
          <path d="M 418,179 C 470,270 330,270 382,179" fill="none" stroke="#475569" stroke-width="2" marker-end="url(#arrow-pal)"/>
          <rect x="355" y="235" width="90" height="38" rx="4" class="label-bg"/>
          <text x="400" y="250" class="svg-label trans-label" text-anchor="middle">a, a → ε</text>
          <text x="400" y="266" class="svg-label trans-label" text-anchor="middle">b, b → ε</text>
        </g>

        <g id="trans-q1-match-b" class="svg-transition-alias"></g>

        <!-- q1 -> qf: ε, Z -> Z -->
        <g id="trans-q1-qf-accept" class="svg-transition">
          <line x1="432" y1="${yCenter}" x2="648" y2="${yCenter}" stroke="#475569" stroke-width="2.2" marker-end="url(#arrow-pal)"/>
          <rect x="495" y="${yCenter - 25}" width="90" height="20" rx="4" class="label-bg"/>
          <text x="540" y="${yCenter - 11}" class="svg-label trans-label" text-anchor="middle">ε, Z → Z</text>
        </g>

        <!-- ================= STATES ================= -->

        <!-- State q0 -->
        <g id="state-pal-q0" class="svg-state" transform="translate(${coords.q0.x}, ${coords.q0.y})">
          <circle cx="0" cy="0" r="30" class="state-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q₀</text>
          <text cx="0" cy="45" class="state-sublabel" text-anchor="middle">Init (Push S)</text>
        </g>

        <!-- State q1 -->
        <g id="state-pal-q1" class="svg-state" transform="translate(${coords.q1.x}, ${coords.q1.y})">
          <circle cx="0" cy="0" r="32" class="state-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q₁</text>
          <text cx="0" cy="5" class="state-sublabel" text-anchor="middle" opacity="0"></text>
        </g>

        <!-- State qf -->
        <g id="state-pal-qf" class="svg-state final-state" transform="translate(${coords.qf.x}, ${coords.qf.y})">
          <circle cx="0" cy="0" r="32" class="state-circle outer-circle"/>
          <circle cx="0" cy="0" r="26" class="state-circle inner-circle"/>
          <text cx="0" cy="0" dy="5" class="state-text" text-anchor="middle">q_f</text>
          <text cx="0" cy="47" class="state-sublabel" text-anchor="middle">Accept</text>
        </g>
      </svg>
    `;

    container.innerHTML = svg;
  }

  /**
   * Highlights the active state in the given diagram container.
   * @param {string} containerId 
   * @param {string} stateId e.g. 'q0', 'q1', 'q2', 'q3', 'qf'
   */
  highlightState(containerId, stateId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Reset all states
    const states = container.querySelectorAll('.svg-state');
    states.forEach(s => s.classList.remove('active-state', 'pulse'));

    if (!stateId) return;

    // Target state ID in DOM
    const prefix = containerId === 'diagram-palindrome' ? 'state-pal-' : 'state-';
    const targetState = container.querySelector(`#${prefix}${stateId}`);
    if (targetState) {
      targetState.classList.add('active-state', 'pulse');
    }
  }

  /**
   * Highlights the active transition in the given diagram container.
   * @param {string} containerId 
   * @param {string} transitionId 
   */
  highlightTransition(containerId, transitionId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Reset all transitions
    const transitions = container.querySelectorAll('.svg-transition');
    transitions.forEach(t => {
      t.classList.remove('active-transition');
      const path = t.querySelector('path, line');
      if (path) {
        path.setAttribute('stroke', '#475569');
        path.setAttribute('stroke-width', path.tagName.toLowerCase() === 'path' ? '2' : '2.2');
        path.removeAttribute('marker-end-active');
        if (containerId === 'diagram-palindrome') {
          path.setAttribute('marker-end', 'url(#arrow-pal)');
        } else {
          path.setAttribute('marker-end', 'url(#arrow)');
        }
      }
    });

    if (!transitionId) return;

    // Map aliases for palindrome loops
    let targetId = transitionId;
    if (containerId === 'diagram-palindrome') {
      if (transitionId === 'trans-q1-bSb' || transitionId === 'trans-q1-eps') {
        targetId = 'trans-q1-aSa'; // Shares the expansion loop visual
      } else if (transitionId === 'trans-q1-match-b') {
        targetId = 'trans-q1-match-a'; // Shares the matching loop visual
      }
    }

    // Question 1 alias mapping
    if (containerId === 'diagram-matching' && transitionId === 'trans-q0-0-X') {
      targetId = 'trans-q0-0-Z'; // Shares the q0 self-loop visual
    }

    const target = container.querySelector(`#${targetId}`);
    if (target) {
      target.classList.add('active-transition');
      const path = target.querySelector('path, line');
      if (path) {
        path.setAttribute('stroke', '#2563eb');
        path.setAttribute('stroke-width', '3.5');
        if (containerId === 'diagram-palindrome') {
          path.setAttribute('marker-end', 'url(#arrow-pal-active)');
        } else {
          path.setAttribute('marker-end', 'url(#arrow-active)');
        }
      }
    }
  }

  /**
   * Renders the input tape visualization.
   * @param {string} containerId 
   * @param {string} fullInput 
   * @param {number} activeIndex 
   * @param {string} consumedInStep 
   */
  renderInputTape(containerId, fullInput, activeIndex, consumedInStep) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!fullInput || fullInput.length === 0) {
      container.innerHTML = `
        <div class="tape-wrapper empty-tape">
          <div class="tape-cell active current-epsilon">
            <span class="tape-char">ε</span>
            <span class="tape-sub">Empty Input</span>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div class="tape-wrapper">';
    for (let i = 0; i < fullInput.length; i++) {
      const ch = fullInput[i];
      let statusClass = 'upcoming';
      let indicator = '';

      if (i < activeIndex) {
        statusClass = 'consumed';
        indicator = '<span class="cell-status-icon">✓</span>';
      } else if (i === activeIndex) {
        statusClass = 'active';
        indicator = '<div class="tape-head-pointer"><span class="pointer-arrow">▼</span><span class="pointer-text">READING</span></div>';
      }

      html += `
        <div class="tape-cell ${statusClass}">
          ${indicator}
          <span class="tape-char">${ch}</span>
          <span class="tape-index">${i}</span>
        </div>
      `;
    }

    // If input is fully consumed (activeIndex >= length), show end marker
    if (activeIndex >= fullInput.length) {
      html += `
        <div class="tape-cell end-marker active">
          <div class="tape-head-pointer"><span class="pointer-arrow">▼</span><span class="pointer-text">END</span></div>
          <span class="tape-char">⊣</span>
          <span class="tape-index">EOF</span>
        </div>
      `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Smooth horizontal scroll to keep the active character centered
    const tapeWrap = container.querySelector('.tape-wrapper');
    const activeCell = container.querySelector('.tape-cell.active');
    if (tapeWrap && activeCell) {
      const targetScroll = activeCell.offsetLeft - (tapeWrap.clientWidth / 2) + (activeCell.clientWidth / 2);
      tapeWrap.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }

  /**
   * Renders the vertical visual stack.
   * Displays elements from top to bottom visually (top element on top of vertical box).
   * @param {string} containerId 
   * @param {Array<string>} stackArray index 0 is bottom (Z), last element is top.
   * @param {string} lastOperation 'PUSH', 'POP', 'ACCEPT', etc.
   * @param {string} symbolOperated 
   */
  renderVisualStack(containerId, stackArray, lastOperation, symbolOperated) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!stackArray || stackArray.length === 0) {
      container.innerHTML = `
        <div class="stack-box empty-stack">
          <div class="empty-stack-msg">Stack Empty</div>
          <div class="stack-base">BOTTOM OF STACK</div>
        </div>
      `;
      return;
    }

    // Top indicator header
    let html = `
      <div class="stack-box">
        <div class="stack-top-header">
          <span class="stack-top-badge">▲ TOP OF STACK (LIFO)</span>
          <span class="stack-count-badge">${stackArray.length} symbol${stackArray.length === 1 ? '' : 's'}</span>
        </div>
        <div class="stack-elements-container">
    `;

    // Render from top (last index) down to bottom (index 0)
    for (let i = stackArray.length - 1; i >= 0; i--) {
      const sym = stackArray[i];
      const isTop = i === stackArray.length - 1;
      const isBottom = i === 0;

      let colorClass = 'block-default';
      let description = '';

      if (sym === 'Z') {
        colorClass = 'block-bottom-z';
        description = 'Bottom Marker';
      } else if (sym === 'X') {
        colorClass = 'block-x';
        description = 'Counts 0s';
      } else if (sym === 'Y') {
        colorClass = 'block-y';
        description = 'Counts 1s';
      } else if (sym === 'S') {
        colorClass = 'block-s';
        description = 'CFG Variable';
      } else if (sym === 'a') {
        colorClass = 'block-a';
        description = 'Terminal a';
      } else if (sym === 'b') {
        colorClass = 'block-b';
        description = 'Terminal b';
      }

      const topClass = isTop ? 'is-top-element anim-top-focus' : '';
      const bottomClass = isBottom ? 'is-bottom-element' : '';
      const pushAnimClass = (isTop && lastOperation === 'PUSH') ? 'anim-push' : '';

      html += `
        <div class="stack-block ${colorClass} ${topClass} ${bottomClass} ${pushAnimClass}" data-depth="${stackArray.length - 1 - i}">
          <div class="block-left">
            <span class="block-symbol">${sym}</span>
            <span class="block-desc">${description}</span>
          </div>
          <div class="block-right">
            ${isTop ? '<span class="top-tag">TOP</span>' : ''}
            <span class="block-level">idx ${i}</span>
          </div>
        </div>
      `;
    }

    html += `
        </div>
        <div class="stack-base">
          <span class="base-icon">⏚</span>
          <span class="base-text">STACK BASE</span>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Renders the Step Information card.
   * @param {string} containerId 
   * @param {Object} step 
   * @param {number} totalSteps 
   */
  renderStepInfo(containerId, step, totalSteps) {
    const container = document.getElementById(containerId);
    if (!container || !step) return;

    let opBadgeClass = 'badge-init';
    if (step.operation === 'PUSH') opBadgeClass = 'badge-push';
    else if (step.operation === 'POP') opBadgeClass = 'badge-pop';
    else if (step.operation === 'ACCEPT') opBadgeClass = 'badge-accept';
    else if (step.operation === 'REJECT') opBadgeClass = 'badge-reject';

    const inputLabel = step.inputConsumed === '-' 
      ? 'Initial State' 
      : (step.inputConsumed === 'ε' ? 'ε (Epsilon)' : `'${step.inputConsumed}'`);

    const stackBeforeStr = step.stackBefore ? step.stackBefore.join('') : 'Z';
    const stackAfterStr = step.stackAfter ? step.stackAfter.join('') : 'Z';

    const html = `
      <div class="step-card">
        <div class="step-card-header">
          <div class="step-badge-group">
            <span class="step-number-badge">Step ${step.stepNumber} of ${totalSteps - 1}</span>
            <span class="state-badge">State: <strong>${step.state}</strong></span>
            ${step.nextState ? `<span class="next-state-badge">→ <strong>${step.nextState}</strong></span>` : ''}
            <span class="op-badge ${opBadgeClass}">${step.operation}</span>
          </div>
          <div class="step-input-badge">
            <span class="label">Input Consumed:</span>
            <span class="val">${inputLabel}</span>
          </div>
        </div>

        <div class="step-card-body">
          <div class="step-stack-transition">
            <div class="stack-box-pill">
              <span class="pill-label">Stack Before</span>
              <code class="pill-val">${stackBeforeStr}</code>
            </div>
            <div class="transition-arrow">➔</div>
            <div class="stack-box-pill">
              <span class="pill-label">Stack After</span>
              <code class="pill-val">${stackAfterStr}</code>
            </div>
          </div>
          <div class="step-explanation">
            <p>${step.explanation}</p>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Renders the execution trace table.
   * Columns: Step | State | Input Consumed | Stack (Bottom on Left) | Action
   * @param {string} containerId 
   * @param {Array<Object>} steps 
   * @param {number} activeStepIndex 
   */
  renderTraceTable(containerId, steps, activeStepIndex) {
    const container = document.getElementById(containerId);
    if (!container || !steps) return;

    let html = `
      <div class="trace-table-container">
        <table class="trace-table">
          <thead>
            <tr>
              <th class="col-step">Step</th>
              <th class="col-state">State</th>
              <th class="col-input">Input Consumed</th>
              <th class="col-stack">Stack <span class="sub">(Bottom on Left)</span></th>
              <th class="col-action">Action / Operation</th>
            </tr>
          </thead>
          <tbody>
    `;

    steps.forEach((step, idx) => {
      const isActive = idx === activeStepIndex;
      const isPast = idx < activeStepIndex;
      const rowClass = isActive ? 'active-row' : (isPast ? 'past-row' : 'future-row');

      let opBadge = '';
      if (step.operation === 'PUSH') {
        opBadge = `<span class="table-op-badge badge-push">PUSH ${step.symbolOperated || ''}</span>`;
      } else if (step.operation === 'POP') {
        opBadge = `<span class="table-op-badge badge-pop">POP ${step.symbolOperated || ''}</span>`;
      } else if (step.operation === 'ACCEPT') {
        opBadge = `<span class="table-op-badge badge-accept">ACCEPT</span>`;
      } else if (step.operation === 'REJECT') {
        opBadge = `<span class="table-op-badge badge-reject">REJECT</span>`;
      } else {
        opBadge = `<span class="table-op-badge badge-init">INIT</span>`;
      }

      html += `
        <tr id="trace-row-${idx}" class="${rowClass}" onclick="window.app.goToStep(${idx})">
          <td class="col-step">${step.stepNumber}</td>
          <td class="col-state"><code>${step.state}</code></td>
          <td class="col-input"><code>${step.inputConsumed}</code></td>
          <td class="col-stack"><code class="stack-code">${step.stackString}</code></td>
          <td class="col-action">
            ${opBadge}
            <span class="action-summary">${step.production || ''}</span>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Smoothly scroll container internally without shifting window viewport
    const tableContainer = container.querySelector('.trace-table-container');
    const activeRow = container.querySelector('.active-row');
    if (tableContainer && activeRow) {
      const targetScroll = activeRow.offsetTop - (tableContainer.clientHeight / 2) + (activeRow.clientHeight / 2);
      tableContainer.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }

  /**
   * Renders the Palindrome Mirror Comparison widget for Question 2.
   * Input vs Reverse with color-coded matches/mismatches.
   * @param {string} containerId 
   * @param {Object} analysis 
   */
  renderPalindromeMirror(containerId, analysis) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!analysis || !analysis.input || analysis.input.length === 0) {
      container.innerHTML = `
        <div class="palindrome-mirror-box empty-mirror">
          <div class="mirror-status success">Empty String (ε) is inherently an even-length palindrome (0 characters).</div>
        </div>
      `;
      return;
    }

    const input = analysis.input;
    const len = input.length;
    const half = Math.floor(len / 2);

    let html = `
      <div class="palindrome-mirror-box">
        <div class="mirror-header">
          <span class="mirror-title">Symmetry Analysis (Input vs Reverse)</span>
          <span class="mirror-len-badge">Length: ${len} (${analysis.isEvenLength ? 'Even' : 'Odd'})</span>
        </div>

        <div class="mirror-rows">
          <div class="mirror-row">
            <span class="row-label">Input:</span>
            <div class="char-cells">
    `;

    for (let i = 0; i < len; i++) {
      const ch = input[i];
      const j = len - 1 - i;
      const match = input[i] === input[j];
      const isCenter = analysis.isOddLength && i === half;

      let cellClass = match ? 'match-cell' : 'mismatch-cell';
      if (isCenter) cellClass = 'center-cell';

      html += `<span class="mirror-char ${cellClass}" title="Pos ${i + 1}: '${ch}'">${ch}</span>`;
    }

    html += `
            </div>
          </div>

          <div class="mirror-row">
            <span class="row-label">Reverse:</span>
            <div class="char-cells">
    `;

    const reversed = analysis.reversed;
    for (let i = 0; i < len; i++) {
      const ch = reversed[i];
      const j = len - 1 - i;
      const match = reversed[i] === input[i];
      const isCenter = analysis.isOddLength && i === half;

      let cellClass = match ? 'match-cell' : 'mismatch-cell';
      if (isCenter) cellClass = 'center-cell';

      html += `<span class="mirror-char ${cellClass}" title="Pos ${i + 1}: '${ch}'">${ch}</span>`;
    }

    html += `
            </div>
          </div>
        </div>

        <div class="mirror-verdict">
    `;

    if (analysis.isPalindrome && analysis.isEvenLength) {
      html += `
        <div class="mirror-note note-success">
          <span class="icon">✓</span>
          <span><strong>Even-length Palindrome:</strong> String mirrors perfectly from ends to center with an even length (${len} = 2 × ${half}). Successfully recognized by CFG S → aSa | bSb | ε.</span>
        </div>
      `;
    } else if (analysis.isPalindrome && analysis.isOddLength) {
      html += `
        <div class="mirror-note note-warning">
          <span class="icon">⚠</span>
          <span><strong>Odd-length Palindrome:</strong> While '${input}' is symmetrical around center character '${input[half]}', <strong>it cannot be generated by this CFG</strong>. The grammar S → aSa | bSb | ε generates only strings of length 2k.</span>
        </div>
      `;
    } else {
      const mismatch = analysis.firstMismatch;
      html += `
        <div class="mirror-note note-error">
          <span class="icon">✗</span>
          <span><strong>Not a Palindrome:</strong> Mismatch between position ${mismatch ? mismatch.i + 1 : 1} ('${mismatch ? mismatch.c1 : ''}') and position ${mismatch ? mismatch.j + 1 : len} ('${mismatch ? mismatch.c2 : ''}').</span>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Renders the Grammar Derivation step progression for Question 2.
   * @param {string} containerId 
   * @param {Object} simulationResult 
   * @param {number} currentStepIndex 
   */
  renderDerivation(containerId, simulationResult, currentStepIndex) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!simulationResult || !simulationResult.accepted || !simulationResult.analysis) {
      container.innerHTML = `
        <div class="derivation-box empty-derivation">
          <div class="derivation-title">Grammar Derivation</div>
          <div class="no-derivation-msg">No valid leftmost derivation exists for this input under S → aSa | bSb | ε.</div>
        </div>
      `;
      return;
    }

    const derivation = simulationResult.analysis.derivation;
    if (!derivation || derivation.length === 0) return;

    let html = `
      <div class="derivation-box">
        <div class="derivation-title">Leftmost CFG Derivation (S ⇒* w)</div>
        <div class="derivation-chain">
    `;

    derivation.forEach((stepStr, idx) => {
      const isLast = idx === derivation.length - 1;
      html += `
        <div class="derivation-step">
          <span class="step-num">Step ${idx}</span>
          <code class="derivation-code">${stepStr}</code>
        </div>
        ${!isLast ? '<span class="derivation-arrow">⇒</span>' : ''}
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Renders the final ACCEPTED or REJECTED result banner.
   * @param {string} containerId 
   * @param {Object} simulationResult 
   */
  renderResultBanner(containerId, simulationResult) {
    const container = document.getElementById(containerId);
    if (!container || !simulationResult) return;

    let html = '';
    if (simulationResult.accepted) {
      html = `
        <div class="result-banner result-accepted">
          <div class="result-icon-circle">✓</div>
          <div class="result-content">
            <h4 class="result-heading">ACCEPTED</h4>
            <p class="result-text">${simulationResult.reason}</p>
          </div>
        </div>
      `;
    } else {
      html = `
        <div class="result-banner result-rejected">
          <div class="result-icon-circle">✗</div>
          <div class="result-content">
            <h4 class="result-heading">REJECTED</h4>
            <p class="result-text">${simulationResult.reason}</p>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }
}

// Export for module/testing environments as well as browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Visualizer };
} else if (typeof window !== 'undefined') {
  window.Visualizer = Visualizer;
}
