var API = {
    loadInstitutions: function (token) {
        window.request("https://au-api.basiq.io/institutions", "GET", {}, {
            "Authorization": "Bearer " + token
        }).then(resp => {
            if (resp.statusCode > 299) {
                throw resp;
            }

            return resp.body;
        }).then(resp => {
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
        }).catch(err => {
            errorContainer.innerHTML = err.body && err.body.errorMessage
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
        }).then(resp => {
            if (resp.statusCode > 299) {
                throw resp;
            }

            return resp.body;
        }).then(resp => {
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
        }).catch(err => {
            document.getElementById("loading").style.display = "none";

            errorContainer.innerHTML = err.body && err.body.data && err.body.data[0]
                ? "Error: " + err.body.data[0].title + ". " + err.body.data[0].detail
                : "Unknown error";

            console.error(err);
        });
    },
    createUser: function (userId, token, loginId, password) {
        if (!loginId || !password) {
            throw new Error("No user id or password provided: " + JSON.stringify(arguments));
        }

        window.request("https://au-api.basiq.io/users/" + userId + "/connections", "POST", {
            loginId: loginId,
            password: password,
            institution: {
                id: institutionId
            }
        }, {
            "Authorization": "Bearer " + token
        }).then(resp => {
            if (resp.statusCode > 299) {
                throw resp;
            }

            return resp.body;
        }).then(resp => {
            //window.location = nextURI.replace("{token}", resp.accessToken);
            if (window.Android !== undefined) {
                Android.setConnectionId && Android.setConnectionId(resp.id);
            }
        }).catch(err => {
            document.getElementById("loading").style.display = "none";

            errorContainer.innerHTML = err.body && err.body.errorMessage
                ? "Error: " + err.body.errorMessage
                : "Unknown error";
            console.error(err);
        });
    }
};