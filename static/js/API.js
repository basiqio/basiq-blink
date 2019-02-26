/*global Promise readConfig*/
/*eslint no-console: "off"*/

var host = readConfig("basiq-api-host");

window.request = function (url, method, data, headers, multipart) {
    return new Promise(function (resolve, reject) {
        var xhttp = new XMLHttpRequest();

        if (method.toUpperCase() === "POST") {
            xhttp.open("POST", url, true);
            if (!multipart) {
                xhttp.setRequestHeader("Content-type", "application/json");
            }
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
            if (!multipart) {
                xhttp.send(JSON.stringify(data));
            } else {
                xhttp.send(data);
            }
        } else {
            xhttp.send();
        }

        xhttp.addEventListener("load", function () {
            if (xhttp.getResponseHeader("Content-Type") === "application/json") {
                resolve(parseResponse(xhttp));
            } else {
                resolve(xhttp.response);
            }
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

            window.request(host + "/public/institutions?filter=institution.authorization.eq('user')", "GET", {}, {}).then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                var groups = resp.data.reduce(function (acc, v) {
                    if (!acc[v.serviceType]) {
                        acc[v.serviceType] = [];
                    }
                    
                    acc[v.serviceType].push(v);
                    return acc;
                }, {});
                
                var institutions = [];
                
                for (var st in groups) {
                    institutions = institutions.concat(groups[st].sort(function(a,b) {return a.tier > b.tier;}));
                }

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

        var payload = {
            loginId: loginId,
            password: password,
            institution: {
                id: institution.id
            }
        };

        if (securityCode && institution.securityCodeCaption) {
            payload["securityCode"] = securityCode;
        }
        if (secondaryLoginId && institution.secondaryLoginIdCaption) {
            payload["secondaryLoginId"] = secondaryLoginId;
        }

        return new Promise(function (resolve, reject) {
            window.request(host + "/users/" + userId + "/connections", "POST", payload, {
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
    updateUserConnection: function (token, userId, connectionId, institution, loginId, password, securityCode, secondaryLoginId) {
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
            window.request(host + "/users/" + userId + "/connections/" + connectionId, "POST", payload, {
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
            window.request(host + "/jobs/" + jobId, "GET", {}, {
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
            window.request(host + "/users/" + userId, "GET", {}, {
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
    getConnection: function (token, userId, connectionId) {
        if (!userId) {
            throw new Error("User id not provided: " + JSON.stringify(arguments));
        }
        if (!connectionId) {
            throw new Error("Connection id not provided: " + JSON.stringify(arguments));
        }

        return new Promise(function (resolve, reject) {
            window.request(host + "/users/" + userId + "/connections/" + connectionId, "GET", {}, {
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
    getInstitution: function (token, institutionId) {
        return new Promise(function (resolve, reject) {
            if (window.localStorage && window.JSON) {
                var cachedInstitutions = window.localStorage.getItem("cachedInstitutions"),
                    cacheTime = window.localStorage.getItem("cacheTime");

                // Cache should expire after one hour
                if (cachedInstitutions
                    && (Date.now() - parseInt(cacheTime)) < 1000 * 60 * 60
                ) {
                    var institution = JSON.parse(cachedInstitutions).filter(function (i) {
                        return i.id === institutionId;
                    })[0];
                    resolve(institution);
                    return;
                }
            }

            window.request(host + "/public/institutions", "GET").then(function (resp) {
                if (resp.statusCode > 299) {
                    throw resp;
                }

                return resp.body;
            }).then(function (resp) {
                if (window.localStorage && window.JSON) {
                    window.localStorage.setItem("cachedInstitutions", JSON.stringify(resp.data));
                    window.localStorage.setItem("cacheTime", Date.now());
                }

                var institution = resp.data.filter(function (i) {
                    return i.id === institutionId;
                })[0];
                resolve(institution);
            }).catch(function (err) {
                reject(err.body && err.body.data
                    && err.body.data[0] ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail :
                    "Unknown error"
                );

                console.error(JSON.stringify(err));
            });
        });
    }
};
