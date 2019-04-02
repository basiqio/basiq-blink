/*global API*/
/*global Promise*/
/*global naiveFlexBoxSupport*/
/*global parseQueryVariables*/
/*global showElement*/
/*global hideElement*/
/*global hideAllButtons*/
/*global setActiveButton*/
/*exported institutionSearch*/
/*exported showConsentScreen*/
/*exported hideConsentScreen*/
/*exported showLoadingScreen*/
/*exported hideLoadingScreen*/
/*exported checkJobStatus*/
/*exported renderError*/
/*eslint no-console: "off"*/

(function (window) {
    showElement("loading");
    hideElement("institutionSearchForm");
    hideElement("institutionsContainer");

    var institutions = null,
        queryVars = parseQueryVariables(),
        iFrame = !!queryVars["iframe"] && queryVars["iframe"] === "true",
        userId = queryVars["user_id"],
        connectionId = queryVars["connection_id"],
        accessToken = queryVars["access_token"],
        demo = !!queryVars["demo"] && queryVars["demo"] === "true",
        //serviceTypes = queryVars["service_types"],
        //countries = queryVars["countries"],
        errorContainer = document.getElementById("errorContainer"),
        proceedButton = document.getElementById("proceedButton"),
        instCont = document.getElementById("institutionsContainer"),
        url = "/authenticate.html?user_id=" + userId + "&institution_id={inst_id}&access_token=" + accessToken,
        searching = false,
        error = checkAccessToken(accessToken, demo);


    if (iFrame) {
        url += "&iframe=true";
    }

    if (error) {
        hideElement("loading");
        renderError((error.title ? error.title : "") + " " + (error.detail ? error.detail : ""));
    } else {
        if (connectionId) {
            if (demo === true) {
                renderError("Demo is not supported for update connection use-case.");
                return;
            }
            return updateConnection(connectionId);
        }

        checkUserID(userId, demo).then(function () {        
            return API.loadInstitutions();
        }).then(function (loadedInstitutions) {
            institutions = loadedInstitutions;

            return preloadImages(institutions);
        }).then(function () {
            hideElement("loading");
            showElement("institutionSearchForm");
            showElement("institutionsContainer");
            renderInstitutions(instCont, institutions, url);

            var timer = null;
            instCont.addEventListener("scroll", function () {
                if (timer !== null) {
                    clearTimeout(timer);
                    instCont.classList.add("scrolling");
                }
                timer = setTimeout(function () {
                    instCont.classList.remove("scrolling");
                }, 150);
            });
        }).catch(function (err) {
            renderError((err.title ? err.title: "") + " " + (err.detail  ? err.detail : ""));
        });

        document.getElementById("closeButton").addEventListener("click", function (e) {
            e.preventDefault();

            sendEventNotification("cancellation");
        });

        document.getElementById("institutionSearchForm").addEventListener("submit", function (e) {
            e.preventDefault();
            var term = document.getElementById("institutionSearch").value;
            institutionSearch(url, term);
        });
        document.getElementById("institutionSearch").addEventListener("input", function (e) {
            var term = e.target.value.trim();

            institutionSearch(url, term);
        });
        document.getElementById("institutionSearch").addEventListener("focus", function () {
            if (searching) {
                return;
            }
            searching = true;
            showElement("hideSearchButton");
            var term = document.getElementById("institutionSearch").value;
            if (term.length > 0) {
                institutionSearch(url, term);
            } else {
                renderEmptySearch("Find your bank, credit union or superannuation fund");
            }
        });
        document.getElementById("hideSearchButton").addEventListener("click", function (e) {
            e.preventDefault();
            searching = false;
            resetSelection();
            document.getElementById("institutionSearch").value = "";
            hideElement("hideSearchButton");
            renderInstitutions(instCont, institutions, url);
        });

        document.getElementById("backButton").addEventListener("click", function (e) {
            e.preventDefault();
            hideAllButtons();
            hideElement("authenticationContainer");
            hideElement("backButton");
            showElement("institutionSearchForm");
            showElement("institutionsContainer");
            document.getElementById("headerTitle").innerHTML = "Select your bank";
            renderInstitutions(instCont, institutions, url);
            resetSelection();
        });

        document.getElementById("retryButton").addEventListener("click", function (e) {
            e.preventDefault();
            hideLoadingScreen();
            showElement("backButton");
        });
        document.getElementById("doneButton").addEventListener("click", function (e) {
            e.preventDefault();

            sendEventNotification("completion");
        });

        setTimeout(function () {
            sendEventNotification("handshake", {"success": true});
        }, 1000);
    }

    function updateConnection(connectionId) {
        hideElement("header");
        checkUserID(userId, demo).then(function () {        
            return checkConnectionID(userId, connectionId, demo);
        }).then(function(resp) {
            return API.getInstitution(accessToken, resp.institutionId);
        }).then(function(resp) {
            hideElement("loading");
            showElement("header");
            renderInstitution(resp);
            hideElement("backButton");
        }).catch(function(err) {
            renderError((err.title ? err.title: "") + " " + (err.detail  ? err.detail : ""));
        });
    }

    function preloadImages(institutions) {
        var loadedImages = 0;
        return new Promise(function (resolve) {
            institutions.forEach(function (institution) {
                var img = document.createElement("img");

                if (institution.logo.links.square) {
                    img.setAttribute("src", institution.logo.links.square);
                } else {
                    img.setAttribute("src", institution.logo.links.self);
                }
                img.setAttribute("alt", institution.name);
                img.setAttribute("title", institution.name);
                img.onload = function () {
                    loadedImages++;
                    if (loadedImages === institutions.length) {
                        resolve(true);
                    }
                };
                img.onerror = function () {
                    loadedImages++;
                    if (loadedImages === institutions.length) {
                        resolve(true);
                    }
                };
            });
        });
    }

    function renderInstitutions(container, institutions, url, search) {
        container.innerHTML = "";

        var margins = 10,
            parentHeightPx = window.getComputedStyle(container.parentNode).getPropertyValue("height"),
            parentHeight = parseFloat(parentHeightPx.substr(0, parentHeightPx.length - 2)),
            w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            searchWidthPx = window.getComputedStyle(document.getElementById("institutionSearch")).getPropertyValue("width"),
            searchWidth = parseFloat(searchWidthPx.substr(0, searchWidthPx.length - 2)),
            liW = (searchWidth / 2) - (margins / 2);

        container.style.height = parentHeight - 110 - 65 - 20 + "px";

        window.addEventListener("resize", function () {
            var parentHeight = window.getComputedStyle(container.parentNode).getPropertyValue("height");
            container.style.height = parentHeight - 110 - 65 - 20 + "px";
        });

        if (search) {
            container.classList.add("container-search");
            renderSearchedInstitutions(container, institutions, url, searchWidth, liW, w, h);
        } else {
            container.classList.remove("container-search");
            renderAllInstitutions(container, institutions, url, liW, w, h);
        }
    }

    function renderInstitution(institution) {
        document.getElementById("institutionsContainer").innerHTML = "";
        showElement("authenticationContainer");
        showElement("backButton");
        hideElement("institutionsContainer");
        hideElement("institutionSearchForm");

        setActiveButton("submitButton");

        document.getElementById("headerTitle").innerHTML = "Login";

        if (institution.loginIdCaption) {
            document.getElementById("usernameInput").setAttribute("placeholder", institution.loginIdCaption);
        }
        if (institution.passwordCaption) {
            document.getElementById("passwordInput").setAttribute("placeholder", institution.passwordCaption);
        }
        if (institution.securityCodeCaption) {
            showElement("securityInputContainer");
            document.getElementById("securityInput").setAttribute("placeholder", institution.securityCodeCaption);
        } else {
            hideElement("securityInputContainer");
            document.getElementById("securityInput").value = "";
        }
        if (institution.secondaryLoginIdCaption) {
            showElement("secondaryLoginIdContainer");
            document.getElementById("secondaryLoginId").setAttribute("placeholder", institution.secondaryLoginIdCaption);
        } else {
            hideElement("secondaryLoginIdContainer");
            document.getElementById("secondaryLoginId").value = "";
        }

        var logo = document.getElementById("bankLogo");

        if (institution.logo.links.full) {
            logo.src = institution.logo.links.full;
        } else {
            logo.src = institution.logo.links.self;
        }

        logo.onload = function () {
            this.removeAttribute("style");
            if (this.width === this.height) {
                return this.style.width = "30%";
            } else if (this.width > this.height) {
                return this.style.width = "70%";
            }

            this.style.height = "30%";
        };

        if (!institution.colors) {
            institution.colors = {
                primary: "#f5f5f5"
            };
        }

       
        var formHandler = function (e) {
            e.preventDefault();
            hideElement("backButton");

            var username = document.getElementById("usernameInput").value.trim(),
                password = document.getElementById("passwordInput").value.trim(),
                security = document.getElementById("securityInput").value.trim(),
                secondaryLoginId = document.getElementById("secondaryLoginId").value.trim();

            if (!username) {
                //document.getElementById("errorContainer").innerHTML = "No username provided";
                return;
            }

            if (!password) {
                //document.getElementById("errorContainer").innerHTML = "No password provided";
                return;
            }

            hideLoadingScreen();

            if (demo) {
                sendEventNotification("job", {
                    success: true,
                    data: {
                        id: "fake-job-id"
                    }
                });

                setTimeout(function () {
                    credentialsDemoCheck(username, password);
                }, 2100);
            } else {
                createOrUpdate(institution, username, password, security, secondaryLoginId).then(function (jobData) {
                    sendEventNotification("job", {
                        success: true,
                        data: {
                            id: jobData.id
                        }
                    });

                    setTimeout(checkJobStatus.bind(undefined, accessToken, jobData), 100);
                }).catch(function (err) {
                    jobNotAcceptable(err);
                });
            }

            showLoadingScreen();
        };

        document.getElementById("credentialsForm").addEventListener("submit", formHandler);
        document.getElementById("submitButton").addEventListener("click", formHandler);

        var removeListeners = function () {
            document.getElementById("credentialsForm").removeEventListener("submit", formHandler);
            document.getElementById("submitButton").removeEventListener("click", formHandler);
            document.getElementById("backButton").removeEventListener("click", removeListeners);
        };

        document.getElementById("backButton").addEventListener("click", removeListeners);

        window.institution = institution;
    }

    function createOrUpdate(institution, username, password, security, secondaryLoginId) {
        if (connectionId) {
            return API.updateUserConnection(
                accessToken, userId, connectionId, institution, username, password, security, secondaryLoginId
            );
        }
        return API.createUserConnection(
            accessToken,
            userId,
            institution,
            username,
            password,
            security,
            secondaryLoginId
        );
    }

    function renderEmptySearch(text) {
        var instConst = document.getElementById("institutionsContainer");

        instConst.innerHTML = "<div class=\"search-placeholder\">" +
            "<img src=\"images/institution.svg\"/>" +
            "<span>" + text + "</span>" +
            "</div>";
    }

    function sendEventNotification(event, payload) {
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
    }

    function checkAccessToken(token, demo) {
        if (demo === true) {
            return null;
        }

        if (!token) {
            return {title: "Token is not valid"};
        }

        var sections = token.split(".").filter(Boolean);
        if (sections.length < 3) {
            return {title: "Token is not valid"};
        }

        try {
            var claims = JSON.parse(atob(sections[1]));
            if (!claims.scope || claims.scope.toUpperCase() !== "CLIENT_ACCESS") {
                return {title: "Scope is not valid"};
            }
        } catch (err) {
            return {title: err.message};
        }

        return null;

    }

    function checkUserID(userId, demo) {
        if (demo === true) {
            return Promise.resolve(true);
        }
        return new Promise(function (res, rej) {
            if (!userId) {
                return rej({title:"User ID is not valid"});
            }

            API.getUser(accessToken, userId).then(function () {
                res(true);
            }).catch(function (e) {
                rej(e);
            });
        });
    }

    function checkConnectionID(userId, connectionId, demo) {
        if (demo === true) {
            return Promise.resolve(true);
        }
        return new Promise(function (res, rej) {
            if (!userId) {
                return rej("User ID is not valid");
            }
            if (!connectionId) {
                return rej("Connection ID is not valid");
            }

            API.getConnection(accessToken, userId, connectionId).then(function (resp) {
                    res({institutionId: resp.institution.id, connectionId: resp.id});
            }).catch(function (e) {
                rej(e);
            });
        });
    }

    function resolveSearchedInstName(institution) {
        var result = "";
        function getCountry(country) {
            var countries = [
                {
                    longName: "Australia",
                    shortName: "AU"
                },
                {
                    longName: "New Zealand",
                    shortName: "NZ"
                }
            ];
            for(var i=0; i<countries.length; i++) if (countries[i].longName === country) return countries[i];
        }
        var serviceTypes = ["Personal Banking", "Business Banking"];
        var country = getCountry(institution.country);
        result = institution.name.length > 18 ? (institution.shortName > 18 ?  institution.name.substr(0, 16).trim() + "..." : institution.shortName ) : institution.name;
        // Add suffix if country is not Australia
        if (country.longName !== "Australia" && institution.shortName.indexOf("("+country.shortName+")") === -1) result += (" (" + country.shortName + ")");
        // Add suffix if service type is not personal
        if (institution.serviceType !== serviceTypes[0]) result += (" (" + institution.serviceType + ")");
        return result;
    }
    

    function renderAllInstitutions(container, institutions, url, liW, w, h) {
        var newUl = true, ul;

        institutions.forEach(function (institution) {
            var instUrl = url.replace("{inst_id}", institution.id),
                a = document.createElement("a"),
                img = document.createElement("img"),
                li = document.createElement("li"),
                searchHeight = liW / (w / h > 0.8 ? 1.4 : 2.5);

            resetSelection();

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
                linkClickHandler.bind(this, institution, e)();
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
                imageLoaded.bind(this, false, searchHeight)();
            };
            img.onerror = function () {
                //this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
            };
        });
    }

    function renderSearchedInstitutions(container, institutions, url, searchWidth, liW, w, h) {
        institutions.forEach(function (institution) {
            var instUrl = url.replace("{inst_id}", institution.id),
                div = document.createElement("div"),
                a = document.createElement("a"),
                img = document.createElement("img"),
                li = document.createElement("li"),
                searchHeight = liW / (w / h > 0.8 ? 1.4 : 2.5);

            resetSelection();

            li.appendChild(a);

            div.appendChild(img);
            div.style.width = "25%";

            a.appendChild(div);
            a.setAttribute("href", instUrl);

            a.onclick = function (e) {
                linkClickHandler.bind(this, institution, e)();
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
                imageLoaded.bind(this, true, searchHeight)();
            };
            img.onerror = function () {
                //this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
            };

            var h3 = document.createElement("h3");
            h3.className = "bank-link-search-header";
            h3.innerHTML = resolveSearchedInstName(institution);

            a.title = institution.name;
            a.className = "bank-link-nav-search";
            a.appendChild(h3);

            li.className = "bank-link-search";
            li.style.width = searchWidth;
            li.style.height = searchHeight + "px";

            img.style.width = (liW - (liW / 16) * 2) / 2 + "px";

            if (naiveFlexBoxSupport(document)) {
                a.style.display = "flex";
                a.style.alignItems = "center";
            } else {
                a.style.display = "inline-block";
                a.style.verticalAlign = "middle";
            }
        });
    }

    function renderError(message, title) {
        if (!title) {
            title = "Error";
        }
        showElement("errorContainer");
        document.getElementById("headerTitle").innerHTML = title;
        errorContainer.innerHTML = message;
        document.getElementById("loading").classList.add("result-error");
        document.getElementById("initialSpinner").style.opacity = "0";
        showElement("loadingCross");
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

    function linkClickHandler(institution, e) {
        e.preventDefault();
        resetSelection();

        setActiveButton("proceedButton");

        if (this.classList.contains("active")) {
            this.classList.remove("active");
            resetSelection();
        } else {
            this.classList.add("active");
        }
        proceedButton.onclick = function () {
            if (searching) {
                searching = false;
            }
            hideElement("hideSearchButton");
            renderInstitution(institution);
        }.bind(this);
    }

    function resetSelection() {
        var links = document.getElementById("institutionsContainer").getElementsByTagName("a");

        [].forEach.call(links, function (link) {
            link.classList.remove("active");
        });
    }

    function showLoadingScreen() {
        hideAllButtons();
        showElement("statusContainer");
        hideElement("credentialsForm");
        hideElement("backButton");
        document.getElementById("headerTitle").innerHTML = "Connecting...";
        document.getElementById("statusMessage").innerHTML = "Retrieving Data...";
        document.getElementById("statusMessage").className = "";
        document.getElementById("statusMessage").classList.add("result-text-default");
    }

    function hideLoadingScreen() {
        document.getElementById("headerTitle").innerHTML = "Enter your credentials";
        document.getElementById("connectionSpinner").style.opacity = "1";
        document.getElementById("connectionLoader").classList.remove("result-error");
        hideElement("statusContainer");
        hideElement("connectionCross");
        hideElement("connectionCheckmark");
        setActiveButton("submitButton");
        showElement("backButton");
        showElement("credentialsForm");
    }

    function institutionSearch(url, term) {
        if (!institutions || term.length < 2) {
            return;
        }

        var matched = [],
            instCont = document.getElementById("institutionsContainer");

        for (var x = 0; x < institutions.length; x++) {
            var institution = institutions[x];

            if (institution.shortName.toLowerCase().indexOf(term.toLowerCase()) > -1) {
                matched.push(institution);
                continue;
            }

            if (institution.name.toLowerCase().indexOf(term.toLowerCase()) > -1) {
                matched.push(institution);
            }
        }

        if (matched.length === 0) {
            return renderEmptySearch("Sorry no results found");
        }

        renderInstitutions(instCont, matched, url, true);
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
                            return connectionResultFailure(steps[step]);
                        case "success":
                            return connectionResultSuccess(steps[step]);
                        case "pending":
                        case "in-progress":
                            setTimeout(checkJobStatus.bind(undefined, accessToken, jobData), 1000);
                    }

                }
            }
        }).catch(function (err) {
            renderError(err.detail);
        });
    }

    function credentialsDemoCheck(username, password) {
        if (username === "username_valid" && password === "password_valid") {
            return connectionResultSuccess(null, true);
        } else {
            return connectionResultFailure(null, true);
        }
    }

    function connectionResultSuccess(step, demo) {
        hideElement("backButton");

        setActiveButton("doneButton");

        showElement("connectionCheckmark");
        document.getElementById("connectionSpinner").style.opacity = "0";
        document.getElementById("headerTitle").innerHTML = "Success";


        setTimeout(function () {
            document.getElementById("statusMessage").className = "";
            document.getElementById("statusMessage").classList.add("result-text-success");
            document.getElementById("statusMessage").innerHTML = "Your data has been successfully submitted.";
        }, 1100);

        if (demo) {
            return sendEventNotification("connection", {
                success: true,
                data: {
                    id: "fake-connection-id"
                }
            });
        }

        var url = step.result.url,
            connectionId = url.substr(url.lastIndexOf("/") + 1);

        return sendEventNotification("connection", {
            success: true,
            data: {
                id: connectionId
            }
        });
    }

    function jobNotAcceptable(err) {
        hideElement("backButton");

        setActiveButton("retryButton");

        showElement("connectionCross");
        document.getElementById("connectionSpinner").style.opacity = "0";
        document.getElementById("connectionLoader").classList.add("result-error");
        document.getElementById("headerTitle").innerHTML = "Unsuccessful";
        document.getElementById("headerTitle").classList.add("result-text-error");

        setTimeout(function () {
            document.getElementById("statusMessage").className = "";
            document.getElementById("statusMessage").classList.add("result-text-error");
            document.getElementById("statusMessage").innerHTML = (err.title ? err.title: "") + " " + (err.detail  ? err.detail : "");
        }, 1100);

        
        sendEventNotification("job", {
            success: false,
            data: err
        });
    }

    function connectionResultFailure(step, demo) {
        hideElement("backButton");

        setActiveButton("retryButton");

        showElement("connectionCross");
        document.getElementById("connectionSpinner").style.opacity = "0";
        document.getElementById("connectionLoader").classList.add("result-error");
        document.getElementById("headerTitle").innerHTML = "Unsuccessful";
        document.getElementById("headerTitle").classList.add("result-text-error");

        setTimeout(function () {
            document.getElementById("statusMessage").className = "";
            document.getElementById("statusMessage").classList.add("result-text-error");
            document.getElementById("statusMessage").innerHTML = "The credentials you provided were incorrect.";
        }, 1100);

        if (demo) {
            return sendEventNotification("connection", {
                success: true,
                data: {
                    code: "invalid-credentials",
                    title: "Cannot login to target institution, check credentials.",
                    detail: "Cannot login to target institution using supplied credentials. Please check credentials and try again."
                }
            });
        }

        return sendEventNotification("connection", {
            success: false,
            data: step.result
        });
    }
})(this);
