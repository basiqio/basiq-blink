/*global showElement updateTitle hideElement transitionToPage resetSelection sendEventNotification setActiveButton2 readConfig Dropzone Promise*/

var host = readConfig("basiq-api-host");

window.pages["pdfUpload"] = function (container, institution) {
    showElement("backButton");
    updateTitle("Upload Statements");
    hideElement("institutionSearchForm");
    hideElement("hideSearchButton");

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
    previewsContainer.id = "previews";
 
    var pdfDropzone = new Dropzone(dropzoneContainer, {
        url: host + "/users/" + window.globalState.userId + "/statements",
        previewsContainer: previewsContainer,
        parallelUploads: 3,
        previewTemplate: "<div id=\"tpl\" class=\"dz-preview dz-file-preview\">\n" + 
            "<div class=\"dz-details\"><div id=\"pdficon\" class=\"dz-pdf-icon\"></div>\n<div class=\"dz-filename\"><span data-dz-name></span></div></div>\n" + 
            "<div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress></span></div><a href=\"javascript:null;\" class=\"dz-remove-file\" data-dz-remove>X</a>\n",
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
            return response.data[0].title + " " + response.data[0].detail; 
        },
        headers: {
            "Authorization": "Bearer " + window.globalState.accessToken
        },
        params: {
            "institutionId": institution.id
        }
    });

    window.jobs = window.jobs || [];
    window.jobIds = [];
    pdfDropzone.on("success", function (event, response) {
        window.jobIds.push(response.id);
        sendEventNotification("job", { success: true, data: { id: response.id, institutionShortName: event.institution.shortName, fileName: event.name }});
        if (response.links && response.links.self) {
            window.jobs.push(response.links.self);
        }
    });

    pdfDropzone.on("error", function(response, error){
        // var err = error && error.data && error.data[0] ? error.data[0] : {detail: "Unknown error"};
        // transitionToPage("loading", err);
    });

    pdfDropzone.on("queuecomplete", function () {
        if (window.globalState.ignoreParsing) {
            transitionToPage("pdfResult", "success", institution, []);
            return;
        }

        var promises = [];
        window.jobIds.forEach(function(jobId){
            promises.push(new Promise(function(resolve, reject){
            function checkJobStatus(timeout) {
                var now = new Date().getTime();
                window.API.checkJobStatus(window.globalState.accessToken, jobId).then(function (resp) {
                    var steps = resp.steps;
                    for (var step in steps) {
                        if (!steps.hasOwnProperty(step)) {
                            continue;
                        }
                        if (steps[step].title === "verify-credentials") {
                            switch (steps[step].status) {
                                case "failed":
                                   return  resolve({status:"failure", step: steps[step]});
                                case "success":
                                   return  resolve({status:"success", step: steps[step]});
                                case "pending":
                                case "in-progress":
                                    new Date().getTime() - now > timeout ? resolve({status: "failure", step:step[step]}) : setTimeout(checkJobStatus, 1000);
                            }
            
                        }
                    }
                }).catch(function (err) {
                   reject(err.message);
                });
            }
            checkJobStatus(180000);
            }));
        });
        if(promises.length > 0){
            transitionToPage("pdfResult", "loading", institution);
            Promise.all(promises).then(function(results){
                var status = "success";
                var steps = [];
                results.forEach(function(result){
                    if(result.status === "failure") {
                        status = "failure";
                    }
                    steps.push(result.step);
                });
                transitionToPage("pdfResult", status, institution, steps);
            }).catch(function(err){
                transitionToPage("loading", err);
            });
        }
    });
var i = 0;
    pdfDropzone.on("addedfile", function(file) {
        i++
        console.log("TRIGGER :", i)
        var fileExt = file.name.split('.').pop()
        if(fileExt != "pdf"){

            details = document.querySelectorAll(".dz-details")
            details.forEach(detail => { 
                    fileNameElement = detail.querySelector(".dz-filename"); 
                    if(file.name === fileNameElement.innerText){ 

                        var pdfIcon = detail.querySelector("#pdficon")

                        pdfIcon.className = ""
                        pdfIcon.style.marginRight = 10
                        pdfIcon.style.marginLeft = 10
                        pdfIcon.innerHTML = "?"

                        var divElement = document.createElement('div')
                        divElement.style.marginTop = 4
                        var spanElement = document.createElement('span')
                        spanElement.style.fontWeight = 100
                        spanElement.style.opacity = 0.9
                        spanElement.innerText = "Not a supported file type."
                        divElement.appendChild(spanElement)
                        fileNameElement.appendChild(divElement)
                    }
                })

            file.previewTemplate.style.color = "#E24A4A";
        }


        document.getElementById("footer").innerHTML = "";
        setActiveButton2("Proceed", function (button) {
            button.disabled = true;
            window.filesToUpload = window.filesToUpload.concat(pdfDropzone.files.map(function (file) {file.institution = institution; return file;}));
            pdfDropzone.processQueue();
        });
    });

    pageContainer.appendChild(logoContainer);
    pageContainer.appendChild(previewsContainer);
    pageContainer.appendChild(dropzoneContainer);

    return pageContainer;
};

