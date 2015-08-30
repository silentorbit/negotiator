"use strict";

//return whether the domain contain a leading wildcard
function isWild(domain) {
    if (domain.length == 0)
        return false;
    return domain.indexOf("*") == 0;
}

//return domain without leading wildcard
function withoutWild(domain) {
    if (isWild(domain))
        return domain.substring(1);
    else
        return domain;
}

function addFilter(f) {
    var fr;

    //From...
    var fromWithout = withoutWild(f.from);
    if (isWild(f.from)) {
        //From Wildcard
        if (filters.wild == null)
            filters.wild = {};
        fr = filters.wild[fromWithout];
        if (fr == null) {
            fr = {};
            filters.wild[fromWithout] = fr;
        }
    }
    else {
        fr = filters[fromWithout];
        if (fr == null) {
            fr = {};
            filters[fromWithout] = fr;
        }
    }
    if (fr.wild == null)
        fr.wild = {};

    //...To: add filter
    var toWithout = withoutWild(f.to);
    if (isWild(f.to))
        mergeListUpdate(fr.wild, toWithout, f);
    else
        mergeListUpdate(fr, toWithout, f);

    return true;
}

//Filter is updated by the user, save changes
function updateFilter(before, after) {
    if (before.from != after.from || before.to != after.to) {
        //Delete old location
        deleteFilter(before.from, before.to);
        syncDeleteFilter(before.from, before.to);
    }
    addFilter(after);
    syncUpdateFilter(after);
}

//Delete filter from live tree
function deleteFilter(from, to) {
    var f;
    if (isWild(from))
        f = filters.wild[withoutWild(from)];
    else
        f = filters[withoutWild(from)];
    if (f == null)
        return;

    if (isWild(to))
        delete f.wild[withoutWild(to)];
    else
        delete f[withoutWild(to)];
}