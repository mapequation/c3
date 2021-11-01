"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateArray = exports.Node = void 0;
class Node {
    constructor(start = 0, end = 1) {
        this.start = 0;
        this.end = 1;
        this.children = null;
        this.start = start;
        this.end = end;
    }
    get size() {
        return this.end - this.start;
    }
    get mid() {
        return this.start + this.size / 2;
    }
    split() {
        if (!this.children) {
            this.children = [
                new Node(this.start, this.mid),
                new Node(this.mid, this.end),
            ];
        }
        return this.children;
    }
}
exports.Node = Node;
function generateArray(numColors = 10) {
    const numLoops = Math.ceil(Math.log2(numColors));
    const colors = [new Node()];
    for (let i = 0; i < numLoops; ++i) {
        const length = colors.length;
        for (let j = 0; j < length; ++j) {
            const [first, second] = colors[j].split();
            colors[j] = first;
            colors.push(second);
        }
    }
    return colors;
}
exports.generateArray = generateArray;
