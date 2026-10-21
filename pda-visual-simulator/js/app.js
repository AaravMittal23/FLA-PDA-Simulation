/**
 * app.js
 * 
 * Application Controller for the PDA Visual Simulator.
 * Coordinates between PDA computation engines (matching-pda, palindrome-pda),
 * visual rendering (visualizer), and user interaction (tabs, controls, inputs, presets).
 */

class App {
  constructor() {
    this.visualizer = new Visualizer();
    this.matchingPDA = new MatchingPDA();
    this.palindromePDA = new PalindromePDA();

    // Active tab: 'matching' | 'palindrome'
    this.activeTab = 'matching';

    // State for Tab 1 (Matching PDA)
    this.tab1 = {
      pda: this.matchingPDA,
      defaultInput: '00112233',
      currentInput: '00112233',
      simulationResult: null,
      currentStepIndex: 0,
      isPlaying: false,
      timer: null,
      speedMs: 800, // 800ms normal, 1500ms slow, 350ms fast
      diagramId: 'diagram-matching',
      tapeId: 'tape-matching',
      stackId: 'stack-matching',
      stepInfoId: 'step-info-matching',
      traceTableId: 'trace-table-matching',
      resultBannerId: 'result-banner-matching',
      inputId: 'input-matching',
      stepCounterId: 'step-counter-matching'
    };

    // State for Tab 2 (Palindrome PDA)
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
    this.visualizer.initDiagrams();

    // 2. Initialize simulation data for both tabs
    this.loadSimulation('matching', this.tab1.defaultInput);
    this.loadSimulation('palindrome', this.tab2.defaultInput);

    // 3. Attach event listeners
    this.attachEventListeners();

    // 4. Initial render of active tab
    this.renderCurrentState();

    // Make app accessible to global window for trace table onclick handlers
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

    // Pause any active auto-play
    this.pause(tabName);

    // Update input and simulate
    tabState.currentInput = input;
    tabState.simulationResult = tabState.pda.simulate(input);
    tabState.currentStepIndex = 0;

    // Update input element in DOM if out of sync
    const inputEl = document.getElementById(tabState.inputId);
    if (inputEl && inputEl.value !== input) {
      inputEl.value = input;
    }

    // Render tab components
    this.renderTab(tabName);
  }

  /**
   * Attaches event listeners for tabs, controls, presets, and keyboard shortcuts.
   */
  attachEventListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Setup controls for Matching PDA
    this.setupTabControls('matching', 'matching');

    // Setup controls for Palindrome PDA
    this.setupTabControls('palindrome', 'palindrome');

    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-value');
        const tab = btn.getAttribute('data-tab') || this.activeTab;
        this.loadSimulation(tab, value);
      });
    });

    // Keyboard shortcuts (Left/Right arrows, Space, Esc)
    window.addEventListener('keydown', (e) => {
      // Don't trigger if user is typing in an input field
      if (e.target.tagName.toLowerCase() === 'input') return;

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

    // Input string field
    const inputEl = document.getElementById(tabState.inputId);
    if (inputEl) {
      inputEl.addEventListener('input', (e) => {
        const rawVal = e.target.value.trim();
        this.loadSimulation(tabKey, rawVal);
      });
    }

    // Play button
    const playBtn = document.getElementById(`btn-play-${prefix}`);
    if (playBtn) {
      playBtn.addEventListener('click', () => this.play(tabKey));
    }

    // Pause button
    const pauseBtn = document.getElementById(`btn-pause-${prefix}`);
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause(tabKey));
    }

    // Next step button
    const nextBtn = document.getElementById(`btn-next-${prefix}`);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep(tabKey));
    }

    // Prev step button
    const prevBtn = document.getElementById(`btn-prev-${prefix}`);
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep(tabKey));
    }

    // Reset button
    const resetBtn = document.getElementById(`btn-reset-${prefix}`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset(tabKey));
    }

    // Speed options
    const speedSelect = document.getElementById(`speed-select-${prefix}`);
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        tabState.speedMs = parseInt(e.target.value, 10) || 800;
        // If currently playing, restart timer with new speed
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

    // Pause current tab
    this.pause(this.activeTab);

    this.activeTab = tabName;

    // Update tab button classes
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });

    // Update section visibility
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-panel-${tabName}`);
    });

    // Re-render state
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
      // Reached the end
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

    // If already at end, restart from step 0
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
   * Jumps to a specific step index (e.g. from table click).
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
