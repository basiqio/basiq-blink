window.pages["pdfOverview"] = function (container, files) {
    hideElement("backButton");
    updateTitle("File overview");

    setActiveButton2("Finish", function() {
        var url = "http://basiq-web-portal.s3-website-ap-southeast-2.amazonaws.com/?token=" + window.globalState.accessToken +  "&userId=" + window.globalState.userId + "&jobs=";

        window.jobs.forEach(function (link) {
            url += link + ",";
        });

        url.substr(0, url.length-1);

        window.parent.location.href = url;
    });
    setActiveButton2("Add more", function() {
        transitionToPage("institutionSelection", "pdf");
    });

    var overviewContainer = document.createElement("div");

    overviewContainer.className = "overviewContainer";

    var groups = files.reduce(function (acc, v) {
        if (!acc[v.institution.id]) {
            acc[v.institution.id] = [];
        }

        acc[v.institution.id].push(v);

        return acc;
    }, {});

    for (var institutionId in groups) {
        var institution = groups[institutionId][0].institution,
            bankLogo = document.createElement("img");

        bankLogo.style.maxWidth = "200px";
        bankLogo.style.marginTop = "50px";
        bankLogo.src = institution.logo.links.full || institution.logo.links.self;

        overviewContainer.appendChild(bankLogo);

        groups[institutionId].forEach(function (file) {
            var filec = document.createElement("div"),
                dc = document.createElement("div"),
                icon = document.createElement("div"),
                filename = document.createElement("div");

            filec.className = "dz-preview dz-file-preview";
            dc.className = "dz-details";
            icon.className = "dz-pdf-icon";
            filename.className = "dz-filename";

            dc.appendChild(icon);
            dc.appendChild(filename);
            filec.appendChild(dc);
            filename.textContent = file.name;

            overviewContainer.appendChild(filec);
        });
    }

    return overviewContainer;
};
