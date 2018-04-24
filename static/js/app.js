/*global Promise*/
/*global API*/
/*global sendEventNotification*/
/*global footer*/
/*global proceedBtn*/
/*exported showConsentScreen*/
/*exported hideConsentScreen*/
/*exported showLoadingScreen*/
/*exported hideLoadingScreen*/
/*exported checkJobStatus*/
/*eslint no-console: "off"*/

window.request = function(url, method, data, headers) {
    return new Promise(function (resolve, reject) {
        var xhttp = new XMLHttpRequest();

        if (method.toUpperCase() === "POST") {
            xhttp.open("POST", url, true);
            xhttp.setRequestHeader("Content-type", "application/json");
        } else {
            xhttp.open("GET", url, true);
        }

        for (var header in headers) {
            if (!headers.hasOwnProperty(header)) {
                continue;
            }
            xhttp.setRequestHeader(header, headers[header]);
        }

        if (method.toUpperCase() === "POST") {
            xhttp.send(JSON.stringify(data));
        } else {
            xhttp.send();
        }

        xhttp.addEventListener("load", function () {
            resolve(parseResponse(xhttp));
        });
        xhttp.addEventListener("error", function (e) {
            console.log(xhttp, e);
            reject(parseResponse(xhttp));
        });
    });
};

window.renderInstitutions = function (container, institutions, url, search) {
    container.innerHTML = "";

    var parentHeight = window.getComputedStyle(container.parentNode).getPropertyValue("height"),
        w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        searchWidthPx = window.getComputedStyle(document.getElementById("institutionSearch")).getPropertyValue("width"),
        searchWidth = searchWidthPx.substr(0, searchWidthPx.length - 2),
        liW =  searchWidth / 2 - (w / 10 / 5);

    //document.getElementById("closeButton").style.right = (w - searchWidth) / 2 + "px";

    window.addEventListener("resize", function () {
        var parentHeight = window.getComputedStyle(container.parentNode).getPropertyValue("height");
        container.style.height = parentHeight.substr(0, parentHeight.length - 2) - 150 - 65 - 20 + "px";
    });

    container.style.height = parentHeight.substr(0, parentHeight.length - 2) - 150 - 65 - 20 + "px";

    var links = [];

    for (var institution in institutions) {
        if (!institutions.hasOwnProperty(institution)) {
            continue;
        }

        var instUrl = url.replace("{inst_id}", institutions[institution].id);
        var div = document.createElement("div"),
            a = document.createElement("a"),
            imgPlaceholder = document.createElement("div"),
            imgPlaceholderSpinner = document.createElement("div"),
            img = document.createElement("img"),
            searchHeight = liW / (w/h > 0.8 ? 1.4 : 2.5);

        a.appendChild(img);
        a.appendChild(imgPlaceholder);
        imgPlaceholder.classList.add("img-placeholder");
        imgPlaceholder.appendChild(imgPlaceholderSpinner);
        imgPlaceholderSpinner.className = "spinner img-placeholder-spinner";
        a.setAttribute("href", instUrl);
        links.push(a);

        a.onclick = (function (index) {
            return function(institution, e) {
                e.preventDefault();
                resetSelection(search, institutions);

                window.localStorage.setItem("selectedInstitution", JSON.stringify(institution));
                window.localStorage.setItem("selectedInstitutionTime", Date.now());
                footer.style.display = "block";
                if (!search) {
                    this.style.border = "2px solid #4A90E2";
                } else {
                    this.style.borderTop = "2px solid #4A90E2";
                    if (this.parentElement.nextSibling) {
                        this.parentElement.nextSibling.getElementsByTagName("a")[0].style.borderTop = "2px solid #4A90E2";
                    } else {
                        this.style.borderBottom = "2px solid #4A90E2";
                    }
                }
                if (this.classList.contains("active")) {
                    this.classList.remove("active");
                    footer.style.display = "none";
                    resetSelection(search);
                } else {
                    this.classList.add("active");
                }
                proceedBtn.onclick = function () {
                    window.location.replace(this.href);
                }.bind(this);
            }.bind(this, institutions[index]);
        }.bind(a))(institution);

        div.appendChild(a);
        div.className = "bank-link";
        div.style.width = liW + "px";
        div.style.height = liW/2 + "px";

        imgPlaceholderSpinner.style.marginTop = liW/4 - 50 + "px";

        if (institutions[institution].logo.links.square) {
            img.setAttribute("src", institutions[institution].logo.links.square);
        } else {
            img.setAttribute("src", institutions[institution].logo.links.self);
        }

        img.setAttribute("alt", institutions[institution].name);
        img.setAttribute("title", institutions[institution].name);

        img.onload = (function (a, imgPlaceholder, searchHeight) {
            return function () {
                a.removeChild(imgPlaceholder);
                if (!search) {
                    if (this.width - this.height > this.height / 2) {
                        this.style.width = "99%";
                        this.style.marginTop = (liW / 2 - this.height) / 6 + "px";
                    } else {
                        this.style.height = "99%";
                    }
                } else {
                    var target = this.parentElement;

                    target.style.lineHeight = (searchHeight) / 2 + "px";
                    if (this.width - this.height > this.height / 6) {
                        this.style.width = "20%";
                    } else {
                        this.style.height = searchHeight - 40 + "px";
                    }
                }
            };
        })(a, imgPlaceholder, searchHeight);

        img.onerror = function () {
            this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
        };

        if (search) {
            resetSelection(search);
            div.className = "bank-link-search";
            div.style.width = searchWidth;
            div.style.marginLeft = (w - searchWidth) / 2;
            div.style.height = searchHeight + "px";
            imgPlaceholderSpinner.style.marginTop = searchHeight/2-50 + "px";
            imgPlaceholder.classList.add("img-placeholder-search");
            var h3 = document.createElement("h3");
            h3.className = "bank-link-search-header";

            img.style.width = (liW - (liW / 16) * 2) / 2 + "px";
            a.className = "bank-link-nav-search";

            if (naiveFlexBoxSupport(document)) {
                a.style.display = "flex";
                a.style.alignItems = "center";
            } else {
                a.style.display = "inline-block";
                a.style.verticalAlign = "middle";
            }

            h3.innerHTML = institutions[institution].name;
            a.appendChild(h3);
        }

        container.appendChild(div);
    }
};

window.renderInstitution = function (institution) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("content").style.display = "block";
    if (institution.loginIdCaption) {
        //document.getElementById("usernameInputLabel").innerHTML = institution.loginIdCaption + ":";
        document.getElementById("usernameInput").setAttribute("placeholder", institution.loginIdCaption);
    }
    if (institution.passwordCaption) {
        //document.getElementById("passwordInputLabel").innerHTML = institution.passwordCaption + ":";
        document.getElementById("passwordInput").setAttribute("placeholder", institution.passwordCaption);
    }
    if (institution.securityCodeCaption) {
        document.getElementById("securityInputContainer").style.display = "block";
        document.getElementById("securityInput").setAttribute("placeholder", institution.securityCodeCaption);
    }

    var logo = document.getElementById("bankLogo");

    if (institution.logo.links.full) {
        logo.src = institution.logo.links.full;
    } else {
        logo.src = institution.logo.links.self;
    }

    logo.onload = function () {
        if (this.width > this.height) {
            return this.style.width = "70%";

        }

        this.style.height = "30%";
    };

    if (!institution.colors) {
        institution.colors = {
            primary: "#f5f5f5"
        };
    }

    window.institution = institution;
};

window.sendEventNotification = function (event, payload) {
    var queryVars = parseQueryVariables(),
        iframe = queryVars["iframe"];

    if (iframe && iframe === "true") {
        var data = {
            event: event,
            payload: payload
        };

        window.parent.postMessage(JSON.stringify(data), "*");
    } else {
        var url = "basiq://" + event + "/";

        if (payload) {
            url += JSON.stringify(payload, null, 0);
        }
        window.location.replace(url);
    }
};

window.checkAccessToken = function(token) {
    if (!token) {
        return "No token provided"; 
    }

    var sections = token.split(".").filter(Boolean);
    if (sections.length < 3) {
        return "Invalid token provided";
    }

    try {
        var claims = JSON.parse(atob(sections[1]));
        if (!claims.scope || claims.scope.toUpperCase() !== "CLIENT_ACCESS") {
            return "Invalid token scope provided";
        }
    } catch (err) {
        return err.message;
    }

    return null;

};

function parseResponse(res) {
    try {
        return {
            statusText: res.statusText,
            statusCode: res.status,
            body: JSON.parse(res.responseText)
        };
    } catch (err) {
        return {
            statusText: res.statusText,
            statusCode: res.status,
            body: res.responseText
        };
    }
}

function resetSelection(search) {
    var links = document.getElementById("institutionsContainer").getElementsByTagName("a");

    [].forEach.call(links, function (link) {
        link.classList.remove("active");
        if (!search) {
            link.style.border = "2px solid #EDEDED";
        } else {
            link.style.borderTop = "2px solid #E1E1E1";
            link.style.borderBottom = "none";
        }
    });
}

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

function naiveFlexBoxSupport (d){
    var f = "flex", e = d.createElement("b");
    e.style.display = f;
    return e.style.display === f;
}

function showLoadingScreen() {    
    document.getElementById("headerTitle").innerHTML = "Connecting to " + window.institution.name;
    document.getElementById("statusContainer").style.display = "block";
    document.getElementById("statusMessage").innerHTML = "Logging on securely";
    document.getElementById("statusMessage").className = "";
    document.getElementById("statusMessage").classList.add("result-text-default");
    document.getElementById("credentialsForm").style.display = "none";
}

function hideLoadingScreen() {
    document.getElementById("headerTitle").innerHTML = "Enter your credentials";
    document.getElementById("statusContainer").style.display = "none";
    document.getElementById("credentialsForm").style.display = "block";
}

window.institutionSearch = function (url, e) {
    e.preventDefault();

    var target, proceed = false;

    if (e.target.nodeName.toLowerCase() === "input") {
        target = e.target;
    } else {
        proceed = true;
        target = document.getElementById("institutionSearch");
    }

    var searchTerm = target.value.trim(),
        searchParser = function (term) {
            if (!window.institutions) {
                return;
            }

            var matched = [],
                instCont = document.getElementById("institutionsContainer");

            if (term.length < 2) {
                window.renderInstitutions(instCont, window.institutions, url);
                return;
            }

            for (var x = 0; x < window.institutions.length; x++) {
                var institution = window.institutions[x];

                if (institution.shortName.toLowerCase().indexOf(term.toLowerCase()) > -1) {
                    matched.push(institution);
                    continue;
                }

                if (institution.name.toLowerCase().indexOf(term.toLowerCase()) > -1) {
                    matched.push(institution);
                }
            }

            window.renderInstitutions(instCont, matched, url, true);
        };

    if (!proceed) {
        setTimeout(function () {
            var searchTermNew = target.value.trim();

            if (searchTermNew !== searchTerm) {
                return;
            }

            searchParser(searchTerm);
        }, 700);

        return;
    }

    searchParser(searchTerm);
};

function checkJobStatus(accessToken, jobData) {
    API.checkJobStatus(accessToken, jobData.id).then(function (resp) {
        var steps = resp.steps;

        for (var step in steps) {
            if (!steps.hasOwnProperty(step)) {
                continue;
            }
            if (steps[step].title === "verify-credentials") {
                switch (steps[step].status) {
                case "failed":
                    document.getElementById("backButton").style.display = "none";
                    document.getElementById("statusTitle").innerHTML = "";
                    document.getElementById("statusFooter").style.display = "block";
                    document.getElementById("retryBtn").style.display = "block";
                    document.getElementById("doneBtn").style.display = "none";
                    document.getElementById("statusIcon").innerHTML = "<div class='rounded-cross'></div>";
                    document.getElementById("statusMessage").innerHTML = steps[step].result.detail;
                    document.getElementById("headerTitle").innerHTML = "Unsuccessful";

                    document.getElementById("statusMessage").className = "";
                    document.getElementById("statusMessage").classList.add("result-text-error");

                    return sendEventNotification("connection", {
                        success: false,
                        data: steps[step].result
                    });
                case "success":
                    document.getElementById("backButton").style.display = "none";
                    document.getElementById("statusTitle").innerHTML = "";
                    document.getElementById("statusFooter").style.display = "block";
                    document.getElementById("retryBtn").style.display = "none";
                    document.getElementById("doneBtn").style.display = "block";
                    document.getElementById("statusIcon").innerHTML = "<div class='rounded-check'></div>";
                    document.getElementById("statusMessage").innerHTML = "Your account has been successfully linked.";
                    document.getElementById("headerTitle").innerHTML = "Success";

                    document.getElementById("statusMessage").className = "";
                    document.getElementById("statusMessage").classList.add("result-text-success");

                    var url = steps[step].result.url,
                        connectionId = url.substr(url.lastIndexOf("/") + 1);

                    return sendEventNotification("connection", {
                        success: true,
                        data: {
                            id: connectionId
                        }
                    });
                case "pending":
                case "in-progress":
                    setTimeout(checkJobStatus.bind(undefined, accessToken, jobData), 1000);
                }

            }
        }
    });
}

window.stringifyQueryParams = function(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
};