import { FaceName } from "../face-name";
import { zip } from "../utils/iteration";
import { CubeModel, Faces } from "./cube.model";
import { Block, Face } from "./face.model";

export type HistoricBlock = { value: string, oldPosition: { face: FaceName, index: number } };

export class HistoricalCube extends CubeModel {
    historicFaces: Record<FaceName, HistoricBlock[]>;

    constructor(dimension: number) {
        super(dimension);
        this.updateHistoricFaces(this.facesCopy(), this.facesCopy());
    }

    rotateX(columnIndex: number, isClockwise: boolean): void {
        const oldFaces = this.facesCopy();
        super.rotateX(columnIndex, isClockwise);
        this.updateHistoricFaces(oldFaces, this.facesCopy());
    }

    rotateY(rowIndex: number, isClockwise: boolean): void {
        const oldFaces = this.facesCopy();
        super.rotateY(rowIndex, isClockwise);
        this.updateHistoricFaces(oldFaces, this.facesCopy());
    }

    private updateHistoricFaces(oldFaces: Faces, newFaces: Faces): void {
        const searchBlockInFaces = (faces: Faces, searchedBlock: Block): { face: FaceName, index: number } | undefined => {
            const nameAndFaceList = Object.entries(faces) as [FaceName, Face][];
            for (const [faceName, face] of nameAndFaceList) {
                const indexOf = face.blockList.findIndex(block => block.id === searchedBlock.id && block.value === searchedBlock.value);
                if (indexOf !== -1) return { face: faceName, index: indexOf }
            };

            return undefined;
        };

        const nameAndFaceList = zip(Object.keys(oldFaces), Object.values(newFaces)) as [FaceName, Face][];
        this.historicFaces = nameAndFaceList.reduce((historicFaces, [faceName, newFace]) => {
            historicFaces[faceName] = newFace.blockList.map(block => ({
                value: block.value,
                oldPosition: searchBlockInFaces(oldFaces, block)
            }));

            return historicFaces;
        }, {} as Record<FaceName, HistoricBlock[]>);
    }

    private facesCopy(): Faces {
        return Object.entries(this.faces).reduce((accumulator, [faceName, face]) => ({
            ...accumulator,
            [faceName]: face.copy()
        }), {} as Faces);
    }
}