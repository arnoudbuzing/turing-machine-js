# Turing Machine JS

A JavaScript implementation of a 2-state, 2-color Turing Machine, designed to be compatible with the Wolfram Language's `TuringMachine` function.

## Features
- Supports 2-state, 2-color Turing Machines.
- Accepts rule integers (0-4095) using standard Wolfram enumeration.
- Simulates tape evolution and head movement.
- Zero dependencies (standard Node.js).

## Installation

Clone the repository and ensure you have Node.js installed.

```bash
git clone <repository-url>
cd turing-machine-js
# No npm install needed as there are no external dependencies
```

## Usage

### Library Usage

You can use the `TuringMachine` class in your own projects.

```javascript
import { TuringMachine } from './src/TuringMachine.js';

// Initialize with Rule 2506
const tm = new TuringMachine(2506);

const initialCondition = {
    state: 1,              // Initial state (1 or 2)
    tape: [0, 0, 1, 0],    // Initial tape contents
    headPosition: 2        // 0-based index of the head on the tape
};

const steps = 10;
const history = tm.evolve(initialCondition, steps);

console.log(history);
```

### Running the Example

A simple CLI example is provided in `example.js`.

```bash
# Usage: node example.js [RuleNumber] [Steps] [InitialConditionJSON]
node example.js 2506 10
```

You can also specify complex initial conditions using JSON format:

```bash
# Infinite tape with background 0, starting state 1, tape [0,1]
node example.js 2506 10 '[[1,1], [[0,1], 0]]'

# Cyclic tape
node example.js 2506 10 '[[1,0], [0,0,0]]'
```

## Extended Initial Conditions

The `evolve` method supports Wolfram-like initial condition specifications:

- **State & Head**: `[s, h]` (State `s`, Head at index `h` *1-based*) or just `s` (Head default 0).
- **Infinite Tape**: `[[tape...], background]`. Background can be a value (e.g. `0`) or a repeating list.
- **Cyclic Tape**: `[tape...]` (A single list without background spec implies cyclic).

Examples:
- `[[1, 1], [[0, 1], 0]]`: State 1, Head at 1st element. Tape `[0, 1]` on 0-background.
- `[[1, 1], [0, 0, 0]]`: State 1, Head 1. Cyclic tape `[0, 0, 0]`.

## Verification

The project includes a verification script that compares the JavaScript implementation against the Wolfram Language `TuringMachine` function (requires `wolframscript` to be in your PATH).

```bash
npm test
```

## Project Structure

- `src/TuringMachine.js`: Main class implementation.
- `src/utils.js`: Helper functions for rule parsing.
- `test/verify.js`: Verification script against Wolfram Language.
- `example.js`: Simple usage example.
