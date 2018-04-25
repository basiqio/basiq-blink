/*global API*/
/*global sendEventNotification*/
/*global proceedBtn*/
/*global naiveFlexBoxSupport*/
/*global parseQueryVariables*/
/*exported institutionSearch*/
/*exported showConsentScreen*/
/*exported hideConsentScreen*/
/*exported showLoadingScreen*/
/*exported hideLoadingScreen*/
/*exported checkJobStatus*/
/*eslint no-console: "off"*/

window.renderInstitutions = function (container, institutions, url, search) {
    container.innerHTML = "";

    var parentHeightPx = window.getComputedStyle(container.parentNode).getPropertyValue("height"),
        parentHeight = parseFloat(parentHeightPx.substr(0, parentHeightPx.length - 2)),
        w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        searchWidthPx = window.getComputedStyle(document.getElementById("institutionSearch")).getPropertyValue("width"),
        searchWidth = parseFloat(searchWidthPx.substr(0, searchWidthPx.length - 2)),
        liW =  searchWidth / 2 - (w / 10 / 5);

    container.style.height = parentHeight - 150 - 65 - 20 + "px";

    window.addEventListener("resize", function () {
        var parentHeight = window.getComputedStyle(container.parentNode).getPropertyValue("height");
        container.style.height = parentHeight - 150 - 65 - 20 + "px";
    });

    institutions.forEach(function (institution) {
        var instUrl = url.replace("{inst_id}", institution.id),
            div = document.createElement("div"),
            a = document.createElement("a"),
            img = document.createElement("img"),
            imgPlaceholder = document.createElement("div"),
            imgPlaceholderSpinner = document.createElement("div"),
            searchHeight = liW / (w/h > 0.8 ? 1.4 : 2.5);

        resetSelection(search);

        a.appendChild(img);
        a.setAttribute("href", instUrl);
        a.appendChild(imgPlaceholder);

        a.onclick = function (e) {
            linkClickHandler.bind(this, institution, e, search)();
        };

        imgPlaceholder.classList.add("img-placeholder");
        imgPlaceholder.appendChild(imgPlaceholderSpinner);
        imgPlaceholderSpinner.className = "spinner img-placeholder-spinner";
        imgPlaceholderSpinner.style.marginTop = liW/4 - 50 + "px";

        div.appendChild(a);
        div.className = "bank-link";
        div.style.width = liW + "px";
        div.style.height = liW/2 + "px";

        if (institution.logo.links.square) {
            img.setAttribute("src", institution.logo.links.square);
        } else {
            img.setAttribute("src", institution.logo.links.self);
        }

        img.setAttribute("alt", institution.name);
        img.setAttribute("title", institution.name);
        img.onload = function () {
            imageLoaded.bind(this, a, imgPlaceholder, search, searchHeight, liW)();
        };
        img.onerror = function () {
            this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
        };

        if (search) {
            var h3 = document.createElement("h3");
            h3.className = "bank-link-search-header";
            h3.innerHTML = institution.name;

            a.className = "bank-link-nav-search";
            a.appendChild(h3);

            div.className = "bank-link-search";
            div.style.width = searchWidth;
            div.style.marginLeft = (w - searchWidth) / 2;
            div.style.height = searchHeight + "px";

            img.style.width = (liW - (liW / 16) * 2) / 2 + "px";

            imgPlaceholderSpinner.style.marginTop = searchHeight/2-50 + "px";
            imgPlaceholder.classList.add("img-placeholder-search");

            if (naiveFlexBoxSupport(document)) {
                a.style.display = "flex";
                a.style.alignItems = "center";
            } else {
                a.style.display = "inline-block";
                a.style.verticalAlign = "middle";
            }
        }

        container.appendChild(div);
    });
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

window.renderEmptySearch = function (text) {
    console.log("invoked");
    var instConst = document.getElementById("institutionsContainer");

    instConst.innerHTML = "<div class=\"search-placeholder\">" +
        "<img src=\"institution.svg\"/>" +
        "<span>" + text + "</span>" +
        "</div>";
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



function imageLoaded(a, imgPlaceholder, search, searchHeight, liW) {
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

    a.removeChild(imgPlaceholder);
}

function linkClickHandler(institution, e, search) {
    e.preventDefault();
    resetSelection(search);

    window.localStorage.setItem("selectedInstitution", JSON.stringify(institution));
    window.localStorage.setItem("selectedInstitutionTime", Date.now());
    proceedBtn.classList.add("footer-button-active");
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
        proceedBtn.classList.remove("footer-button-active");
        resetSelection(search);
    } else {
        this.classList.add("active");
    }
    proceedBtn.onclick = function () {
        window.location.replace(this.href);
    }.bind(this);
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

function institutionSearch(url, term) {
    if (!window.institutions) {
        return;
    }

    var matched = [],
        instCont = document.getElementById("institutionsContainer");

    if (term.length < 2) {
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

    if (matched.length === 0) {
        return window.renderEmptySearch("Sorry no results found");
    }

    window.renderInstitutions(instCont, matched, url, true);
}

function checkJobStatus(accessToken, jobData) {
    document.getElementById("connectionLoader").classList.remove("result-error");

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

                    document.getElementById("doneBtn").style.display = "none";
                    document.getElementById("retryBtn").style.display = "block";
                    setTimeout(function () {
                        document.getElementById("doneBtn").classList.remove("footer-button-active");
                        document.getElementById("retryBtn").classList.add("footer-button-active");
                    }, 100);

                    //document.getElementById("statusIcon").innerHTML = "<div class='rounded-cross'></div>";
                    document.getElementById("connectionSpinner").style.opacity = "0";
                    document.getElementById("connectionCross").style.display = "block";
                    document.getElementById("connectionLoader").classList.add("result-error");
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

                    document.getElementById("doneBtn").style.display = "block";
                    document.getElementById("retryBtn").style.display = "none";
                    setTimeout(function () {
                        document.getElementById("retryBtn").classList.remove("footer-button-active");
                        document.getElementById("doneBtn").classList.add("footer-button-active");
                    }, 100);

                    //document.getElementById("statusIcon").innerHTML = "<div class='rounded-check'></div>";
                    document.getElementById("connectionSpinner").style.opacity = "0";
                    document.getElementById("connectionCheckmark").style.display = "block";
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