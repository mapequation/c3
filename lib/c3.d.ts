export declare class Node {
    start: number;
    end: number;
    children: [Node, Node] | null;
    constructor(start?: number, end?: number);
    get size(): number;
    get mid(): number;
    split(): [Node, Node];
}
export declare function generateArray(numColors?: number): Node[];
