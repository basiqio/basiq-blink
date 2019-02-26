/*global Dropzone*/

var host = "https://au-api.basiq.io";

window.pages["pdfUpload"] = function (container, institution) {
    showElement("backButton");
    updateTitle("Upload your bank statements");
    hideElement("institutionSearchForm");

    document.getElementById("backButton").onclick = function (e) {
        e.preventDefault();
        transitionToPage("institutionSelection", "pdf");
        resetSelection();
    };

    var pageContainer = document.createElement("div"),
        dropzoneContainer = document.createElement("div");

    pageContainer.id = "pdfUploadPage";

    dropzoneContainer.id = "dropzone";
    dropzoneContainer.className = "dropzoneContainer dropzone";

    var logoContainer = document.createElement("div"), 
        logo = document.createElement("img");

    logoContainer.className = "bank-logo-container";
    logoContainer.appendChild(logo);

    if (institution.logo.links.full) {
        logo.src = institution.logo.links.full;
    } else {
        logo.src = institution.logo.links.self;
    }

    logo.onload = function () {
        this.removeAttribute("style");
        if (this.width === this.height) {
            return this.style.width = "30%";
        } else if (this.width > this.height) {
            return this.style.width = "70%";
        }

        this.style.height = "30%";
    };

    var previewsContainer = document.createElement("div");

    previewsContainer.className = "dropzone-previews";

    var pdfDropzone = new Dropzone(dropzoneContainer, {
        url: host + "/users/" + window.globalState.userId + "/statements",
        previewsContainer: previewsContainer,
        parallelUploads: 3,
        previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n" + 
            "<div class=\"dz-details\"><div class=\"dz-pdf-icon\"></div>\n<div class=\"dz-filename\"><span data-dz-name></span></div></div>\n" + 
            "<div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div><a href=\"javascript:null;\" class=\"dz-remove-file\" data-dz-remove>X</a>\n" +
            "<div class=\"dz-error-message\"><span data-dz-errormessage></span></div>\n</div>",
        dictDefaultMessage: "<h4>Drag & Drop or <span>Browse</span></h4>We support only official statements downloaded directly from your banking institution",
        createImageThumbnails: false,
        acceptedFiles: "application/pdf",
        autoProcessQueue: false,
        paramName: "statement",
        errorResolver: function (_, response) {
            if (!response.data || !response.data[0]) {
                console.error(response);
                return "Unknown error while uploading file";
            }
            return "Error: "  + response.data[0].title + " " + response.data[0].detail; 
        },
        headers: {
            "Authorization": "Bearer " + window.globalState.accessToken
        },
        params: {
            "institutionId": institution.id
        }
    });

    window.jobs = window.jobs || [];

    pdfDropzone.on("success", function (_, response) {
        sendEventNotification("job", { success: true, data: { id: response.id }});
        if (response.links && response.links.self) {
            window.jobs.push(response.links.self);
        }
    });

    pdfDropzone.on("queuecomplete", function () {
        transitionToPage("pdfOverview", window.filesToUpload);
    });

    pdfDropzone.on("addedfile", function() {
        hideAllButtons();
        setActiveButton2("Proceed", function () {
            
            window.filesToUpload = window.filesToUpload.concat(pdfDropzone.files.map(function (file) {file.institution = institution; return file;}));
            pdfDropzone.processQueue();
            
            //manualUpload(pdfDropzone.files, institution);
        });
    });

    pageContainer.appendChild(logoContainer);
    pageContainer.appendChild(previewsContainer);
    pageContainer.appendChild(dropzoneContainer);

    return pageContainer;
};
