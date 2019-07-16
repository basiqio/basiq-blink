/*global hideElement updateTitle updateStatusMessage setActiveButton2 sendEventNotification transitionToPage sendEventNotification */

window.pages["result"] = function (container, style, institution, step, message, job) {
    hideElement("backButton");

    var statusContainer = document.createElement("div");
    statusContainer.className = "status-container";

    var status = document.createElement("div"),
        icon = document.createElement("div"),
        connectionLoader = document.createElement("div");

    status.id = "statusMessage";

    connectionLoader.id = "connectionLoader";
    connectionLoader.className = "loader-container";

    icon.id = "statusIcon";
    icon.appendChild(connectionLoader);

    statusContainer.appendChild(icon);
    statusContainer.appendChild(status);

    container.appendChild(statusContainer);

    switch (style) {
        case "loading":
            connectionCreationLoading(connectionLoader);
            break;
        case "success":
            connectionResultSuccess(connectionLoader, institution, step, message);
            break;
        case "failure":
            connectionResultFailure(connectionLoader, institution, step, message, job);
            break;
    }
};

function connectionCreationLoading(iconContainer) {
    iconContainer.innerHTML = "<div id=\"connectionSpinner\" class=\"spinner\"></div>";
    updateTitle("Connecting...");
    updateStatusMessage("Retrieving Data...");
}


function connectionResultSuccess(iconContainer, institution, step) {
    iconContainer.innerHTML = "<svg id=\"connectionCheckmark\" class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\"" +
        "viewBox=\"5 0 40 36\">" +
        "<path class=\"checkmark__check\" fill=\"none\" d=\"M14.1 27.2l7.1 7.2 16.7-16.8\"/>" +
        "</svg>";

    setActiveButton2("Done", function () {
        sendEventNotification("completion", {
            success: true,
            data: {
                institutionName: institution.shortName,
                logo: institution.logo.links.square
            }
        });
    });

    updateTitle("Success");

    setTimeout(function () {
        updateStatusMessage("Your data has been successfully submitted.", "success");
    }, 1100);

    if (window.globalState.demo) {
        return sendEventNotification("connection", {
            success: true,
            data: {
                id: "fake-connection-id"
            }
        });
    }

    var url = step.result.url,
        connectionId = url.substr(url.lastIndexOf("/") + 1);

    return sendEventNotification("connection", {
        success: true,
        data: {
            id: connectionId,
            institutionName: institution.shortName,
            logo: institution.logo.links.square
        }
    });
}


function connectionResultFailure(iconContainer, institution, step, error, job) {
    iconContainer.innerHTML = "<svg id=\"connectionCross\" class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\"" +
        "viewBox=\"5 0 40 52\">" +
        "<path class=\"checkmark__cross\" d=\"M 15,20 L 35,40 M 35,20 L 15,40\"/>" +
        "</svg>";

    setActiveButton2("Try again", function () {
        transitionToPage("institution", institution);
    }, true);

    iconContainer.classList.add("result-error");
    updateTitle("Unsuccessful", true);

    setTimeout(function () {

        if (error !== undefined && error !== null) {
            if (error.title === "Resource already exists") {
                updateStatusMessage(`You have already connected to ${institution.shortName} with the supplied credentials`, "failure");
            }
            else {
                updateStatusMessage((error.title ? error.title : "") + " " + (error.detail ? error.detail : ""), "failure");
            }
        } else {
            updateStatusMessage("The credentials you provided were incorrect.", "failure");
            window.API.deleteUserConnection(
                window.globalState.accessToken, job
            );
        }
    }, 1100);

    if (window.globalState.demo) {
        return sendEventNotification("connection", {
            success: false,
            data: {
                code: "invalid-credentials",
                title: "Cannot login to target institution, check credentials.",
                detail: "Cannot login to target institution using supplied credentials. Please check credentials and try again."
            }
        });
    }

    return sendEventNotification("connection", {
        success: false,
        data: {
            step: step.result,
            institutionName: institution.shortName,
        }
    });
}

function updateStatusMessage(message, type) {
    switch (type) {
        case "success":
            document.getElementById("statusMessage").className = "result-text-success";
            break;
        case "failure":
            document.getElementById("statusMessage").className = "result-text-error";
            break;
        default:
            document.getElementById("statusMessage").className = "result-text-default";
            break;
    }

    document.getElementById("statusMessage").textContent = message;
}
