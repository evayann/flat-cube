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
const rotationSpeedInS = 3;

new p5(p => {
    let flatCube;
    let solutionList;

    p.setup = function () {
        CubeJS.initSolver();
        flatCube = FlatCube.random();
        // solutionList = flatCube.solve().split(' ');
        solutionList = ['U'];
        console.log(solutionList)

        p.createCanvas(800, 800);
    }

    p.draw = function () {
        p.translate(p.width / 2, p.height / 2);
        p.background('lightgray');
        flatCube.draw();
    }

    function updateCube() {
        const movement = solutionList.shift();

        const noMovementLeft = !movement;
        if (noMovementLeft) {
            p.noLoop();
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

            this.percentStep = 0.2;
            this.centerPosition = { x: 0, y: 0 };
            this.radius = 200;
            this.halfRadius = this.radius / 2;
            this.diameter = this.radius * 2;
            this.calculateFacePosition();
            this.initializeDisplayFaces();

            console.log(this)
        }

        draw() {
            p.push();
            p.translate(0, -this.halfRadius);
            this.drawLines();

            // const faceEntries = Object.entries(this.faces);
            // faceEntries.forEach(([type, faceColorList]) => {
            //     const positionList = this.facesPositions[type];
            //     zip(positionList, faceColorList).forEach(([position, color]) => {
            //         p.fill(color);
            //         p.circle(position.x, position.y, 10);
            //     });
            // });

            if (flatCube.isSolved())
                p.noLoop();

            if (p.frameCount % (fps * rotationSpeedInS) === 0) {
                this.initializeDisplayFaces();
                updateCube();
            }

            const percentage = (p.frameCount / (fps * rotationSpeedInS)) % 1;
            Object.values(this.displayFaces).forEach(blocList => {
                blocList.forEach(bloc => {
                    p.fill(bloc.color);
                    const pos = slerp(bloc.from, bloc.to, this.top, percentage);
                    p.circle(pos.x, pos.y, 10);
                });
            });

            p.pop();
        }

        move(movement) {
            super.move(movement);

            this.updateDisplayFaces(movement);

            const movementDirection = movement[0];
            this.circlePosition = this.getCirclePositionFromMovement(movementDirection);
        }

        randomize() {
            super.randomize();
            this.initializeDisplayFaces();
        }

        drawLines() {
            p.noFill();

            this.drawCirclesForPoint(this.top);
            this.drawCirclesForPoint(this.left);
            this.drawCirclesForPoint(this.right);
        }

        drawCirclesForPoint({ x, y }) {
            p.circle(x, y, this.diameter * 0.8);
            p.circle(x, y, this.diameter);
            p.circle(x, y, this.diameter * 1.2);
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
            }

            this.nextPositionsByRotation = {
                U: {
                    up: [upTopRight, upMiddleRight, upBottomRight, upTopCenter, upMiddleCenter, upBottomCenter, upTopLeft, upMiddleLeft, upBottomLeft],
                    left: [backTopLeft, backTopCenter, backTopRight, leftMiddleLeft, leftMiddleCenter, leftMiddleRight, leftBottomLeft, leftBottomCenter, leftBottomRight],
                    front: [leftTopLeft, leftTopCenter, leftTopRight, frontMiddleLeft, frontMiddleCenter, frontMiddleRight, frontBottomLeft, frontBottomCenter, frontBottomRight],
                    right: [frontTopLeft, frontTopCenter, frontTopRight, rightMiddleLeft, rightMiddleCenter, rightMiddleRight, rightBottomLeft, rightBottomCenter, rightBottomRight],
                    back: [rightTopLeft, rightTopCenter, rightTopRight, backMiddleLeft, backMiddleCenter, backMiddleRight, backBottomLeft, backBottomCenter, backBottomRight],
                },
                D: {},
                R: {},
                L: {},
                F: {},
                B: {},
                M: {},
                E: {},
                S: {}
            }
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
                D: () => this.right, // Down
            };

            return circlePositionFromMovement[movementDirection]();
        }

        updateDisplayFaces(movement) {
            this.displayFaces = Object.entries(this.displayFaces).reduce((displayFaces, [face, displayFaceList]) => {
                const nextPositionList = this.nextPositionsByRotation[movement][face];
                if (!nextPositionList) {
                    displayFaces[face] = displayFaceList;
                    return displayFaces;
                };
                console.log(this.nextPositionsByRotation.U.top)

                displayFaces[face] = displayFaceList.map((displayFace, index) => {
                    const nextPosition = nextPositionList[index];

                    return {
                        color: displayFace.color,
                        from: displayFace.to,
                        to: nextPosition,
                    };
                });

                return displayFaces;
            }, {});
            console.log(this.displayFaces)
        }

        initializeDisplayFaces() {
            this.displayFaces = Object.entries(this.faces).reduce((displayFaces, [face, colorList]) => {
                const facePositionList = this.facesPositions[face];

                displayFaces[face] = colorList.map((color, index) => {
                    const position = facePositionList[index];

                    return {
                        color,
                        from: position,
                        to: position,
                    };
                });

                return displayFaces;
            }, {});
        }
    }

    function slerp(from, to, center, percentage) {
        const fromAngle = p.atan2(from.y - center.y, from.x - center.x);
        const toAngle = p.atan2(to.y - center.y, to.x - center.x);
        const [minAngle, maxAngle] = fromAngle < toAngle ? [fromAngle, toAngle] : [toAngle, fromAngle];

        const currentAngle = p.lerp(minAngle, maxAngle, percentage);
        const distance = p.dist(from.x, from.y, center.x, center.y);

        return {
            x: center.x + p.cos(currentAngle) * distance,
            y: center.y + p.sin(currentAngle) * distance,
        };
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

function zip(...listOfList) {
    const shortestListLength = Math.min(...listOfList.map(list => list.length));
    return Array.from({ length: shortestListLength }).map((_, i) => listOfList.map(list => list[i]));
}