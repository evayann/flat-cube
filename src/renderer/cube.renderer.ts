import * as p5 from 'p5';
import { AnimationManager } from '../animation-manager';
import { Circle } from '../circle';
import { FaceName, faceNameList } from '../face-name';
import { Block, Face } from '../model/face.model';
import { HistoricBlock, HistoricalCube } from '../model/historic-cube.model';
import { p } from '../p5-utils';
import { range } from '../utils/iteration';
import { Vec2 } from '../vec2';
import { slerp } from '../utils/interpolation';

type BlockItem = { position: Vec2, color: string };

export class RendererCube extends HistoricalCube {
    isMoving: boolean;

    private animationManager: AnimationManager;

    private percentStep: number;
    private centerPosition: p5.Vector;
    private radius: number;
    private halfRadius: number;

    private renderedFaces: Record<FaceName, BlockItem[]>;
    private positions!: Record<FaceName, p5.Vector[]>;

    private facesColors: Record<string, string> = {
        key1: 'white',
        key2: 'red',
        key3: 'blue',
        key4: 'orange',
        key5: 'green',
        key6: 'yellow'
    };

    private get renderedBlockList(): BlockItem[] {
        return Object.values(this.renderedFaces).flat();
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


        const faceList = Object.entries(this.faces) as [FaceName, Face][];
        this.renderedFaces = faceList.reduce((renderedFaces, [faceName, face]) => {
            renderedFaces[faceName] = face.blockList.map((block, index) => ({
                position: this.positions[faceName][index],
                color: block.value
            }));

            return renderedFaces;
        }, {} as Record<FaceName, { position: Vec2, color: string }[]>);
    }

    draw() {
        this.animationManager.update();

        p.push();
        p.translate(0, -this.halfRadius);
        this.drawLines();

        this.renderedBlockList.forEach(({ color, position }) => {
            p.fill(color);
            p.circle(position.x, position.y, 10);
        });

        // const faceNameAndFaceList = Object.entries(this.historicFaces) as [FaceName, HistoricBlock[]][];
        // faceNameAndFaceList.forEach(([faceName, blockList]) => {
        //     const positionList = this.positions[faceName];
        //     blockList.forEach((block, index) => {
        //         const { x, y } = positionList[index];
        //         p.fill(this.facesColors[block.value]);
        //         p.circle(x, y, 10);
        //     });
        // });

        p.pop();
    }

    rotateX(columnIndex: number, isClockwise: boolean): void {
        if (this.isMoving) return;
        super.rotateX(columnIndex, isClockwise);
        this.triggerMogementAnimation(isClockwise);
    }

    rotateY(rowIndex: number, isClockwise: boolean): void {
        if (this.isMoving) return;
        super.rotateY(rowIndex, isClockwise);
        this.triggerMogementAnimation(isClockwise);
    }

    private triggerMogementAnimation(isClockwise: boolean): void {
        this.animationManager.animate({
            callback: (percentage) => {
                this.isMoving = true;
                const faceList = Object.entries(this.historicFaces) as [FaceName, HistoricBlock[]][];
                this.renderedFaces = faceList.reduce((renderedFaces, [faceName, historicBlock]) => {
                    renderedFaces[faceName] = historicBlock.map(({ oldPosition, value }: HistoricBlock, index: number): BlockItem => {
                        const color = this.facesColors[value];
                        const hasChangeOfFace = oldPosition.face === faceName;
                        const blockNotMove = hasChangeOfFace && oldPosition.index === index;

                        if (blockNotMove) return { position: this.getPositionFromKey({ faceName, index }), color };

                        const oldPositionVec = this.getPositionFromKey({ faceName: oldPosition.face, index: oldPosition.index });
                        const newPositionVec = this.getPositionFromKey({ faceName, index });
                        const position = !hasChangeOfFace ? p5.Vector.lerp(oldPositionVec, newPositionVec, percentage)
                            : slerp(oldPositionVec, newPositionVec, circlePosition, percentage, isClockwise);

                        return { color, position };

                        // if (isBlockItem(displayBlock)) return displayBlock;

                        // const position = displayBlock.type === 'linear' ?
                        //     p5.Vector.lerp(displayBlock.from, displayBlock.to, percentage)
                        //     : slerp(displayBlock.from, displayBlock.to, circlePosition.raw, percentage, displayBlock.clockwise);

                        // return {
                        //     color: displayBlock.color,
                        //     position
                        // };
                    });

                    return renderedFaces;
                }, {} as Record<FaceName, BlockItem[]>);
            },
            whenEnd: () => this.isMoving = false,
            durationInSecond: 1
        });
    }

    private getPositionFromKey({ faceName, index }: { faceName: FaceName, index: number }): p5.Vector {
        return this.positions[faceName][index];
    }

    // private getCenterCircleFromKey(axeRotate: 'x' | 'y'{, faceName, index }: { faceName: FaceName, index: number }): p5.Vector {
    //     return
    // }

    private drawLines() {
        p.noFill();
        const circleList: Circle[] = [
            ...this.topCircleList,
            ...this.leftCircleList,
            ...this.rightCircleList,
        ];
        circleList.forEach(({ raw: { x, y, radius } }) => p.circle(x, y, radius * 2));
    }

    private calculatePositions(): void {
        this.positions = faceNameList.reduce((emptyPositions, faceName) => ({
            ...emptyPositions,
            [faceName]: range(this._dimension).map(() => ({ x: 0, y: 0 }))
        }), {} as Record<FaceName, p5.Vector[]>);

        this.topCircleList.forEach((topCircle, topCircleIndex) => {
            this.leftCircleList.forEach((leftCircle, leftCircleIndex) => {
                const [rightPosition, leftPosition] = topCircle.intersectionBetween(leftCircle);
                this.positions.left[this._dimension * (this._dimension - 1 - topCircleIndex) + leftCircleIndex % this._dimension] = leftPosition;
                this.positions.right[this._dimension * this._dimension - 1 - (topCircleIndex * this._dimension + leftCircleIndex)] = rightPosition;
            });

            this.rightCircleList.forEach((rightCircle, rightCircleIndex) => {
                const [backPosition, frontPosition] = topCircle.intersectionBetween(rightCircle);
                this.positions.back[this._dimension * this._dimension - 1 - (topCircleIndex * this._dimension + rightCircleIndex)] = backPosition;
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