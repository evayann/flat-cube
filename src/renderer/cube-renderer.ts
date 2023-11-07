import * as p5 from 'p5';
import { AnimationManager } from '../animation-manager';
import { Circle } from '../circle';
import { FaceName, faceNameList } from '../face-name';
import { CubeModel, Face } from '../model/cube-model';
import { p } from '../p5-utils';
import { range } from '../utils/iteration';
import { Vec2 } from '../vec2';



export class RendererCube extends CubeModel {
    isMoving: boolean;

    private animationManager: AnimationManager;

    private percentStep: number;
    private centerPosition: p5.Vector;
    private radius: number;
    private halfRadius: number;

    private renderedFaces: Record<FaceName, any>;
    private positions!: Record<FaceName, Vec2[]>;

    private get renderedFaceList(): any[] {
        return Object.values(this.renderedFaces);
    }

    private get topCircleList(): Circle[] {
        const centerPosition = {
            x: this.centerPosition.x,
            y: this.centerPosition.y + this.spaceBetweenFirstAndLastCircle / 2
        };
        return this.getCircleListAt(centerPosition);
    }

    private get leftCircleList(): Circle[] {
        const centerPosition = {
            x: this.centerPosition.x - this.halfRadius + this.spaceBetweenFirstAndLastCircle / 3,
            y: this.centerPosition.y + this.halfRadius * p.sqrt(3)
        };
        return this.getCircleListAt(centerPosition);
    }

    private get rightCircleList(): Circle[] {
        const centerPosition = {
            x: this.centerPosition.x + this.halfRadius - this.spaceBetweenFirstAndLastCircle / 3,
            y: this.centerPosition.y + this.halfRadius * p.sqrt(3)
        };
        return this.getCircleListAt(centerPosition);
    }

    private get spaceBetweenFirstAndLastCircle(): number {
        return this.radius - this.radius * (1 - this.percentStep * (this._dimension - 1));
    }

    constructor(dimension: number) {
        super(dimension);
        this.animationManager = new AnimationManager();
        this.percentStep = 0.075;
        this.centerPosition = p.createVector(0, 0);
        this.radius = 200;
        this.halfRadius = this.radius / 2;
        this.isMoving = false;
        this.calculatePositions();

        // this.renderedFaces = Object.entries(this.faces).reduce((renderedFaces, [faceName, face]) => {
        //     renderedFaces[faceName] = face.blockList.map(block => ({
        //         position: this.positions[faceName],
        //         value: block.value
        //     }));

        //     return renderedFaces;
        // }, {});
        // this.updateFaces();
    }

    draw() {
        this.animationManager.update();

        p.push();
        p.translate(0, -this.halfRadius);
        this.drawLines();

        // this.renderedFaceList.forEach(face => face.forEach(({ color, position }) => {
        //     p.fill(color);
        //     p.circle(position.x, position.y, 10);
        // }));

        const facesColors: Record<string, string> = {
            key1: 'white',
            key2: 'red',
            key3: 'blue',
            key4: 'orange',
            key5: 'green',
            key6: 'yellow'
        };

        const faceNameAndFaceList = Object.entries(this.faces) as [FaceName, Face][];
        faceNameAndFaceList.forEach(([faceName, face]) => {
            const positionList = this.positions[faceName];
            face.blockList.forEach((block, index) => {
                const { x, y } = positionList[index];
                p.fill(facesColors[block.value]);
                p.circle(x, y, 10);
            });
        });

        p.pop();
    }

    private drawLines() {
        p.noFill();
        const circleList: Circle[] = [
            ...this.topCircleList,
            ...this.leftCircleList,
            ...this.rightCircleList,
        ];
        circleList.forEach(({ raw: { x, y, radius } }) => p.circle(x, y, radius * 2));
    }

    private updateFaces(): void {
        // this.renderedFaces = 
    }

    private calculatePositions(): void {
        this.positions = faceNameList.reduce((emptyPositions, faceName) => ({
            ...emptyPositions,
            [faceName]: range(this._dimension).map(() => ({ x: 0, y: 0 }))
        }), {} as Record<FaceName, Vec2[]>);

        // n = dimension * dimension; d = dimension
        this.topCircleList.forEach((topCircle, topCircleIndex) => {
            this.leftCircleList.forEach((leftCircle, leftCircleIndex) => {
                const [rightPosition, leftPosition] = topCircle.intersectionBetween(leftCircle);

                // left n - d -> n, n - 2d -> n - d - 1 ...
                this.positions.left[this._dimension * (this._dimension - 1 - topCircleIndex) + leftCircleIndex % this._dimension] = leftPosition;

                // right n to 0
                this.positions.right[this._dimension * this._dimension - 1 - (topCircleIndex * this._dimension + leftCircleIndex)] = rightPosition;
            });

            this.rightCircleList.forEach((rightCircle, rightCircleIndex) => {
                const [backPosition, frontPosition] = topCircle.intersectionBetween(rightCircle);

                // back n to 0
                this.positions.back[this._dimension * this._dimension - 1 - (topCircleIndex * this._dimension + rightCircleIndex)] = backPosition;

                // front n - d -> n, n - 2d -> n - d - 1 ...
                this.positions.front[this._dimension * (this._dimension - 1 - topCircleIndex) + rightCircleIndex % this._dimension] = frontPosition;
            });
        });

        this.leftCircleList.forEach((leftCircle, leftCircleIndex) => {
            this.rightCircleList.forEach((rightCircle, rightCircleIndex) => {
                const [upPosition, downPosition] = leftCircle.intersectionBetween(rightCircle);
                this.positions.up[leftCircleIndex * this._dimension + rightCircleIndex] = upPosition;
                this.positions.down[leftCircleIndex * this._dimension + rightCircleIndex] = downPosition;
            });
        });
    }

    private getCircleListAt({ x, y }: Vec2): Circle[] {
        return range(this._dimension).map(index => new Circle().x(x).y(y).radius(this.radius * (1 - this.percentStep * index)));
    }
}