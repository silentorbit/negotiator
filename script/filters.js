
//return whether the domain contain a leading wildcard
function isWild(domain)
{
	if(domain.length = 0)
		return false;
	return domain.indexOf("*") == 0;
}

//return domain without leading wildcard
function withoutWild(domain)
{
	if(isWild(domain))
		return domain.substring(1);
	else
		return domain;
}

//Return the filter string for a given domain
//Return null if no filter matched
function getFilter(from, to)
{
	//Remove leading www.
	if(ignoreWWW){
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
	if(f != null){
		//To 
		var t = getRequestFilterTo(f, to);
		if(t != null)
			return t;
	}

	//From wildcard match
	if(filters.wild == null)
		return null;
	while(from != ""){
		var toList = filters.wild[from];
		if(toList != null){
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
function getWild(source, domain){
	source = source.wild;
	if(source == null)
		return null;
	while(true){
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

function addFilter(f)
{
	//f.from = f.from.replace(/\*+/, "*");
	//f.to = f.to.replace(/\*+/, "*");

	var fr;
	
	//From...
	var fromWithout = withoutWild(f.from);
	if(isWild(f.from)){
		//From Wildcard
		if(filters.wild == null)
			filters.wild = {};
		fr = filters.wild[fromWithout];
		if(fr == null){
			fr = {};
			filters.wild[fromWithout] = fr;
		}
	}else{
		fr = filters[fromWithout];
		if(fr == null){
			fr = {};
			filters[fromWithout] = fr;
		}
	}
	if(fr.wild == null)
		fr.wild = {};
	
	//...To: add filter
	var toWithout = withoutWild(f.to);
	if(isWild(f.to))
		fr.wild[toWithout] = f;
	else
		fr[toWithout] = f;
	
	return true;
}

function updateFilter(before, after)
{
	if(before.from != after.from || before.to != after.to)
	{
		//Delete old location
		deleteFilter(before.from, before.to);
		syncDelete(before.from, before.to);
	}
	addFilter(after);
	saveFilter(after);
}

function deleteFilter(from, to)
{
	var f;
	if(isWild(from))
		f = filters.wild[withoutWild(from)];
	else
		f = filters[withoutWild(from)];
	if(f == null)
		return;
		
	if(isWild(to))
		delete f.wild[withoutWild(to)];
	else
		delete f[withoutWild(to)];
}

function syncDelete(from, to)
{
	if(useChromeSync)
	{
		//console.log("Sync: delete: " + from + filterFromToSeparator + to);
		chrome.storage.sync.remove(from + filterFromToSeparator + to);
	}
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
