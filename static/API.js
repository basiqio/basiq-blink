/*eslint no-console: "off"*/

window.API = {
    loadInstitutions: function (token, url) {
        window.request("https://au-api.basiq.io/institutions", "GET", {}, {
            "Authorization": "Bearer " + token
        }).then(function (resp) {
            if (resp.statusCode > 299) {
                throw resp;
            }

            return resp.body;
        }).then(function (resp) {
            document.getElementById("loading").style.display = "none";
            document.getElementById("content").style.display = "block";

            var instCont = document.getElementById("institutionsContainer");
            console.log("Institutions resp", resp);
            for (var institution in resp.data) {
                url = url.replace("{inst_id}", resp.data[institution].id);
                var li = document.createElement("li"), a = document.createElement("a");
                a.innerHTML = resp.data[institution].name;
                a.setAttribute("href", url);
                li.appendChild(a);
                instCont.appendChild(li);
            }
        }).catch(function (err) {
            window.errorContainer.innerHTML = err.body && err.body.errorMessage
                ? "Error: " + err.body.errorMessage
                : "Unknown error";

            console.error(JSON.stringify(err));
        });
    },
    loadInstitution: function(id, token) {
        if (!id) {
            return console.log("No id provided");
        }

        window.request("https://au-api.basiq.io/institutions/" + id, "GET", {}, {
            "Authorization": "Bearer " + token
        }).then(function (resp) {
            if (resp.statusCode > 299) {
                throw resp;
            }

            return resp.body;
        }).then(function (resp) {
            document.getElementById("loading").style.display = "none";
            document.getElementById("content").style.display = "block";
            if (resp.loginIdCaption) {
                document.getElementById("usernameInputLabel").innerHTML = resp.loginIdCaption + ":";
            }
            if (resp.passwordCaption) {
                document.getElementById("passwordInputLabel").innerHTML = resp.passwordCaption + ":";
            }

            document.getElementById("title").innerHTML = "Login to " + resp.name;
            document.getElementById("serviceName").innerHTML = resp.serviceName;
        }).catch(function (err) {
            document.getElementById("loading").style.display = "none";

            window.errorContainer.innerHTML = err.body && err.body.data && err.body.data[0]
                ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail
                : "Unknown error";

            console.error(err);
        });
    },
    createUserConnection: function (token, userId, institutionId, loginId, password) {
        if (!loginId || !password) {
            throw new Error("No user id or password provided: " + JSON.stringify(arguments));
        }

        loginId = loginId.trim();
        password = password.trim();

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
            var connectionData = {};
            connectionData.id = resp.id;
            window.location.replace("basiq://connection/" + JSON.stringify(connectionData, null, 0));
        }).catch(function (err) {
            document.getElementById("loading").style.display = "none";

            window.errorContainer.innerHTML = err.body && err.body.errorMessage
                ? "Error: " + err.body.errorMessage
                : "Unknown error";
            console.error(err);
        });
    }
};