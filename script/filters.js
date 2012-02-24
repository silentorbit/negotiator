	

function testFilter(from, to){
	var f = getFilter(from, to);
	if(f == null)
		return null;
	return f.filter;
}

//Return a list of all filter object matching the domain name
function listDomainFilters(domain){
	var ret = {};

	//Add exact match
	d = filters[domain];
	if(d != null)
		ret[domain] = d;

	//Add wildcard match
	ret.wild = listWild(filters, domain);

	return ret; 
}

//Return the filter string for a given domain
//Return null if no filter matched
function getFilter(from, to)
{
	//Remove leading www.
	if(ignoreWWW){
		if(from !== undefined && from.lastIndexOf("www.", 0) == 0)
			from = from.substring(4);
		if(to.lastIndexOf("www.", 0) == 0)
			to = to.substring(4);
	}

	if(from == null)
		return getRequestFilterTo(filters.wild[""], to);
	else
		return getRequestFilter(from, to);
}	

function getRequestFilter(from, to)
{
	//From direct match
	var f = filters[from];

	if(f != null){
		//To 
		var t = getRequestFilterTo(f, to);
		if(t != null)
			return t;
	}

	//From wildcard match
	f = getWild(filters, from);
	if(f == null)
		return null;

	return getRequestFilterTo(f, to);
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

//Same as getWild but return every match in a list
function listWild(source, domain){
	var ret = {};
	
	source = source.wild;
	if(source == null)
		return ret;
	while(domain != ""){
		var t = source[domain];
		if(t != null)
			ret[domain] = t;
		//remove one subdomain
		var p = domain.indexOf(".");
		if(p < 0)
			return ret;
		domain = domain.substring(p + 1);
	}
	
	return ret;
}

function addFilter(f)
{
	//Remove whitespace
	f.from = f.from.trim();
	f.to = f.to.trim();

	//Interpret leading * as wildcard
	if(f.from.indexOf("*") == 0){
		f.fromWild = true;
		f.from = f.from.substring(1);
	}
	if(f.to.indexOf("*") == 0){
		f.toWild = true;
		f.to = f.to.substring(1);
	}

	//Remove leading dots
	f.from = f.from.replace(/^[\.]+/,'').trim();
	f.to = f.to.replace(/^[\.]+/,'').trim();

	if(f.from.indexOf(" ") >= 0 || f.to.indexOf(" ") >= 0){
		alert("domains can't contain spaces");
		return;
	}
	//Empty is interpreted as wildcard(which includes empty
	if(f.from == "")
		f.fromWild = true;
	if(f.to == "")
		f.toWild = true;
	
	//From...
	var fr;
	if(f.fromWild){
		//From Wildcard
		fr = filters.wild[f.from];
		if(fr == null){
			fr = {};
			filters.wild[f.from] = fr;
		}
	}else{
		fr = filters[f.from];
		if(fr == null){
			fr = {};
			filters[f.from] = fr;
		}
	}
	if(fr.wild == null)
		fr.wild = {};
	
	//...To: add filter
	if(f.toWild)
		fr.wild[f.to] = f;
	else
		fr[f.to] = f;
	
	saveFilters();
}

function deleteFilter(fromWild, from, toWild, to){
	var f;
	if(fromWild)
		f = filters.wild[from];
	else
		f = filters[from];
	if(f == null)
		return;
		
	if(toWild)
		delete f.wild[to];
	else
		delete f[to];

	saveFilters();
}

