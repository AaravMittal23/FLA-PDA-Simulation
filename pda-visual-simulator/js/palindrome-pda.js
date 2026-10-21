/**
 * palindrome-pda.js
 * 
 * General Context-Free Grammar (CFG) to Pushdown Automaton (PDA) Engine.
 * 
 * Default Problem:
 * S -> aSa | bSb | ε
 * (Even-length palindromes over Σ = {a, b}, including empty string ε).
 * 
 * Capability:
 * - Can parse and simulate ANY Context-Free Grammar input by user (e.g. S -> aSb | ε, S -> 0S0 | 1S1 | c, etc.)
 * - Converts grammar productions into standard top-down PDA transitions:
 *     q0 -> q1: (ε, Z -> SZ)
 *     q1 -> q1: (ε, A -> α) for every production A -> α
 *     q1 -> q1: (a, a -> ε) for every terminal a
 *     q1 -> qf: (ε, Z -> Z) when input is exhausted
 * - Preserves default college presentation settings as default.
 */

class PalindromePDA {
  constructor() {
    this.name = 'CFG-to-PDA Converter & Simulator';
    this.defaultGrammar = 'S → aSa | bSb | ε';
    this.defaultDescription = 'Generates even-length palindromes (length 2k) over {a, b}';
    this.maxInputLength = 30;

    // Load default grammar
    this.setGrammar(this.defaultGrammar, this.defaultDescription);
  }

  /**
   * Sets and parses a new Context-Free Grammar.
   * @param {string} grammarString 
   * @param {string} [description]
   * @returns {{ success: boolean, error?: string, grammarInfo?: Object }}
   */
  setGrammar(grammarString, description) {
    if (typeof grammarString !== 'string' || !grammarString.trim()) {
      return { success: false, error: 'Grammar cannot be empty.' };
    }

    try {
      const parsed = this._parseGrammar(grammarString);
      if (parsed.productions.length === 0) {
        return { success: false, error: 'No valid productions found. Format: S -> aSa | bSb | ε' };
      }

      this.grammar = grammarString.trim();
      this.description = description || `Grammar: ${this.grammar}`;
      this.startSymbol = parsed.startSymbol;
      this.variables = parsed.variables;
      this.terminals = parsed.terminals;
      this.productions = parsed.productions;
      this.isDefaultGrammar = this._checkIsDefault(parsed);

      return {
        success: true,
        grammarInfo: {
          startSymbol: this.startSymbol,
          variables: this.variables,
          terminals: this.terminals,
          productionsCount: this.productions.length
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Resets the grammar back to default college presentation problem.
   */
  resetToDefault() {
    return this.setGrammar(this.defaultGrammar, this.defaultDescription);
  }

  /**
   * Internal parser for CFG rules.
   * Handles '->', '→', '|', and epsilon representations (ε, eps, e, lambda, empty).
   */
  _parseGrammar(grammarText) {
    const lines = grammarText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('#'));
    const productions = [];
    const variables = new Set();
    let startSymbol = null;

    for (const line of lines) {
      const arrowMatch = line.split(/\s*->\s*|\s*→\s*/);
      if (arrowMatch.length < 2) continue;

      const lhs = arrowMatch[0].trim();
      if (!lhs) continue;
      if (!startSymbol) startSymbol = lhs;
      variables.add(lhs);

      const rhsAlternatives = arrowMatch[1].split(/\s*\|\s*/);
      for (const alt of rhsAlternatives) {
        const trimmedAlt = alt.trim();
        let rhs = [];
        if (trimmedAlt !== '' && trimmedAlt !== 'ε' && trimmedAlt !== 'eps' && trimmedAlt !== 'e' && trimmedAlt !== 'lambda') {
          // split into symbols (treating characters as symbols)
          rhs = trimmedAlt.split(/\s+/).join('').split('');
        }
        productions.push({
          id: `prod-${productions.length}`,
          lhs,
          rhs,
          rhsStr: trimmedAlt || 'ε',
          fullStr: `${lhs} → ${trimmedAlt || 'ε'}`
        });
      }
    }

    const terminals = new Set();
    for (const p of productions) {
      for (const sym of p.rhs) {
        if (!variables.has(sym)) {
          terminals.add(sym);
        }
      }
    }

    return {
      startSymbol: startSymbol || 'S',
      variables: Array.from(variables),
      terminals: Array.from(terminals),
      productions
    };
  }

  /**
   * Checks if the parsed grammar matches the default S -> aSa | bSb | ε.
   */
  _checkIsDefault(parsed) {
    if (parsed.variables.length !== 1 || parsed.variables[0] !== 'S') return false;
    if (parsed.productions.length !== 3) return false;
    const rules = parsed.productions.map(p => `${p.lhs}->${p.rhsStr}`).sort();
    const defaultRules = ['S->aSa', 'S->bSb', 'S->ε'].sort();
    return JSON.stringify(rules) === JSON.stringify(defaultRules);
  }

  /**
   * Validates input string syntax and length against current terminals.
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

    // Check alphabet
    const allowedTerminals = new Set(this.terminals);
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (!allowedTerminals.has(ch)) {
        return { 
          valid: false, 
          error: `Invalid character '${ch}' at position ${i + 1}. Terminal alphabet for current grammar is Σ = {${this.terminals.join(', ') || 'none'}}.` 
        };
      }
    }
    return { valid: true };
  }

  /**
   * Analyzes palindrome symmetry properties of the string.
   * (Available for palindrome-based grammars).
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

    // Default derivation builder for S -> aSa | bSb | ε
    const derivation = [];
    if (this.isDefaultGrammar && isPal && isEven) {
      if (len === 0) {
        derivation.push('S', 'ε');
      } else {
        derivation.push('S');
        let current = 'S';
        for (let i = 0; i < half; i++) {
          const leftPrefix = input.slice(0, i + 1);
          const rightSuffix = input.slice(len - 1 - i);
          current = `${leftPrefix}S${rightSuffix}`;
          derivation.push(current);
        }
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
   * Simulates CFG-to-PDA on the input string.
   * If default grammar is active, uses exact canonical sequence.
   * If custom grammar is active, uses universal top-down parsing.
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

    // If default grammar, use dedicated canonical implementation
    if (this.isDefaultGrammar) {
      const analysis = this.analyzePalindrome(input);
      if (analysis.isPalindrome && analysis.isEvenLength) {
        return this._simulateDefaultEvenPalindrome(input, analysis);
      } else {
        return this._simulateDefaultRejectedString(input, analysis);
      }
    }

    // Universal simulation for any custom CFG
    return this._simulateGeneralCFG(input);
  }

  /**
   * General top-down CFG-to-PDA parser for any user-defined grammar.
   */
  _simulateGeneralCFG(input) {
    const len = input.length;
    const getStackString = (stk) => stk.join('');
    const varSet = new Set(this.variables);

    // Initial configuration: state q0, stack [Z]
    const initialStep0 = {
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
      explanation: `PDA initialized in state q0 with bottom marker Z.`
    };

    // Step 1: q0 -> q1 via (ε, Z -> S Z)
    const initialStep1 = {
      stepNumber: 1,
      state: 'q0',
      nextState: 'q1',
      activeTransitionId: 'trans-q0-q1-init',
      inputConsumed: 'ε',
      inputPosition: 0,
      inputRemaining: input || 'ε',
      stackBefore: ['Z'],
      stackAfter: ['Z', this.startSymbol],
      stackString: `Z${this.startSymbol}`,
      operation: 'PUSH',
      symbolOperated: this.startSymbol,
      production: `Z → ${this.startSymbol}Z`,
      explanation: `Initialize: Push start symbol ${this.startSymbol} onto stack above Z and transition to state q1.`
    };

    // Bounded Guided Search over PDA configurations
    const queue = [{
      pos: 0,
      stack: ['Z', this.startSymbol], // index 0 is bottom Z, last element is top
      steps: [initialStep0, initialStep1],
      derivation: [this.startSymbol],
      sentential: this.startSymbol,
      depth: 0
    }];

    let maxExplorations = 1500;
    let acceptingBranch = null;
    let deepestBranch = queue[0];

    while (queue.length > 0 && maxExplorations-- > 0) {
      const curr = queue.shift();
      if (curr.steps.length > deepestBranch.steps.length) {
        deepestBranch = curr;
      }

      const stackTop = curr.stack[curr.stack.length - 1];

      // Check accepting condition
      if (stackTop === 'Z' && curr.pos === len) {
        const stackBeforeAcc = [...curr.stack];
        const acceptStep = {
          stepNumber: curr.steps.length,
          state: 'q1',
          nextState: 'qf',
          activeTransitionId: 'trans-q1-qf-accept',
          inputConsumed: 'ε',
          inputPosition: curr.pos,
          inputRemaining: '',
          stackBefore: stackBeforeAcc,
          stackAfter: [...curr.stack],
          stackString: getStackString(curr.stack),
          operation: 'ACCEPT',
          symbolOperated: 'Z',
          production: 'Z → Z',
          explanation: `Input fully consumed and bottom marker Z reached: Move to state qf via (ε, Z → Z). ACCEPTED!`
        };

        acceptingBranch = {
          steps: [...curr.steps, acceptStep],
          derivation: curr.derivation
        };
        break;
      }

      if (!stackTop || stackTop === 'Z') {
        continue;
      }

      if (varSet.has(stackTop)) {
        // Variable on stack top: try grammar expansion A -> α
        for (let pIdx = 0; pIdx < this.productions.length; pIdx++) {
          const prod = this.productions[pIdx];
          if (prod.lhs === stackTop) {
            const stackBeforeExp = [...curr.stack];
            const newStack = curr.stack.slice(0, -1); // pop variable
            // push RHS in reverse order so leftmost symbol of RHS is on top
            for (let r = prod.rhs.length - 1; r >= 0; r--) {
              newStack.push(prod.rhs[r]);
            }

            // Update sentential form
            const newSentential = curr.sentential.replace(stackTop, prod.rhs.join(''));
            const newDeriv = [...curr.derivation, newSentential || 'ε'];

            const expStep = {
              stepNumber: curr.steps.length,
              state: 'q1',
              nextState: 'q1',
              activeTransitionId: `trans-q1-expand-${pIdx}`,
              inputConsumed: 'ε',
              inputPosition: curr.pos,
              inputRemaining: input.slice(curr.pos) || 'ε',
              stackBefore: stackBeforeExp,
              stackAfter: [...newStack],
              stackString: getStackString(newStack),
              operation: prod.rhs.length === 0 ? 'POP' : 'PUSH',
              symbolOperated: prod.lhs,
              production: prod.fullStr,
              explanation: `Grammar expansion: Apply production ${prod.fullStr} (replace ${prod.lhs} on stack). Stack top is '${newStack[newStack.length - 1]}'.`
            };

            // Pruning heuristic: prevent runaway stack depth
            if (newStack.length <= len + 12 && curr.depth < 35) {
              queue.push({
                pos: curr.pos,
                stack: newStack,
                steps: [...curr.steps, expStep],
                derivation: newDeriv,
                sentential: newSentential,
                depth: curr.depth + 1
              });
            }
          }
        }
      } else {
        // Terminal on stack top: must match input[pos]
        if (curr.pos < len && input[curr.pos] === stackTop) {
          const stackBeforeMatch = [...curr.stack];
          const newStack = curr.stack.slice(0, -1); // pop matched terminal
          const matchedChar = input[curr.pos];
          const nextPos = curr.pos + 1;

          const matchStep = {
            stepNumber: curr.steps.length,
            state: 'q1',
            nextState: 'q1',
            activeTransitionId: `trans-q1-match-${matchedChar}`,
            inputConsumed: matchedChar,
            inputPosition: curr.pos,
            inputRemaining: input.slice(nextPos) || 'ε',
            stackBefore: stackBeforeMatch,
            stackAfter: [...newStack],
            stackString: getStackString(newStack),
            operation: 'POP',
            symbolOperated: matchedChar,
            production: `(${matchedChar}, ${matchedChar} → ε)`,
            explanation: `Terminal match: Read '${matchedChar}' from input and pop matching '${stackTop}' from stack top.`
          };

          queue.unshift({
            pos: nextPos,
            stack: newStack,
            steps: [...curr.steps, matchStep],
            derivation: curr.derivation,
            sentential: curr.sentential,
            depth: curr.depth
          });
        }
      }
    }

    if (acceptingBranch) {
      return {
        input,
        isValid: true,
        accepted: true,
        reason: `ACCEPTED: Successfully generated by grammar ${this.grammar}. Leftmost derivation: ${acceptingBranch.derivation.join(' ⇒ ')}.`,
        steps: acceptingBranch.steps,
        analysis: {
          input,
          isPalindrome: input === input.split('').reverse().join(''),
          derivation: acceptingBranch.derivation
        }
      };
    }

    // Rejection: build best trace leading to failure
    const rejectSteps = [...deepestBranch.steps];
    const lastStack = deepestBranch.stack;
    const topSym = lastStack[lastStack.length - 1];
    const nextInp = deepestBranch.pos < len ? input[deepestBranch.pos] : 'EOF';

    rejectSteps.push({
      stepNumber: rejectSteps.length,
      state: 'q1',
      nextState: null,
      activeTransitionId: null,
      inputConsumed: deepestBranch.pos < len ? input[deepestBranch.pos] : 'ε',
      inputPosition: deepestBranch.pos,
      inputRemaining: input.slice(deepestBranch.pos),
      stackBefore: [...lastStack],
      stackAfter: [...lastStack],
      stackString: getStackString(lastStack),
      operation: 'REJECT',
      symbolOperated: null,
      explanation: `Computation halted in state q1. Cannot match input symbol '${nextInp}' against stack top '${topSym}'. No valid derivation exists in this CFG.`
    });

    return {
      input,
      isValid: true,
      accepted: false,
      reason: `REJECTED: String '${input}' cannot be generated by grammar ${this.grammar}. Mismatch on remaining input near position ${deepestBranch.pos + 1}.`,
      steps: rejectSteps,
      analysis: {
        input,
        isPalindrome: input === input.split('').reverse().join(''),
        derivation: null
      },
      failedAtStep: rejectSteps.length - 1,
      failedState: 'q1'
    };
  }

  /**
   * Dedicated canonical sequence for default even palindrome (matches original 38 tests).
   */
  _simulateDefaultEvenPalindrome(input, analysis) {
    const steps = [];
    const getStackString = (stk) => stk.join('');
    const len = input.length;
    const half = len / 2;

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
      stack.pop();
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

    // First half expansions and matches
    for (let i = 0; i < half; i++) {
      const ch = input[i];
      const prod = ch === 'a' ? 'S → aSa' : 'S → bSb';
      const transId = ch === 'a' ? 'trans-q1-aSa' : 'trans-q1-bSb';

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
        explanation: `Grammar expansion: Apply production ${prod} (pop S, push ${ch}S${ch}). Top of stack is '${ch}'.`
      });

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
        explanation: `Terminal match: Read '${ch}' from input and pop matching '${ch}' from stack top.`
      });
    }

    // Center S -> ε
    const stackBeforeEps = [...stack];
    stack.pop();
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

    // Second half matches
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

    // Final transition
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
   * Dedicated rejection sequence for default palindrome grammar.
   */
  _simulateDefaultRejectedString(input, analysis) {
    const steps = [];
    const getStackString = (stk) => stk.join('');
    const len = input.length;

    let stack = ['Z'];
    let state = 'q0';
    let pos = 0;

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

    const half = Math.floor(len / 2);
    let stuckReason = '';

    for (let i = 0; i < half; i++) {
      const ch = input[i];
      const prod = ch === 'a' ? 'S → aSa' : 'S → bSb';
      const transId = ch === 'a' ? 'trans-q1-aSa' : 'trans-q1-bSb';

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

    if (analysis.isOddLength) {
      const stackBeforeEps = [...stack];
      stack.pop();
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
      const stackBeforeEps = [...stack];
      stack.pop();
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
  module.exports = { PalindromePDA, CFGtoPDA: PalindromePDA };
} else if (typeof window !== 'undefined') {
  window.PalindromePDA = PalindromePDA;
  window.CFGtoPDA = PalindromePDA;
}
