# PDA Visual Simulator — Interactive Automata Theory

An interactive, educational Pushdown Automata (PDA) simulator designed for college computer science presentations, lecture demonstrations, and hands-on automata exploration.

Built with **pure Vanilla JavaScript (ES6+), HTML5, CSS3, and native SVGs** — completely standalone with **zero dependencies, no build tools, no npm installs, and no internet connection required**.

---

## 1. Project Purpose

Pushdown Automata are central to Formal Language and Automata Theory (FLAT / TOC) and Context-Free Grammars (CFGs). However, teaching how PDAs operate internally—especially how the LIFO stack changes state-by-state, how non-deterministic CFG expansions map to PDA transitions, and why certain strings are accepted or rejected—can be difficult using static blackboard diagrams.

This simulator solves that challenge by providing:
1. **Interactive Step-by-Step Execution:** Step forward, step backward, or auto-play through transitions.
2. **Synchronized SVG State Diagrams:** Real-time visual highlighting of the active state and the active transition being fired.
3. **Live LIFO Stack Visualization:** Distinct color-coded stack blocks that visibly grow on `PUSH` and shrink on `POP`, with an explicit `TOP` pointer.
4. **Input Tape Head:** Character-by-character consumption visualization with current-head indicators and processed checkmarks.
5. **Rigorous Mathematical Calculations:** Real simulation engines executing actual transition functions rather than pre-baked animations.

---

## 2. Problems Implemented

### Question 1: Matching PDA
- **Language:** \( L = \{0^i 1^j 2^j 3^i \mid i, j \ge 1\} \)
- **Formal Definition:**
  - States: \( Q = \{q_0, q_1, q_2, q_3, q_f\} \)
  - Input Alphabet: \( \Sigma = \{0, 1, 2, 3\} \)
  - Stack Alphabet: \( \Gamma = \{Z, X, Y\} \) where \( Z \) is the bottom marker.
  - Start State: \( q_0 \)
  - Accepting State: \( F = \{q_f\} \)
- **Mechanism:**
  - \( q_0 \): Reads 0s and pushes \( X \) onto the stack. When reading the first 1, transitions to \( q_1 \) and pushes \( Y \).
  - \( q_1 \): Reads subsequent 1s and pushes \( Y \). When reading the first 2, moves to \( q_2 \) and pops \( Y \).
  - \( q_2 \): Reads 2s and pops \( Y \) (matching 1s with 2s). When reading the first 3 with \( X \) on top of the stack, moves to \( q_3 \) and pops \( X \).
  - \( q_3 \): Reads 3s and pops \( X \) (matching 0s with 3s). When input is exhausted and stack top is \( Z \), executes \( (\varepsilon, Z \to Z) \) to reach \( q_f \).
- **Default Input:** `00112233`
- **Stack Evolution (Bottom on left):**
  `Z → ZX → ZXX → ZXXY → ZXXYY → ZXXY → ZXX → ZX → Z → Z`
- **Acceptance Verdict:** Reports exact matched counts of \( i \) and \( j \), e.g.:
  `ACCEPTED: i = 2 and j = 2. Both pairs of symbol counts match.`

---

### Question 2: Palindrome CFG-to-PDA
- **Grammar:** \( S \to aSa \mid bSb \mid \varepsilon \)
- **Language:** Even-length palindromes over \( \{a, b\} \), including \( \varepsilon \).
  > **Mathematical Note:** This grammar generates strings of length \( 2k \). It **does not generate odd-length palindromes** like `aba` or `bab`. The simulator explicitly clarifies this distinction.
- **Conversion to PDA:**
  - States: \( Q = \{q_0, q_1, q_f\} \)
  - Stack Alphabet: \( \Gamma = \{Z, S, a, b\} \)
  - \( q_0 \to q_1 \): \( (\varepsilon, Z \to SZ) \) (initialization)
  - \( q_1 \) self-loops:
    - Grammar expansions: \( (\varepsilon, S \to aSa) \), \( (\varepsilon, S \to bSb) \), \( (\varepsilon, S \to \varepsilon) \)
    - Terminal matching: \( (a, a \to \varepsilon) \), \( (b, b \to \varepsilon) \)
  - \( q_1 \to q_f \): \( (\varepsilon, Z \to Z) \) when input is exhausted.
- **Default Input:** `abba`
- **Execution Sequence:**
  1. Initialize with `SZ`
  2. Expand \( S \to aSa \)
  3. Match terminal `a`
  4. Expand \( S \to bSb \)
  5. Match terminal `b`
  6. Expand \( S \to \varepsilon \) (center reached)
  7. Match remaining terminal `b`
  8. Match remaining terminal `a`
  9. Accept on empty input and stack `Z`
- **Visual Symmetry Widget:** Displays an input vs. reverse character mirror table highlighting matched pairs, center points, and mismatch positions.
- **Leftmost Derivation:** Dynamically generates \( S \Rightarrow aSa \Rightarrow abSba \Rightarrow abba \).

---

## 3. Technology & Architecture

```text
pda-visual-simulator/
├── index.html              # Main presentation dashboard and simulator UI
├── css/
│   └── styles.css          # Minimalist classroom-optimized CSS design system
├── js/
│   ├── matching-pda.js     # Engine: 5-state deterministic PDA for 0^i 1^j 2^j 3^i
│   ├── palindrome-pda.js   # Engine: CFG-to-PDA parser and palindrome symmetry analyzer
│   ├── visualizer.js       # Renderer: Dynamic SVG highlighting, tape, stack, and tables
│   └── app.js              # Controller: Playback timer, step navigation, presets, shortcuts
├── README.md               # Complete documentation
└── tests/
    └── tests.html          # In-browser automated unit test suite (38 tests)
```

- **Separation of Concerns:** Pure simulation engines calculate full computation trees independently of the DOM. The visualizer handles only DOM manipulation and SVGs. The controller orchestrates user events.
- **Zero Dependencies:** No frameworks (React/Vue), no external fonts or CDN dependencies, no build steps.

---

## 4. How to Run the Website

### Method 1: Direct File Open (Offline)
Simply double-click `index.html` (or drag and drop into any modern browser such as Chrome, Firefox, Safari, or Edge):
```bash
open pda-visual-simulator/index.html
```

### Method 2: Optional Local Server
If preferred:
```bash
cd pda-visual-simulator
python3 -m http.server 8000
# Then visit http://localhost:8000 in your browser
```

---

## 5. How to Operate the Simulation

1. **Switch Tabs:** Click either **Question 1: Matching PDA** or **Question 2: Palindrome CFG-to-PDA**.
2. **Enter or Select an Input:**
   - Type any custom string into the text box (up to 30 characters).
   - Or click any of the green **Accepted Presets** or red **Rejected Presets**.
3. **Playback Controls:**
   - **Play (`▶`):** Automatically advances through the computation.
   - **Pause (`⏸`):** Pauses at the current step.
   - **Next Step (`Next Step ▶`):** Advances exactly one transition.
   - **Prev Step (`◀ Prev Step`):** Moves backward one transition, accurately restoring the prior stack and tape state.
   - **Reset (`⏮ Reset`):** Returns to Step 0 (initial configuration).
   - **Speed Selector:** Choose between Slow (1.5s), Normal (0.8s), or Fast (0.35s).
4. **Keyboard Shortcuts (Presenter Friendly):**
   - `Right Arrow (→)`: Next Step
   - `Left Arrow (←)`: Previous Step
   - `Spacebar`: Toggle Play / Pause
   - `Escape (Esc)`: Reset
5. **Interactive Trace Table:** Click any row in the execution trace table to immediately jump the simulator to that step.

---

## 6. Running Tests

Open `tests/tests.html` in your web browser, or run the test suite via Node:
```bash
open pda-visual-simulator/tests/tests.html
```

The test suite automatically executes **38 test cases** covering:
- **Question 1:** Valid inputs (`0123`, `00112233`, `011223`, `0001122333`, `001233`), count mismatches, ordering errors, boundary empty string, non-alphabet symbols, and length limits.
- **Question 2:** Empty string, even palindromes (`aa`, `bb`, `abba`, `baab`, `aabbaa`), odd palindromes (`aba`, `bab`), non-palindromes (`abab`, `aabb`), and invalid symbols.
- **Trace Invariants:** Verifies exact stack string sequences, final epsilon transitions to \( q_f \), and leftmost derivation generation.
