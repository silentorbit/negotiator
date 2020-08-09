"use strict";
function addFilter(f) {
    f = JSON.parse(JSON.stringify(f));
    var fr;
    var fromWithout = withoutWild(f.from);
    if (isWild(f.from)) {
        if (filters.wild == null)
            filters.wild = {};
        fr = filters.wild[fromWithout];
        if (fr == null) {
            fr = { wild: {}, direct: {} };
            filters.wild[fromWithout] = fr;
        }
    }
    else {
        fr = filters.direct[fromWithout];
        if (fr == null) {
            fr = { wild: {}, direct: {} };
            filters.direct[fromWithout] = fr;
        }
    }
    var toWithout = withoutWild(f.to);
    if (isWild(f.to))
        fr.wild[toWithout] = f;
    else
        fr.direct[toWithout] = f;
    return true;
}
function updateFilter(before, after) {
    before = JSON.parse(JSON.stringify(before));
    after = JSON.parse(JSON.stringify(after));
    if (before.from != after.from || before.to != after.to) {
        syncDeleteFilter(before);
    }
    addFilter(after);
    syncUpdateFilter(after);
}
function deleteFilter(from, to) {
    var f;
    if (isWild(from))
        f = filters.wild[withoutWild(from)];
    else
        f = filters.direct[withoutWild(from)];
    if (f == null)
        return;
    if (isWild(to))
        delete f.wild[withoutWild(to)];
    else
        delete f.direct[withoutWild(to)];
}
