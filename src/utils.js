
/**
 * Converts a rule integer (0-4095) to a transition table.
 * For a 2-state, 2-color machine.
 * 
 * Logic inferred (to be verified):
 * Inputs: 4 cases: {State, Color} -> {1,0}, {1,1}, {2,0}, {2,1}
 * Outputs per case: {NewState, NewColor, Move}
 * Total 3 bits per case. 4 cases * 3 bits = 12 bits. 2^12 = 4096.
 * 
 * @param {number} rule - Integer rule.
 * @returns {Object} Transition table.
 */
export function parseRule(rule) {
    if (rule < 0 || rule > 4095) {
        throw new Error("Rule must be between 0 and 4095");
    }

    const transitions = {};

    // Wolfram 2-state 2-color rule numbering encoding:
    // Base 8 digits: d3, d2, d1, d0 (MSB .. LSB of the 4-digit representation)
    // Order of inputs corresponding to digits:
    // Digit 0 (MSB, 512s place): Input (State 1, Color 1)
    // Digit 1 (64s place):       Input (State 1, Color 0)
    // Digit 2 (8s place):        Input (State 2, Color 1)
    // Digit 3 (LSB, 1s place):   Input (State 2, Color 0)

    // Extract digits manually (equivalent to IntegerDigits[rule, 8, 4])
    const digits = [];
    let temp = rule;
    for (let i = 0; i < 4; i++) {
        digits.unshift(temp & 7); // Get last 3 bits (base 8 digit)
        temp >>= 3;
    }

    // Map digits to inputs
    const inputs = [
        { s: 1, c: 1 }, // MSB - Digit index 0
        { s: 1, c: 0 },
        { s: 2, c: 1 },
        { s: 2, c: 0 }  // LSB - Digit index 3
    ];

    inputs.forEach((input, index) => {
        const digit = digits[index];

        // Decode digit (3 bits: S C M)
        // Bit 2 (4): New State Offset (0->State 1, 1->State 2)
        // Bit 1 (2): New Color (0 or 1)
        // Bit 0 (1): Move (0->Left -1, 1->Right +1)

        const stateBit = (digit >> 2) & 1;
        const colorBit = (digit >> 1) & 1;
        const moveBit = digit & 1;

        const newState = stateBit + 1;
        const newColor = colorBit;
        const move = moveBit === 1 ? 1 : -1;

        const key = `${input.s},${input.c}`;
        transitions[key] = { newState, newColor, move };
    });

    return transitions;
}
