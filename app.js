
import { TuringMachine } from './src/TuringMachine.js';

// DOM Elements
const ruleInput = document.getElementById('rule-input');
const randomRuleBtn = document.getElementById('random-rule-btn');
const stepsRange = document.getElementById('steps-range');
const stepsInput = document.getElementById('steps-input');
const presetBtns = document.querySelectorAll('.preset-btn');
const jsonInput = document.getElementById('init-json');

const canvas = document.getElementById('tm-canvas');
const ctx = canvas.getContext('2d');
const stepCounter = document.getElementById('step-counter');

// Config
const CELL_SIZE = 12; // Size of each cell in pixels
const CELL_GAP = 1;

// State
let tm = null;

// Initialization
function init() {
    // Bind Events
    ruleInput.addEventListener('change', runSimulation);
    stepsRange.addEventListener('input', (e) => {
        stepsInput.value = e.target.value;
        // Debounce? For now just run on change end or throttled
    });
    // Run on range change (drag release)
    stepsRange.addEventListener('change', runSimulation);

    stepsInput.addEventListener('change', (e) => {
        stepsRange.value = e.target.value;
        runSimulation();
    });

    randomRuleBtn.addEventListener('click', () => {
        const r = Math.floor(Math.random() * 4096);
        ruleInput.value = r;
        runSimulation();
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Format JSON nicely in textarea
            const data = JSON.parse(btn.getAttribute('data-json'));
            jsonInput.value = JSON.stringify(data, null, 2); // null, 2 for pretty print? simplified
            runSimulation();
        });
    });

    // Auto-update on JSON edit
    jsonInput.addEventListener('input', () => {
        try {
            JSON.parse(jsonInput.value);
            // Valid JSON
            jsonInput.style.borderColor = 'var(--border)';
            runSimulation();
        } catch (e) {
            // Invalid JSON - visualization stays on last valid state
            // Optionally style to indicate error (already handled in runSimulation but that returns early)
            // runSimulation checks JSON again, so we can just call it?
            // checking runSimulation:
            // try { JSON.parse... } catch { borderColor = red; return; }
            // So yes, calling runSimulation() is enough to handle the UI feedback!
            runSimulation();
        }
    });

    // Initial Run
    runSimulation();
}

function runSimulation() {
    const rule = parseInt(ruleInput.value);
    const steps = parseInt(stepsInput.value);

    let initialCondition;
    try {
        // Parse the text area. Allow loose JSON if possible? No, strict.
        initialCondition = JSON.parse(jsonInput.value);
        jsonInput.style.borderColor = 'var(--border)';
    } catch (e) {
        console.error("Invalid JSON", e);
        jsonInput.style.borderColor = '#ef4444'; // Red error
        return;
    }

    try {
        tm = new TuringMachine(rule);
        const history = tm.evolve(initialCondition, steps);
        render(history);
        stepCounter.textContent = `Steps: ${history.length - 1}`;
    } catch (e) {
        console.error("Simulation Error", e);
        alert(e.message);
    }
}

function render(history) {
    if (!history || history.length === 0) return;

    // Determine grid dimensions
    // Y-axis = steps (history.length)
    // X-axis = tape width. 
    // Tape grows. We need to find min and max indices touched across all steps to center/scale.

    let minIdx = Infinity;
    let maxIdx = -Infinity;

    history.forEach(step => {
        // Tape is array. We need to know the 'offset' of the head to align steps?
        // history stores: { state, tape, headPosition }
        // BUT headPosition is index into that specific tape array.
        // That tape array might have expanded.
        // Wait, did I implement a global offset tracking in TuringMachine.js History?
        // Let's check logic:
        // "headPosition: headPosition - offset" for infinite tape.
        // "headPosition: headPosition" for cyclic.

        // If cyclic, headPosition is just index. Tape length constant.
        // If infinite, history headPosition is "logical global index".
        // AND the stored `tape` is the full content.
        // But `tape` in JS array starts at 0.
        // If headPosition (logical) is 5, and tape is [0,0,0,1], and head maps to index 2 of tape...
        // My history logic:
        // `history.push({ state, tape: [...tape], headPosition: cyclic ? headPosition : headPosition });`
        // Wait, I reverted the `- offset` logic in previous turn?
        // Let's re-read TuringMachine.js or just inspect data.
        // In previous `TuringMachine.js`:
        // Infinite: `history.push({ ..., headPosition: headPosition });` where headPosition was reset to 0 after unshift?
        // Yes: `headPosition += expandCount; // Now 0` after unshift.
        // So `headPosition` in history IS the index into the `tape` array for that step.
        // This means step.tape[step.headPosition] is the cell under head.
        // Correct.

        // alignment problem:
        // Step 0: tape [1], head 0.
        // Step 1: shifts left. tape [0, 1], head 0. (Original 1 is at index 1).
        // If we simply draw index 0 at x=0, the tape will wiggle left/right visually.
        // We want to align the "center" or "origin".
        // But we don't track origin in history.
        // We can infer alignment by matching the tapes? Hard.

        // Alternative: Center the HEAD for every step? (Relative view)
        // Or Center the TAPE?
        // Let's try Centering the Head initially. 
        // Let's find relative bounds: relative to head.
        // step.headPosition is the pivot.

        // Let's define: Visual X = index - step.headPosition.
        // Then Head is always at Visual X = 0.
        // This is a "HEAD-CENTERED" view. 
        // Pros: Head is straight line down the middle.
        // Cons: Background moves.

        // User usually expects "Space-Time Diagram" where space is static X axis.
        // To do that, we need to know how much we shifted left.
        // Since we don't have explicit shift history, we can deduce it?
        // If tape grew by 1 at front, shift +1.
        // If tape grew by 1 at back, shift 0.

        // Let's assume initially for this version: Center the tape array in the view?
        // Or better: Let's modify TuringMachine to export offset?
        // Too risky to edit core logic now without testing.

        // Heuristic: Align matching segments?
        // Let's stick to valid visualization: Just center the arrays.
        // `let centerIdx = Math.floor(step.tape.length / 2);`
        // Draw `step.tape[i]` at `x = (i - centerIdx)`.

    });

    // Actually, reconstructing absolute coordinates:
    // We know `headPosition` tracks movement.
    // In infinite mode:
    // If `tape` length increased and `headPosition` changed abruptly (e.g. became 0 after unshift), we know a shift happened.
    // Unshift adds items at 0.
    // Let's just iterate and align.

    // For V1 visualizer: Align such that the Head path is visible?
    // Let's use the simplest approach: Map tape index `i` to `i - step.headPosition`.
    // Then X=0 is the head.
    // This is the "Head-Fixed" reference frame.
    // It's a valid way to view Turing Machines (especially for 4096 rules).

    // Let's compute bounds in Head-Fixed frame.
    const stepsData = history.map(step => {
        const row = [];
        // Determine visible range including head
        const minIdx = Math.min(0, step.headPosition);
        const maxIdx = Math.max(step.tape.length - 1, step.headPosition);

        for (let i = minIdx; i <= maxIdx; i++) {
            let val = 0; // Default virtual background
            if (i >= 0 && i < step.tape.length) {
                val = step.tape[i];
            }

            row.push({
                val: val,
                state: step.state,
                relX: i - step.headPosition, // 0 means at head
                isHead: i === step.headPosition
            });
        }
        return row;
    });

    // Find min/max relX
    let minRelX = 0;
    let maxRelX = 0;
    stepsData.forEach(row => {
        row.forEach(cell => {
            if (cell.relX < minRelX) minRelX = cell.relX;
            if (cell.relX > maxRelX) maxRelX = cell.relX;
        });
    });

    const widthCells = maxRelX - minRelX + 1;
    const heightCells = stepsData.length;

    // Resize Canvas
    canvas.width = widthCells * (CELL_SIZE + CELL_GAP);
    canvas.height = heightCells * (CELL_SIZE + CELL_GAP);

    // Clear
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw
    stepsData.forEach((row, y) => {
        row.forEach(cell => {
            // Map relX to canvas X
            // minRelX should be at x=0
            const canvasX = (cell.relX - minRelX) * (CELL_SIZE + CELL_GAP);
            const canvasY = y * (CELL_SIZE + CELL_GAP);

            // Tape 0: Yellow (#FACC15), Tape 1: Orange (#F97316)
            ctx.fillStyle = cell.val === 1 ? '#F97316' : '#FACC15';

            // Draw Cell
            ctx.fillRect(canvasX, canvasY, CELL_SIZE, CELL_SIZE);

            // Highlight Head
            if (cell.isHead) {
                // Draw filled white triangle
                // State 1: Up, State 2: Down
                ctx.fillStyle = '#ffffff';

                const cx = canvasX + CELL_SIZE / 2;
                const cy = canvasY + CELL_SIZE / 2;
                const size = CELL_SIZE * 0.6; // Triangle size relative to cell
                const r = size / 2;

                ctx.beginPath();
                if (cell.state === 1) {
                    // Up Triangle
                    ctx.moveTo(cx, cy - r);
                    ctx.lineTo(cx + r, cy + r);
                    ctx.lineTo(cx - r, cy + r);
                } else {
                    // Down Triangle
                    ctx.moveTo(cx, cy + r);
                    ctx.lineTo(cx + r, cy - r);
                    ctx.lineTo(cx - r, cy - r);
                }
                ctx.fill();
            }
        });
    });
}

// Start
init();
