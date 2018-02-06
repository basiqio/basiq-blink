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

window.renderInstitutions = function (container, institutions, url) {
    container.innerHTML = "";

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        liW = w / 3 - w / 9;

    for (var institution in institutions) {
        if (!institutions.hasOwnProperty(institution)) {
            continue;
        }

        var instUrl = url.replace("{inst_id}", institutions[institution].id);
        var div = document.createElement("div"),
            a = document.createElement("a"),
            img = document.createElement("img");

        a.appendChild(img);
        a.setAttribute("href", instUrl);

        div.appendChild(a);
        div.className = "bank-link";
        div.style.width = liW + "px";
        div.style.height = liW + "px";

        img.setAttribute("src", institutions[institution].logo.links.self);
        img.setAttribute("alt", institutions[institution].name);
        img.setAttribute("title", institutions[institution].name);

        img.onload = function () {
            this.style.marginTop = (liW / 2 - liW / 16) - this.height / 2;
        };

        img.onerror = function () {
            this.setAttribute("src", "https://s3-ap-southeast-2.amazonaws.com/basiq-institutions/AU00000.png");
        };

        container.appendChild(div);
    }
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