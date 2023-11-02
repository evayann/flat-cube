import CubeJS from 'cubejs';
import { FaceName } from './face-name';

const colorsRecord: any = {
    U: 'white', // Up
    L: 'red', // Left
    F: 'blue', // Front
    R: 'orange', // Right
    B: 'green', // Back
    D: 'yellow', // Down
};

export class CubeModel extends CubeJS {
    protected faces: Record<FaceName, string[]>;

    constructor() {
        super();
        this.faces = this.cubeToFaces();
    }

    move(movement: string) {
        super.move(movement);
        this.faces = this.cubeToFaces();
    }

    randomize() {
        super.randomize();
        this.faces = this.cubeToFaces();
    }

    cubeToFaces() {
        const cubeString = this.asString();
        const cubeFaceStringList = cubeString.match(/.{1,9}/g) ?? [];

        const faceStringToColorList = (faceString: string) => faceString.split('').map(colorCode => colorsRecord[colorCode]);
        const cubeFaceList = cubeFaceStringList.map(faceStringToColorList);
        const [up, right, front, down, left, back] = cubeFaceList;

        return {
            up, right, front, down, left, back
        };
    }
}
