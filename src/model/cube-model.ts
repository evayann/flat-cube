import { FaceName } from '../face-name';
import { range } from '../utils/iteration';
import { modulo } from '../utils/math';
import { Vec2 } from '../vec2';

const faceList = [
    { id: 'up', value: 'key1' },
    { id: 'left', value: 'key2' },
    { id: 'front', value: 'key3' },
    { id: 'right', value: 'key4' },
    { id: 'back', value: 'key5' },
    { id: 'down', value: 'key6' }
];

export class CubeModel {
    faces: Record<FaceName, Face>;
    protected _dimension: number;

    private get faceList(): Face[] {
        return Object.values(this.faces);
    }

    constructor(dimension: number) {
        this._dimension = dimension;
        this.faces = faceList.reduce((faces, { id, value }) => ({
            ...faces,
            [id]: Face.create().initialBlockValue(value).dimension(dimension)
        }), {} as Record<FaceName, Face>);
    }

    randomize(): void {
        // TODO
    }

    isSolved(): boolean {
        return this.faceList.every(face => face.allBlockIsInitial);
    }

    rotateX(columnIndex: number, isClockwise: boolean): void {
        this.checkIsCorrectMove(columnIndex, 'x');

        const maxColumn = this._dimension - 1;
        const faceNameList: FaceName[] = ['up', 'front', 'down', 'back'];
        const [upCopy, frontCopy, downCopy, backCopy] = this.extractAndCopy(faceNameList);

        if (isClockwise) {
            this.faces.front.updateColumn(columnIndex, upCopy.columns.at(columnIndex));
            this.faces.down.updateColumn(columnIndex, frontCopy.columns.at(columnIndex));
            this.faces.back.updateColumn(maxColumn - columnIndex, downCopy.columns.at(columnIndex));
            this.faces.up.updateColumn(columnIndex, backCopy.columns.at(maxColumn - columnIndex));
        }
        else {
            this.faces.up.updateColumn(columnIndex, frontCopy.columns.at(columnIndex));
            this.faces.front.updateColumn(columnIndex, downCopy.columns.at(columnIndex));
            this.faces.down.updateColumn(columnIndex, backCopy.columns.at(maxColumn - columnIndex));
            this.faces.back.updateColumn(maxColumn - columnIndex, upCopy.columns.at(columnIndex));
        }

        const isBorder = columnIndex === 0 || columnIndex === this._dimension;
        if (!isBorder) return;

        const borderFace = columnIndex === 0 ? this.faces.left : this.faces.right;
        borderFace.rotateClockwise();
    }

    rotateY(rowIndex: number, isClockwise: boolean): void {
        this.checkIsCorrectMove(rowIndex, 'y');

        const faceNameList: FaceName[] = ['left', 'front', 'right', 'back'];
        const faceToRotateCopyList = this.extractAndCopy(faceNameList);

        faceToRotateCopyList.forEach((_, index) => {
            const otherFaceIndex = modulo(index - (isClockwise ? 1 : -1), faceToRotateCopyList.length)
            const otherFace = faceToRotateCopyList[otherFaceIndex];
            const otherFaceRow = otherFace.rows[rowIndex];
            this.faces[faceNameList[index]].updateRow(rowIndex, otherFaceRow);
        });

        const isBorder = rowIndex === 0 || rowIndex === this._dimension;
        console.log([...this.faces.up.blockList])
        if (!isBorder) return;

        const borderFace = rowIndex === 0 ? this.faces.up : this.faces.down;
        borderFace.rotateClockwise();
        console.log([...this.faces.up.blockList])
    }

    toString(): string {
        const stringifyFace = (face: Face) => '\t' + face.rows.map(row => row.map(({ value }) => value).join(' ')).join('\n\t\t');
        const faceListStringify: string[] = Object.entries(this.faces).map(([faceName, face]) => `${faceName} = {\n\t${stringifyFace(face)}\n\t}`);
        return `Cube : \n\t${faceListStringify.join(',\n\t')}`;
    }

    private extractAndCopy(faceNameList: FaceName[]): Face[] {
        return faceNameList.map(faceName => this.faces[faceName].copy());
    }

    private checkIsCorrectMove(index: number, axe: string): void {
        if (0 > index && index >= this._dimension)
            throw new Error(`Incorrect move ! Can't move the ${index} of rotation ${axe}`);
    }
}

type Block = {
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

    get blockList(): { position: Vec2, value: string }[] {
        return this._blockList.map((block, index) => ({
            position: {
                x: index % this._dimension,
                y: Math.floor(index / this._dimension)
            },
            value: block.value
        }));
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
        rotatableFace._blockList = [...this._blockList];
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
