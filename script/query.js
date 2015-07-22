
//Return the filter string for a given domain
//Return null if no filter matched
function getFilter(from, to)
{
	//Remove leading www.
	if(settings.ignoreWWW)
	{
		if(from != null && from.lastIndexOf("www.", 0) == 0)
			from = from.substring(4);
		if(to.lastIndexOf("www.", 0) == 0)
			to = to.substring(4);
	}

	if(from == null)
	{
		//First check for within the domain filter
		var f = getRequestFilter(to, to);
		if(f != null)
			return f;
		return getRequestFilterTo(filters.wild[""], to);
	}
	else
		return getRequestFilter(from, to);
}	

function getRequestFilter(from, to)
{
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
	var f = filters[from];
	if(f != null)
	{
		//To 
		var t = getRequestFilterTo(f, to);
		if(t != null)
			return t;
	}

	//From wildcard match
	if(filters.wild == null)
		return null;
	while(from != "")
	{
		var toList = filters.wild[from];
		if(toList != null)
		{
			t = getRequestFilterTo(toList, to);
			if(t != null)
				return t;
		}
		//remove one subdomain level
		var p = from.indexOf(".");
		if(p < 0)
			break;
		from = from.substring(p + 1);
	}
	if(filters.wild[""] == null)
		return null;
	return getRequestFilterTo(filters.wild[""], to);
}

function getRequestFilterTo(fromList, to)
{
	//To direct match
	var t = fromList[to];
	if(t != null)
		return t;
		
	//To wildcard match
	return getWild(fromList, to);
}

//Helper for getFilter
function getWild(source, domain)
{
	source = source.wild;
	if(source == null)
		return null;
	while(true)
	{
		var t = source[domain];
		if(t != null)
			return t;
		//remove one subdomain
		var p = domain.indexOf(".");
		if(p < 0)
			break;
		domain = domain.substring(p + 1);
	}
	return source[""];
}

function parseSubnet(ipsub)
{
	var a = ipsub.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)(\/(\d+))?/);
	if(a === null)
		return null;
	var n = (a[1] << 24) + (a[2] << 16) + (a[3] << 8) + (a[4]);
	if(a[5] === undefined)
		return {ip: n, mask:0xFFFFFFFF};
	var m = ~((1 << (32 - a[5])) - 1);
	return {ip: n, mask:m};
}
