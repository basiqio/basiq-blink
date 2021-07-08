/* global 
   parseQueryVariables 
   hideElement
   showElement
   loadScript
   sendEventNotification
   transitionToPage
   getState
   API
   getPartnerId 
   :true */

(function (window) {
  document.getElementById("closeButton").addEventListener("click", function (e) {
    e.preventDefault();

    sendEventNotification("cancellation");
  });

  window.globalState = getState(parseQueryVariables());

  var result = window.checkAccessToken(
    window.globalState.accessToken,
    window.globalState.demo
  );

  if (result.error) {
    transitionToPage("loading", result.error);
  } else {

    transitionToPage("loading");

    if (window.globalState.connectionId) {
      if (window.globalState.demo === true) {
        transitionToPage(
          "loading",
          "Demo is not supported for update connection use-case."
        );
        return;
      }
      return updateConnection(window.globalState.connectionId);
    }

    window
      .checkUserID(window.globalState.userId, window.globalState.demo)
      .then(function () {
        return API.loadInstitutions(window.globalState.institutionRegion);
      })
      .then(function (loadedInstitutions) {
        var partnerId = getPartnerId(window.globalState.accessToken);
        var tokenVersion = getTokenVersion(window.globalState.accessToken);

        window.globalState.institutions = loadedInstitutions.filter(function (institution) {
          if (partnerId == "8f6d03ae-e2ca-4bc9-950d-53f20b30ba73" && (institution.id == "AU00000" || institution.id == "AU00001")) {
            return false;
          } else if (tokenVersion !== "2.1" && (institution.authorization == "user-mfa" || institution.authorization === "user-mfa-intermittent")) {
            return false;
          }
          return true;
        });


        window.preloadImages(loadedInstitutions, 16);
        if (result.pdf) {
          if (window.globalState.connect === "true" && window.globalState.upload === "false") {
            transitionToPage("institutionSelection", "online");
          }
          else if (window.globalState.upload === "true" && window.globalState.connect === "false") {
            transitionToPage("institutionSelection", "pdf");
          }
          else {
            transitionToPage("initialChoice");
          }
        } else {
          transitionToPage("institutionSelection", "online");
        }
      })
      .catch(function (err) {
        transitionToPage("loading", err);
      });
  }

  setTimeout(function () {
    sendEventNotification("handshake", { success: !result.error });
  }, 1000);

  function updateConnection(connectionId) {
    hideElement("header");
    window
      .checkUserID(window.globalState.userId, window.globalState.demo)
      .then(function () {
        return window.checkConnectionID(
          window.globalState.userId,
          connectionId,
          window.globalState.demo
        );
      })
      .then(function (resp) {
        return API.getInstitution(
          window.globalState.accessToken,
          resp.institutionId
        );
      })
      .then(function (resp) {
        showElement("header");
        transitionToPage("institution", resp);
        hideElement("backButton");
      })
      .catch(function (err) {
        transitionToPage("loading", err);
      });
  }

  loadScript("js/pages/pdfResult.js");
  loadScript("js/pages/pdfUpload.js");
  loadScript("js/pages/institution.js");
  loadScript("js/pages/pdfOverview.js");
  loadScript("js/pages/result.js");
})(this);
