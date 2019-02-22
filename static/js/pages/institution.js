window.pages["institution"] = {
    setup: function(institution) {
        window.pages["institution"].formHandler = window.pages["institution"].formHandler.bind(window.pages["institution"], institution);
    },
    render: function (container, institution) {
        showElement("backButton");
        hideElement("institutionSearchForm");
        updateTitle("Login");

        document.getElementById("backButton").onclick = function (e) {
            e.preventDefault();
            transitionToPage("institutionSelection", "online");
            resetSelection();
        };

        var form = document.createElement("form"), 
            logoContainer = document.createElement("div"),
            logo = document.createElement("img");

        form.id = "credentialsForm";
        form.className = "credentials-form";

        logoContainer.className = "bank-logo-container";

        logo.id = "bankLogo";

        logoContainer.appendChild(logo);
        form.appendChild(logoContainer);

        container.appendChild(form);

        if (institution.loginIdCaption) {
            form.appendChild(generateInput("usernameInput", "Username", "text", institution.loginIdCaption));
        }
        if (institution.passwordCaption) {
            form.appendChild(generateInput("passwordInput", "Password", "password", institution.passwordCaption));
        }
        if (institution.securityCodeCaption) {
            form.appendChild(generateInput("securityInput", "Security", "text", institution.securityCodeCaption));
        }
        if (institution.secondaryLoginIdCaption) {
            form.appendChild(generateInput("secondaryLoginId", "Security", "text", institution.secondaryLoginIdCaption));
        }

        if (institution.logo.links.full) {
            logo.src = institution.logo.links.full;
        } else {
            logo.src = institution.logo.links.self;
        }

        logo.onload = function () {
            if (this.width === this.height) {
                return this.style.width = "30%";
            } else if (this.width > this.height) {
                return this.style.width = "70%";
            }

            this.style.height = "30%";
        };

        form.addEventListener("keypress", function (e) { // Accept enter for submit
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code === 13) {
                window.pages["institution"].formHandler(e);
            }
        });

        form.addEventListener("submit", window.pages["institution"].formHandler);

        setActiveButton2("Submit", window.pages["institution"].formHandler);
    },
    formHandler: function (institution, e) {
        e.preventDefault();

        var username = document.getElementById("usernameInput") ? document.getElementById("usernameInput").value.trim() : undefined,
            password = document.getElementById("passwordInput") ? document.getElementById("passwordInput").value.trim() : undefined,
            security = document.getElementById("securityInput") ? document.getElementById("securityInput").value.trim() : undefined,
            secondaryLoginId = document.getElementById("secondaryLoginId") ?  document.getElementById("secondaryLoginId").value.trim() : undefined;

        if (!username || !password) {
            return;
        }

        hideElement("backButton");

        if (window.globalState.demo) {
            sendEventNotification("job", {
                success: true,
                data: {
                    id: "fake-job-id"
                }
            });

            setTimeout(function () {
                credentialsDemoCheck(username, password, institution);
            }, 2100);
        } else {
            createOrUpdate(window.globalState.userId, window.globalState.connectionId, institution, username, password, security, secondaryLoginId).then(function (jobData) {
                sendEventNotification("job", {
                    success: true,
                    data: {
                        id: jobData.id
                    }
                });

                setTimeout(checkJobStatus.bind(undefined, window.globalState.accessToken, institution, jobData), 100);
            }).catch(function (err) {
                sendEventNotification("job", {
                    success: false,
                    data: err
                });

                transitionToPage("result", "failure", institution, {
                    result: err
                }, err);
            });
        }

        transitionToPage("result", "loading", institution);
    }
};

function generateInput(id, title, type, placeholder) {
    var container = document.createElement("div"),
        icon = document.createElement("div"),
        input = document.createElement("input");

    container.className = "input-container-right";

    icon.className = "ico-lock";

    input.id = id;
    input.title = title;
    input.placeholder = placeholder;
    input.type = type;

    container.appendChild(icon);
    container.appendChild(input);
    return container;
}

function createOrUpdate(userId, connectionId, institution, username, password, security, secondaryLoginId) {
    if (window.globalState.connectionId) {
        return window.API.updateUserConnection(
            window.globalState.accessToken, userId, connectionId, institution, username, password, security, secondaryLoginId
        );
    }
    return window.API.createUserConnection(
        window.globalState.accessToken,
        userId,
        institution,
        username,
        password,
        security,
        secondaryLoginId
    );
}

function checkJobStatus(accessToken, institution, jobData) {
    window.API.checkJobStatus(window.globalState.accessToken, jobData.id).then(function (resp) {
        var steps = resp.steps;

        for (var step in steps) {
            if (!steps.hasOwnProperty(step)) {
                continue;
            }
            if (steps[step].title === "verify-credentials") {
                switch (steps[step].status) {
                    case "failed":
                        return transitionToPage("result", "failure", institution, steps[step]);
                    case "success":
                        return transitionToPage("result", "success", institution, steps[step]);
                    case "pending":
                    case "in-progress":
                        setTimeout(checkJobStatus.bind(undefined, window.globalState.accessToken, institution, jobData), 1000);
                }

            }
        }
    }).catch(function (err) {
        transitionToPage("loading", err.message);
    });
}

function credentialsDemoCheck(username, password, institution) {
    if (username === "username_valid" && password === "password_valid") {
        return transitionToPage("result", "success", institution, null);
    } else {
        return transitionToPage("result", "failure", institution, null);
    }
}
