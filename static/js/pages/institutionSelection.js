/*global showElement hideElement updateTitle transitionToPage hideAllButtons setActiveButton2 preloadImage */

window.pages["institutionSelection"] = {
    setup: function (type) {
        window.pages["institutionSelection"].hideSearchHandler = window.pages["institutionSelection"].hideSearchHandler.bind(null, type);
        window.pages["institutionSelection"].searchHandler = window.pages["institutionSelection"].searchHandler.bind(null, type);
        window.pages["institutionSelection"].searchFocusHandler = window.pages["institutionSelection"].searchFocusHandler.bind(null, type);
    },
    render: function (container, type) {
        var institutionsContainer = document.createElement("ul");

        institutionsContainer.id = "institutionsContainer";

        showElement("institutionSearchForm");
        showElement("backButton");
        hideElement("hideSearchButton");
        updateTitle("Select your bank");

        document.getElementById("backButton").onclick = function (e) {
            e.preventDefault();
            resetSelection();
            transitionToPage("initialChoice");
        };

        var timer = null;
        institutionsContainer.addEventListener("scroll", function () {
            if (timer !== null) {
                clearTimeout(timer);
                institutionsContainer.classList.add("scrolling");
            }
            timer = setTimeout(function () {
                institutionsContainer.classList.remove("scrolling");
            }, 150);
        });

        container.appendChild(institutionsContainer);

        document.getElementById("hideSearchButton").addEventListener("click", window.pages["institutionSelection"].hideSearchHandler);
        document.getElementById("institutionSearchForm").addEventListener("submit", window.pages["institutionSelection"].searchHandler);
        document.getElementById("institutionSearch").addEventListener("input", window.pages["institutionSelection"].searchHandler);
        document.getElementById("institutionSearch").addEventListener("focus", window.pages["institutionSelection"].searchFocusHandler);

        renderInstitutions(institutionsContainer, type, window.globalState.institutions, window.globalState.url);
    },
    hideSearchHandler: function(type, e) {
        e.preventDefault();
        transitionToPage("institutionSelection", type);
    },
    searchFocusHandler: function(type) {
        showElement("hideSearchButton");
        var term = document.getElementById("institutionSearch").value;
    
        if (term.length > 0) {
            institutionSearch(window.globalState.institutions, window.globalState.url, term, type);
        } else {
            renderEmptySearch("Find your bank, credit union or superannuation fund");
        }
    },
    searchHandler: function(type, e) {
        e.preventDefault();
        var term = document.getElementById("institutionSearch").value;
        institutionSearch(window.globalState.institutions, window.globalState.url, term, type);
    },
    unload: function () {
        document.getElementById("hideSearchButton").removeEventListener("click", window.pages["institutionSelection"].hideSearchHandler);
        document.getElementById("institutionSearchForm").removeEventListener("submit", window.pages["institutionSelection"].searchHandler);
        document.getElementById("institutionSearch").removeEventListener("input",window.pages["institutionSelection"]. searchHandler);
        document.getElementById("institutionSearch").removeEventListener("focus", window.pages["institutionSelection"].searchFocusHandler);
    }
};

function renderInstitutions(container, type, institutions, url, search) {
    var margins = 10,
        parent = document.getElementById("content"),
        parentHeightPx = window.getComputedStyle(parent).getPropertyValue("height"),
        parentHeight = parseFloat(parentHeightPx.substr(0, parentHeightPx.length - 2)),
        w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        searchWidthPx = window.getComputedStyle(document.getElementById("institutionSearch")).getPropertyValue("width"),
        searchWidth = parseFloat(searchWidthPx.substr(0, searchWidthPx.length - 2)),
        liW = (searchWidth / 2) - (margins / 2);

    container.style.height = parentHeight - 110 - 65 - 20 + "px";

    window.addEventListener("resize", function () {
        var parentHeight = window.getComputedStyle(parent).getPropertyValue("height");
        container.style.height = parentHeight - 110 - 65 - 20 + "px";
    });

    if (search) {
        if (!container.classList.contains("container-search")) {
            hideElement("searchPlaceholder");
        }
        container.classList.add("container-search");
        return renderSearchedInstitutions(container, type, institutions, url, searchWidth, liW, w, h);
    } else {
        container.classList.remove("container-search");
        return renderAllInstitutions(container, type, institutions, url, liW);
    }
}

function institutionSearch(institutions, url, term, type) {
    if (!institutions || term.length < 2) {
        renderEmptySearch("Find your bank, credit union or superannuation fund");
        return;
    }

    var matchedLong = [],
        matchedShort = [],
        institutionsContainer = document.getElementById("institutionsContainer");

    for (var x = 0; x < institutions.length; x++) {
        var institution = institutions[x];

        if (institution.shortName.toLowerCase().indexOf(term.toLowerCase()) > -1) {
            matchedShort.push(institution);
            continue;
        }

        if (institution.name.toLowerCase().indexOf(term.toLowerCase()) > -1) {
            matchedLong.push(institution);
        }
    }

    if (matchedShort.length + matchedLong.length === 0) {
        return renderEmptySearch("Sorry no results found");
    }

    renderInstitutions(institutionsContainer, type, matchedShort.concat(matchedLong), url, true);
}

function renderEmptySearch(text) {
    var instConst = document.getElementById("institutionsContainer");

    instConst.innerHTML = "<div id=\"searchPlaceholder\" class=\"search-placeholder\">" +
        "<img src=\"images/institution.svg\"/>" +
        "<span>" + text + "</span>" +
        "</div>";
}

function renderSearchedInstitutions(container, type, institutions, url, searchWidth, liW, w, h) {
    container.innerHTML = "";
    var flexBox = window.naiveFlexBoxSupport(document),
        searchHeight = liW / (w / h > 0.8 ? 1.4 : 2.5);

    resetSelection();

    institutions.forEach(function (institution) {
        var instUrl = url.replace("{inst_id}", institution.id),
            div = document.createElement("div"),
            a = document.createElement("a"),
            img = document.createElement("img"),
            li = document.createElement("li");

        li.appendChild(a);

        div.appendChild(img);
        div.style.width = "25%";

        a.appendChild(div);
        a.setAttribute("href", instUrl);

        a.onclick = function (e) {
            e.preventDefault();
            selectInstitution(type, institution);
        };

        li.appendChild(a);
        li.className = "bank-link";
        li.style.width = liW + "px";
        li.style.height = liW / 2 + "px";

        container.appendChild(li);

        if (institution.logo.links.square) {
            img.setAttribute("src", institution.logo.links.square);
        } else {
            img.setAttribute("src", institution.logo.links.self);
        }

        img.setAttribute("alt", institution.name);
        img.setAttribute("title", institution.name);
        img.onload = function () {
            imageLoaded.call(this, true, searchHeight);
        };
        //img.onerror = function () {
            //this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
        //};

        var h3 = document.createElement("h3");
        h3.className = "search-result-title";
        h3.innerHTML = resolveSearchedInstName(institution);

        a.title = institution.name;
        a.className = "bank-link-nav-search";
        a.appendChild(h3);

        li.className = "bank-link-search";
        li.style.width = searchWidth;
        li.style.height = searchHeight + "px";

        img.style.width = (liW - (liW / 16) * 2) / 2 + "px";

        if (flexBox) {
            a.style.display = "flex";
            a.style.alignItems = "center";
        } else {
            a.style.display = "inline-block";
            a.style.verticalAlign = "middle";
        }
    });
}

function renderAllInstitutions(container, type, institutions, url, liW) {
    var newUl = true,
        ul;

    resetSelection();

    institutions.forEach(function (institution) {
        var instUrl = url.replace("{inst_id}", institution.id),
            a = document.createElement("a"),
            img = document.createElement("img"),
            li = document.createElement("li");

        if (newUl) {
            ul = document.createElement("ul");
            li.style.marginRight = "5px";
            container.appendChild(ul);
        } else {
            li.style.marginLeft = "5px";
        }

        newUl = !newUl;

        ul.appendChild(li);
        ul.classList.add("bank-row");
        li.appendChild(a);

        a.appendChild(img);
        a.setAttribute("href", instUrl);

        a.onclick = function (e) {
            e.preventDefault();
            selectInstitution(type, institution);
        };

        li.appendChild(a);
        li.className = "bank-link";
        li.style.width = liW + "px";
        li.style.height = liW / 2 + "px";

        img.style.opacity = "0";
        if (institution.logo.links.square) {
            img.setAttribute("src", institution.logo.links.square);
        } else {
            img.setAttribute("src", institution.logo.links.self);
        }
        img.setAttribute("alt", institution.name);
        img.setAttribute("title", institution.name);
        img.onload = function () {
            imageLoaded.call(this, false);
        };
        //img.onerror = function () {
            //this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
        //};
    });
}

function resolveSearchedInstName(institution) {
    var result = "";

    function getCountry(country) {
        var countries = [{
                longName: "Australia",
                shortName: "AU"
            },
            {
                longName: "New Zealand",
                shortName: "NZ"
            }
        ];
        for (var i = 0; i < countries.length; i++)
            if (countries[i].longName === country) return countries[i];
    }
    var serviceTypes = ["Personal Banking", "Business Banking"];
    var country = getCountry(institution.country);
    result = institution.name.length > 18 ? (institution.shortName > 18 ? institution.name.substr(0, 16).trim() + "..." : institution.shortName) : institution.name;
    // Add suffix if country is not Australia
    if (country.longName !== "Australia" && institution.shortName.indexOf("(" + country.shortName + ")") === -1) result += (" (" + country.shortName + ")");
    // Add suffix if service type is not personal
    if (institution.serviceType !== serviceTypes[0]) result += (" (" + institution.serviceType + ")");
    return result;
}

function selectInstitution(type, institution) {
    switch (type) {
        case "pdf":
            transitionToPage("pdfUpload", institution);
            break;
        case "online":
            transitionToPage("institution", institution);
            break;
    }
}

function imageLoaded(search, searchHeight) {
    if (!search) {
        if (this.width - this.height > this.height / 2) {
            this.style.width = "72%";
        } else {
            this.style.height = "95%";
        }
    } else {
        var target = this.parentElement;

        target.style.lineHeight = (searchHeight) / 2 + "px";
        if (this.width - this.height > this.height / 6) {
            this.style.width = "100%";
        } else {
            this.style.height = searchHeight - 15 + "px";
        }
    }

    this.style.opacity = "1";
}

function resetSelection() {
    var links = document.getElementById("institutionsContainer").getElementsByTagName("a");

    [].forEach.call(links, function (link) {
        link.classList.remove("active");
    });
}
