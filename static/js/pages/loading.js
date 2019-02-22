window.pages["loading"] = function (_, error, title) {
    var loadingContainer = document.createElement("div");

    loadingContainer.className = "loader-container initial-loader";

    if (error) {
        if (!title) {
            title = "Error";
        }
        var errorContainer = document.createElement("div");
        errorContainer.id = "errorContainer";
        errorContainer.textContent = error;
        updateTitle(title);
    
        loadingContainer.classList.add("result-error");
        loadingContainer.innerHTML = "<svg id=\"loadingCross\" class=\"checkmark\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"5 0 40 52\">" +
            "<path class=\"checkmark__cross\" d=\"M 15,20 L 35,40 M 35,20 L 15,40\"/>" +
        "</svg>";

        return [loadingContainer, errorContainer];
    } else {
        loadingContainer.innerHTML = "<div id=\"initialSpinner\" class=\"spinner\"></div>";
    }

    return loadingContainer;
};