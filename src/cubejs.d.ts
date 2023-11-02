declare module 'cubejs' {
    class CubeJS {
        static initSolver(): void;
        constructor();

        move(movement: string): void;
        randomize(): void;

        solve(): string;
        isSolved(): boolean;

        asString(): string;
    }

    export default CubeJS;
}
