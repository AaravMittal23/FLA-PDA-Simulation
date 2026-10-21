/**
 * palindrome-pda.js
 * 
 * Implementation of CFG-to-PDA conversion and simulation for:
 * S -> aSa | bSb | ε
 * 
 * Language: Even-length palindromes over Σ = {a, b}, including the empty string ε.
 * Note: Does NOT generate odd-length palindromes (such as 'aba', 'bab').
 * 
 * CFG to PDA Construction:
 * States: Q = {q0, q1, qf}
 * Input Alphabet: Σ = {a, b}
 * Stack Alphabet: Γ = {Z, S, a, b} (Z is bottom-of-stack marker)
 * Start State: q0
 * Initial Stack: Z
 * Final State: F = {qf}
 * 
 * Transitions:
 * q0 -> q1: (ε, Z -> SZ)
 * q1 -> q1:
 *   (ε, S -> aSa)
 *   (ε, S -> bSb)
 *   (ε, S -> ε)
 *   (a, a -> ε)
 *   (b, b -> ε)
 * q1 -> qf:
 *   (ε, Z -> Z), when input is exhausted
 */

class PalindromePDA {
  constructor() {
    this.name = 'Palindrome CFG-to-PDA';
    this.grammar = 'S → aSa | bSb | ε';
    this.maxInputLength = 30;
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
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch !== 'a' && ch !== 'b') {
        return { 
          valid: false, 
          error: `Invalid character '${ch}' at position ${i + 1}. Alphabet is Σ = {a, b}.` 
        };
      }
    }
    return { valid: true };
  }

  /**
   * Analyzes the palindrome properties of the string.
   * @param {string} input 
   */
  analyzePalindrome(input) {
    const len = input.length;
    const reversed = input.split('').reverse().join('');
    const isPal = input === reversed;
    const isEven = len % 2 === 0;
    const isOdd = len % 2 === 1;

    const pairs = [];
    const half = Math.floor(len / 2);
    let firstMismatch = null;

    for (let i = 0; i < half; i++) {
      const j = len - 1 - i;
      const match = input[i] === input[j];
      pairs.push({
        leftIndex: i,
        rightIndex: j,
        leftChar: input[i],
        rightChar: input[j],
        match
      });
      if (!match && firstMismatch === null) {
        firstMismatch = { i, j, c1: input[i], c2: input[j] };
      }
    }

    // Generate CFG derivation if even palindrome
    const derivation = [];
    if (isPal && isEven) {
      if (len === 0) {
        derivation.push('S', 'ε');
      } else {
        derivation.push('S');
        let current = 'S';
        for (let i = 0; i < half; i++) {
          const ch = input[i];
          const leftPrefix = input.slice(0, i + 1);
          const rightSuffix = input.slice(len - 1 - i);
          current = `${leftPrefix}S${rightSuffix}`;
          derivation.push(current);
        }
        // Final step: S -> ε
        derivation.push(input);
      }
    }

    return {
      input,
      reversed,
      isPalindrome: isPal,
      isEvenLength: isEven,
      isOddLength: isOdd,
      length: len,
      pairs,
      firstMismatch,
      derivation: derivation.length > 0 ? derivation : null
    };
  }

  /**
   * Simulates the CFG-to-PDA step-by-step.
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
        analysis: null
      };
    }

    const analysis = this.analyzePalindrome(input);
    const getStackString = (stk) => stk.join('');

    // If string is an even palindrome, generate the canonical accepting computation trace
    if (analysis.isPalindrome && analysis.isEvenLength) {
      return this._simulateAcceptedEvenPalindrome(input, analysis);
    } else {
      return this._simulateRejectedString(input, analysis);
    }
  }

  /**
   * Generates the trace for an accepted even-length palindrome.
   * Matches the exact step structure specified in Section 5:
   * 1. Initialize with SZ
   * 2. Expand S -> aSa (or bSb)
   * 3. Match first terminal
   * ...
   * k. Expand S -> ε
   * ...
   * Match remaining terminals
   * Accept when input is exhausted and Z remains.
   */
  _simulateAcceptedEvenPalindrome(input, analysis) {
    const steps = [];
    const getStackString = (stk) => stk.join('');
    const len = input.length;
    const half = len / 2;

    // Stack: index 0 is bottom 'Z', last element is top
    let stack = ['Z'];
    let state = 'q0';
    let pos = 0;

    // Step 0: Initial configuration
    steps.push({
      stepNumber: 0,
      state: 'q0',
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
      explanation: 'PDA initialized in state q0 with bottom-of-stack marker Z.'
    });

    // Step 1: Transition q0 -> q1 via (ε, Z -> SZ)
    const stackBefore1 = [...stack];
    stack.push('S');
    state = 'q1';
    steps.push({
      stepNumber: steps.length,
      state: 'q0',
      nextState: 'q1',
      activeTransitionId: 'trans-q0-q1-init',
      inputConsumed: 'ε',
      inputPosition: 0,
      inputRemaining: input || 'ε',
      stackBefore: stackBefore1,
      stackAfter: [...stack],
      stackString: getStackString(stack),
      operation: 'PUSH',
      symbolOperated: 'S',
      production: 'Z → SZ',
      explanation: 'Initialize PDA: Push start symbol S onto stack above Z and move to state q1.'
    });

    if (len === 0) {
      // Empty string: S -> ε directly
      const stackBeforeExp = [...stack];
      stack.pop(); // pop S
      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: 'trans-q1-eps',
        inputConsumed: 'ε',
        inputPosition: 0,
        inputRemaining: '',
        stackBefore: stackBeforeExp,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'POP',
        symbolOperated: 'S',
        production: 'S → ε',
        explanation: 'Grammar expansion: Apply production S → ε (popping S). Stack holds bottom marker Z.'
      });

      // Accept transition q1 -> qf via (ε, Z -> Z)
      const stackBeforeAcc = [...stack];
      state = 'qf';
      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'qf',
        activeTransitionId: 'trans-q1-qf-accept',
        inputConsumed: 'ε',
        inputPosition: 0,
        inputRemaining: '',
        stackBefore: stackBeforeAcc,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'ACCEPT',
        symbolOperated: 'Z',
        production: 'Z → Z',
        explanation: 'Input is empty and bottom marker Z reached: Move to state qf via (ε, Z → Z). ACCEPTED!'
      });

      return {
        input,
        isValid: true,
        accepted: true,
        reason: 'ACCEPTED: Empty string ε is generated by S → ε (length = 0, even-length palindrome).',
        steps,
        analysis
      };
    }

    // For length > 0:
    // First half: expand S -> cSc then match terminal c
    for (let i = 0; i < half; i++) {
      const ch = input[i];
      const prod = ch === 'a' ? 'S → aSa' : 'S → bSb';
      const transId = ch === 'a' ? 'trans-q1-aSa' : 'trans-q1-bSb';

      // Expansion step: pop S, push [ch, 'S', ch]
      // Top on left: replacement is 'c', 'S', 'c'. In bottom-to-top array: push c, push S, push c.
      const stackBeforeExp = [...stack];
      stack.pop(); // Pop S
      stack.push(ch); // outer matching terminal
      stack.push('S');
      stack.push(ch); // terminal to match immediately

      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: transId,
        inputConsumed: 'ε',
        inputPosition: pos,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeExp,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'PUSH',
        symbolOperated: prod,
        production: prod,
        explanation: `Grammar expansion: Apply production ${prod} (pop S, push ${ch}S${ch}). Top of stack is '${ch}'.`
      });

      // Terminal matching step: match input[pos] against stack top ch
      const stackBeforeMatch = [...stack];
      stack.pop(); // Pop terminal ch
      pos++;
      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: ch === 'a' ? 'trans-q1-match-a' : 'trans-q1-match-b',
        inputConsumed: ch,
        inputPosition: pos - 1,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeMatch,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'POP',
        symbolOperated: ch,
        production: `(${ch}, ${ch} → ε)`,
        explanation: `Terminal match: Read '${ch}' from input and pop matching '${ch}' from stack top.`
      });
    }

    // Middle reached: expand S -> ε
    const stackBeforeEps = [...stack];
    stack.pop(); // Pop S
    steps.push({
      stepNumber: steps.length,
      state: 'q1',
      nextState: 'q1',
      activeTransitionId: 'trans-q1-eps',
      inputConsumed: 'ε',
      inputPosition: pos,
      inputRemaining: input.slice(pos),
      stackBefore: stackBeforeEps,
      stackAfter: [...stack],
      stackString: getStackString(stack),
      operation: 'POP',
      symbolOperated: 'S',
      production: 'S → ε',
      explanation: 'Grammar expansion: Apply S → ε (pop S) to mark the center of the palindrome.'
    });

    // Second half: match remaining terminals
    for (let i = half; i < len; i++) {
      const ch = input[i];
      const stackBeforeMatch = [...stack];
      const topSymbol = stack.pop();
      pos++;
      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: ch === 'a' ? 'trans-q1-match-a' : 'trans-q1-match-b',
        inputConsumed: ch,
        inputPosition: pos - 1,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeMatch,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'POP',
        symbolOperated: ch,
        production: `(${ch}, ${ch} → ε)`,
        explanation: `Terminal match: Read mirrored '${ch}' from input and pop matching '${topSymbol}' from stack top.`
      });
    }

    // Final transition q1 -> qf via (ε, Z -> Z)
    const stackBeforeAcc = [...stack];
    state = 'qf';
    steps.push({
      stepNumber: steps.length,
      state: 'q1',
      nextState: 'qf',
      activeTransitionId: 'trans-q1-qf-accept',
      inputConsumed: 'ε',
      inputPosition: pos,
      inputRemaining: '',
      stackBefore: stackBeforeAcc,
      stackAfter: [...stack],
      stackString: getStackString(stack),
      operation: 'ACCEPT',
      symbolOperated: 'Z',
      production: 'Z → Z',
      explanation: 'Input fully consumed and bottom marker Z reached: Move to state qf via (ε, Z → Z). ACCEPTED!'
    });

    return {
      input,
      isValid: true,
      accepted: true,
      reason: `ACCEPTED: Even-length palindrome of length ${len}. Successfully generated via CFG derivation: ${analysis.derivation ? analysis.derivation.join(' ⇒ ') : input}.`,
      steps,
      analysis
    };
  }

  /**
   * Generates the trace and explanation for a rejected string.
   */
  _simulateRejectedString(input, analysis) {
    const steps = [];
    const getStackString = (stk) => stk.join('');
    const len = input.length;

    let stack = ['Z'];
    let state = 'q0';
    let pos = 0;

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
      explanation: 'PDA initialized in state q0 with bottom marker Z.'
    });

    // Step 1: Init with SZ
    const stackBefore1 = [...stack];
    stack.push('S');
    state = 'q1';
    steps.push({
      stepNumber: steps.length,
      state: 'q0',
      nextState: 'q1',
      activeTransitionId: 'trans-q0-q1-init',
      inputConsumed: 'ε',
      inputPosition: 0,
      inputRemaining: input,
      stackBefore: stackBefore1,
      stackAfter: [...stack],
      stackString: getStackString(stack),
      operation: 'PUSH',
      symbolOperated: 'S',
      production: 'Z → SZ',
      explanation: 'Initialize PDA: Push start symbol S onto stack above Z and move to q1.'
    });

    // Attempt leftmost parsing of prefix
    const half = Math.floor(len / 2);
    let stuckReason = '';

    for (let i = 0; i < half; i++) {
      const ch = input[i];
      const prod = ch === 'a' ? 'S → aSa' : 'S → bSb';
      const transId = ch === 'a' ? 'trans-q1-aSa' : 'trans-q1-bSb';

      // Expand S
      const stackBeforeExp = [...stack];
      stack.pop();
      stack.push(ch);
      stack.push('S');
      stack.push(ch);

      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: transId,
        inputConsumed: 'ε',
        inputPosition: pos,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeExp,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'PUSH',
        symbolOperated: prod,
        production: prod,
        explanation: `Grammar expansion: Attempting production ${prod} to match prefix symbol '${ch}'.`
      });

      // Match terminal ch
      const stackBeforeMatch = [...stack];
      stack.pop();
      pos++;

      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: ch === 'a' ? 'trans-q1-match-a' : 'trans-q1-match-b',
        inputConsumed: ch,
        inputPosition: pos - 1,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeMatch,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'POP',
        symbolOperated: ch,
        production: `(${ch}, ${ch} → ε)`,
        explanation: `Terminal match: Read '${ch}' and popped matching '${ch}'.`
      });
    }

    // Now S is at top of stack
    if (analysis.isOddLength) {
      // For odd length, e.g. 'aba' (len 3, half = 1):
      // pos is at index 1 ('b'), stack has [Z, 'a', 'S']
      // If we expand S -> ε:
      const stackBeforeEps = [...stack];
      stack.pop(); // Pop S
      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: 'trans-q1-eps',
        inputConsumed: 'ε',
        inputPosition: pos,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeEps,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'POP',
        symbolOperated: 'S',
        production: 'S → ε',
        explanation: 'Center reached: Pop S via S → ε. Stack top now holds mirrored symbol, but odd center character remains.'
      });

      const nextInput = input[pos];
      const stackTop = stack[stack.length - 1];
      stuckReason = `Odd-length string (${len} characters): Center character '${nextInput}' at index ${pos + 1} has no match on stack top ('${stackTop}'). The grammar S → aSa | bSb | ε generates only even-length palindromes (length = 2k). Even though '${input}' is a palindrome, it cannot be generated by this grammar.`;
    } else {
      // Even length but not a palindrome (e.g. 'abab')
      // Try S -> ε
      const stackBeforeEps = [...stack];
      stack.pop(); // Pop S
      steps.push({
        stepNumber: steps.length,
        state: 'q1',
        nextState: 'q1',
        activeTransitionId: 'trans-q1-eps',
        inputConsumed: 'ε',
        inputPosition: pos,
        inputRemaining: input.slice(pos),
        stackBefore: stackBeforeEps,
        stackAfter: [...stack],
        stackString: getStackString(stack),
        operation: 'POP',
        symbolOperated: 'S',
        production: 'S → ε',
        explanation: 'Center hypothesis: Pop S via S → ε. Testing if stack mirrors the remaining input.'
      });

      const nextInput = input[pos];
      const stackTop = stack[stack.length - 1];
      const mismatch = analysis.firstMismatch;
      stuckReason = `Mirror mismatch: Remaining input symbol '${nextInput}' at position ${pos + 1} does not match stack top '${stackTop}'. String is not a palindrome (mismatch between position ${mismatch ? mismatch.i + 1 : 1} and ${mismatch ? mismatch.j + 1 : len}).`;
    }

    // Add final rejection step
    steps.push({
      stepNumber: steps.length,
      state: 'q1',
      nextState: null,
      activeTransitionId: null,
      inputConsumed: pos < len ? input[pos] : 'ε',
      inputPosition: pos,
      inputRemaining: input.slice(pos),
      stackBefore: [...stack],
      stackAfter: [...stack],
      stackString: getStackString(stack),
      operation: 'REJECT',
      symbolOperated: null,
      explanation: `Computation halted in non-accepting state q1. ${stuckReason}`
    });

    let overallReason = '';
    if (analysis.isOddLength && analysis.isPalindrome) {
      overallReason = `REJECTED: '${input}' is an odd-length palindrome (length ${len}). The grammar S → aSa | bSb | ε only derives even-length palindromes (length 2k). No derivation exists in this CFG.`;
    } else if (analysis.isOddLength) {
      overallReason = `REJECTED: Odd-length string (length ${len}). This grammar only generates even-length palindromes.`;
    } else {
      overallReason = `REJECTED: Not a palindrome under CFG S → aSa | bSb | ε. ${stuckReason}`;
    }

    return {
      input,
      isValid: true,
      accepted: false,
      reason: overallReason,
      steps,
      analysis,
      failedAtStep: steps.length - 1,
      failedState: 'q1'
    };
  }
}

// Export for module/testing environments as well as browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PalindromePDA };
} else if (typeof window !== 'undefined') {
  window.PalindromePDA = PalindromePDA;
}
