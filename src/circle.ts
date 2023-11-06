import * as p5 from "p5";
import { createVector, dist } from "./p5-utils";

export class Circle {
    private _radius = 1;
    private _position = { x: 0, y: 0 };

    get raw(): { x: number, y: number, radius: number } {
        return {
            x: this._position.x,
            y: this._position.y,
            radius: this._radius,
        };
    }

    x(x: number): Circle {
        this._position.x = x;
        return this;
    }

    y(y: number): Circle {
        this._position.y = y;
        return this;
    }

    radius(radius: number): Circle {
        this._radius = radius;
        return this;
    }

    intersectionBetween(otherCircle: Circle): [p5.Vector, p5.Vector] {
        const { x: x1, y: y1, radius: r1 } = this.raw;
        const { x: x2, y: y2, radius: r2 } = otherCircle.raw;

        const distance = dist(x1, y1, x2, y2);
        const distanceFromCenter1ToMidpoint = (r1 ** 2 - r2 ** 2 + distance ** 2) / (2 * distance);
        const distanceFromMidpointToIntersection = Math.sqrt(r1 ** 2 - distanceFromCenter1ToMidpoint ** 2);
        const intersectionX1 = x1 + (distanceFromCenter1ToMidpoint * (x2 - x1)) / distance + (distanceFromMidpointToIntersection * (y2 - y1)) / distance;
        const intersectionY1 = y1 + (distanceFromCenter1ToMidpoint * (y2 - y1)) / distance - (distanceFromMidpointToIntersection * (x2 - x1)) / distance;
        const intersectionX2 = x1 + (distanceFromCenter1ToMidpoint * (x2 - x1)) / distance - (distanceFromMidpointToIntersection * (y2 - y1)) / distance;
        const intersectionY2 = y1 + (distanceFromCenter1ToMidpoint * (y2 - y1)) / distance + (distanceFromMidpointToIntersection * (x2 - x1)) / distance;

        return [
            createVector(intersectionX1, intersectionY1),
            createVector(intersectionX2, intersectionY2),
        ];
    }
}