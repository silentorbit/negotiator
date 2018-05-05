"use strict";

//return whether the domain contain a leading wildcard
function isWild(domain: string) {
    if (domain.length == 0)
        return false;
    return domain.indexOf("*") == 0;
}

//return domain without leading wildcard
function withoutWild(domain: string) {
    if (isWild(domain))
        return domain.substring(1);
    else
        return domain;
}

function addFilter(f: Filter) {
    f = JSON.parse(JSON.stringify(f)); //Prevents Firefox dead object warning 
    var fr: FiltersTo;

    //From...
    var fromWithout = withoutWild(f.from);
    if (isWild(f.from)) {
        //From Wildcard
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
function updateFilter(before: Filter, after: Filter) {
    before = JSON.parse(JSON.stringify(before)); //Prevents Firefox dead object warning 
    after = JSON.parse(JSON.stringify(after)); //Prevents Firefox dead object warning 

    if (before.from != after.from || before.to != after.to) {
        //Delete old location
        syncDeleteFilter(before);
    }
    addFilter(after);
    syncUpdateFilter(after);
}

//Delete filter from live tree
function deleteFilter(from: string, to: string) {
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