"use strict";

//Return the filter string for a given domain
//Return null if no filter matched
function getFilter(from: string, to: string) {
    //Remove leading www.
    if (settings.ignoreWWW) {
        if (from != null && from.lastIndexOf("www.", 0) == 0)
            from = from.substring(4);
        if (to.lastIndexOf("www.", 0) == 0)
            to = to.substring(4);
    }

    if (from == null) {
        //First check for within the domain filter
        var f = getRequestFilter(to, to);
        if (f != null)
            return f;
        return getRequestFilterTo(filters.wild[""], to);
    }
    else
        return getRequestFilter(from, to);
}

function getRequestFilter(from: string, to: string) {
    //From ip
    /*
	var a = ipsub.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
	if(a !== null)
	{
		//TODO: Decide
		//Either: Loop through an entire list if ip filters(up to n tests)
		//Or  interpret as 32 bit - up to 32 tests
		//Or interpret as bytes - up to 4 tests
		//Or compare as domains but start cutting off at the end instead.
		//We go with the last option
	}*/

    //From direct match
    {
        let fto = filters.direct[from];
        if (fto != null) {
            //To 
            var t = getRequestFilterTo(fto, to);
            if (t != null && t.sync != "deleted")
                return t;
        }
    }

    //From wildcard match
    if (filters.wild == null)
        return null;
    while (from != "") {
        var toList = filters.wild[from];
        if (toList != null) {
            t = getRequestFilterTo(toList, to);
            if (t != null && t.sync != "deleted")
                return t;
        }
        //remove one subdomain level
        var p = from.indexOf(".");
        if (p < 0)
            break;
        from = from.substring(p + 1);
    }
    if (filters.wild[""] == null)
        return null;
    var t = getRequestFilterTo(filters.wild[""], to);
    if (t != null && t.sync != "deleted")
        return t;
    return null;
}

function getRequestFilterTo(fromList: FiltersTo, domain: string) {
    //To direct match
    var t = fromList.direct[domain];
    if (t != null && t.sync != "deleted")
        return t;

    //To wildcard match
    var source = fromList.wild;
    if (source == null)
        return null;
    while (true) {
        let t = source[domain];
        if (t != null && t.sync != "deleted")
            return t;
        //remove one subdomain
        var p = domain.indexOf(".");
        if (p < 0)
            break;
        domain = domain.substring(p + 1);
    }
    return source[""];
}

function parseSubnet(ipsub: string) {
    var a = ipsub.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)(\/(\d+))?/);
    if (a === null)
        return null;
    var n = (parseInt(a[1]) << 24) + (parseInt(a[2]) << 16) + (parseInt(a[3]) << 8) + (a[4]);
    if (a[5] === undefined)
        return { ip: n, mask: 0xFFFFFFFF };
    var m = ~((1 << (32 - parseInt(a[5]))) - 1);
    return { ip: n, mask: m };
}
