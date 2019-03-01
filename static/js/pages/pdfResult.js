/*global hideElement updateTitle updateStatusMessage setActiveButton2 sendEventNotification sendEventNotification */

window.pages["pdfResult"] = function (container, style, institution, steps) {
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
            pdfConnectionCreationLoading(connectionLoader);
            break;
        case "success": 
            pdfConnectionResultSuccess(connectionLoader, steps);
            break;
        case "failure":
            pdfConnectionResultFailure(connectionLoader, steps);
            break;
    }
};

function pdfConnectionCreationLoading(iconContainer) {
    iconContainer.innerHTML = "<div id=\"connectionSpinner\" class=\"spinner\"></div>";
    updateTitle("Connecting...");
    updateStatusMessage("Parsing statements");
}


function pdfConnectionResultSuccess(iconContainer, steps) {
    iconContainer.innerHTML = "<svg id=\"connectionCheckmark\" class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\""+
         "viewBox=\"5 0 40 36\">"+
        "<path class=\"checkmark__check\" fill=\"none\" d=\"M14.1 27.2l7.1 7.2 16.7-16.8\"/>"+
    "</svg>";

    setActiveButton2("Done", function () {
        sendEventNotification("completion");
    });

    updateTitle("Success");

    setTimeout(function () {
       updateStatusMessage("Statement parsing has been successful.", "success");
    }, 1100);

    if (window.globalState.demo) {
        return sendEventNotification("connection", {
            success: true,
            data: {
                id: "fake-connection-id"
            }
        });
    }

    
    steps && steps.forEach(function(step) {
        var url = step.result.url,
        connectionId = url.substr(url.lastIndexOf("/") + 1);
        sendEventNotification("connection", {
            success: true,
            data: {
                id: connectionId
            }
        });
    });
}


function pdfConnectionResultFailure(iconContainer, steps, error) {
    iconContainer.innerHTML = "<svg id=\"connectionCross\" class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\""+
         "viewBox=\"5 0 40 52\">"+
        "<path class=\"checkmark__cross\" d=\"M 15,20 L 35,40 M 35,20 L 15,40\"/>"+
    "</svg>";

    setActiveButton2("Finish", function () {
        sendEventNotification("completion");
    }, true);

    iconContainer.classList.add("result-error");
    updateTitle("Unsuccessful");

    setTimeout(function () {

        if (error !== undefined) {
            updateStatusMessage(error, "failure");
        } else {
            updateStatusMessage("Statement parsing failed.", "failure");
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

    steps && steps.forEach(function(step){
        sendEventNotification("connection", {
            success: false,
            data: step.result
        });
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
