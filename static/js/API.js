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

window.API = {
    loadInstitutions: function (token) {
        return new Promise(function (resolve) {
            if (window.localStorage && window.JSON) {
                var cachedInstitutions = localStorage.getItem("cachedInstitutions"),
                    cacheTime = localStorage.getItem("cacheTime");

                // Cache should expire after one hour
                if (cachedInstitutions && (Date.now() - parseInt(cacheTime)) < 1000 * 60 * 60) {
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
                }

                resolve(institutions);
            }).catch(function (err) {
                window.errorContainer.innerHTML = err.body && err.body.errorMessage
                    ? "Error: " + err.body.errorMessage
                    : "Unknown error";

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
                var selectedInstitution = window.localStorage.getItem("selectedInstitution"),
                    selectedInstitutionTime = window.localStorage.getItem("selectedInstitutionTime");

                if (selectedInstitution && (Date.now() - parseInt(selectedInstitutionTime)) < 1000 * 60 * 5) {
                    return resolve(JSON.parse(selectedInstitution));
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
                document.getElementById("loading").style.display = "none";

                window.errorContainer.innerHTML = err.body && err.body.data && err.body.data[0]
                    ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail
                    : "Unknown error";

                console.error(err);
            });
        });
    },
    createUserConnection: function (token, userId, institutionId, loginId, password) {
        if (!loginId || !password) {
            throw new Error("No user id or password provided: " + JSON.stringify(arguments));
        }

        loginId = loginId.trim();
        password = password.trim();

        return new Promise(function (resolve) {
            window.request("https://au-api.basiq.io/users/" + userId + "/connections", "POST", {
                loginId: loginId,
                password: password,
                institution: {
                    id: institutionId
                }
            }, {
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
                document.getElementById("loading").style.display = "none";

                window.errorContainer.innerHTML = err.body && err.body.errorMessage
                    ? "Error: " + err.body.errorMessage
                    : "Unknown error";
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
                document.getElementById("loading").style.display = "none";

                window.errorContainer.innerHTML = err.body && err.body.errorMessage
                    ? "Error: " + err.body.errorMessage
                    : "Unknown error";
                console.error(err);
            });
        });
    }
};