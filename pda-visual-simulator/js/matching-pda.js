/**
 * matching-pda.js
 * 
 * Configurable Pushdown Automaton Engine.
 * 
 * Default Assignment Problem:
 * L = { 0^i 1^j 2^j 3^i | i, j >= 1 }
 * 
 * Capabilities:
 * - Solves the default assignment with exact mathematical counts and transition sequence
 * - Can be configured with other language presets (e.g. 0^n 1^n, a^n b^{2n}, w c w^R)
 * - Supports custom user-defined PDA transition tables:
 *     (state, input, stack-top) -> (next-state, replacement)
 * - Restores default settings with one click.
 */

class MatchingPDA {
  constructor() {
    this.name = 'Configurable Pushdown Automaton';
    this.maxInputLength = 30;

    // Presets definitions
    this.presets = {
      default: {
        key: 'default',
        equation: 'L = { 0ⁱ1ʲ2ʲ3ⁱ | i, j ≥ 1 }',
        description: 'Equal 0s & 3s, equal 1s & 2s • Strict order: 0-1-2-3 • Stack Alphabet: {Z, X, Y}',
        defaultInput: '00112233',
        alphabet: ['0', '1', '2', '3'],
        states: ['q0', 'q1', 'q2', 'q3', 'qf'],
        startState: 'q0',
        acceptState: 'qf',
        transitionsText: `(q0, 0, Z) -> (q0, XZ)\n(q0, 0, X) -> (q0, XX)\n(q0, 1, X) -> (q1, YX)\n(q1, 1, Y) -> (q1, YY)\n(q1, 2, Y) -> (q2, ε)\n(q2, 2, Y) -> (q2, ε)\n(q2, 3, X) -> (q3, ε)\n(q3, 3, X) -> (q3, ε)\n(q3, ε, Z) -> (qf, Z)`
      },
      equal01: {
        key: 'equal01',
        equation: 'L = { 0ⁿ1ⁿ | n ≥ 1 }',
        description: 'Equal number of 0s followed by equal number of 1s • Stack Alphabet: {Z, X}',
        defaultInput: '0011',
        alphabet: ['0', '1'],
        states: ['q0', 'q1', 'qf'],
        startState: 'q0',
        acceptState: 'qf',
        transitionsText: `(q0, 0, Z) -> (q0, XZ)\n(q0, 0, X) -> (q0, XX)\n(q0, 1, X) -> (q1, ε)\n(q1, 1, X) -> (q1, ε)\n(q1, ε, Z) -> (qf, Z)`
      },
      doubleB: {
        key: 'doubleB',
        equation: 'L = { aⁿb²ⁿ | n ≥ 1 }',
        description: 'Twice as many b\'s as a\'s • Stack Alphabet: {Z, X}',
        defaultInput: 'aabbbb',
        alphabet: ['a', 'b'],
        states: ['q0', 'q1', 'qf'],
        startState: 'q0',
        acceptState: 'qf',
        transitionsText: `(q0, a, Z) -> (q0, XXZ)\n(q0, a, X) -> (q0, XXX)\n(q0, b, X) -> (q1, ε)\n(q1, b, X) -> (q1, ε)\n(q1, ε, Z) -> (qf, Z)`
      },
      markedPal: {
        key: 'markedPal',
        equation: 'L = { w c wᴿ | w ∈ {0,1}* }',
        description: 'Binary palindrome mirrored around center symbol c',
        defaultInput: '01c10',
        alphabet: ['0', '1', 'c'],
        states: ['q0', 'q1', 'qf'],
        startState: 'q0',
        acceptState: 'qf',
        transitionsText: `(q0, 0, Z) -> (q0, 0Z)\n(q0, 1, Z) -> (q0, 1Z)\n(q0, 0, 0) -> (q0, 00)\n(q0, 0, 1) -> (q0, 01)\n(q0, 1, 0) -> (q0, 10)\n(q0, 1, 1) -> (q0, 11)\n(q0, c, Z) -> (q1, Z)\n(q0, c, 0) -> (q1, 0)\n(q0, c, 1) -> (q1, 1)\n(q1, 0, 0) -> (q1, ε)\n(q1, 1, 1) -> (q1, ε)\n(q1, ε, Z) -> (qf, Z)`
      }
    };

    // Initialize with default
    this.setPreset('default');
  }

  /**
   * Sets the active language preset or custom configuration.
   * @param {string} presetKey 'default' | 'equal01' | 'doubleB' | 'markedPal' | 'custom'
   * @param {Object} [customConfig]
   */
  setPreset(presetKey, customConfig) {
    if (presetKey === 'custom' && customConfig) {
      this.currentPresetKey = 'custom';
      this.languageDescription = customConfig.equation || 'Custom PDA';
      this.description = customConfig.description || 'User Defined PDA';
      this.defaultInput = customConfig.defaultInput || '01';
      this.alphabet = customConfig.alphabet || ['0', '1'];
      this.states = customConfig.states || ['q0', 'q1', 'qf'];
      this.startState = customConfig.startState || 'q0';
      this.acceptState = customConfig.acceptState || 'qf';
      this.transitionsText = customConfig.transitionsText || '';
      this.parsedTransitions = this._parseTransitions(this.transitionsText);
      this.isDefault = false;
      return;
    }

    const preset = this.presets[presetKey] || this.presets.default;
    this.currentPresetKey = preset.key;
    this.languageDescription = preset.equation;
    this.description = preset.description;
    this.defaultInput = preset.defaultInput;
    this.alphabet = [...preset.alphabet];
    this.states = [...preset.states];
    this.startState = preset.startState;
    this.acceptState = preset.acceptState;
    this.transitionsText = preset.transitionsText;
    this.parsedTransitions = this._parseTransitions(this.transitionsText);
    this.isDefault = preset.key === 'default';
  }

  /**
   * Resets the language back to the default assignment problem.
   */
  resetToDefault() {
    this.setPreset('default');
  }

  /**
   * Parses transition text lines into structured transition rules.
   */
  _parseTransitions(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
    const transitions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/\s*->\s*|\s*→\s*/);
      if (parts.length < 2) continue;

      const left = parts[0].replace(/[\(\)]/g, '').split(',').map(s => s.trim());
      const right = parts[1].replace(/[\(\)]/g, '').split(',').map(s => s.trim());
      if (left.length < 3 || right.length < 2) continue;

      const state = left[0];
      const input = (left[1] === 'ε' || left[1] === 'eps' || left[1] === 'e') ? 'ε' : left[1];
      const stackTop = left[2];
      const nextState = right[0];
      const replacement = (right[1] === 'ε' || right[1] === 'eps' || right[1] === 'e') ? '' : right[1];

      transitions.push({
        id: `trans-${state}-${input}-${stackTop}-${i}`,
        state,
        input,
        stackTop,
        nextState,
        replacement,
        raw: line
      });
    }

    return transitions;
  }

  /**
   * Validates input string syntax and length.
   * @param {string} input 
   * @returns {{ valid: boolean, error?: string }}
   */
  validateInput(input) {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a string.' };
    }
    if (input.length > this.maxInputLength) {
      return { 
        valid: false, 
        error: `Input length (${input.length}) exceeds the maximum allowed limit of ${this.maxInputLength} characters.` 
      };
    }

    const allowed = new Set(this.alphabet);
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (!allowed.has(ch)) {
        return { 
          valid: false, 
          error: `Invalid character '${ch}' at position ${i + 1}. Alphabet is Σ = {${this.alphabet.join(', ')}}.` 
        };
      }
    }
    return { valid: true };
  }

  /**
   * Simulates the PDA step-by-step on the input string.
   * If default preset is active, runs the dedicated canonical simulation.
   * If other preset or custom PDA is active, runs the generalized transition runner.
   * @param {string} input 
   */
  simulate(input) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      return {
        input,
        isValid: false,
        accepted: false,
        validationError: validation.error,
        reason: validation.error,
        steps: [],
        counts: null
      };
    }

    // Default college assignment language simulation
    if (this.isDefault) {
      return this._simulateDefaultMatching(input);
    }

    // General simulation for other presets or custom PDAs
    return this._simulateGeneralPDA(input);
  }

  /**
   * General transition runner for configurable PDAs.
   */
  _simulateGeneralPDA(input) {
    const len = input.length;
    const steps = [];
    const getStackString = (stk) => stk.join('');

    let state = this.startState;
    let stack = ['Z'];
    let pos = 0;

    // Step 0: Initial configuration
    steps.push({
      stepNumber: 0,
      state: this.startState,
      nextState: null,
      activeTransitionId: null,
      inputConsumed: '-',
      inputPosition: -1,
      inputRemaining: input || 'ε',
      stackBefore: ['Z'],
      stackAfter: ['Z'],
      stackString: 'Z',
      operation: 'INITIALIZE',
      symbolOperated: 'Z',
      explanation: `PDA initialized in state ${this.startState} with bottom marker Z.`
    });

    let accepted = false;
    let haltedReason = '';
    let maxSteps = 200;

    while (maxSteps-- > 0) {
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : null;
      const currentChar = pos < len ? input[pos] : null;
      const stackBefore = [...stack];

      // Check accepting condition first if input is exhausted and in accept state
      if (pos === len && state === this.acceptState && stackTop === 'Z') {
        accepted = true;
        break;
      }

      // Find matching transition
      let matchedTrans = null;

      // 1. Try consuming next input symbol
      if (currentChar !== null) {
        matchedTrans = this.parsedTransitions.find(t => t.state === state && t.input === currentChar && t.stackTop === stackTop);
      }

      // 2. Try epsilon transition
      if (!matchedTrans) {
        matchedTrans = this.parsedTransitions.find(t => t.state === state && t.input === 'ε' && t.stackTop === stackTop);
      }

      if (matchedTrans) {
        // Execute transition
        stack.pop(); // pop stackTop
        // push replacement in reverse order (top on left convention)
        if (matchedTrans.replacement) {
          for (let r = matchedTrans.replacement.length - 1; r >= 0; r--) {
            stack.push(matchedTrans.replacement[r]);
          }
        }

        const consumedSym = matchedTrans.input === 'ε' ? 'ε' : currentChar;
        if (matchedTrans.input !== 'ε') {
          pos++;
        }

        const op = matchedTrans.replacement.length > 1 ? 'PUSH' : (matchedTrans.replacement.length === 0 ? 'POP' : 'REPLACE');

        steps.push({
          stepNumber: steps.length,
          state,
          nextState: matchedTrans.nextState,
          activeTransitionId: matchedTrans.id,
          inputConsumed: consumedSym,
          inputPosition: matchedTrans.input !== 'ε' ? pos - 1 : pos,
          inputRemaining: input.slice(pos) || 'ε',
          stackBefore,
          stackAfter: [...stack],
          stackString: getStackString(stack),
          operation: op,
          symbolOperated: matchedTrans.replacement || matchedTrans.stackTop,
          production: matchedTrans.raw,
          explanation: `Transition: ${matchedTrans.raw}. Stack becomes ${getStackString(stack)}.`
        });

        state = matchedTrans.nextState;

        // Check if just entered accept state with empty input
        if (state === this.acceptState && pos === len) {
          accepted = true;
          break;
        }
      } else {
        // No transition possible
        if (pos === len && state === this.acceptState) {
          accepted = true;
        } else if (pos === len && stackTop !== 'Z') {
          haltedReason = `Input exhausted, but unmatched symbols remain on stack (${stackTop}) in non-final state ${state}.`;
        } else if (pos < len) {
          haltedReason = `No transition defined in state ${state} for input symbol '${currentChar}' with stack top '${stackTop}'.`;
        } else {
          haltedReason = `Computation halted in non-accepting state ${state}.`;
        }
        break;
      }
    }

    if (!accepted) {
      steps.push({
        stepNumber: steps.length,
        state,
        nextState: null,
        activeTransitionId: null,
        inputConsumed: pos < len ? input[pos] : 'ε',
        inputPosition: pos,
        inputRemaining: input.slice(pos) || 'ε',
        stackBefore: [...stack],
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'REJECT',
        symbolOperated: null,
        explanation: haltedReason || `Rejected in state ${state}.`
      });
    }

    return {
      input,
      isValid: true,
      accepted,
      reason: accepted 
        ? `ACCEPTED: Input '${input}' successfully recognized by ${this.languageDescription}.`
        : `REJECTED: ${haltedReason}`,
      steps,
      counts: null,
      failedAtStep: accepted ? null : steps.length - 1,
      failedState: accepted ? null : state
    };
  }

  /**
   * Dedicated canonical implementation for the default college assignment problem.
   * Matches original 38 unit tests exactly.
   */
  _simulateDefaultMatching(input) {
    const steps = [];
    let state = 'q0';
    let stack = ['Z'];
    let pos = 0;
    const len = input.length;

    const getStackString = (stk) => stk.join('');

    steps.push({
      stepNumber: 0,
      state: 'q0',
      nextState: null,
      activeTransitionId: null,
      inputConsumed: '-',
      inputPosition: -1,
      inputRemaining: input,
      stackBefore: ['Z'],
      stackAfter: ['Z'],
      stackString: 'Z',
      operation: 'INITIALIZE',
      symbolOperated: 'Z',
      explanation: 'PDA initialized in state q0 with bottom-of-stack marker Z.'
    });

    if (len === 0) {
      return {
        input: '',
        isValid: true,
        accepted: false,
        reason: 'Empty string rejected: The language requires i ≥ 1 and j ≥ 1 (at least one 0, 1, 2, and 3). The PDA has no ε-transition from q0 with stack Z.',
        steps,
        counts: null,
        failedAtStep: 0,
        failedState: 'q0'
      };
    }

    let accepted = false;
    let rejectionReason = '';
    let count0 = 0;
    let count1 = 0;
    let count2 = 0;
    let count3 = 0;

    while (true) {
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : null;
      const currentChar = pos < len ? input[pos] : null;
      const stackBefore = [...stack];

      if (state === 'q0') {
        if (currentChar === '0' && stackTop === 'Z') {
          stack.push('X');
          count0++;
          pos++;
          steps.push({
            stepNumber: steps.length,
            state: 'q0',
            nextState: 'q0',
            activeTransitionId: 'trans-q0-0-Z',
            inputConsumed: '0',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'PUSH',
            symbolOperated: 'X',
            explanation: 'Reading first 0: Pops Z, pushes XZ (stack top is now X) to begin counting 0s.'
          });
          continue;
        } else if (currentChar === '0' && stackTop === 'X') {
          stack.push('X');
          count0++;
          pos++;
          steps.push({
            stepNumber: steps.length,
            state: 'q0',
            nextState: 'q0',
            activeTransitionId: 'trans-q0-0-X',
            inputConsumed: '0',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'PUSH',
            symbolOperated: 'X',
            explanation: 'Reading 0: Pops X, pushes XX (stack top is X) to count another 0.'
          });
          continue;
        } else if (currentChar === '1' && stackTop === 'X') {
          stack.push('Y');
          count1++;
          pos++;
          state = 'q1';
          steps.push({
            stepNumber: steps.length,
            state: 'q0',
            nextState: 'q1',
            activeTransitionId: 'trans-q0-1-X',
            inputConsumed: '1',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'PUSH',
            symbolOperated: 'Y',
            explanation: 'Reading first 1: Transitions to state q1 and pushes Y onto stack above X (counting 1s).'
          });
          continue;
        } else {
          if (currentChar === null) {
            rejectionReason = `Input ended prematurely in state q0. No '1', '2', or '3' symbols provided. Language requires i, j ≥ 1.`;
          } else if (stackTop === 'Z') {
            rejectionReason = `Invalid starting symbol '${currentChar}'. In state q0 with stack bottom Z, expected '0'. Language requires i ≥ 1.`;
          } else {
            rejectionReason = `Unexpected symbol '${currentChar}' in state q0. Allowed symbols in q0 are '0' (count 0s) or '1' (switch to q1).`;
          }
          break;
        }
      } else if (state === 'q1') {
        if (currentChar === '1' && stackTop === 'Y') {
          stack.push('Y');
          count1++;
          pos++;
          steps.push({
            stepNumber: steps.length,
            state: 'q1',
            nextState: 'q1',
            activeTransitionId: 'trans-q1-1-Y',
            inputConsumed: '1',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'PUSH',
            symbolOperated: 'Y',
            explanation: 'Reading 1: Pops Y, pushes YY (stack top is Y) to count another 1.'
          });
          continue;
        } else if (currentChar === '2' && stackTop === 'Y') {
          stack.pop();
          count2++;
          pos++;
          state = 'q2';
          steps.push({
            stepNumber: steps.length,
            state: 'q1',
            nextState: 'q2',
            activeTransitionId: 'trans-q1-2-Y',
            inputConsumed: '2',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'POP',
            symbolOperated: 'Y',
            explanation: 'Reading first 2: Transitions to state q2 and pops Y (matching 2 with 1).'
          });
          continue;
        } else {
          if (currentChar === null) {
            rejectionReason = `Input ended prematurely in state q1. Missing '2' and '3' symbols. All 1s (${count1}) must be matched by 2s.`;
          } else if (currentChar === '0') {
            rejectionReason = `Incorrect symbol order: Encountered '0' after '1' in state q1. Symbols must follow strict 0-1-2-3 ordering.`;
          } else if (currentChar === '3') {
            rejectionReason = `Encountered '3' in state q1 before any '2' was processed. Language requires j ≥ 1 (at least one '2' matching '1').`;
          } else {
            rejectionReason = `Undefined transition in state q1 on symbol '${currentChar}' with stack top '${stackTop}'.`;
          }
          break;
        }
      } else if (state === 'q2') {
        if (currentChar === '2' && stackTop === 'Y') {
          stack.pop();
          count2++;
          pos++;
          steps.push({
            stepNumber: steps.length,
            state: 'q2',
            nextState: 'q2',
            activeTransitionId: 'trans-q2-2-Y',
            inputConsumed: '2',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'POP',
            symbolOperated: 'Y',
            explanation: 'Reading 2: Pops Y from stack top to match a previously read 1.'
          });
          continue;
        } else if (currentChar === '3' && stackTop === 'X') {
          stack.pop();
          count3++;
          pos++;
          state = 'q3';
          steps.push({
            stepNumber: steps.length,
            state: 'q2',
            nextState: 'q3',
            activeTransitionId: 'trans-q2-3-X',
            inputConsumed: '3',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'POP',
            symbolOperated: 'X',
            explanation: 'Reading first 3: All Ys popped (1s and 2s balanced). Transitions to state q3 and pops X to match 3 with 0.'
          });
          continue;
        } else {
          if (currentChar === '2' && stackTop !== 'Y') {
            rejectionReason = `Stack mismatch in state q2: Found extra '2' when stack top was '${stackTop}' (all Ys were already popped). Count of 2s exceeds 1s.`;
          } else if (currentChar === '3' && stackTop === 'Y') {
            rejectionReason = `Stack mismatch in state q2: Encountered '3' while 'Y' remains on stack. Fewer 2s were read than 1s (found ${count2} twos vs ${count1} ones).`;
          } else if (currentChar === null) {
            rejectionReason = `Input ended prematurely in state q2. Unmatched symbols remain on stack (${stackTop}). Missing '3' symbols.`;
          } else {
            rejectionReason = `Unexpected symbol '${currentChar}' in state q2 with stack top '${stackTop}'. Expected '2' (if Y on stack) or '3' (if X on stack).`;
          }
          break;
        }
      } else if (state === 'q3') {
        if (currentChar === '3' && stackTop === 'X') {
          stack.pop();
          count3++;
          pos++;
          steps.push({
            stepNumber: steps.length,
            state: 'q3',
            nextState: 'q3',
            activeTransitionId: 'trans-q3-3-X',
            inputConsumed: '3',
            inputPosition: pos - 1,
            inputRemaining: input.slice(pos),
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'POP',
            symbolOperated: 'X',
            explanation: 'Reading 3: Pops X from stack top to match a previously read 0.'
          });
          continue;
        } else if (currentChar === null && stackTop === 'Z') {
          state = 'qf';
          steps.push({
            stepNumber: steps.length,
            state: 'q3',
            nextState: 'qf',
            activeTransitionId: 'trans-q3-eps-Z',
            inputConsumed: 'ε',
            inputPosition: pos,
            inputRemaining: '',
            stackBefore,
            stackAfter: [...stack],
            stackString: getStackString(stack),
            operation: 'ACCEPT',
            symbolOperated: 'Z',
            explanation: 'Input exhausted and stack bottom marker Z reached: Transitions to final state qf via (ε, Z → Z). ACCEPTED!'
          });
          accepted = true;
          break;
        } else {
          if (currentChar === '3' && stackTop === 'Z') {
            rejectionReason = `Stack mismatch in state q3: Encountered extra '3' when stack top was bottom marker 'Z'. More 3s were read than 0s.`;
          } else if (currentChar === null && stackTop === 'X') {
            rejectionReason = `Input exhausted in state q3, but unmatched 'X' symbols remain on stack. Fewer 3s were read than 0s (${count3} threes vs ${count0} zeros).`;
          } else if (currentChar !== null) {
            rejectionReason = `Unexpected symbol '${currentChar}' in state q3. In q3, only '3' (pop X) is accepted.`;
          } else {
            rejectionReason = `Undefined transition in state q3 with stack top '${stackTop}'.`;
          }
          break;
        }
      } else {
        break;
      }
    }

    if (!accepted) {
      steps.push({
        stepNumber: steps.length,
        state,
        nextState: null,
        activeTransitionId: null,
        inputConsumed: pos < len ? input[pos] : 'ε',
        inputPosition: pos < len ? pos : pos,
        inputRemaining: input.slice(pos),
        stackBefore: [...stack],
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'REJECT',
        symbolOperated: null,
        explanation: `Computation halted in non-accepting state ${state}. Reason: ${rejectionReason}`
      });
    }

    return {
      input,
      isValid: true,
      accepted,
      reason: accepted 
        ? `ACCEPTED: i = ${count0} and j = ${count1}. Both pairs of symbol counts match (0s = 3s = ${count0}, 1s = 2s = ${count1}).`
        : rejectionReason,
      steps,
      counts: accepted ? { i: count0, j: count1 } : null,
      failedAtStep: accepted ? null : steps.length - 1,
      failedState: accepted ? null : state
    };
  }
}

// Export for module/testing environments as well as browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MatchingPDA };
} else if (typeof window !== 'undefined') {
  window.MatchingPDA = MatchingPDA;
}
