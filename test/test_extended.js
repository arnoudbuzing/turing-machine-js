
import { TuringMachine } from '../src/TuringMachine.js';

const tm = new TuringMachine(2506);

// Test 1: Cyclic Tape
// Wolfram style: {{1, 1}, {0, 0, 0}} -> State 1, Head 1 (index 0), Cyclic tape {0, 0, 0}
console.log("--- Test 1: Cyclic ---");
const cyclicHist = tm.evolve([[1, 1], [0, 0, 0]], 5);
cyclicHist.forEach((s, i) => console.log(`Step ${i}: State ${s.state}, Head ${s.headPosition}, Tape [${s.tape}]`));

// Test 2: Infinite with Background
// Wolfram style: {{1, 1}, {{0, 1}, 0}} -> State 1, Head 1, Initial {0, 1}, Background 0
console.log("\n--- Test 2: Infinite Background 0 ---");
const infHist = tm.evolve([[1, 1], [[0, 1], 0]], 5);
infHist.forEach((s, i) => console.log(`Step ${i}: State ${s.state}, Head ${s.headPosition}, Tape [${s.tape}]`));

// Test 3: Repetitive Background (Simplified handling verification)
// Wolfram style: {{1, 1}, {{0}, 1}} -> Tape {0}, Background 1s
console.log("\n--- Test 3: Infinite Background 1 ---");
const bg1Hist = tm.evolve([[1, 1], [[0], 1]], 5);
bg1Hist.forEach((s, i) => console.log(`Step ${i}: State ${s.state}, Head ${s.headPosition}, Tape [${s.tape}]`));

// Test 4: Regression Rule 1010
// TuringMachine[1010, {1, {{}, 0}}, 20]
console.log("\n--- Test 4: Rule 1010 Regression ---");
const tm1010 = new TuringMachine(1010);
const hist1010 = tm1010.evolve([1, [[], 0]], 20);
hist1010.forEach((s, i) => {
    if (i === 0 || i === 20) {
        console.log(`Step ${i}: State ${s.state}, Head ${s.headPosition}, Tape [${s.tape}]`);
    }
});
