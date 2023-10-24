import * as p5 from 'p5';
import * as CubeJS from 'cubejs';

const body = document.getElementsByTagName('body')[0];

new p5(p => {
    let cube, cubeAxis;
    let solutionList;

    p.setup = function () {
        CubeJS.initSolver();
        cube = Cube.random();
        cubeAxis = new CubeView(cube);
        solutionList = cube.solve().split(' ');

        p.createCanvas(800, 800);
        p.background('lightgray');
    }

    p.draw = function () {
        p.translate(p.width / 2, p.height / 2);
        cubeAxis.draw();
        // drawCube2DSphere(cube);
    }

    function updateCube() {
        const movement = solutionList.shift();

        const noMovementLeft = !movement;
        if (noMovementLeft) {
            p.noLoop();
            return;
        }

        cube.move(movement);
    }

    function drawCube2D(cube) {
        const faceSize = Math.min(p.width, p.height) / 4;

        function drawFace(face) {
            face.rows.forEach((colorList, rowIndex) => {
                const colorSize = faceSize / colorList.length;
                colorList.forEach((color, columnIndex) => {
                    p.fill(color);
                    p.square(columnIndex * colorSize, rowIndex * colorSize, colorSize);
                });
            });
        }

        const { up, down, ...otherFaces } = cube.faces;

        p.push();
        p.translate(faceSize, 0);
        drawFace(up);
        p.pop();

        p.push();
        p.translate(0, faceSize);
        Object.values(otherFaces).forEach(face => {
            drawFace(face);
            p.translate(faceSize, 0);
        });
        p.pop();

        p.push();
        p.translate(faceSize, faceSize * 2);
        drawFace(down);
        p.pop();
    }

    class CubeView {
        get top() { return p.createVector(this.center.x, this.center.y); }
        get left() { return p.createVector(this.center.x - this.halfRadius, this.center.y + this.halfRadius * p.sqrt(3)); }
        get right() { return p.createVector(this.center.x + this.halfRadius, this.center.y + this.halfRadius * p.sqrt(3)); }

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

        constructor(cube) {
            this.percentStep = 0.2;
            this.center = { x: 0, y: 0 };
            this.radius = 200;
            this.halfRadius = this.radius / 2;
            this.diameter = this.radius * 2;
            this.cube = cube;
            this.calculateFacePosition();
        }

        draw() {
            p.push();
            p.translate(0, -this.halfRadius);
            this.drawLines();

            const faceEntries = Object.entries(this.cube.faces);
            faceEntries.forEach(([type, face]) => {
                const positionList = this.facesPositions[type];
                zip(positionList, face.colorList).forEach(([position, color]) => {
                    p.fill(color);
                    p.circle(position.x, position.y, 10);
                });
            });

            const percentage = (p.frameCount / 100) % 1;
            const from = this.facesPositions.down[0];
            const to = this.facesPositions.back[8];
            const pos = slerp(from, to, this.right, percentage);
            p.circle(pos.x, pos.y, 10);
            p.pop();
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
    }

    function slerp(from, to, center, percentage) {
        const fromAngle = p.atan2(from.y - center.y, from.x - center.x);
        const toAngle = p.atan2(to.y - center.y, to.x - center.x);

        const currentAngle = p.lerp(fromAngle, toAngle, percentage);
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

class Cube extends CubeJS {
    static random() {
        const cube = new Cube();
        cube.randomize();
        return cube;
    }

    get faces() {
        const cubeString = this.asString();
        const cubeFaceStringList = cubeString.match(/.{1,9}/g) ?? [];
        const cubeFaceList = cubeFaceStringList.map(faceString => this.stringToFace(faceString));
        const [up, right, front, down, left, back] = cubeFaceList;
        return {
            up, right, front, down, left, back
        };
    }

    stringToFace(faceString) {
        const faceColorString = faceString.split('')
            .map(colorCode => colorsRecord[colorCode]);
        return new Face(faceColorString);
    }
}

class Face {
    get rows() {
        return [
            this.firstRow,
            this.secondRow,
            this.thirdRow,
        ];
    }

    get firstRow() { return this.colorList.slice(0, 3); }
    get secondRow() { return this.colorList.slice(3, 6); }
    get thirdRow() { return this.colorList.slice(6, 9); }

    constructor(colorList) { this.colorList = colorList; }
}

function zip(...listOfList) {
    const shortestListLength = Math.min(...listOfList.map(list => list.length));
    return Array.from({ length: shortestListLength }).map((_, i) => listOfList.map(list => list[i]));
}