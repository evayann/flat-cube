import { FaceName } from '../face-name';
import { modulo } from '../utils/math';
import { Face } from './face.model';

export type Faces = Record<FaceName, Face>;

const faceList = [
    { id: 'up', value: 'key1' },
    { id: 'left', value: 'key2' },
    { id: 'front', value: 'key3' },
    { id: 'right', value: 'key4' },
    { id: 'back', value: 'key5' },
    { id: 'down', value: 'key6' }
];

export class CubeModel {
    faces: Faces;
    protected _dimension: number;

    private get faceList(): Face[] {
        return Object.values(this.faces);
    }

    constructor(dimension: number) {
        this._dimension = dimension;
        this.faces = faceList.reduce((faces, { id, value }) => ({
            ...faces,
            [id]: Face.create().initialBlockValue(value).dimension(dimension)
        }), {} as Faces);
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
        if (!isBorder) return;

        const borderFace = rowIndex === 0 ? this.faces.up : this.faces.down;
        borderFace.rotateClockwise();
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