import * as p5 from "p5";

export let p: p5;

export let TWO_PI: number;

export function initializeP5Methods(p5Instance: p5): void {
    p = p5Instance;
    TWO_PI = p.TWO_PI;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
    return p.dist(x1, y1, x2, y2);
}

export function createVector(x?: number, y?: number, z?: number): p5.Vector {
    return p.createVector(x, y, z);
}

export function lerp(start: number, stop: number, percentage: number): number {
    return p.lerp(start, stop, percentage);
}

export function frameCount(): number {
    return p.frameCount;
}

export function frameRate(): number {
    return p.frameRate();
}