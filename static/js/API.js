/*global Promise*/
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
    loadInstitutions: function () {
        return new Promise(function (resolve, reject) {
            if (window.localStorage && window.JSON) {
                var cachedInstitutions = localStorage.getItem("cachedInstitutions"),
                    cacheTime = localStorage.getItem("cacheTime");

                // Cache should expire after one hour
                if (cachedInstitutions
                    && (Date.now() - parseInt(cacheTime)) < 1000 * 60 * 60
                ) {
                    var institutions = JSON.parse(cachedInstitutions);
                    resolve(institutions);
                    return;
                }
            }

            window.request("https://au-api.basiq.io/public/institutions", "GET", {}, {}).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                var institutions = resp.data.map(function (inst) {
                    return Object.assign({}, inst, {colors: {primary: colors[inst.shortName] || colors["default"]}});
                });

                if (window.localStorage && window.JSON) {
                    localStorage.setItem("cachedInstitutions", JSON.stringify(institutions));
                    localStorage.setItem("cacheTime", Date.now());
                }

                resolve(institutions);
            }).catch(function (err) {
                reject(err.body && err.body.data
                    && err.body.data[0] ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail :
                    "Unknown error"
                );

                console.error(JSON.stringify(err));
            });
        });
    },
    createUserConnection: function (token, userId, institution, loginId, password, securityCode, secondaryLoginId) {
        if (!loginId || !password) {
            throw new Error("No user id or password provided: " + JSON.stringify(arguments));
        }

        loginId = loginId.trim();
        password = password.trim();
        securityCode = securityCode.trim();
        secondaryLoginId = secondaryLoginId.trim();

        var payload = {
            loginId: loginId,
            password: password,
            institution: {
                id: institution.id
            }
        };

        if (securityCode.length > 0 && institution.securityCodeCaption) {
            payload["securityCode"] = securityCode;
        }
        if (secondaryLoginId.length > 0 && institution.secondaryLoginIdCaption) {
            payload["secondaryLoginId"] = secondaryLoginId;
        }

        return new Promise(function (resolve, reject) {
            window.request("https://au-api.basiq.io/users/" + userId + "/connections", "POST", payload, {
                "Authorization": "Bearer " + token
            }).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                resolve(resp);
            }).catch(function (err) {
                reject(err.body && err.body.data
                    && err.body.data[0] ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail :
                    "Unknown error"
                );

                console.error(err);
            });
        });
    },
    checkJobStatus: function (token, jobId) {
        if (!jobId) {
            throw new Error("Job id not provided: " + JSON.stringify(arguments));
        }

        return new Promise(function (resolve, reject) {
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
                reject(err.body && err.body.data
                    && err.body.data[0] ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail :
                    "Unknown error"
                );

                console.error(err);
            });
        });
    },
    getUser: function (token, userId) {
        if (!userId) {
            throw new Error("User id not provided: " + JSON.stringify(arguments));
        }

        return new Promise(function (resolve, reject) {
            window.request("https://au-api.basiq.io/users/" + userId, "GET", {}, {
                "Authorization": "Bearer " + token
            }).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                resolve(resp);
            }).catch(function (err) {
                reject(err.body && err.body.data
                    && err.body.data[0] ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail :
                    "Unknown error"
                );

                console.error(err);
            });
        });
    }
};