/*global Promise*/
/*global sendEventNotification*/
/*eslint no-console: "off"*/

var colors = {
    "Basiq Test Bank": "#024767",
    "Hooli Bank": "#024767",
    "Bendigo Bank": "#990133",
    "ING Direct": "#ff6002",
    "Macquarie Bank": "#010101",
    "default": "#f5f5f5"
};

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

window.API = {
    loadInstitutions: function (token) {
        return new Promise(function (resolve) {
            if (window.localStorage && window.JSON) {
                var cachedToken = localStorage.getItem("cachedToken"),
                    cachedInstitutions = localStorage.getItem("cachedInstitutions"),
                    cacheTime = localStorage.getItem("cacheTime");

                // Cache should expire after one hour
                if (cachedToken === token
                    && cachedInstitutions
                    && (Date.now() - parseInt(cacheTime)) < 1000 * 60 * 60
                ) {
                    var institutions = JSON.parse(cachedInstitutions);
                    window.institutions = institutions;
                    resolve(institutions);
                    return;
                }
            }

            window.request("https://au-api.basiq.io/institutions", "GET", {}, {
                "Authorization": "Bearer " + token
            }).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                var institutions = resp.data.map(function (inst) {
                    return Object.assign({}, inst, {colors: {primary: colors[inst.shortName] || colors["default"]}});
                });
                window.institutions = institutions;

                if (window.localStorage && window.JSON) {
                    localStorage.setItem("cachedInstitutions", JSON.stringify(institutions));
                    localStorage.setItem("cacheTime", Date.now());
                    localStorage.setItem("cachedToken", token);
                }

                resolve(institutions);
            }).catch(function (err) {
                window.renderError(err.body && err.body.data && err.body.data[0]
                    ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail
                    : "Unknown error", "Error initializing");

                console.error(JSON.stringify(err));
            });
        });
    },
    loadInstitution: function(id, token) {
        if (!id) {
            return console.log("No id provided");
        }
        return new Promise(function (resolve) {
            if (window.localStorage) {
                var cachedToken = localStorage.getItem("cachedToken"),
                    selectedInstitution = window.localStorage.getItem("selectedInstitution") && JSON.parse(window.localStorage.getItem("selectedInstitution")),
                    selectedInstitutionTime = window.localStorage.getItem("selectedInstitutionTime");

                if (cachedToken === token && selectedInstitution && selectedInstitution.id === id && (Date.now() - parseInt(selectedInstitutionTime)) < 1000 * 60 * 5) {
                    return resolve(selectedInstitution);
                }
            }

            window.request("https://au-api.basiq.io/institutions/" + id, "GET", {}, {
                "Authorization": "Bearer " + token
            }).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                resp.colors = {primary: colors[resp.shortName] || colors["default"]};

                if (window.localStorage) {
                    window.localStorage.setItem("selectedInstitution", JSON.stringify(resp));
                    window.localStorage.setItem("selectedInstitutionTime", Date.now());
                }

                resolve(resp);
            }).catch(function (err) {
                window.renderError(err.body && err.body.data && err.body.data[0]
                    ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail
                    : "Unknown error");

                console.error(err);
            });
        });
    },
    createUserConnection: function (token, userId, institutionId, loginId, password, securityCode) {
        if (!loginId || !password) {
            throw new Error("No user id or password provided: " + JSON.stringify(arguments));
        }

        loginId = loginId.trim();
        password = password.trim();
        securityCode = securityCode.trim();

        var payload = {
            loginId: loginId,
            password: password,
            institution: {
                id: institutionId
            }
        };

        if (securityCode.length > 0) {
            payload["securityCode"] = securityCode;
        }

        return new Promise(function (resolve) {
            window.request("https://au-api.basiq.io/users/" + userId + "/connections", "POST", payload, {
                "Authorization": "Bearer " + token
            }).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                sendEventNotification("job", {
                    success: true,
                    data: {
                        id: resp.id
                    }
                });

                resolve(resp);
            }).catch(function (err) {
                window.hideLoadingScreen();

                sendEventNotification("job", {
                    success: false,
                    data: err
                });

                window.renderError(err.body && err.body.errorMessage
                    ? "Error: " + err.body.errorMessage
                    : "Unknown error");
                console.error(err);
            });
        });
    },
    checkJobStatus: function (token, jobId) {
        if (!jobId) {
            throw new Error("Job id not provided: " + JSON.stringify(arguments));
        }

        return new Promise(function (resolve) {
            window.request("https://au-api.basiq.io/jobs/" + jobId, "GET", {}, {
                "Authorization": "Bearer " + token
            }).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                resolve(resp);
            }).catch(function (err) {
                window.renderError(err.body && err.body.errorMessage
                    ? "Error: " + err.body.errorMessage
                    : "Unknown error");
                console.error(err);
            });
        });
    }
};