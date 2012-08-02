
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
	return true;
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
