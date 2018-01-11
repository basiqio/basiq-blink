function request(url, method, data) {
    return new SimplePromise(function (resolve, reject) {
        var xhttp = new XMLHttpRequest();

        if (method.toUpperCase() === "POST") {
            xhttp.open("POST", url, true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(data));
        } else {
            xhttp.open("GET", url, true);
        }

        xhttp.addEventListener("load", function (res) {
            resolve(parseResponse(xhttp));
        });
        xhttp.addEventListener("error", function (err) {
            reject(parseResponse(xhttp))
        });
    });
}

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

function SimplePromise(executor) {
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
                return rejector(err)
            }

            throw err;
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
                return rejector(err)
            }

            throw err;
        }, 0);
    }

    return self;
}