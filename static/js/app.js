/*global Promise*/
/*global API*/
/*global sendEventNotification*/
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

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        liW = w / 3 - w / 9;

    for (var institution in institutions) {
        if (!institutions.hasOwnProperty(institution)) {
            continue;
        }


        var instUrl = url.replace("{inst_id}", institutions[institution].id);
        var div = document.createElement("div"),
            a = document.createElement("a"),
            img = document.createElement("img"),
            searchHeight = liW / (w/h > 0.8 ? 1.2 : 1);

        a.appendChild(img);
        a.setAttribute("href", instUrl);

        a.onclick = (function (index) {
            return function (e) {
                e.preventDefault();
                var institution = institutions[index];
                window.localStorage.setItem("selectedInstitution", JSON.stringify(institution));
                window.localStorage.setItem("selectedInstitutionTime", Date.now());

                window.location.replace(this.href);
            };
        })(institution);

        div.appendChild(a);
        div.className = "bank-link";
        div.style.width = liW + "px";
        div.style.height = liW + "px";

        img.setAttribute("src", institutions[institution].logo.links.self);
        img.setAttribute("alt", institutions[institution].name);
        img.setAttribute("title", institutions[institution].name);

        img.onload = function () {
            if (!search) {
                this.style.marginTop = (liW / 2 - liW / 16) - this.height / 2;
            } else {
                var target = this.parentElement;

                target.style.lineHeight = (searchHeight) / 2 + "px";
            }
        };

        img.onerror = function () {
            this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
        };

        if (search) {
            div.style.width = "100%";
            div.style.height = searchHeight + "px";
            div.className = "bank-link-search";

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

window.renderInstitution = function (institution, userId, accessToken) {
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
        document.getElementById("securityInput").style.display = "block";
        document.getElementById("securityInput").setAttribute("placeholder", institution.securityCodeCaption);
    }

    document.getElementById("title").innerHTML += "Login to " + institution.name;
    document.getElementById("serviceName").innerHTML = institution.serviceName;

    if (!institution.colors) {
        institution.colors = {
            primary: "#f5f5f5"
        };
    }

    var complementaryColor = hexToComplimentary(institution.colors.primary, true);

    document.getElementById("backLink").setAttribute("href", "/?user_id=" + userId + "&access_token=" + accessToken);
    document.getElementById("backLink").style.color = complementaryColor;
    document.getElementById("submitBtn").style.color = complementaryColor;
    document.getElementById("cancelBtn").style.color = complementaryColor;
    document.body.style.color = complementaryColor;
    document.body.style.background = institution.colors.primary;
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

function hexToComplimentary(hex, bw){
    if (hex.indexOf("#") === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error("Invalid HEX color.");
    }
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);
    if (bw) {
        // http://stackoverflow.com/a/3943023/112731
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186
            ? "#000000"
            : "#FFFFFF";
    }

    var padZero = function(str, len) {
        len = len || 2;
        var zeros = new Array(len).join("0");
        return (zeros + str).slice(-len);
    };

    // invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);
    // pad each with zeros and return
    return "#" + padZero(r) + padZero(g) + padZero(b);
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

function supportsCSSAnimations() {
    var domPrefixes = "Webkit Moz O ms Khtml".split(" "),
        elem = document.createElement("div");

    if( elem.style.animationName !== undefined ) { return true; }    
    for( var i = 0; i < domPrefixes.length; i++ ) {
        if( elem.style[ domPrefixes[i] + "AnimationName" ] !== undefined ) {
            return true;
        }
    }

    return false;
}


var fast = 0, slow = 60;

function showLoadingScreen(x) {
    if (!x) {
        document.getElementById("statusTitle").innerHTML = "Connecting to your account. Please wait";
        document.getElementById("statusMessage").innerHTML = "";
        document.getElementById("closeStatusOverlay").style.display = "none";
        x = 0;
    }

    if (supportsCSSAnimations()) {
        document.getElementById("statusContainer").classList.remove("status-animate-inactive");
        document.getElementById("statusContainer").classList.add("status-animate-active");
        return;
    }

    document.getElementById("statusContainer").style.top = 150-x + "%";

    var tween = Math.max(x/150/3 * slow, fast);

    if (x < 150) {
        setTimeout(showLoadingScreen.bind(undefined, x+0.5), tween);
    }
}

function hideLoadingScreen(x) {
    if (supportsCSSAnimations()) {
        document.getElementById("statusContainer").classList.remove("status-animate-active");            
        document.getElementById("statusContainer").classList.add("status-animate-inactive");
        return;
    }

    if (!x) x = 0;

    document.getElementById("statusContainer").style.top = 0+x + "%";

    var tween = Math.max(x/150/3 * slow, fast);

    if (x < 150) {
        setTimeout(hideLoadingScreen.bind(undefined, x+0.5), tween);
    }
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
                    document.getElementById("statusTitle").innerHTML = "Invalid credentials";
                    document.getElementById("statusMessage").innerHTML = steps[step].result.detail;
                    document.getElementById("closeStatusOverlay").style.display = "block";

                    return sendEventNotification("connection", {
                        success: false,
                        data: steps[step].result
                    });
                case "success":
                    document.getElementById("statusTitle").innerHTML = "Success";
                    document.getElementById("statusMessage").innerHTML = "You are connected to your account.";
                    document.getElementById("closeStatusOverlay").style.display = "block";

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

/*function SimplePromise(executor) {
    var self = this;

    self.state = "pending";
    self.iterator = 0;

    self.resolverFunctions = [];
    self.rejectorFunction = null;

    var resolver = function (data) {
        self.state = "resolved";
        self.data = data;
        try {
            while (self.resolverFunctions[self.iterator]) {
                self.data = self.resolverFunctions[self.iterator](self.data);
                self.iterator++;
            }
        } catch (err) {
            if (self.rejectorFunction) {
                return rejector(err);
            }

            console.error(err);
        }
    };

    var rejector = function (data) {
        self.state = "rejected";
        self.data = data;
        self.rejectorFunction(self.data);
    };

    self.then = function (resolver) {
        self.resolverFunctions.push(resolver);

        return self;
    };
    self.catch = function (rejector) {
        self.rejectorFunction = rejector;

        return self;
    };

    try {
        executor(resolver, rejector);
    } catch (err) {
        setTimeout(function () {
            if (self.rejectorFunction) {
                return rejector(err);
            }

            throw err;
        }, 0);
    }

    return self;
}*/