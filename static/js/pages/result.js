/*global hideElement updateTitle updateStatusMessage setActiveButton2 sendEventNotification transitionToPage sendEventNotification */

window.pages["result"] = function (container, style, institution, step, message) {
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
            connectionResultFailure(connectionLoader, institution, step, message);
            break;
    }
};

function connectionCreationLoading(iconContainer) {
    iconContainer.innerHTML = "<div id=\"connectionSpinner\" class=\"spinner\"></div>";
    updateTitle("Connecting...");
    updateStatusMessage("Retrieving Data...");
}


function connectionResultSuccess(iconContainer, institution, step) {
    iconContainer.innerHTML = isIE()
        ?
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"3 1 13 13\" width=\"56px\" height=\"56px\" version=\"1.1\">" +
        "<g id=\"ggroup1\" fill=\"none\" fill-rule=\"evenodd\" stroke=\"#4a90e2\" stroke-width=\"1\">" +
        "<g id=\"ggroup2\" fill=\"#ffffff\" fill-rule=\"nonzero\" transform=\"translate(-753 -562)\">" +
        "<g id=\"ggroup3\" transform=\"translate(753 562)\">" +
        "<g id=\"ggroup4\">" +
        "<polygon id=\"polypath\" points=\"8.32967,11.6703 5.51648,8.85714 4.1978,10.1758 8.32967,14.2857 14.967,7.64835 13.6484,6.32967\" />" +
        "</g>" +
        "</g>" +
        "</g>" +
        "</g>" +
        "</svg>"
        :
        "<svg id=\"connectionCheckmark\" class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"5 0 40 36\">" +
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


function connectionResultFailure(iconContainer, institution, step, error) {
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

        if (error !== undefined) {
            if (error.title === "Resource already exists") {
                updateStatusMessage("You have already connected to " + institution.shortName + " with the supplied credentials", "failure");
            }
            else {
                updateStatusMessage((error.title ? error.title : "") + " " + (error.detail ? error.detail : ""), "failure");
            }
        } else {
            updateStatusMessage("The credentials you provided were incorrect.", "failure");
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
