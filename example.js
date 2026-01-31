import { TuringMachine } from './src/TuringMachine.js';

const rule = parseInt(process.argv[2]) || 2506;
const steps = parseInt(process.argv[3]) || 10;
let initialCondition = {
    state: 1,
    tape: [0, 0, 0],
    headPosition: 1
};

// Check for custom initial condition arg
if (process.argv[4]) {
    try {
        // Allow loose JSON (e.g. without quotes around keys if possible, but JSON.parse is strict)
        // User should provide valid JSON or JS-like structure we can eval (unsafe? usually fine for local tool)
        // Let's use JSON.parse for safety, user needs to escape quotes.
        initialCondition = JSON.parse(process.argv[4]);
    } catch (e) {
        console.error("Error parsing initial condition JSON:", e.message);
        console.error("Using default initial condition.");
    }
}

console.log(`Running Rule ${rule} for ${steps} steps...`);
console.log("Initial Condition:", JSON.stringify(initialCondition));

const tm = new TuringMachine(rule);

const history = tm.evolve(initialCondition, steps);

history.forEach((step, i) => {
    // Visualization:
    // Determine the range to print so we always see the head and the tape.
    // Internal tape indices: 0 to step.tape.length - 1.
    // Head index: step.headPosition (can be < 0 or >= step.tape.length).

    const minIdx = Math.min(0, step.headPosition);
    const maxIdx = Math.max(step.tape.length - 1, step.headPosition);

    let tapeStr = "";

    // Virtual background assumption for CLI (0)
    for (let idx = minIdx; idx <= maxIdx; idx++) {
        let val;
        if (idx >= 0 && idx < step.tape.length) {
            val = step.tape[idx];
        } else {
            val = 0; // Virtual background
        }

        tapeStr += idx === step.headPosition ? `[${val}]` : ` ${val} `;
    }

    console.log(`Step ${i}: State ${step.state} | ${tapeStr}`);
});
