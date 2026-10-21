/**
 * app.js
 * 
 * Application Controller for the PDA Visual Simulator.
 * Coordinates between PDA computation engines (matching-pda, palindrome-pda),
 * visual rendering (visualizer), dynamic configuration drawers, and user interactions.
 */

class App {
  constructor() {
    this.visualizer = new Visualizer();
    this.matchingPDA = new MatchingPDA();
    this.palindromePDA = new PalindromePDA();

    // Active tab: 'matching' | 'palindrome'
    this.activeTab = 'matching';

    // State for Tab 1 (Matching / Configurable PDA)
    this.tab1 = {
      pda: this.matchingPDA,
      defaultInput: '00112233',
      currentInput: '00112233',
      simulationResult: null,
      currentStepIndex: 0,
      isPlaying: false,
      timer: null,
      speedMs: 800,
      diagramId: 'diagram-matching',
      tapeId: 'tape-matching',
      stackId: 'stack-matching',
      stepInfoId: 'step-info-matching',
      traceTableId: 'trace-table-matching',
      resultBannerId: 'result-banner-matching',
      inputId: 'input-matching',
      stepCounterId: 'step-counter-matching'
    };

    // State for Tab 2 (Palindrome / General CFG-to-PDA)
    this.tab2 = {
      pda: this.palindromePDA,
      defaultInput: 'abba',
      currentInput: 'abba',
      simulationResult: null,
      currentStepIndex: 0,
      isPlaying: false,
      timer: null,
      speedMs: 800,
      diagramId: 'diagram-palindrome',
      tapeId: 'tape-palindrome',
      stackId: 'stack-palindrome',
      stepInfoId: 'step-info-palindrome',
      traceTableId: 'trace-table-palindrome',
      resultBannerId: 'result-banner-palindrome',
      mirrorId: 'mirror-palindrome',
      derivationId: 'derivation-palindrome',
      inputId: 'input-palindrome',
      stepCounterId: 'step-counter-palindrome'
    };
  }

  /**
   * Initializes the application.
   */
  init() {
    // 1. Render base SVG diagrams
    this.visualizer.initDiagrams(this.matchingPDA, this.palindromePDA);

    // 2. Initialize simulation data for both tabs
    this.loadSimulation('matching', this.tab1.defaultInput);
    this.loadSimulation('palindrome', this.tab2.defaultInput);

    // 3. Attach event listeners
    this.attachEventListeners();
    this.setupConfigurationDrawers();

    // 4. Initial render of active tab
    this.renderCurrentState();

    // Global reference for onclick handlers
    window.app = this;
  }

  /**
   * Helper to get state of currently active tab.
   */
  getActiveState() {
    return this.activeTab === 'matching' ? this.tab1 : this.tab2;
  }

  /**
   * Loads or reloads a simulation for a specific tab with new input.
   * @param {'matching' | 'palindrome'} tabName 
   * @param {string} input 
   */
  loadSimulation(tabName, input) {
    const tabState = tabName === 'matching' ? this.tab1 : this.tab2;

    this.pause(tabName);

    tabState.currentInput = input;
    tabState.simulationResult = tabState.pda.simulate(input);
    tabState.currentStepIndex = 0;

    const inputEl = document.getElementById(tabState.inputId);
    if (inputEl && inputEl.value !== input) {
      inputEl.value = input;
    }

    this.renderTab(tabName);
  }

  /**
   * Sets up dynamic customization drawers for both tabs.
   */
  setupConfigurationDrawers() {
    // ==========================================
    // Tab 1: Question 1 Configuration
    // ==========================================
    const presetSelectQ1 = document.getElementById('preset-select-matching');
    const customEqQ1 = document.getElementById('custom-eq-matching');
    const customDescQ1 = document.getElementById('custom-desc-matching');
    const customTransBoxQ1 = document.getElementById('custom-trans-box-matching');
    const customTransTextQ1 = document.getElementById('custom-transitions-matching');
    const btnApplyQ1 = document.getElementById('btn-apply-matching');
    const btnResetQ1 = document.getElementById('btn-reset-config-matching');
    const badgeQ1 = document.getElementById('config-badge-matching');

    if (presetSelectQ1) {
      presetSelectQ1.addEventListener('change', (e) => {
        const key = e.target.value;
        if (key === 'custom') {
          if (customTransBoxQ1) customTransBoxQ1.style.display = 'block';
          if (customTransTextQ1 && !customTransTextQ1.value.trim()) {
            customTransTextQ1.value = this.matchingPDA.presets.default.transitionsText;
          }
        } else {
          if (customTransBoxQ1) customTransBoxQ1.style.display = 'none';
          const p = this.matchingPDA.presets[key];
          if (p) {
            if (customEqQ1) customEqQ1.value = p.equation;
            if (customDescQ1) customDescQ1.value = p.description;
            if (customTransTextQ1) customTransTextQ1.value = p.transitionsText;
          }
        }
      });
    }

    if (btnApplyQ1) {
      btnApplyQ1.addEventListener('click', () => {
        const key = presetSelectQ1 ? presetSelectQ1.value : 'default';
        if (key === 'custom') {
          this.matchingPDA.setPreset('custom', {
            equation: customEqQ1 ? customEqQ1.value.trim() : 'Custom PDA',
            description: customDescQ1 ? customDescQ1.value.trim() : 'User Defined PDA',
            transitionsText: customTransTextQ1 ? customTransTextQ1.value : ''
          });
          if (badgeQ1) badgeQ1.textContent = 'Custom PDA Active';
        } else {
          this.matchingPDA.setPreset(key);
          if (badgeQ1) badgeQ1.textContent = key === 'default' ? 'Default: 0ⁱ1ʲ2ʲ3ⁱ' : `Preset: ${this.matchingPDA.languageDescription}`;
        }

        // Update problem strip
        const eqEl = document.getElementById('math-eq-matching');
        const descEl = document.getElementById('strip-desc-matching');
        if (eqEl) eqEl.textContent = this.matchingPDA.languageDescription;
        if (descEl) descEl.textContent = this.matchingPDA.description;

        // Re-render SVG diagram
        this.visualizer.renderMatchingDiagram('diagram-matching', this.matchingPDA);

        // Update presets buttons in DOM
        this.updatePresetsDOM('matching', key);

        // Reload simulation with default input for this preset
        this.loadSimulation('matching', this.matchingPDA.defaultInput);
      });
    }

    if (btnResetQ1) {
      btnResetQ1.addEventListener('click', () => {
        this.matchingPDA.resetToDefault();
        if (presetSelectQ1) presetSelectQ1.value = 'default';
        if (customTransBoxQ1) customTransBoxQ1.style.display = 'none';
        const p = this.matchingPDA.presets.default;
        if (customEqQ1) customEqQ1.value = p.equation;
        if (customDescQ1) customDescQ1.value = p.description;
        if (badgeQ1) badgeQ1.textContent = 'Default: 0ⁱ1ʲ2ʲ3ⁱ';

        const eqEl = document.getElementById('math-eq-matching');
        const descEl = document.getElementById('strip-desc-matching');
        if (eqEl) eqEl.textContent = p.equation;
        if (descEl) descEl.textContent = p.description;

        this.visualizer.renderMatchingDiagram('diagram-matching', this.matchingPDA);
        this.updatePresetsDOM('matching', 'default');
        this.loadSimulation('matching', p.defaultInput);
      });
    }

    // ==========================================
    // Tab 2: Question 2 Configuration
    // ==========================================
    const presetSelectQ2 = document.getElementById('preset-select-palindrome');
    const customDescQ2 = document.getElementById('custom-desc-palindrome');
    const customGrammarInput = document.getElementById('custom-grammar-input');
    const btnApplyQ2 = document.getElementById('btn-apply-palindrome');
    const btnResetQ2 = document.getElementById('btn-reset-config-palindrome');
    const badgeQ2 = document.getElementById('config-badge-palindrome');

    const grammarPresets = {
      default: {
        grammar: 'S -> aSa | bSb | ε',
        desc: 'Generates even-length palindromes (length 2k) over {a, b}',
        defaultInput: 'abba',
        badge: 'Default: S → aSa | bSb | ε'
      },
      allPal: {
        grammar: 'S -> aSa | bSb | a | b | ε',
        desc: 'Generates ALL palindromes (both even and odd length) over {a, b}',
        defaultInput: 'aba',
        badge: 'All Palindromes (Even & Odd)'
      },
      anbn: {
        grammar: 'S -> aSb | ε',
        desc: 'Equal number of a\'s followed by b\'s: L = { aⁿbⁿ | n ≥ 0 }',
        defaultInput: 'aabb',
        badge: 'L = { aⁿbⁿ }'
      },
      centerC: {
        grammar: 'S -> 0S0 | 1S1 | c',
        desc: 'Marked center binary palindromes with center delimiter c',
        defaultInput: '01c10',
        badge: 'Marked Center c'
      }
    };

    if (presetSelectQ2) {
      presetSelectQ2.addEventListener('change', (e) => {
        const key = e.target.value;
        if (key !== 'custom' && grammarPresets[key]) {
          const p = grammarPresets[key];
          if (customGrammarInput) customGrammarInput.value = p.grammar;
          if (customDescQ2) customDescQ2.value = p.desc;
        }
      });
    }

    if (btnApplyQ2) {
      btnApplyQ2.addEventListener('click', () => {
        const key = presetSelectQ2 ? presetSelectQ2.value : 'default';
        const grammarText = customGrammarInput ? customGrammarInput.value.trim() : 'S -> aSa | bSb | ε';
        const descText = customDescQ2 ? customDescQ2.value.trim() : '';

        const res = this.palindromePDA.setGrammar(grammarText, descText);
        if (!res.success) {
          alert('Error parsing grammar: ' + res.error);
          return;
        }

        if (badgeQ2) {
          badgeQ2.textContent = key === 'default' ? 'Default: S → aSa | bSb | ε' : `CFG: ${this.palindromePDA.grammar}`;
        }

        // Update problem strip in DOM
        const eqEl = document.getElementById('grammar-badge-palindrome');
        const descEl = document.getElementById('strip-desc-palindrome');
        if (eqEl) eqEl.textContent = this.palindromePDA.grammar;
        if (descEl) descEl.textContent = this.palindromePDA.description;

        // Re-render SVG diagram
        this.visualizer.renderPalindromeDiagram('diagram-palindrome', this.palindromePDA);

        // Update presets in DOM
        this.updatePresetsDOM('palindrome', key);

        const defaultInp = grammarPresets[key] ? grammarPresets[key].defaultInput : (this.palindromePDA.terminals[0] || 'a');
        this.loadSimulation('palindrome', defaultInp);
      });
    }

    if (btnResetQ2) {
      btnResetQ2.addEventListener('click', () => {
        this.palindromePDA.resetToDefault();
        if (presetSelectQ2) presetSelectQ2.value = 'default';
        const p = grammarPresets.default;
        if (customGrammarInput) customGrammarInput.value = p.grammar;
        if (customDescQ2) customDescQ2.value = p.desc;
        if (badgeQ2) badgeQ2.textContent = p.badge;

        const eqEl = document.getElementById('grammar-badge-palindrome');
        const descEl = document.getElementById('strip-desc-palindrome');
        if (eqEl) eqEl.textContent = this.palindromePDA.defaultGrammar;
        if (descEl) descEl.textContent = p.desc;

        this.visualizer.renderPalindromeDiagram('diagram-palindrome', this.palindromePDA);
        this.updatePresetsDOM('palindrome', 'default');
        this.loadSimulation('palindrome', p.defaultInput);
      });
    }
  }

  /**
   * Updates preset button tags dynamically based on the active language or grammar.
   * @param {'matching' | 'palindrome'} tabKey 
   * @param {string} presetKey 
   */
  updatePresetsDOM(tabKey, presetKey) {
    if (tabKey === 'matching') {
      const containerAcc = document.getElementById('presets-acc-matching');
      const containerRej = document.getElementById('presets-rej-matching');
      if (!containerAcc || !containerRej) return;

      let accList = ['0123', '00112233', '011223', '0001122333', '001233'];
      let rejList = ['0011223', '00112333', '01233', '00113223', '0112233', ''];

      if (presetKey === 'equal01') {
        accList = ['01', '0011', '000111', '00001111'];
        rejList = ['001', '011', '10', '00011', ''];
      } else if (presetKey === 'doubleB') {
        accList = ['abb', 'aabbbb', 'aaabbbbbb'];
        rejList = ['ab', 'abbb', 'aab', ''];
      } else if (presetKey === 'markedPal') {
        accList = ['c', '0c0', '1c1', '01c10', '110c011'];
        rejList = ['0c1', '01c01', '00', ''];
      }

      containerAcc.innerHTML = accList.map(v => `<button class="preset-btn preset-acc" data-tab="matching" data-value="${v}">${v === '' ? 'ε (Empty)' : v}</button>`).join(' ');
      containerRej.innerHTML = rejList.map(v => `<button class="preset-btn preset-rej" data-tab="matching" data-value="${v}">${v === '' ? 'ε (Empty)' : v}</button>`).join(' ');
      this.rebindPresetButtons('matching');
    } else if (tabKey === 'palindrome') {
      const containerAcc = document.getElementById('presets-acc-palindrome');
      const containerRej = document.getElementById('presets-rej-palindrome');
      if (!containerAcc || !containerRej) return;

      let accList = ['', 'aa', 'bb', 'abba', 'baab', 'aabbaa'];
      let rejList = ['aba', 'abab', 'aabb', 'abc', 'a'];

      if (presetKey === 'allPal') {
        accList = ['', 'a', 'b', 'aa', 'bb', 'aba', 'bab', 'abba', 'baab'];
        rejList = ['abab', 'aabb', 'ab', 'ba'];
      } else if (presetKey === 'anbn') {
        accList = ['', 'ab', 'aabb', 'aaabbb'];
        rejList = ['aab', 'abb', 'ba', 'a', 'b'];
      } else if (presetKey === 'centerC') {
        accList = ['c', '0c0', '1c1', '01c10', '110c011'];
        rejList = ['0c1', '01c01', '00', 'c0'];
      }

      containerAcc.innerHTML = accList.map(v => `<button class="preset-btn preset-acc" data-tab="palindrome" data-value="${v}">${v === '' ? 'ε (Empty)' : v}</button>`).join(' ');
      containerRej.innerHTML = rejList.map(v => `<button class="preset-btn preset-rej" data-tab="palindrome" data-value="${v}">${v === '' ? 'ε (Empty)' : v}</button>`).join(' ');
      this.rebindPresetButtons('palindrome');
    }
  }

  /**
   * Rebinds click listeners on dynamically generated preset buttons.
   * @param {'matching' | 'palindrome'} tabKey 
   */
  rebindPresetButtons(tabKey) {
    const buttons = document.querySelectorAll(`.preset-btn[data-tab="${tabKey}"]`);
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        this.loadSimulation(tabKey, val);
      });
    });
  }

  /**
   * Attaches general event listeners for tabs, playback controls, and shortcuts.
   */
  attachEventListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    this.setupTabControls('matching', 'matching');
    this.setupTabControls('palindrome', 'palindrome');

    this.rebindPresetButtons('matching');
    this.rebindPresetButtons('palindrome');

    // Global presenter keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        this.nextStep();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        this.prevStep();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        this.reset();
      }
    });
  }

  /**
   * Sets up playback and input controls for a tab.
   * @param {string} tabKey 
   * @param {string} prefix 
   */
  setupTabControls(tabKey, prefix) {
    const tabState = tabKey === 'matching' ? this.tab1 : this.tab2;

    const inputEl = document.getElementById(tabState.inputId);
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        const rawVal = e.target.value.trim();
        this.loadSimulation(tabKey, rawVal);
      });
    }

    const playBtn = document.getElementById(`btn-play-${prefix}`);
    if (playBtn) {
      playBtn.addEventListener('click', () => this.play(tabKey));
    }

    const pauseBtn = document.getElementById(`btn-pause-${prefix}`);
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause(tabKey));
    }

    const nextBtn = document.getElementById(`btn-next-${prefix}`);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep(tabKey));
    }

    const prevBtn = document.getElementById(`btn-prev-${prefix}`);
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep(tabKey));
    }

    const resetBtn = document.getElementById(`btn-reset-${prefix}`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset(tabKey));
    }

    const speedSelect = document.getElementById(`speed-select-${prefix}`);
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        tabState.speedMs = parseInt(e.target.value, 10) || 800;
        if (tabState.isPlaying) {
          this.pause(tabKey);
          this.play(tabKey);
        }
      });
    }
  }

  /**
   * Switches active tab.
   * @param {'matching' | 'palindrome'} tabName 
   */
  switchTab(tabName) {
    if (this.activeTab === tabName) return;

    this.pause(this.activeTab);
    this.activeTab = tabName;

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-panel-${tabName}`);
    });

    this.renderCurrentState();
  }

  /**
   * Renders the current state of the active tab.
   */
  renderCurrentState() {
    this.renderTab(this.activeTab);
  }

  /**
   * Renders all views for the specified tab.
   * @param {'matching' | 'palindrome'} tabKey 
   */
  renderTab(tabKey) {
    const tabState = tabKey === 'matching' ? this.tab1 : this.tab2;
    const sim = tabState.simulationResult;
    const stepIdx = tabState.currentStepIndex;
    const totalSteps = sim.steps.length;

    const currentStep = totalSteps > 0 ? sim.steps[stepIdx] : null;

    // 1. Diagram highlights
    if (currentStep) {
      this.visualizer.highlightState(tabState.diagramId, currentStep.state);
      this.visualizer.highlightTransition(tabState.diagramId, currentStep.activeTransitionId);
    } else {
      this.visualizer.highlightState(tabState.diagramId, null);
      this.visualizer.highlightTransition(tabState.diagramId, null);
    }

    // 2. Input tape
    const activeTapePos = currentStep ? currentStep.inputPosition : 0;
    const consumed = currentStep ? currentStep.inputConsumed : '';
    this.visualizer.renderInputTape(tabState.tapeId, tabState.currentInput, activeTapePos, consumed);

    // 3. Visual vertical stack
    const stack = currentStep ? currentStep.stackAfter : ['Z'];
    const op = currentStep ? currentStep.operation : 'INITIALIZE';
    const symOp = currentStep ? currentStep.symbolOperated : '';
    this.visualizer.renderVisualStack(tabState.stackId, stack, op, symOp);

    // 4. Step info panel
    this.visualizer.renderStepInfo(tabState.stepInfoId, currentStep, totalSteps);

    // 5. Trace table
    this.visualizer.renderTraceTable(tabState.traceTableId, sim.steps, stepIdx);

    // 6. Result banner
    this.visualizer.renderResultBanner(tabState.resultBannerId, sim);

    // 7. Step counter text
    const counterEl = document.getElementById(tabState.stepCounterId);
    if (counterEl) {
      counterEl.textContent = `Step ${stepIdx} of ${Math.max(0, totalSteps - 1)}`;
    }

    // 8. Tab-specific extra panels
    if (tabKey === 'palindrome') {
      this.visualizer.renderPalindromeMirror(tabState.mirrorId, sim.analysis);
      this.visualizer.renderDerivation(tabState.derivationId, sim, stepIdx);
    }

    // 9. Update button enabled/disabled states
    this.updateControlsState(tabKey);

    // 10. Highlight matching active preset button
    const presetBtns = document.querySelectorAll(`.preset-btn[data-tab="${tabKey}"]`);
    presetBtns.forEach(btn => {
      const val = btn.getAttribute('data-value');
      btn.classList.toggle('active-preset', val === tabState.currentInput);
    });
  }

  /**
   * Updates enabled/disabled attributes for buttons.
   * @param {'matching' | 'palindrome'} tabKey 
   */
  updateControlsState(tabKey) {
    const tabState = tabKey === 'matching' ? this.tab1 : this.tab2;
    const prefix = tabKey;
    const totalSteps = tabState.simulationResult ? tabState.simulationResult.steps.length : 0;
    const isAtStart = tabState.currentStepIndex === 0;
    const isAtEnd = tabState.currentStepIndex >= totalSteps - 1;
    const isPlaying = tabState.isPlaying;

    const btnPlay = document.getElementById(`btn-play-${prefix}`);
    const btnPause = document.getElementById(`btn-pause-${prefix}`);
    const btnNext = document.getElementById(`btn-next-${prefix}`);
    const btnPrev = document.getElementById(`btn-prev-${prefix}`);
    const btnReset = document.getElementById(`btn-reset-${prefix}`);

    if (btnPlay) {
      btnPlay.disabled = isPlaying || isAtEnd;
      btnPlay.classList.toggle('active-mode', isPlaying);
    }
    if (btnPause) {
      btnPause.disabled = !isPlaying;
      btnPause.classList.toggle('active-mode', !isPlaying && !isAtEnd);
    }
    if (btnNext) {
      btnNext.disabled = isPlaying || isAtEnd;
    }
    if (btnPrev) {
      btnPrev.disabled = isPlaying || isAtStart;
    }
    if (btnReset) {
      btnReset.disabled = isAtStart && !isPlaying;
    }
  }

  /**
   * Advances one step.
   * @param {'matching' | 'palindrome'} [tabKey] 
   */
  nextStep(tabKey) {
    const key = tabKey || this.activeTab;
    const tabState = key === 'matching' ? this.tab1 : this.tab2;
    const totalSteps = tabState.simulationResult.steps.length;

    if (tabState.currentStepIndex < totalSteps - 1) {
      tabState.currentStepIndex++;
      this.renderTab(key);
    } else {
      this.pause(key);
    }
  }

  /**
   * Moves back one step.
   * @param {'matching' | 'palindrome'} [tabKey] 
   */
  prevStep(tabKey) {
    const key = tabKey || this.activeTab;
    const tabState = key === 'matching' ? this.tab1 : this.tab2;

    if (tabState.currentStepIndex > 0) {
      tabState.currentStepIndex--;
      this.renderTab(key);
    }
  }

  /**
   * Resets simulation to step 0.
   * @param {'matching' | 'palindrome'} [tabKey] 
   */
  reset(tabKey) {
    const key = tabKey || this.activeTab;
    const tabState = key === 'matching' ? this.tab1 : this.tab2;

    this.pause(key);
    tabState.currentStepIndex = 0;
    this.renderTab(key);
  }

  /**
   * Starts automatic play forward.
   * @param {'matching' | 'palindrome'} [tabKey] 
   */
  play(tabKey) {
    const key = tabKey || this.activeTab;
    const tabState = key === 'matching' ? this.tab1 : this.tab2;
    const totalSteps = tabState.simulationResult.steps.length;

    if (tabState.currentStepIndex >= totalSteps - 1) {
      tabState.currentStepIndex = 0;
      this.renderTab(key);
    }

    if (tabState.isPlaying) return;

    tabState.isPlaying = true;
    this.updateControlsState(key);

    tabState.timer = setInterval(() => {
      if (tabState.currentStepIndex < totalSteps - 1) {
        this.nextStep(key);
      } else {
        this.pause(key);
      }
    }, tabState.speedMs);
  }

  /**
   * Pauses automatic play.
   * @param {'matching' | 'palindrome'} [tabKey] 
   */
  pause(tabKey) {
    const key = tabKey || this.activeTab;
    const tabState = key === 'matching' ? this.tab1 : this.tab2;

    if (tabState.timer) {
      clearInterval(tabState.timer);
      tabState.timer = null;
    }
    tabState.isPlaying = false;
    this.updateControlsState(key);
  }

  /**
   * Toggles between play and pause.
   */
  togglePlayPause() {
    const tabState = this.getActiveState();
    if (tabState.isPlaying) {
      this.pause(this.activeTab);
    } else {
      this.play(this.activeTab);
    }
  }

  /**
   * Jumps to a specific step index.
   * @param {number} stepIndex 
   */
  goToStep(stepIndex) {
    const tabState = this.getActiveState();
    const totalSteps = tabState.simulationResult.steps.length;

    if (stepIndex >= 0 && stepIndex < totalSteps) {
      this.pause(this.activeTab);
      tabState.currentStepIndex = stepIndex;
      this.renderTab(this.activeTab);
    }
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
