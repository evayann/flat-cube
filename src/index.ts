import * as p5 from 'p5';

import { initializeP5Methods } from './p5-utils';
import { RendererCube } from './renderer/cube.renderer';

const body = document.getElementsByTagName('body')[0];

new p5(p => {
    // let flatCube: FlatCube;
    let rendererCube: RendererCube;
    let solutionList: { axe: 'x' | 'y' | 'z', index: number, clockwise: boolean }[];

    p.setup = function () {
        initializeP5Methods(p);
        rendererCube = new RendererCube(3);

        // flatCube = FlatCube.random();
        // solutionList = flatCube.solve().split(' ');
        // console.log(solutionList);
        solutionList = [
            { axe: 'z', index: 0, clockwise: false },
            // { axe: 'y', index: 1, clockwise: true },
            // { axe: 'y', index: 1, clockwise: true },
            // { axe: 'x', index: 1, clockwise: false },
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
        if (rendererCube.isMoving) return;

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
            z: () => rendererCube.rotateZ(index, clockwise)
        };
        movements[axe]();
    }
}, body);