"use strict";
function getFilter(from, to) {
    if (settings.ignoreWWW) {
        if (from != null && from.lastIndexOf("www.", 0) == 0)
            from = from.substring(4);
        if (to.lastIndexOf("www.", 0) == 0)
            to = to.substring(4);
    }
    if (from == null) {
        var f = getRequestFilter(to, to);
        if (f != null)
            return f;
        return getRequestFilterTo(filters.wild[""], to);
    }
    else
        return getRequestFilter(from, to);
}
function getRequestFilter(from, to) {
    {
        var fto = filters.direct[from];
        if (fto != null) {
            var t = getRequestFilterTo(fto, to);
            if (t != null)
                return t;
        }
    }
    if (filters.wild == null)
        return null;
    while (from != "") {
        var toList = filters.wild[from];
        if (toList != null) {
            t = getRequestFilterTo(toList, to);
            if (t != null)
                return t;
        }
        var p = from.indexOf(".");
        if (p < 0)
            break;
        from = from.substring(p + 1);
    }
    if (filters.wild[""] == null)
        return null;
    var t = getRequestFilterTo(filters.wild[""], to);
    if (t != null)
        return t;
    return null;
}
function getRequestFilterTo(fromList, domain) {
    var t = fromList.direct[domain];
    if (t != null)
        return t;
    var source = fromList.wild;
    if (source == null)
        return null;
    while (true) {
        var t_1 = source[domain];
        if (t_1 != null)
            return t_1;
        var p = domain.indexOf(".");
        if (p < 0)
            break;
        domain = domain.substring(p + 1);
    }
    return source[""];
}
function parseSubnet(ipsub) {
    var a = ipsub.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)(\/(\d+))?/);
    if (a === null)
        return null;
    var n = (parseInt(a[1]) << 24) + (parseInt(a[2]) << 16) + (parseInt(a[3]) << 8) + (a[4]);
    if (a[5] === undefined)
        return { ip: n, mask: 0xFFFFFFFF };
    var m = ~((1 << (32 - parseInt(a[5]))) - 1);
    return { ip: n, mask: m };
}
