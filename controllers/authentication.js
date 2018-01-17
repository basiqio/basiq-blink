const crypto = require("crypto"),
    apiKey = "MjQxOGViNGItMDdiZC00MDg2LThhMDEtZTBhN2MxNWJhNDNmOjhiZmE1NmFkLWYzZWMtNGY0My04MmQ0LTZkNTAxNGE2Y2I0OQ==",
    API = new (require("../utils/request"))("https://au-api.basiq.io", apiKey);

const credentialsCheck = function (req, res) {
    const username = req.body.username ? req.body.username : null,
        password = req.body.password ? req.body.password : null;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            errorMessage: "Username or password not received"
        });
    }

    if (username === "asd" && password === "asd") {
        return res.json({
            success: true,
            accessToken: randomString(20)
        });
    }

    res.status(400).json({
        success: false,
        errorMessage: "Invalid credentials"
    });
};

const accessTokenCheck = function (req, res) {
    const clientId = req.body.client_id ? req.body.client_id : null;

    if (!clientId) {
        return res.status(400).json({
            success: false,
            errorMessage: "Client ID not received"
        });
    }

    API.send("oauth2/token", "POST", {
        "grant_type": "client_credentials"
    }, function (body) {
        res.json({
            success: true,
            result: body
        });
    }, function (err) {
        res.json({
            success: false,
            result: err
        });
    })
};

function randomString(len) {
    let str = "";

    while (str.length < len) {
        str += crypto.randomBytes(100).toString('hex');
    }

    return str.substr(0, len);
}

module.exports = {
    credentialsCheck,
    accessTokenCheck
};