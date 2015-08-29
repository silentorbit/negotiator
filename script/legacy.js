
//Add "*" to wildcard filters .from and .to properties.
function fixLegacyWildcard() {
    //Fix from, to wildcards
    for (var i in filters) {
        if (i == "wild")
            continue;
        fixLegacyWildcardFrom(filters[i], false);
    }
    var fw = filters.wild;
    for (var i in fw) {
        fixLegacyWildcardFrom(fw[i], true);
    }
}
function fixLegacyWildcardFrom(list, fromWild) {
    if (list == null)
        return;

    //Fix from, to wildcards
    for (var i in list) {
        if (i == "wild")
            continue;
        fixLegacyWildcardTo(list[i], fromWild, false);
    }
    var fw = list.wild;
    for (var i in fw) {
        fixLegacyWildcardTo(fw[i], fromWild, true);
    }
}
function fixLegacyWildcardTo(f, fromWild, toWild) {
    if (f == null)
        return;
    if (fromWild && !isWild(f.from))
        f.from = "*" + f.from;
    if (toWild && !isWild(f.to))
        f.to = "*" + f.to;
}

function loadLegacySettings() {
    //Load old formats
    var s = {};

    //Default filter: what action to take when no filter match
    //We changed the storage key from defaultFilter to defaultAction
    s.defaultAction = localStorage.defaultAction || localStorage.defaultFilter || "pass";

    //This one is used when the referer is empty or the request is within the same domain
    s.defaultLocalAction = localStorage.defaultLocalAction || "pass";

    //This one is used when the TLD is the same such as www.example.com -> static.example.com
    s.defaultLocalTLDAction = localStorage.defaultLocalTLDAction || s.defaultAction;

    //Default new filter: what the preselected action for new filters are
    s.defaultNewFilterAction = localStorage.defaultNewFilterAction || "block";

    //Ignore leading www.
    s.ignoreWWW = (localStorage.ignoreWWW == "true");

    //Experimental: allow bar>bar when block:*>bar is set
    s.alwaysPassSame = (localStorage.alwaysPassSame == "true");

    return s;
}