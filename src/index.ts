import * as p5 from 'p5';

import { AnimationManager } from './animation-manager';
import { slerp } from './utils/interpolation';
import { Circle } from './circle';
import { FaceName } from './face-name';
import { initializeP5Methods } from './p5-utils';
import { RendererCube } from './renderer/cube.renderer';

const body = document.getElementsByTagName('body')[0];

new p5(p => {
    // let flatCube: FlatCube;
    let rendererCube: RendererCube;
    let solutionList: { axe: 'x' | 'y', index: number, clockwise: boolean }[];

    p.setup = function () {
        initializeP5Methods(p);
        rendererCube = new RendererCube(3);

        // flatCube = FlatCube.random();
        // solutionList = flatCube.solve().split(' ');
        // console.log(solutionList);
        solutionList = [
            { axe: 'x', index: 1, clockwise: true },
            { axe: 'y', index: 1, clockwise: true },
            { axe: 'y', index: 1, clockwise: true },
            { axe: 'x', index: 1, clockwise: false },
        ];
        console.log(solutionList);

        p.createCanvas(800, 800);
    }

    p.draw = function () {
        p.translate(p.width / 2, p.height / 2);
        p.background('lightgray');

        // if (rendererCube.isSolved()) {
        //     // p.noLoop();
        //     return;
        // }

        rendererCube.draw();

        if (p.frameCount % 60 === 0) updateCube();
    }

    p.mouseClicked = () => updateCube();

    function updateCube() {
        // if (flatCube.isMoving) return;

        const movement = solutionList.shift();

        const noMovementLeft = !movement;
        if (noMovementLeft) {
            // p.noLoop();
            return;
        }

        const { axe, index, clockwise } = movement;
        const movements = {
            x: () => rendererCube.rotateX(index, clockwise),
            y: () => rendererCube.rotateY(index, clockwise),
        };
        movements[axe]();

        // flatCube.move(movement);
    }

    // type BlockTransition = {
    //     color: string,
    //     clockwise: boolean,
    //     from: p5.Vector,
    //     to: p5.Vector,
    //     type: 'spherical' | 'linear'
    // };

    // type BlockItem = {
    //     color: string,
    //     position: p5.Vector
    // };

    // type Block = BlockItem | BlockTransition;

    // class FlatCube extends CubeModel {
    //     static random() {
    //         const flatCube = new FlatCube();
    //         flatCube.randomize();
    //         return flatCube;
    //     }

    //     isMoving: boolean;

    //     private faceBlocks: Record<FaceName, BlockItem[]>;
    //     private facesPositions: Record<FaceName, p5.Vector[]>;
    //     private nextPositionsByMovement: Record<string, { clockwise: boolean, faces: Partial<Record<FaceName, { type: 'spherical' | 'linear', positionList: p5.Vector[] }>> }>;

    //     private animationManager: AnimationManager;
    //     private percentStep: number;
    //     private centerPosition: p5.Vector;
    //     private radius: number;
    //     private halfRadius: number;

    //     get faceBlockList(): BlockItem[][] { return Object.values(this.faceBlocks); }

    //     get top(): Circle { return new Circle().x(this.centerPosition.x).y(this.centerPosition.y); }
    //     get left(): Circle { return new Circle().x(this.centerPosition.x - this.halfRadius).y(this.centerPosition.y + this.halfRadius * p.sqrt(3)); }
    //     get right(): Circle { return new Circle().x(this.centerPosition.x + this.halfRadius).y(this.centerPosition.y + this.halfRadius * p.sqrt(3)); }

    //     get topInner(): Circle { return this.top.radius(this.innerCircleRadius); }
    //     get topMiddle(): Circle { return this.top.radius(this.middleCircleRadius); }
    //     get topOuter(): Circle { return this.top.radius(this.outerCircleRadius); }

    //     get leftInner(): Circle { return this.left.radius(this.innerCircleRadius); }
    //     get leftMiddle(): Circle { return this.left.radius(this.middleCircleRadius); }
    //     get leftOuter(): Circle { return this.left.radius(this.outerCircleRadius); }

    //     get rightInner(): Circle { return this.right.radius(this.innerCircleRadius); }
    //     get rightMiddle(): Circle { return this.right.radius(this.middleCircleRadius); }
    //     get rightOuter(): Circle { return this.right.radius(this.outerCircleRadius); }

    //     get innerCircleRadius(): number { return this.radius * (1 - this.percentStep); }
    //     get middleCircleRadius(): number { return this.radius; }
    //     get outerCircleRadius(): number { return this.radius * (1 + this.percentStep); }

    //     private get faceList(): [FaceName, string[]][] {
    //         return Object.entries((this as any).faces) as [FaceName, string[]][];
    //     }

    //     constructor() {
    //         super(3);

    //         this.animationManager = new AnimationManager();
    //         this.percentStep = 0.1;
    //         this.centerPosition = p.createVector(0, 0);
    //         this.radius = 200;
    //         this.halfRadius = this.radius / 2;
    //         this.isMoving = false;
    //         this.calculateFacePosition();
    //         this.updateFaceBlocks();
    //     }

    //     draw() {
    //         this.animationManager.update();

    //         p.push();
    //         p.translate(0, -this.halfRadius);
    //         this.drawLines();

    //         this.faceBlockList.forEach(face => face.forEach(({ color, position }) => {
    //             p.fill(color);
    //             p.circle(position.x, position.y, 10);
    //         }));

    //         p.pop();
    //     }

    //     move(movement: string) {
    //         const displayFaces = this.nextDisplayFaces(movement);
    //         const movementType = movement[0];
    //         const circlePosition = this.getCirclePositionFromMovement(movementType);

    //         const isBlockItem = (block: Block): block is BlockItem => (block as any).position;

    //         this.animationManager.animate({
    //             callback: (percentage) => {
    //                 this.isMoving = true;
    //                 const displayFaceList = Object.entries(displayFaces) as [FaceName, Block[]][];
    //                 displayFaceList.map(([face, displayBlockList]) => {
    //                     this.faceBlocks[face] = displayBlockList.map((displayBlock: Block): BlockItem => {
    //                         if (isBlockItem(displayBlock)) return displayBlock;

    //                         const position = displayBlock.type === 'linear' ?
    //                             p5.Vector.lerp(displayBlock.from, displayBlock.to, percentage)
    //                             : slerp(displayBlock.from, displayBlock.to, circlePosition.raw, percentage, displayBlock.clockwise);

    //                         return {
    //                             color: displayBlock.color,
    //                             position
    //                         }
    //                     });
    //                 });
    //             },
    //             whenEnd: () => {
    //                 // super.move(movement);
    //                 this.updateFaceBlocks();
    //                 this.isMoving = false;
    //             },
    //             durationInSecond: 1
    //         });
    //     }

    //     randomize() {
    //         super.randomize();
    //         this.updateFaceBlocks();
    //     }

    //     drawLines() {
    //         p.noFill();

    //         const circleList: Circle[] = [
    //             this.topInner,
    //             this.topMiddle,
    //             this.topOuter,
    //             this.leftInner,
    //             this.leftMiddle,
    //             this.leftOuter,
    //             this.rightInner,
    //             this.rightMiddle,
    //             this.rightOuter,
    //         ];
    //         circleList.forEach(({ raw: { x, y, radius } }) => p.circle(x, y, radius * 2));
    //     }

    //     calculateFacePosition() {
    //         const [rightTopLeft, leftTopRight] = this.topInner.intersectionBetween(this.leftInner);
    //         const [rightTopCenter, leftTopCenter] = this.topInner.intersectionBetween(this.leftMiddle);
    //         const [rightTopRight, leftTopLeft] = this.topInner.intersectionBetween(this.leftOuter);

    //         const [rightMiddleLeft, leftMiddleRight] = this.topMiddle.intersectionBetween(this.leftInner);
    //         const [rightMiddleCenter, leftMiddleCenter] = this.topMiddle.intersectionBetween(this.leftMiddle);
    //         const [rightMiddleRight, leftMiddleLeft] = this.topMiddle.intersectionBetween(this.leftOuter);

    //         const [rightBottomLeft, leftBottomRight] = this.topOuter.intersectionBetween(this.leftInner);
    //         const [rightBottomCenter, leftBottomCenter] = this.topOuter.intersectionBetween(this.leftMiddle);
    //         const [rightBottomRight, leftBottomLeft] = this.topOuter.intersectionBetween(this.leftOuter);

    //         const [backTopLeft, frontTopRight] = this.topInner.intersectionBetween(this.rightInner);
    //         const [backTopCenter, frontTopCenter] = this.topInner.intersectionBetween(this.rightMiddle);
    //         const [backTopRight, frontTopLeft] = this.topInner.intersectionBetween(this.rightOuter);

    //         const [backMiddleLeft, frontMiddleRight] = this.topMiddle.intersectionBetween(this.rightInner);
    //         const [backMiddleCenter, frontMiddleCenter] = this.topMiddle.intersectionBetween(this.rightMiddle);
    //         const [backMiddleRight, frontMiddleLeft] = this.topMiddle.intersectionBetween(this.rightOuter);

    //         const [backBottomLeft, frontBottomRight] = this.topOuter.intersectionBetween(this.rightInner);
    //         const [backBottomCenter, frontBottomCenter] = this.topOuter.intersectionBetween(this.rightMiddle);
    //         const [backBottomRight, frontBottomLeft] = this.topOuter.intersectionBetween(this.rightOuter);

    //         const [downTopRight, upBottomRight] = this.rightInner.intersectionBetween(this.leftInner);
    //         const [downMiddleRight, upMiddleRight] = this.rightInner.intersectionBetween(this.leftMiddle);
    //         const [downBottomRight, upTopRight] = this.rightInner.intersectionBetween(this.leftOuter);

    //         const [downTopCenter, upBottomCenter] = this.rightMiddle.intersectionBetween(this.leftInner);
    //         const [downMiddleCenter, upMiddleCenter] = this.rightMiddle.intersectionBetween(this.leftMiddle);
    //         const [downBottomCenter, upTopCenter] = this.rightMiddle.intersectionBetween(this.leftOuter);

    //         const [downTopLeft, upBottomLeft] = this.rightOuter.intersectionBetween(this.leftInner);
    //         const [downMiddleLeft, upMiddleLeft] = this.rightOuter.intersectionBetween(this.leftMiddle);
    //         const [downBottomLeft, upTopLeft] = this.rightOuter.intersectionBetween(this.leftOuter);

    //         this.facesPositions = {
    //             up: [upTopLeft, upTopCenter, upTopRight, upMiddleLeft, upMiddleCenter, upMiddleRight, upBottomLeft, upBottomCenter, upBottomRight],
    //             down: [downTopLeft, downTopCenter, downTopRight, downMiddleLeft, downMiddleCenter, downMiddleRight, downBottomLeft, downBottomCenter, downBottomRight],
    //             left: [leftTopLeft, leftTopCenter, leftTopRight, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, leftBottomLeft, leftBottomCenter, leftBottomRight],
    //             right: [rightTopLeft, rightTopCenter, rightTopRight, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, rightBottomLeft, rightBottomCenter, rightBottomRight],
    //             front: [frontTopLeft, frontTopCenter, frontTopRight, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, frontBottomLeft, frontBottomCenter, frontBottomRight],
    //             back: [backTopLeft, backTopCenter, backTopRight, backMiddleLeft, backMiddleCenter, backMiddleRight, backBottomLeft, backBottomCenter, backBottomRight],
    //         };

    //         const noMove: undefined = undefined;
    //         this.nextPositionsByMovement = {
    //             U: {
    //                 clockwise: true,
    //                 faces: {
    //                     up: { type: 'linear', positionList: [upTopRight, upMiddleRight, upBottomRight, upTopCenter, upMiddleCenter, upBottomCenter, upTopLeft, upMiddleLeft, upBottomLeft] },
    //                     left: { type: 'spherical', positionList: [backTopLeft, backTopCenter, backTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                     front: { type: 'spherical', positionList: [leftTopLeft, leftTopCenter, leftTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                     right: { type: 'spherical', positionList: [frontTopLeft, frontTopCenter, frontTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                     back: { type: 'spherical', positionList: [rightTopLeft, rightTopCenter, rightTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                 }
    //             },
    //             'U\'': {
    //                 clockwise: false,
    //                 faces: {
    //                     up: { type: 'linear', positionList: [upBottomLeft, upMiddleLeft, upTopLeft, upBottomCenter, upMiddleCenter, upTopCenter, upBottomRight, upMiddleRight, upTopRight] },
    //                     left: { type: 'spherical', positionList: [frontTopLeft, frontTopCenter, frontTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                     front: { type: 'spherical', positionList: [rightTopLeft, rightTopCenter, rightTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                     right: { type: 'spherical', positionList: [backTopLeft, backTopCenter, backTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                     back: { type: 'spherical', positionList: [leftTopLeft, leftTopCenter, leftTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
    //                 }
    //             },
    //             D: {
    //                 clockwise: false,
    //                 faces: {
    //                     down: { type: 'linear', positionList: [downTopRight, downMiddleRight, downBottomRight, downTopCenter, downMiddleCenter, downBottomCenter, downTopLeft, downMiddleLeft, downBottomLeft] },
    //                     left: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, frontBottomLeft, frontBottomCenter, frontBottomRight] },
    //                     front: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, rightBottomLeft, rightBottomCenter, rightBottomRight] },
    //                     right: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, backBottomLeft, backBottomCenter, backBottomRight] },
    //                     back: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, leftBottomLeft, leftBottomCenter, leftBottomRight] },
    //                 }
    //             },
    //             'D\'': {
    //                 clockwise: true,
    //                 faces: {
    //                     down: { type: 'linear', positionList: [downBottomLeft, downMiddleLeft, downTopLeft, downBottomCenter, downMiddleCenter, downTopCenter, downBottomRight, downMiddleRight, downTopRight] },
    //                     left: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, backBottomLeft, backBottomCenter, backBottomRight] },
    //                     front: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, leftBottomLeft, leftBottomCenter, leftBottomRight] },
    //                     right: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, frontBottomLeft, frontBottomCenter, frontBottomRight] },
    //                     back: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, rightBottomLeft, rightBottomCenter, rightBottomRight] },
    //                 }
    //             },
    //             // R: {},
    //             // L: {},
    //             // F: {},
    //             // B: {},
    //             // M: {},
    //             E: {
    //                 clockwise: false,
    //                 faces: {
    //                     left: { type: 'spherical', positionList: [noMove, noMove, noMove, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, noMove, noMove, noMove] },
    //                     front: { type: 'spherical', positionList: [noMove, noMove, noMove, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, noMove, noMove, noMove] },
    //                     right: { type: 'spherical', positionList: [noMove, noMove, noMove, backMiddleLeft, backMiddleCenter, backMiddleRight, noMove, noMove, noMove] },
    //                     back: { type: 'spherical', positionList: [noMove, noMove, noMove, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, noMove, noMove, noMove] },
    //                 }
    //             },
    //             'E\'': {
    //                 clockwise: true,
    //                 faces: {
    //                     left: { type: 'spherical', positionList: [noMove, noMove, noMove, backMiddleLeft, backMiddleCenter, backMiddleRight, noMove, noMove, noMove,] },
    //                     front: { type: 'spherical', positionList: [noMove, noMove, noMove, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, noMove, noMove, noMove,] },
    //                     right: { type: 'spherical', positionList: [noMove, noMove, noMove, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, noMove, noMove, noMove,] },
    //                     back: { type: 'spherical', positionList: [noMove, noMove, noMove, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, noMove, noMove, noMove,] },
    //                 }
    //             },
    //             // S: {}
    //         };
    //     }

    //     getCirclePositionFromMovement(movementDirection: string) {
    //         const circlePositionFromMovement: Record<string, () => Circle> = {
    //             U: () => this.top, // Up
    //             L: () => this.top, // Left
    //             F: () => this.left, // Front
    //             R: () => this.right, // Right
    //             B: () => this.top, // Back
    //             D: () => this.top, // Down
    //             E: () => this.top
    //         };

    //         return circlePositionFromMovement[movementDirection]();
    //     }

    //     nextDisplayFaces(movement: string): Partial<Record<FaceName, Block[]>> {
    //         const nextPosition = this.nextPositionsByMovement[movement];
    //         return this.faceList.reduce((displayFaces: Partial<Record<FaceName, Block[]>>, [face, colorList]) => {
    //             const fromPositionList = this.facesPositions[face];
    //             const nextPositionForFace = nextPosition.faces[face];

    //             if (!nextPositionForFace)
    //                 return displayFaces;

    //             const { type, positionList: toPositionList } = nextPositionForFace;

    //             displayFaces[face] = colorList.map((color, index) => {
    //                 const from = fromPositionList[index];
    //                 const to = toPositionList[index];

    //                 const block: Block = to ? {
    //                     color,
    //                     clockwise: nextPosition.clockwise,
    //                     from,
    //                     to,
    //                     type
    //                 } : {
    //                     color,
    //                     position: from
    //                 };

    //                 return block;

    //             });

    //             return displayFaces;
    //         }, {});
    //     }

    //     updateFaceBlocks() {
    //         this.faceBlocks = this.faceList.reduce((faceBlocks: Record<FaceName, BlockItem[]>, [face, colorList]) => ({
    //             ...faceBlocks,
    //             [face]: colorList.map((color, index): BlockItem => ({
    //                 color,
    //                 position: this.facesPositions[face][index]
    //             }))
    //         }), {} as any);
    //     }
    // }
}, body);