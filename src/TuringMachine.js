
import { parseRule } from './utils.js';

export class TuringMachine {
    constructor(rule) {
        this.rule = rule;
        this.transitions = typeof rule === 'number' ? parseRule(rule) : rule;
    }

    /**
     * Normalizes initial condition input to internal format.
     * Supports:
     * - {state, tape, headPosition} (Standard JS object)
     * - [state, [tape, background]] (Infinite, background 0 or val or list)
     * - [[state, head], [tape, background]] (Infinite with explicit head)
     * - [[state, head], tape] (Cyclic if tape is a single list and 2nd part is missing/different structure checking needed?)
     *   Wolfram: {{s, ...}, {a...}} is Cyclic. {{s, ...}, {{a...}, 0}} is Infinite.
     */
    normalizeInitialState(input) {
        // 1. Pass-through if already normalized object
        if (input.state !== undefined && input.tape !== undefined) {
            return {
                state: input.state,
                tape: Array.isArray(input.tape) ? input.tape : [input.tape],
                headPosition: input.headPosition !== undefined ? input.headPosition : 0,
                background: input.background || 0,
                cyclic: !!input.cyclic
            };
        }

        let state, head = 0, tape, background = 0, cyclic = false;

        // Helper to check if array is a list of values or a list of lists?
        // Wolfram logic: {state, tapespec}

        let stateSpec = input[0];
        let tapeSpec = input[1];

        // Parse State Spec
        if (Array.isArray(stateSpec)) {
            // {{s, x}, ...} -> State s, Head x (1-based in Wolfram -> 0-based JS)
            state = stateSpec[0];
            head = stateSpec[1];
            // Wolfram is 1-based usually. If user passes naive JS array [s, x], do we assume 0 or 1 based?
            // To be safe and compatible with Wolfram numbers, let's assuming input mimics Wolfram means 1-based head.
            // But if users use this lib, they might expect 0-based. 
            // Decision: If using array syntax (Wolfram-style), assume Wolfram 1-based indexing for head.
            head = head - 1;
        } else {
            // {s, ...}
            state = stateSpec;
            head = 0; // Default head? Typically 0 (first element) or centered? Wolfram default is usually 0 (element 1).
        }

        // Parse Tape Spec
        if (Array.isArray(tapeSpec) && tapeSpec.length === 2 && Array.isArray(tapeSpec[0])) {
            // {{a...}, background} -> Infinite
            tape = tapeSpec[0];
            background = tapeSpec[1];
        } else if (Array.isArray(tapeSpec)) {
            // {a...} -> Cyclic
            // Note: {{a...}, bg} was caught above. 
            // So if we are here, tapeSpec is a list, but NOT a pair where first is list.
            // Wait. {1, 0, 1} is Array. length is 3. 
            // {{1,0}, 0} is Array. length 2. tapeSpec[0] is {1,0} (Array).
            // What if Cyclic tape is {{1,0}, {0,1}} (list of lists)?
            // Wolfram definition: finite list -> cyclic.
            // If input is {s, {a...}}.
            // tapeSpec = {a...}.
            // If tapeSpec is {{1,0}, 0}, it matches first if.
            // If tapeSpec is {1, 0, 1}, tapeSpec[0] is 1 (Not Array). Else matches.

            // What about {{1,0}, {1,0}}? 
            // Matches first if? tapeSpec[0] is Array. tapeSpec[1] is Array.
            // Wolfram: {{init}, {bg}}.
            // Cyclic tape of lists? Not standard 2-color.
            // For 2-color, tape is 1D list of 0/1. 
            // So tapeSpec[0] being a number implies Simple List.

            tape = tapeSpec;
            cyclic = true;
        } else {
            // Fallback
            tape = tapeSpec || [0];
        }

        return { state, tape, headPosition: head, background, cyclic };
    }

    evolve(input, steps) {
        const initialState = this.normalizeInitialState(input);

        let { state, tape, headPosition, background, cyclic } = initialState;
        tape = [...tape]; // Copy

        const history = [];

        // Record initial state
        // For output consistency, we might want to return the 'Tape' as relative to the head or absolute?
        // We'll return the internal tape view.
        history.push({ state, tape: [...tape], headPosition });

        let offset = 0; // Track shifting of the infinite tape origin

        for (let i = 0; i < steps; i++) {
            // Get color under head
            let color;
            let effectiveHead = headPosition;

            if (cyclic) {
                // Wrap head
                const len = tape.length;
                effectiveHead = ((headPosition % len) + len) % len;
                color = tape[effectiveHead];
            } else {
                // Infinite tape logic
                if (headPosition < 0) {
                    // Expand Left
                    const expandCount = -headPosition;
                    for (let k = 0; k < expandCount; k++) {
                        // Background alignment:
                        // If bg = [b1, b2], left of tape implies reversing?
                        // Wolfram test analysis:
                        // Right neighbor of tape start is b1. 
                        // Left neighbor of tape start should be last element of bg?
                        // Let's implement: Tape ... b[last], b[0] [TAPE] b[0], b[1] ...
                        // To maintain [ ... b0, b1, b0, b1 ... ] pattern globally?
                        // If center is 0. 
                        // Index 0 -> Tape[0].
                        // Index 1 -> bg[0] (if tape len 1).
                        // Index -1 -> bg[last]?

                        let val = 0;
                        if (Array.isArray(background) && background.length > 0) {
                            // Logic: value at index i (relative to tape start 0)
                            // Right side (i >= len): val = bg[(i - len) % bg.length]
                            // Left side (i < 0): val = bg[(i % bg.length + bg.length) % bg.length] ??
                            // Actually, let's keep track of 'offset'.
                            // But simplified: when prepending, we are adding at index 'headPosition + k' ?
                            // No, we prepend one by one.
                            // New element at index -1 corresponds to... ?
                            // If pattern is ... b0 b1 b0 b1 [tape] b0 b1 ...
                            // Then index -1 should be b1 (if len 2). Index -2 b0.
                            // (index % len + len) % len.
                            // -1 % 2 = -1 + 2 = 1 -> b[1].
                            // -2 % 2 = 0 -> b[0].
                            // Checks out.

                            // We are adding elements at new index 0 (after shift).
                            // The element being added corresponds to logical index 'currentHead - (expandCount - k) ...'
                            // Actually simpler:
                            // We need to determine value for logical index `headPosition + k`.
                            // headPosition is e.g. -2. k=0 -> -2. k=1 -> -1.
                            const logicalIndex = headPosition + k;
                            const bgIndex = ((logicalIndex % background.length) + background.length) % background.length;
                            val = background[bgIndex];
                        } else {
                            val = background;
                        }
                        tape.unshift(val);
                    }
                    offset += expandCount;
                    headPosition += expandCount; // Now 0
                    effectiveHead = 0;
                } else if (headPosition >= tape.length) {
                    // Expand Right
                    const expandCount = headPosition - tape.length + 1;
                    for (let k = 0; k < expandCount; k++) {
                        let val = 0;
                        if (Array.isArray(background) && background.length > 0) {
                            // logical index = oldLen + k
                            const logicalIndex = tape.length + k; // tape.length grows? No, constant in this loop?
                            // Ah, tape.push changes length.
                            // But here we are iterating k.
                            // Logical index of new slot is (current length before this specific push).
                            // tape.length updates on push.
                            const idx = tape.length;
                            // Wait, logical index relative to initial tape start?
                            // Yes, indices > initial length.
                            // If tape was shifted left (offset > 0), then relative to what?
                            // 'tape' variable holds current tape. 
                            // We need consistent global indexing for background pattern?
                            // "Background of value b".
                            // Usually implies pattern matches spatial coordinates 0, 1, 2...
                            // Or is it anchored to the tape boundaries?
                            // Wolfram: "with background b".
                            // Usually b starts at the boundary.
                            // Right boundary -> b[0].
                            // Left boundary -> b[last].
                            // This implies the pattern is anchored to the *initial* tape.
                            // Let's use `offset` to calculate "relative to initial tape" index.

                            // Current index i corresponds to initial index `i - offset`.
                            // We are adding at `tape.length`.
                            // So logical index = `tape.length - offset`.
                            // For Right side: `(tape.length - offset) % bg.len`.

                            const absIndex = tape.length - offset;
                            const bgIndex = ((absIndex % background.length) + background.length) % background.length;
                            val = background[bgIndex];
                        } else {
                            val = background;
                        }
                        tape.push(val);
                    }
                    effectiveHead = headPosition;
                }
                color = tape[effectiveHead];
            }

            // Fallback safety
            if (color === undefined) color = 0;

            const key = `${state},${color}`;
            const rule = this.transitions[key];

            if (!rule) {
                break; // Halt
            }

            // Update Tape
            if (cyclic) {
                tape[effectiveHead] = rule.newColor;
            } else {
                tape[headPosition] = rule.newColor;
            }

            state = rule.newState;
            headPosition += rule.move;

            history.push({ state, tape: [...tape], headPosition: cyclic ? headPosition : headPosition - offset });
            // Note: headPosition in history relative to *initial* index 0?
            // If we blindly output 'tape' which grew, headIndex must match that tape.
            // So for history, let's strictly push the *current* full tape and the *current* index into that tape.
            // My offset logic above was mixed. Let's fix history object:
            if (!cyclic) {
                // For infinite string history, just give the current JS array and index.
                history[history.length - 1].headPosition = headPosition;
            }
        }

        return history;
    }
}
