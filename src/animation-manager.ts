import { p, frameCount, frameRate } from './p5-utils';

export type AnimatableItem = { callback: (percent: number) => void, whenEnd: () => void, durationInSecond: number };
type InternalAnimatableItem = AnimatableItem & { startAnimationTimeInSecond: number };

export class AnimationManager {
    private animatableItemList: InternalAnimatableItem[] = [];

    constructor() {
        // AnimatableItem = { callback: (percent) => void, whenEnd: () => void, durationInSecond }
        this.animatableItemList = [];
    }

    update() {
        const currentTimeInSecondes = frameCount() / frameRate();

        const animationIsFinish: (item: InternalAnimatableItem) => boolean = ({ durationInSecond, startAnimationTimeInSecond }) =>
            durationInSecond + startAnimationTimeInSecond < currentTimeInSecondes;

        const animatableItemNotFinishedList = this.animatableItemList
            .filter((animatableItem) => !animationIsFinish(animatableItem));
        const animatableItemFinishedList = this.animatableItemList
            .filter((animatableItem) => animationIsFinish(animatableItem));

        animatableItemFinishedList.forEach(({ whenEnd }) => whenEnd?.());
        this.animatableItemList.forEach(({ callback, durationInSecond, startAnimationTimeInSecond }) =>
            callback(p.constrain((currentTimeInSecondes - startAnimationTimeInSecond) / durationInSecond, 0, 1))
        );

        // animatableItemNotFinishedList.forEach(({ callback, durationInSecond, startAnimationTimeInSecond }) =>
        //     callback((currentTimeInSecondes - startAnimationTimeInSecond) / durationInSecond)
        // );

        this.animatableItemList = animatableItemNotFinishedList;
    }

    animate(animatableItem: AnimatableItem) {
        const startAnimationTimeInSecond = frameCount() / frameRate();
        this.animatableItemList.push({ ...animatableItem, startAnimationTimeInSecond });
    }
}