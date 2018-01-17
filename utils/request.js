const request = require('request');

//require('request').debug = true;

const API = function(host, apiKey) {
    this.postOptions = {
        host: host,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + apiKey
        },
    };

    return this;
};

API.prototype.send = function (path, method, data, cb, errCb) {
    this.postOptions.uri = this.postOptions.host + "/" + path;
    this.postOptions.method = method.toUpperCase();
    this.postOptions.body = JSON.stringify(data);
    this.postOptions.headers["Content-Length"] = this.postOptions.body.length;

    request(this.postOptions, function (error, response, body) {
        if (error) {
            return errCb(JSON.parse(erro));
        }
        cb(JSON.parse(body));
    });
};

module.exports = API;