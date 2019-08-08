/* global
console
API
Promise
 */
/*exported parseQueryVariables*/
/*exported naiveFlexBoxSupport*/
/*exported stringifyQueryParams*/
/*exported setActiveButton*/
/*exported setActiveButton2*/
/*exported updateTitle*/
/*exported transitionToPage*/
/*exported renderError*/
/*exported sendEventNotification*/
/*exported getState*/
/*exported preloadImages*/
/*exported preloadImage*/
/*exported checkAccessToken*/
/*exported checkUserID*/
/*exported checkConnectionID*/
/*exported showElement*/
/*exported hideElement*/
/*exported loadScript*/

if (!window.pages) {
  window.pages = {};
}

function getState(queryVars) {
  var iFrame = !!queryVars["iframe"] && queryVars["iframe"] === "true",
    url =
      "/authenticate.html?user_id=" +
      queryVars["user_id"] +
      "&institution_id={inst_id}&access_token=" +
      queryVars["access_token"];

  if (iFrame) {
    url += "&iframe=true";
  }

  return {
    iFrame: iFrame,
    url: url,
    userId: queryVars["user_id"],
    connectionId: queryVars["connection_id"],
    accessToken: queryVars["access_token"],
    demo: !!queryVars["demo"] && queryVars["demo"] === "true",
    ignoreParsing: queryVars["ignore_parsing"] === "true",
    upload: queryVars["upload"] ? queryVars["upload"] : "false",
    connect: queryVars["connect"] ? queryVars["connect"] : "false"
  };
}

var currentPage,
  loadedPages = [];

function transitionToPage(pageId) {
  var container = document.getElementById("contentContainer");

  container.innerHTML = "";

  if (!window.pages[pageId]) {
    throw new Error("Invalid page ID provided:" + pageId);
  }

  document.getElementById("footer").innerHTML = "";

  if (currentPage && currentPage.unload) {
    currentPage.unload(container);
  }

  currentPage = window.pages[pageId];

  var handler;

  switch (typeof currentPage) {
    case "object":
      handler = currentPage.render;
      break;
    case "function":
      handler = currentPage;
      break;
    default:
      throw new Error("Invalid handler for page: " + pageId);
  }

  var args = [].slice.call(arguments, 1);

  if (loadedPages.indexOf(pageId) === -1) {
    if (currentPage.setup) {
      currentPage.setup.apply(currentPage, args);
    }
    loadedPages.push(pageId);
  }

  var result = handler.apply(null, [container].concat(args));

  switch (typeof result) {
    case "undefined":
      break;
    case "object":
      if (result instanceof Array) {
        result.forEach(function (elem) {
          container.appendChild(elem);
        });
        break;
      }
      container.appendChild(result);
  }
}

function sendEventNotification(event, payload) {
  if (window.globalState.iFrame) {
    var data = {
      event: event,
      payload: payload
    };

    var content = window.parent;
    content.postMessage(JSON.stringify(data), "*");
  } else {
    var url = "basiq://" + event + "/";

    if (payload) {
      url += JSON.stringify(payload, null, 0);
    }
    window.location.replace(url);
  }
}

function parseQueryVariables() {
  var queryString = window.location.search.substring(1),
    query = {},
    pairs = queryString.split("&");

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split("=");
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
  }
  return query;
}

function naiveFlexBoxSupport(d) {
  var f = "flex",
    e = d.createElement("b");
  e.style.display = f;
  return e.style.display === f;
}

function loadScript(url) {
  return window.request(url, "GET").then(function (resp) {
    var script = document.createElement("script");
    script.innerHTML = resp;
    var x = document.getElementsByTagName("script")[0];
    x.parentNode.insertBefore(script, x);
  });
}

function preloadImages(institutions, size) {
  if (size) {
    institutions = institutions.slice(0, size);
  }
  institutions.forEach(function (institution) {
    preloadImage(
      institution.logo.links.square || institution.logo.links.self
    ).then(function (img) {
      if (img) {
        img.setAttribute("alt", institution.name);
        img.setAttribute("title", institution.name);
      }
    });
  });
}

var loadedImages = [];

function preloadImage(url) {
  if (loadedImages.indexOf(url) !== -1) {
    return Promise.resolve(null);
  }
  return new Promise(function (res, rej) {
    var img = document.createElement("img");

    img.setAttribute("src", url);
    img.onload = function () {
      loadedImages.push(url);
      res(img);
    };
    img.onerror = function (e) {
      rej(e);
    };
  });
}

function checkAccessToken(token, demo) {
  if (demo === true) {
    return null;
  }

  if (!token) {
    return { error: "Token is not valid" };
  }

  var sections = token.split(".").filter(Boolean);
  if (sections.length < 3) {
    return { error: "Token is not valid" };
  }

  try {
    var claims = JSON.parse(atob(sections[1]));
    if (!claims.scope || claims.scope.toUpperCase() !== "CLIENT_ACCESS") {
      return { error: "Scope is not valid" };
    }
    return { pdf: !!claims.connect_statements && claims.connect_statements === true };
  } catch (err) {
    return { error: err.message };
  }
}

function checkUserID(userId, demo) {
  if (demo === true) {
    return Promise.resolve(true);
  }
  return new Promise(function (res, rej) {
    if (!userId) {
      return rej("User ID is not valid");
    }

    API.getUser(window.globalState.accessToken, userId)
      .then(function () {
        res(true);
      })
      .catch(function (e) {
        rej(e);
      });
  });
}

function checkConnectionID(userId, connectionId, demo) {
  if (demo === true) {
    return Promise.resolve(true);
  }
  return new Promise(function (res, rej) {
    if (!userId) {
      return rej("User ID is not valid");
    }
    if (!connectionId) {
      return rej("Connection ID is not valid");
    }

    API.getConnection(window.globalState.accessToken, userId, connectionId)
      .then(function (resp) {
        res({ institutionId: resp.institution.id, connectionId: resp.id });
      })
      .catch(function (e) {
        rej(e);
      });
  });
}

function stringifyQueryParams(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

function updateTitle(title, failed) {
  document.getElementById("headerTitle").textContent = title;
  if (failed) {
    document.getElementById("headerTitle").classList.add("result-text-error");
  }

}

function showElement(elementId) {
  var element = document.getElementById(elementId);
  if (!element) {
    return console.error("Element: " + elementId + " not found.");
  }
  element.classList.remove("hidden");
}

function hideElement(elementId) {
  var element = document.getElementById(elementId);
  if (!element) {
    return console.error("Element: " + elementId + " not found.");
  }
  if (element.nodeName === "FORM") {
    element.reset();
  }
  element.classList.add("hidden");
}

function setActiveButton(elementId) {
  var element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element: " + elementId + " not found.");
  }

  if (element.classList.contains("footer-button-active")) {
    return;
  }

  hideAllButtons();
  showElement(elementId);

  setTimeout(function () {
    element.classList.add("footer-button-active");
  }, 100);
}

function setActiveButton2(label, clickHandler, error) {
  document.getElementById("headerTitle").classList.remove("result-text-error");

  var footer = document.getElementById("footer"),
    element = document.createElement("button");

  element.textContent = label;
  element.className = "button footer-button";

  footer.appendChild(element);

  if (error) {
    element.className += " error-button";
  }

  if (clickHandler !== undefined) {
    element.onclick = function (e) { e.preventDefault(); clickHandler(element); };
  }

  setTimeout(function () {
    element.classList.add("footer-button-active");
  }, 100);
}

function hideAllButtons() {
  var footer = document.getElementById("footer"),
    buttons = footer.getElementsByTagName("button");

  [].forEach.call(buttons, function (button) {
    button.classList.remove("footer-button-active");
    hideElement(button.id);
  });
}
