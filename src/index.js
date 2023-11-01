import * as p5 from 'p5';
import * as CubeJS from 'cubejs';

const body = document.getElementsByTagName('body')[0];

class CubeModel extends CubeJS {
    constructor() {
        super();
        this.faces = this.cubeToFaces();
    }

    move(movement) {
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

        const faceStringToColorList = (faceString) => faceString.split('').map(colorCode => colorsRecord[colorCode]);
        const cubeFaceList = cubeFaceStringList.map(faceStringToColorList);
        const [up, right, front, down, left, back] = cubeFaceList;

        return {
            up, right, front, down, left, back
        };
    }
}

const fps = 60;
const rotationSpeedInSecondes = 1;

new p5(p => {
    let flatCube;
    let solutionList;

    p.setup = function () {
        CubeJS.initSolver();
        flatCube = FlatCube.random();
        solutionList = flatCube.solve().split(' ');
        console.log(solutionList);
        solutionList = ['E', 'E\'', 'E', 'E\'', 'E', 'E\''];
        console.log(solutionList);

        p.createCanvas(800, 800);
        updateCube();
    }

    p.draw = function () {
        p.translate(p.width / 2, p.height / 2);
        p.background('lightgray');

        if (flatCube.isSolved()) {
            // p.noLoop();
            return;
        }

        flatCube.draw();
    }

    p.mouseClicked = () => updateCube();

    function updateCube() {
        if (flatCube.moving) return;


        const movement = solutionList.shift();

        const noMovementLeft = !movement;
        if (noMovementLeft) {
            // p.noLoop();
            return;
        }

        flatCube.move(movement);
    }

    class FlatCube extends CubeModel {
        static random() {
            const flatCube = new FlatCube();
            flatCube.randomize();
            return flatCube;
        }

        get faceBlockList() { return Object.values(this.faceBlocks); }

        get top() { return p.createVector(this.centerPosition.x, this.centerPosition.y); }
        get left() { return p.createVector(this.centerPosition.x - this.halfRadius, this.centerPosition.y + this.halfRadius * p.sqrt(3)); }
        get right() { return p.createVector(this.centerPosition.x + this.halfRadius, this.centerPosition.y + this.halfRadius * p.sqrt(3)); }

        get topInner() { return { ...this.top, r: this.innerCircleRadius }; }
        get topMiddle() { return { ...this.top, r: this.middleCircleRadius }; }
        get topOuter() { return { ...this.top, r: this.outerCircleRadius }; }

        get leftInner() { return { ...this.left, r: this.innerCircleRadius }; }
        get leftMiddle() { return { ...this.left, r: this.middleCircleRadius }; }
        get leftOuter() { return { ...this.left, r: this.outerCircleRadius }; }

        get rightInner() { return { ...this.right, r: this.innerCircleRadius }; }
        get rightMiddle() { return { ...this.right, r: this.middleCircleRadius }; }
        get rightOuter() { return { ...this.right, r: this.outerCircleRadius }; }

        get innerCircleRadius() { return this.radius * (1 - this.percentStep); }
        get middleCircleRadius() { return this.radius; }
        get outerCircleRadius() { return this.radius * (1 + this.percentStep); }

        constructor() {
            super();

            this.animationManager = new AnimationManager();
            this.percentStep = 0.1;
            this.centerPosition = { x: 0, y: 0 };
            this.radius = 200;
            this.halfRadius = this.radius / 2;
            this.diameter = this.radius * 2;
            this.moving = false;
            this.calculateFacePosition();
            this.updateFaceBlocks();
        }

        draw() {
            this.animationManager.update();

            p.push();
            p.translate(0, -this.halfRadius);
            this.drawLines();

            this.faceBlockList.forEach(face => face.forEach(({ color, position }) => {
                p.fill(color);
                p.circle(position.x, position.y, 10);
            }));

            p.pop();
        }

        move(movement) {
            const displayFaces = this.nextDisplayFaces(movement);
            const movementType = movement[0];
            const circlePosition = this.getCirclePositionFromMovement(movementType);

            this.animationManager.animate({
                callback: (percentage) => {
                    this.moving = true;
                    Object.entries(displayFaces).map(([face, displayBlockList]) => {
                        this.faceBlocks[face] = displayBlockList.map(displayBlock => {
                            if (displayBlock.position) return displayBlock;

                            const position = displayBlock.type === 'linear' ?
                                p5.Vector.lerp(displayBlock.from, displayBlock.to, percentage)
                                : slerp(displayBlock.from, displayBlock.to, circlePosition, percentage, displayBlock.clockwise);

                            return {
                                color: displayBlock.color,
                                position
                            }
                        });
                    });
                },
                whenEnd: () => {
                    super.move(movement);
                    this.updateFaceBlocks();
                    this.moving = false;
                },
                durationInSecond: animationDuration
            });
        }

        randomize() {
            super.randomize();
            this.updateFaceBlocks();
        }

        drawLines() {
            p.noFill();

            const circleList = [
                this.topInner,
                this.topMiddle,
                this.topOuter,
                this.leftInner,
                this.leftMiddle,
                this.leftOuter,
                this.rightInner,
                this.rightMiddle,
                this.rightOuter,
            ];
            circleList.forEach(({ x, y, r }) => p.circle(x, y, r * 2));
        }

        calculateFacePosition() {
            const [rightTopLeft, leftTopRight] = this.intersectionBetween(this.topInner, this.leftInner);
            const [rightTopCenter, leftTopCenter] = this.intersectionBetween(this.topInner, this.leftMiddle);
            const [rightTopRight, leftTopLeft] = this.intersectionBetween(this.topInner, this.leftOuter);

            const [rightMiddleLeft, leftMiddleRight] = this.intersectionBetween(this.topMiddle, this.leftInner);
            const [rightMiddleCenter, leftMiddleCenter] = this.intersectionBetween(this.topMiddle, this.leftMiddle);
            const [rightMiddleRight, leftMiddleLeft] = this.intersectionBetween(this.topMiddle, this.leftOuter);

            const [rightBottomLeft, leftBottomRight] = this.intersectionBetween(this.topOuter, this.leftInner);
            const [rightBottomCenter, leftBottomCenter] = this.intersectionBetween(this.topOuter, this.leftMiddle);
            const [rightBottomRight, leftBottomLeft] = this.intersectionBetween(this.topOuter, this.leftOuter);

            const [backTopLeft, frontTopRight] = this.intersectionBetween(this.topInner, this.rightInner);
            const [backTopCenter, frontTopCenter] = this.intersectionBetween(this.topInner, this.rightMiddle);
            const [backTopRight, frontTopLeft] = this.intersectionBetween(this.topInner, this.rightOuter);

            const [backMiddleLeft, frontMiddleRight] = this.intersectionBetween(this.topMiddle, this.rightInner);
            const [backMiddleCenter, frontMiddleCenter] = this.intersectionBetween(this.topMiddle, this.rightMiddle);
            const [backMiddleRight, frontMiddleLeft] = this.intersectionBetween(this.topMiddle, this.rightOuter);

            const [backBottomLeft, frontBottomRight] = this.intersectionBetween(this.topOuter, this.rightInner);
            const [backBottomCenter, frontBottomCenter] = this.intersectionBetween(this.topOuter, this.rightMiddle);
            const [backBottomRight, frontBottomLeft] = this.intersectionBetween(this.topOuter, this.rightOuter);

            const [downTopRight, upBottomRight] = this.intersectionBetween(this.rightInner, this.leftInner);
            const [downMiddleRight, upMiddleRight] = this.intersectionBetween(this.rightInner, this.leftMiddle);
            const [downBottomRight, upTopRight] = this.intersectionBetween(this.rightInner, this.leftOuter);

            const [downTopCenter, upBottomCenter] = this.intersectionBetween(this.rightMiddle, this.leftInner);
            const [downMiddleCenter, upMiddleCenter] = this.intersectionBetween(this.rightMiddle, this.leftMiddle);
            const [downBottomCenter, upTopCenter] = this.intersectionBetween(this.rightMiddle, this.leftOuter);

            const [downTopLeft, upBottomLeft] = this.intersectionBetween(this.rightOuter, this.leftInner);
            const [downMiddleLeft, upMiddleLeft] = this.intersectionBetween(this.rightOuter, this.leftMiddle);
            const [downBottomLeft, upTopLeft] = this.intersectionBetween(this.rightOuter, this.leftOuter);

            this.facesPositions = {
                up: [upTopLeft, upTopCenter, upTopRight, upMiddleLeft, upMiddleCenter, upMiddleRight, upBottomLeft, upBottomCenter, upBottomRight],
                down: [downTopLeft, downTopCenter, downTopRight, downMiddleLeft, downMiddleCenter, downMiddleRight, downBottomLeft, downBottomCenter, downBottomRight],
                left: [leftTopLeft, leftTopCenter, leftTopRight, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, leftBottomLeft, leftBottomCenter, leftBottomRight],
                right: [rightTopLeft, rightTopCenter, rightTopRight, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, rightBottomLeft, rightBottomCenter, rightBottomRight],
                front: [frontTopLeft, frontTopCenter, frontTopRight, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, frontBottomLeft, frontBottomCenter, frontBottomRight],
                back: [backTopLeft, backTopCenter, backTopRight, backMiddleLeft, backMiddleCenter, backMiddleRight, backBottomLeft, backBottomCenter, backBottomRight],
            };

            const noMove = undefined;
            this.nextPositionsByMovement = {
                U: {
                    clockwise: true,
                    faces: {
                        up: { type: 'linear', positionList: [upTopRight, upMiddleRight, upBottomRight, upTopCenter, upMiddleCenter, upBottomCenter, upTopLeft, upMiddleLeft, upBottomLeft] },
                        left: { type: 'spherical', positionList: [backTopLeft, backTopCenter, backTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                        front: { type: 'spherical', positionList: [leftTopLeft, leftTopCenter, leftTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                        right: { type: 'spherical', positionList: [frontTopLeft, frontTopCenter, frontTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                        back: { type: 'spherical', positionList: [rightTopLeft, rightTopCenter, rightTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                    }
                },
                'U\'': {
                    clockwise: false,
                    faces: {
                        up: { type: 'linear', positionList: [upBottomLeft, upMiddleLeft, upTopLeft, upBottomCenter, upMiddleCenter, upTopCenter, upBottomRight, upMiddleRight, upTopRight] },
                        left: { type: 'spherical', positionList: [frontTopLeft, frontTopCenter, frontTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                        front: { type: 'spherical', positionList: [rightTopLeft, rightTopCenter, rightTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                        right: { type: 'spherical', positionList: [backTopLeft, backTopCenter, backTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                        back: { type: 'spherical', positionList: [leftTopLeft, leftTopCenter, leftTopRight, noMove, noMove, noMove, noMove, noMove, noMove] },
                    }
                },
                D: {
                    clockwise: false,
                    faces: {
                        down: { type: 'linear', positionList: [downTopRight, downMiddleRight, downBottomRight, downTopCenter, downMiddleCenter, downBottomCenter, downTopLeft, downMiddleLeft, downBottomLeft] },
                        left: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, frontBottomLeft, frontBottomCenter, frontBottomRight] },
                        front: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, rightBottomLeft, rightBottomCenter, rightBottomRight] },
                        right: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, backBottomLeft, backBottomCenter, backBottomRight] },
                        back: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, leftBottomLeft, leftBottomCenter, leftBottomRight] },
                    }
                },
                'D\'': {
                    clockwise: true,
                    faces: {
                        down: { type: 'linear', positionList: [downBottomLeft, downMiddleLeft, downTopLeft, downBottomCenter, downMiddleCenter, downTopCenter, downBottomRight, downMiddleRight, downTopRight] },
                        left: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, backBottomLeft, backBottomCenter, backBottomRight] },
                        front: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, leftBottomLeft, leftBottomCenter, leftBottomRight] },
                        right: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, frontBottomLeft, frontBottomCenter, frontBottomRight] },
                        back: { type: 'spherical', positionList: [noMove, noMove, noMove, noMove, noMove, noMove, rightBottomLeft, rightBottomCenter, rightBottomRight] },
                    }
                },
                R: {},
                L: {},
                F: {},
                B: {},
                M: {},
                E: {
                    clockwise: false,
                    faces: {
                        left: { type: 'spherical', positionList: [noMove, noMove, noMove, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, noMove, noMove, noMove] },
                        front: { type: 'spherical', positionList: [noMove, noMove, noMove, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, noMove, noMove, noMove] },
                        right: { type: 'spherical', positionList: [noMove, noMove, noMove, backMiddleLeft, backMiddleCenter, backMiddleRight, noMove, noMove, noMove] },
                        back: { type: 'spherical', positionList: [noMove, noMove, noMove, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, noMove, noMove, noMove] },
                    }
                },
                'E\'': {
                    clockwise: true,
                    faces: {
                        left: { type: 'spherical', positionList: [noMove, noMove, noMove, backMiddleLeft, backMiddleCenter, backMiddleRight, noMove, noMove, noMove,] },
                        front: { type: 'spherical', positionList: [noMove, noMove, noMove, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, noMove, noMove, noMove,] },
                        right: { type: 'spherical', positionList: [noMove, noMove, noMove, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, noMove, noMove, noMove,] },
                        back: { type: 'spherical', positionList: [noMove, noMove, noMove, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, noMove, noMove, noMove,] },
                    }
                },
                S: {}
            };
        }

        intersectionBetween({ x: x1, y: y1, r: r1 }, { x: x2, y: y2, r: r2 }) {
            const distance = p.dist(x1, y1, x2, y2);
            const distanceFromCenter1ToMidpoint = (r1 ** 2 - r2 ** 2 + distance ** 2) / (2 * distance);
            const distanceFromMidpointToIntersection = p.sqrt(r1 ** 2 - distanceFromCenter1ToMidpoint ** 2);
            const intersectionX1 = x1 + (distanceFromCenter1ToMidpoint * (x2 - x1)) / distance + (distanceFromMidpointToIntersection * (y2 - y1)) / distance;
            const intersectionY1 = y1 + (distanceFromCenter1ToMidpoint * (y2 - y1)) / distance - (distanceFromMidpointToIntersection * (x2 - x1)) / distance;
            const intersectionX2 = x1 + (distanceFromCenter1ToMidpoint * (x2 - x1)) / distance - (distanceFromMidpointToIntersection * (y2 - y1)) / distance;
            const intersectionY2 = y1 + (distanceFromCenter1ToMidpoint * (y2 - y1)) / distance + (distanceFromMidpointToIntersection * (x2 - x1)) / distance;

            return [
                p.createVector(intersectionX1, intersectionY1),
                p.createVector(intersectionX2, intersectionY2),
            ];
        }

        getCirclePositionFromMovement(movementDirection) {
            const circlePositionFromMovement = {
                U: () => this.top, // Up
                L: () => this.top, // Left
                F: () => this.left, // Front
                R: () => this.right, // Right
                B: () => this.top, // Back
                D: () => this.top, // Down
                E: () => this.top
            };

            return circlePositionFromMovement[movementDirection]();
        }

        nextDisplayFaces(movement) {
            const nextPosition = this.nextPositionsByMovement[movement];
            return Object.entries(this.faces).reduce((displayFaces, [face, colorList]) => {
                const fromPositionList = this.facesPositions[face];
                const nextPositionForFace = nextPosition.faces[face];

                if (!nextPositionForFace)
                    return displayFaces;

                const { type, positionList: toPositionList } = nextPositionForFace;

                displayFaces[face] = colorList.map((color, index) => {
                    const from = fromPositionList[index];
                    const to = toPositionList[index];

                    return to ? {
                        color,
                        clockwise: nextPosition.clockwise,
                        from,
                        to,
                        type
                    } : {
                        color,
                        position: from
                    };

                });

                return displayFaces;
            }, {});
        }

        updateFaceBlocks() {
            this.faceBlocks = Object.entries(this.faces).reduce((accumulator, [face, colorList]) => ({
                ...accumulator,
                [face]: colorList.map((color, index) => ({
                    color,
                    position: this.facesPositions[face][index]
                }))
            }), {});
        }
    }

    function slerp(from, to, center, percentage, clockwise = false) {
        const fromAngle = (p.atan2(from.y - center.y, from.x - center.x) + p.TAU) % p.TAU;
        const toAngle = (p.atan2(to.y - center.y, to.x - center.x) + p.TAU) % p.TAU;

        const clockWiseForcing = () => fromAngle < toAngle ? [fromAngle, toAngle] : [fromAngle, toAngle + p.TAU];
        const antiClockWiseForcing = () => fromAngle > toAngle ? [fromAngle, toAngle] : [fromAngle, toAngle - p.TAU];
        const [minAngle, maxAngle] = (clockwise ? clockWiseForcing : antiClockWiseForcing)();

        const currentAngle = p.lerp(minAngle, maxAngle, percentage);
        const distance = p.dist(from.x, from.y, center.x, center.y);

        return {
            x: center.x + p.cos(currentAngle) * distance,
            y: center.y + p.sin(currentAngle) * distance,
        };
    }

    class AnimationManager {
        constructor() {
            // AnimatableItem = { callback: (percent) => void, whenEnd: () => void, durationInSecond }
            this.animatableItemList = [];
        }

        update() {
            const currentTimeInSecondes = p.frameCount / fps;
            const animationIsFinish = ({ item, startAnimationTimeInSecond }) => item.durationInSecond + startAnimationTimeInSecond < currentTimeInSecondes;

            const animatableItemNotFinishedList = this.animatableItemList
                .filter((animatableItem) => !animationIsFinish(animatableItem));
            const animatableItemFinishedList = this.animatableItemList
                .filter((animatableItem) => animationIsFinish(animatableItem));

            animatableItemFinishedList.forEach(({ item }) => item.whenEnd?.());
            animatableItemNotFinishedList.forEach(({ item, startAnimationTimeInSecond }) =>
                item.callback((currentTimeInSecondes - startAnimationTimeInSecond) / item.durationInSecond)
            );

            this.animatableItemList = animatableItemNotFinishedList;
        }

        animate(animatableItem) {
            const startAnimationTimeInSecond = p.frameCount / fps;
            this.animatableItemList.push({ item: animatableItem, startAnimationTimeInSecond });
        }
    }
}, body);

const colorsRecord = {
    U: 'white', // Up
    L: 'red', // Left
    F: 'blue', // Front
    R: 'orange', // Right
    B: 'green', // Back
    D: 'yellow', // Down
};
