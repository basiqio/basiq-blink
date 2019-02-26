/* global 
   parseQueryVariables 
   hideElement
   showElement
   loadScript
   sendEventNotification
   transitionToPage
   getState
   API 
   :true */

(function(window) {
  document.getElementById("closeButton").addEventListener("click", function(e) {
    e.preventDefault();

    sendEventNotification("cancellation");
  });

  window.globalState = getState(parseQueryVariables());

  var error = window.checkAccessToken(
    window.globalState.accessToken,
    window.globalState.demo
  );

  if (error) {
    transitionToPage("loading", error);
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
      .then(function() {
        return API.loadInstitutions();
      })
      .then(function(loadedInstitutions) {
        window.globalState.institutions = loadedInstitutions;

        window.preloadImages(loadedInstitutions, 16);
        transitionToPage("initialChoice");
      })
      .catch(function(err) {
        transitionToPage("loading", err);
      });
  }

  setTimeout(function() {
    sendEventNotification("handshake", { success: !error });
  }, 1000);

  function updateConnection(connectionId) {
    hideElement("header");
    window
      .checkUserID(window.globalState.userId, window.globalState.demo)
      .then(function() {
        return window.checkConnectionID(
          window.globalState.userId,
          connectionId,
          window.globalState.demo
        );
      })
      .then(function(resp) {
        return API.getInstitution(
          window.globalState.accessToken,
          resp.institutionId
        );
      })
      .then(function(resp) {
        showElement("header");
        transitionToPage("institution", resp);
        hideElement("backButton");
      })
      .catch(function(err) {
        transitionToPage("loading", err);
      });
  }

  loadScript("config.js");
  loadScript("js/utils.js");
  loadScript("js/pages/pdfUpload.js");
  loadScript("js/pages/institutionSelection.js");
  loadScript("js/pages/institution.js");
  loadScript("js/pages/pdfOverview.js");
  loadScript("js/pages/result.js");
})(this);
