import * as p5 from "p5";
import { createVector, lerp, dist, TWO_PI } from "../p5-utils";
import { Vec2 } from "../vec2";

export function slerp(from: Vec2, to: Vec2, center: Vec2, percentage: number, clockwise = false): p5.Vector {
    const fromAngle = (Math.atan2(from.y - center.y, from.x - center.x) + TWO_PI) % TWO_PI;
    const toAngle = (Math.atan2(to.y - center.y, to.x - center.x) + TWO_PI) % TWO_PI;

    const clockWiseForcing = () => fromAngle < toAngle ? [fromAngle, toAngle] : [fromAngle, toAngle + TWO_PI];
    const antiClockWiseForcing = () => fromAngle > toAngle ? [fromAngle, toAngle] : [fromAngle, toAngle - TWO_PI];
    const [minAngle, maxAngle] = (clockwise ? clockWiseForcing : antiClockWiseForcing)();

    const currentAngle = lerp(minAngle, maxAngle, percentage);
    const distance = dist(from.x, from.y, center.x, center.y);

    return createVector(
        center.x + Math.cos(currentAngle) * distance,
        center.y + Math.sin(currentAngle) * distance
    );
}