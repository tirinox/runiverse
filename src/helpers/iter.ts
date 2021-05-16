export function setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _difference = new Set(setA);
    for (let elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}

export function setUnion<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _union = new Set(setA);
    for (let elem of setB) {
        _union.add(elem);
    }
    return _union;
}

export function setIntersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    let _intersection = new Set<T>();
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}

export function arrayNotEmpty(array: Array<any>) {
    return Array.isArray(array) && array.length
}