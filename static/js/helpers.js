/*exported parseQueryVariables*/
/*exported naiveFlexBoxSupport*/
/*exported stringifyQueryParams*/
/*exported setActiveButton*/

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

function showElement(elementId) {
    var element = document.getElementById(elementId);
    if (!element) {
        throw new Error("Element: " + elementId + " not found.");
    }
    element.classList.remove("hidden");
}

function hideElement(elementId) {
    var element = document.getElementById(elementId);
    if (!element) {
        throw new Error("Element: " + elementId + " not found.");
    }
    element.classList.add("hidden");
}

function setActiveButton(elementId) {
    var element = document.getElementById(elementId);
    if (!element) {
        throw new Error("Element: " + elementId + " not found.");
    }

    if (element.classList.contains("footer-button-active")) {
        return;
    }

    hideAllButtons();
    showElement(elementId);

    setTimeout(function () {
        element.classList.add("footer-button-active");
    }, 100);
}

function hideAllButtons() {
    var footer = document.getElementById("footer"),
        buttons = footer.getElementsByTagName("button");

    [].forEach.call(buttons, function (button) {
        button.classList.remove("footer-button-active");
        hideElement(button.id);
    });
}