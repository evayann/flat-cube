import * as p5 from 'p5';
import { CubeModel } from '../model/cube-model';
import { p } from '../p5-utils';
import { AnimationManager } from '../animation-manager';
import { FaceName, faceNameList } from '../face-name';
import { Circle } from '../circle';
import { range, zip } from '../utils/iteration';
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
        return this.getCircleListAt(this.centerPosition);
    }

    private get leftCircleList(): Circle[] {
        const centerPosition = {
            x: this.centerPosition.x - this.halfRadius,
            y: this.centerPosition.y + this.halfRadius * p.sqrt(3)
        };
        return this.getCircleListAt(centerPosition);
    }

    private get rightCircleList(): Circle[] {
        const centerPosition = {
            x: this.centerPosition.x + this.halfRadius,
            y: this.centerPosition.y + this.halfRadius * p.sqrt(3)
        };
        return this.getCircleListAt(centerPosition);
    }

    constructor(dimension: number) {
        super(dimension);
        this.animationManager = new AnimationManager();
        this.percentStep = 0.1;
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

        this.topCircleList.forEach((topCircle, topCircleIndex) => {
            this.leftCircleList.forEach((leftCircle, leftCircleIndex) => {
                const [leftPosition, rightPosition] = topCircle.intersectionBetween(leftCircle);
                this.positions.left[topCircleIndex + leftCircleIndex] = leftPosition;
            });

            this.rightCircleList.forEach((rightCircle, rightCircleIndex) => {
                const [backPosition, frontPosition] = topCircle.intersectionBetween(rightCircle);
                this.positions.left[topCircleIndex + rightCircleIndex] = backPosition;
            });
        });

        this.leftCircleList.forEach((leftCircle, leftCircleIndex) => {
            this.rightCircleList.forEach((rightCircle, rightCircleIndex) => {
                const [upPosition, downPosition] = leftCircle.intersectionBetween(rightCircle);
                this.positions.up[leftCircleIndex + rightCircleIndex] = upPosition;
            });
        });
    }

    private getCircleListAt({ x, y }: Vec2): Circle[] {
        return range(this._dimension).map(index => new Circle().x(x).y(y).radius(this.radius * (1 - this.percentStep * index)));
    }
}