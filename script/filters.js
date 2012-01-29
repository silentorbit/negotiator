
	
function testDomainFilter(domain)
{
	var f = getDomainFilter(domain);
	if(f == null)
		return null;
	return f.filter;
}		

function testFilter(from, to){
	var f = getFilter(from, to);
	if(f == null)
		return null;
	return f.filter;
}

//Return a list of all filter object matching the domain name
function listDomainFilters(domain){
	var ret = {};

	//Add target match
	var d = getDomainFilter(domain);
	if(d != null){
		ret[d.from] = d;
	}

	//Add direct match
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
	
	if(from !== undefined){
		var f = getRequestFilter(from, to);
		if(f != null)
			return f;
	}
	return getDomainFilter(to);	
}	

//Return the filter string for a given domain
//Return null if no filter matched
function getDomainFilter(domain)
{
	//From is always ""
	var f = filters[""];
	if(f == null)
		return null;

	//To direct match
	var t = f[domain];
	if(t != null)
		return t;

	//To wildcard match
	return getWild(f, domain);
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

function getRequestFilterTo(f, to)
{
	//To direct match
	var t = f[to];
	if(t != null)
		return t;
		
	//To wildcard match
	t = getWild(f, to);
	if(t != null)
		return t;

	//To empty match
	return f[""];
}

//Helper for getDomainFilter and getFilter
function getWild(source, domain){
	source = source.wild;
	if(source == null)
		return null;
	while(domain != ""){
		var t = source[domain];
		if(t != null)
			return t;
		//remove one subdomain
		var p = domain.indexOf(".");
		if(p < 0)
			return null;
		domain = domain.substring(p + 1);
	}
	return null;
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
	//Remove whitespace and leading dots
	f.from = f.from.replace(/^[\s\.]+/,'').trim();
	f.to = f.to.replace(/^[\s\.]+/,'').trim();
	if(f.from == "wild" || f.to == "wild"){
		alert("Invalid domain: domain can't be 'wild'");
		return;
	}
	if(f.from.indexOf(" ") >= 0 || f.to.indexOf(" ") >= 0){
		alert("domains cant contain space");
		return;
	}
	//Remove wildcard if either from or to is empty
	if(f.from == "")
		f.fromWild = false;
	if(f.to == "")
		f.toWild = false;
	
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

function deleteFilterFrom(fromWild, from){
	if(fromWild)
		delete filters.wild[from];
	else
		delete filters[from];
	
	saveFilters();
}

function saveFilters(){
	localStorage.filters = JSON.stringify(filters);
}
