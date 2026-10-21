/**
 * matching-pda.js
 * 
 * Implementation of the Pushdown Automaton for:
 * L = { 0^i 1^j 2^j 3^i | i, j >= 1 }
 * 
 * Formal Definition:
 * States: Q = {q0, q1, q2, q3, qf}
 * Input Alphabet: Σ = {0, 1, 2, 3}
 * Stack Alphabet: Γ = {Z, X, Y} (Z is bottom-of-stack marker)
 * Start State: q0
 * Initial Stack: Z
 * Final/Accepting State: F = {qf}
 * 
 * Stack Orientation Convention:
 * - In memory / arrays: index 0 is stack bottom (Z), last element is stack top.
 * - In trace strings: bottom marker is on left (e.g., "ZXXYY", where 'Z' is bottom and rightmost 'Y' is top).
 * - In transition specifications: written as (input, stack-top -> replacement), top on left.
 */

class MatchingPDA {
  constructor() {
    this.name = 'Matching PDA';
    this.languageDescription = 'L = { 0ⁱ1ʲ2ʲ3ⁱ | i, j ≥ 1 }';
    this.maxInputLength = 30;
  }

  /**
   * Validates the input string syntax and length.
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
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch !== '0' && ch !== '1' && ch !== '2' && ch !== '3') {
        return { 
          valid: false, 
          error: `Invalid character '${ch}' at position ${i + 1}. Alphabet is Σ = {0, 1, 2, 3}.` 
        };
      }
    }
    return { valid: true };
  }

  /**
   * Simulates the PDA step-by-step on the input string.
   * Returns an array of execution steps and the final acceptance verdict.
   * 
   * @param {string} input 
   * @returns {Object} Simulation trace and verdict
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

    const steps = [];
    let state = 'q0';
    let stack = ['Z']; // Bottom at index 0, top at last index
    let pos = 0;
    const len = input.length;

    // Helper to format stack string with bottom on left
    const getStackString = (stk) => stk.join('');

    // Step 0: Initial configuration
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

    // Special check for empty string
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

    // Run simulation loop
    while (true) {
      const stackTop = stack.length > 0 ? stack[stack.length - 1] : null;
      const currentChar = pos < len ? input[pos] : null;
      const stackBefore = [...stack];

      // Check transitions based on current state
      if (state === 'q0') {
        if (currentChar === '0' && stackTop === 'Z') {
          // Rule: (0, Z -> XZ), stay in q0
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
          // Rule: (0, X -> XX), stay in q0
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
          // Rule: (1, X -> YX), move to q1
          // Stack top X is replaced by YX (top is Y)
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
          // No valid transition in q0
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
          // Rule: (1, Y -> YY), stay in q1
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
          // Rule: (2, Y -> ε), move to q2
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
          // No valid transition in q1
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
          // Rule: (2, Y -> ε), stay in q2
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
          // Rule: (3, X -> ε), move to q3
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
          // No valid transition in q2
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
          // Rule: (3, X -> ε), stay in q3
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
          // Rule: (ε, Z -> Z), move to qf
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
          // No valid transition in q3
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

    // If not accepted and no step was added for rejection, add a final halted step
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
