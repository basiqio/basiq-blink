/*exported parseQueryVariables*/
/*exported naiveFlexBoxSupport*/
/*exported stringifyQueryParams*/

function parseQueryVariables() {
    var queryString = window.location.search.substring(1),
        query = {},
        pairs = queryString.split("&");

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split("=");
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
    }
    return query;
}

function naiveFlexBoxSupport(d){
    var f = "flex", e = d.createElement("b");
    e.style.display = f;
    return e.style.display === f;
}

function stringifyQueryParams(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}