/*global Promise readConfig*/
/*eslint no-console: "off"*/

var host = readConfig("basiq-api-host");

function sortByTierAndCountry(institutions){
    var groupedInstitutions = institutions.reduce(function (acc, obj) {
        var key = obj["country"];
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(obj);
        return acc;
      }, {});

    var institutionsSorted = [];

    for (var group in groupedInstitutions){
        institutionsSorted = institutionsSorted.concat(groupedInstitutions[group].sort(function(a,b) {
            var tier = a.tier - b.tier;
            if(tier == 0){
                var nameA = a.shortName.toLowerCase(), nameB = b.shortName.toLowerCase();
                if(nameA < nameB)
                    return -1;
                if(nameA > nameB)
                    return 1;

                return 0;
            }

            return a.tier - b.tier;
        }));
    }

    return institutionsSorted;
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
                    institutions = sortByTierAndCountry(institutions);
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
                    institutions = institutions.concat(groups[st]);
                }

                institutions = sortByTierAndCountry(institutions)

               if (window.localStorage && window.JSON) {
                    localStorage.setItem("cachedInstitutions", JSON.stringify(institutions));
                    localStorage.setItem("cacheTime", Date.now());
                }

                resolve(institutions);
            }).catch(function (err) {
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
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
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
                );
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
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
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
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
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
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
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
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
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
                reject(err.body && err.body.data && err.body.data[0] ? err.body.data[0] :
                    {detail: "Unknown error"}
                );

                console.error(JSON.stringify(err));
            });
        });
    }
};
