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
    // Visualization: Highlight head
    // Note: step.tape is the raw internal tape.
    // step.headPosition is the index for that tape.
    const tapeStr = step.tape.map((bit, idx) => {
        return idx === step.headPosition ? `[${bit}]` : ` ${bit} `;
    }).join('');

    console.log(`Step ${i}: State ${step.state} | ${tapeStr}`);
});
