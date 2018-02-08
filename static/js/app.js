/*global Promise*/
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
        xhttp.addEventListener("error", function () {
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
            searchHeight = liW / (w/h > 0.8 ? 1.1 : 0.8);

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

window.parseQueryVariables = function() {
    var queryString = window.location.search.substring(1),
        query = {},
        pairs = queryString.split("&");

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split("=");
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
    }
    return query;
};

function naiveFlexBoxSupport (d){
    var f = "flex", e = d.createElement("b");
    e.style.display = f;
    return e.style.display === f;
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