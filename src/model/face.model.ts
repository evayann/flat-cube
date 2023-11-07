import { range } from "../utils/iteration";
import { Vec2 } from "../vec2";

export type Block = {
    id: number;
    value: string;
};

export class Face {
    static create() {
        return new Face();
    }

    private _blockList!: Block[];
    private _dimension!: number;
    private _initialBlockValue: string;

    // get blockList(): { position: Vec2, value: string }[] {
    //     return this._blockList.map((block, index) => ({
    //         position: {
    //             x: index % this._dimension,
    //             y: Math.floor(index / this._dimension)
    //         },
    //         value: block.value
    //     }));
    // }

    get blockList(): Readonly<Block>[] {
        return this._blockList;
    }

    get rows(): Block[][] {
        return range(this._dimension).reduce((acc, index) =>
            [...acc, this._blockList.slice(index * this._dimension, index * this._dimension + this._dimension)]
            , []);
    }

    get columns(): Block[][] {
        return range(this._dimension).reduce((acc, index) =>
            [...acc, this._blockList.filter((_, blockIndex) => blockIndex % this._dimension === index)]
            , []);
    }

    get allBlockIsInitial(): boolean {
        return this._blockList.every(block => block.value === this._initialBlockValue);
    }

    private get squaredDimension(): number {
        return this._dimension * this._dimension;
    }

    private constructor() {
        this._initialBlockValue = 'key1';
        this.dimension(3);
    }

    copy(): Face {
        const rotatableFace = new Face().dimension(this._dimension).initialBlockValue(this._initialBlockValue);
        rotatableFace._blockList = this._blockList.map(block => ({ ...block }));
        return rotatableFace;
    }

    updateRow(rowIndex: number, newRowList: any[]): Face {
        newRowList.forEach((block, index) => this._blockList[index + rowIndex * this._dimension] = block);
        return this;
    }

    updateColumn(columnIndex: number, newColumnList: any[]): Face {
        newColumnList.forEach((block, index) => this._blockList[columnIndex + index * this._dimension] = block);
        return this;
    }

    initialBlockValue(initialBlockValue: string): Face {
        this._initialBlockValue = initialBlockValue;
        this.dimension(this._dimension);
        return this;
    }

    dimension(dimension: number): Face {
        this._dimension = dimension;
        this._blockList = range(this._dimension * this._dimension).map((index) => ({
            id: index,
            value: this._initialBlockValue
        }));
        return this;
    }

    rotateClockwise(): Face {
        this._blockList = this._blockList.map((_, index) => {
            const firstIndexOfRow = this.squaredDimension - (this._dimension - 1) - 1;
            const nbColumnPassed = this._dimension * (index % this._dimension);
            const nbRowPassed = Math.floor(index / this._dimension);
            return this._blockList[firstIndexOfRow - nbColumnPassed + nbRowPassed];
        });

        return this;
    }

    rotateAntiClockwise(): Face {

        return this;
    }
}