
var filters = JSON.parse(localStorage.getItem("filters"));
//First time the filter is filled with entries from blockedDomains
if(filters == null){
	//Fill with embedded block list
	filters = {};
	filters[""] = {};
	filters[""].wild = {};
	
	for(var i in blockedDomains)
	{
		var f = {
			from: "",
			fromWild: false,
			to: blockedDomains[i],
			toWild: true,
			filter: "block"
		};
		filters[""].wild[f.to] = f;
	}
	
}
if(filters.wild == null)
	filters.wild = {};


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

//Return the filter string for a given domain
//Return null if no filter matched
function getFilter(from, to)
{
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
	f = filters[from];
	if(f == null){
		//From wildcard match
		f = getWild(filters, from);
		if(f == null)
			return null;
	}

	//To direct match
	var t = f[to];
	if(t != null)
		return t;
		
	//To wildcard match
	return getWild(f, to);
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
