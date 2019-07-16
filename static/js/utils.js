/* exported readConfig */

window.request = function (url, method, data, headers, multipart) {
    return new Promise(function (resolve, reject) {
        var xhttp = new XMLHttpRequest();

        if (method.toUpperCase() === "POST") {
            xhttp.open("POST", url, true);
            if (!multipart) {
                xhttp.setRequestHeader("Content-type", "application/json");
            }
        } else {
            xhttp.open(method, url, true);
        }

        for (var header in headers) {
            if (!headers.hasOwnProperty(header)) {
                continue;
            }
            xhttp.setRequestHeader(header, headers[header]);
        }

        if (method.toUpperCase() === "POST") {
            if (!multipart) {
                xhttp.send(JSON.stringify(data));
            } else {
                xhttp.send(data);
            }
        } else {
            xhttp.send();
        }

        xhttp.addEventListener("load", function () {
            if (xhttp.getResponseHeader("Content-Type") === "application/json") {
                resolve(parseResponse(xhttp));
            } else {
                resolve(xhttp.response);
            }
        });
        xhttp.addEventListener("error", function (e) {
            console.log(xhttp, e);
            reject(parseResponse(xhttp));
        });
    });
};

function parseResponse(res) {
    try {
        return {
            statusText: res.statusText,
            statusCode: res.status,
            body: JSON.parse(res.responseText)
        };
    } catch (err) {
        return {
            statusText: res.statusText,
            statusCode: res.status,
            body: res.responseText
        };
    }
}

function readConfig(name) {
    if (!window.basiqConfig) {
        return null;
    }
    for (var i = 0; i <= window.basiqConfig.length; i++) {
        if (window.basiqConfig[i].name == name) {
            return window.basiqConfig[i].value;
        }
    }
    return null;
}
