export function range(length: number): number[] {
    return Array.from({ length }).map((_, index) => index);
}

export function zip<T extends unknown[][]>(
    ...listOfList: T
): { [K in keyof T]: T[K] extends (infer V)[] ? V : never }[] {
    const shortestListLength = Math.min(...listOfList.map(list => list.length));
    // @ts-expect-error
    return range(shortestListLength).map((i: number) => listOfList.map(list => list[i]));
}
