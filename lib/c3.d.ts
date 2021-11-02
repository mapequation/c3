export declare class Node {
    readonly start: number;
    readonly end: number;
    children: [Node, Node] | null;
    constructor(start?: number, end?: number);
    get size(): number;
    get mid(): number;
    split(): [Node, Node];
}
export declare class WeightedNode extends Node {
    readonly weight: number;
    constructor(start?: number, end?: number, weight?: number);
}
export declare function generateArray(numColors?: number): Node[];
