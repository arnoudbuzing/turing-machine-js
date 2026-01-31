
import { TuringMachine } from '../src/TuringMachine.js';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function verify() {
    const rule = 2506;
    const steps = 3;
    const initialCondition = {
        state: 1,
        tape: [0, 0, 1, 0], // Matches {0,0,1,0}
        headPosition: 2     // Matches Wolfram index 3 (1-based) -> 2 (0-based) ?? 
        // Wait, if Wolfram init was {{1, 3}, {0,0,1,0}}... 
        // Let's use a simple case where we control everything.
    };

    // My Logic for Head Position: 0-based.
    // Wolfram Logic: 1-based usually.

    // Let's verify a simple case:
    // Rule 2506.
    // Init: State 1, Tape {0, 0, 1, 0}, Head at index 2 (value 1).
    // Wolfram Command: TuringMachine[2506, {{1, 3}, {0, 0, 1, 0}}, 3]
    // (Head index 3 means picking the 3rd element, which is 1).

    const wolframCmd = `wolframscript -code "TuringMachine[${rule}, {{1, 3}, {0, 0, 1, 0}}, ${steps}]"`;

    console.log("Running Wolfram ground truth...");
    const { stdout, stderr } = await execPromise(wolframCmd);

    if (stderr) console.error("Wolfram Error:", stderr);

    // Wolfram Output Format: {{ {s, h}, {t...} }, ... }
    // We need to parse this string into JSON-like object or just manual check.
    const rawOutput = stdout.trim();
    console.log("Wolfram Output:", rawOutput);

    // JS Implementation
    const tm = new TuringMachine(rule);
    const history = tm.evolve({
        state: 1,
        tape: [0, 0, 1, 0],
        headPosition: 2
    }, steps);

    console.log("\nJS Output:");
    history.forEach((step, i) => {
        console.log(`Step ${i}: State ${step.state}, Head ${step.headPosition}, Tape [${step.tape.join(',')}]`);
    });

    // We will do a visual check log based verification for now as parsing Wolfram Output in JS is complex.
    console.log("\nComparison needed manually based on logs above.");
}

verify();
