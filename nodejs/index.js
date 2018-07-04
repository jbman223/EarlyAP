const request = require('request');
const cheerio = require('cheerio');
const express = require('express');
const redis = require('redis');
const config = require('./config.js');
const app = express();

const PAGE_STATE = {
    "LOGGED_IN": "var userLoggedin = true;",
    "SCORE_PAGE": "activateMenuItems('/scores', '/scores/view-your-scores');",
    "AP_NUMBER_REQUEST": "To successfully match you to your AP exams, the information you enter on this page must be the same as the information you entered on your most recent AP answer sheet.",
    "TOS_REQUEST": "To view and send your AP Scores, you'll need to review and accept these Terms and Conditions.",
    "NO_SCORES": "We weren't able to find any AP scores for you. There could be several reasons for this:",
}

const PRIMARY_TIMEOUT = 30 * 1000;
const SECONDARY_TIMEOUT = 10 * 1000;
const VERSION = "2018.8";

class Metrics {
    constructor() {
        this.key_prefix = "metrics"
        this.client = redis.createClient(config.redis_port, config.redis_host, { password: config.redis_auth });
        this._custom_metrics = {}
    }

    _key(name) {
        return this.key_prefix + ":" + name
    }

    _randomKey() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      
        for (var i = 0; i < 8; i++)
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      
        return text;
    }

    custom(metric) {
        if (this._custom_metrics[metric]) {
            this._custom_metrics[metric] += 1;
        } else {
            this._custom_metrics[metric] = 1;
        }
    }

    _saveCustom() {
        var that = this;
        Object.keys(this._custom_metrics).forEach(function (key) {
            if (that._custom_metrics[key] == 0) return;
            var redis_key = that._key(key)
            that.client.incrby(redis_key, that._custom_metrics[key]);
            that._custom_metrics[key] = 0;
        })
    }

    _save() {
        this._saveCustom();
    }

    saveEvery(seconds) {
        var that = this;
        setInterval(function () {
            try {
                that._save();
            } catch(exception) {
                console.log("Failed saving metrics", exception);
            }
        }, seconds * 1000);
    }
}

const METRICS = new Metrics();
METRICS.saveEvery(5);

function buildResponse(status, message, contents) {
    return {
        status: status,
        message: message,
        contents: contents
    }
}

function performLogin(req, res) {
    var username = req.body["username"]
    var password = req.body["password"]
    METRICS.custom("score_request");

    if (username == "" || password == "") {
        METRICS.custom("invalid_form_submit_count")
        res.send(buildResponse("ERROR", "You must include a username and password.", null))
        return;
    }

    var form = {
        'idp': 'ECL',
        'isEncrypted': 'N',
        'DURL': 'https://apscore.collegeboard.org/scores/view-your-scores',
        'password': password,
        'username': username,
        'appId': 287,
        'formState': 1
    }
    var jar = request.jar();
    var headers = {
        'Referer': "https://apscore.collegeboard.org/scores",
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2215.85 Safari/537.36'
    }
    request.post({url: "https://account.collegeboard.org/login/authenticateUser", jar: jar, form: form, followAllRedirects: true, headers: headers, timeout: PRIMARY_TIMEOUT}, function (error, response, body) {
        if (!error) {
            if (!body.includes(PAGE_STATE["LOGGED_IN"])) {
                METRICS.custom("invalid_login_count");
                res.send(buildResponse("LOGIN_ERROR", "Invalid username or password.", null));
                return;
            }

            if (body.includes(PAGE_STATE["TOS_REQUEST"])) {
                if (req.body["tos_accept"]) {
                    var form = {
                        "termsChecked": true,
                        "__checkbox_termsChecked": true
                    }
                    request.post({url: "https://apscore.collegeboard.org/scores/termsAndConditions.action", jar: jar, form: form, timeout: SECONDARY_TIMEOUT}, function (error, response, body) {
                        if (!error) {
                            METRICS.custom("tos_accept_count");
                            res.send(buildResponse("TOS_ACCEPTED", "TOS was accepted. Attempting login again.", null));
                        } else {
                            if (error.code === 'ESOCKETTIMEDOUT' || error.code === "ETIMEDOUT" || error.connect === false) {
                                METRICS.custom("timeout_count");
                                res.send(buildResponse("TIMEOUT", "College Board timeout", null));
                            } else {
                                if (response.statusCode == 500) {
                                    METRICS.custom("down_count");
                                    res.send(buildResponse("DOWN", "College Board down", null));
                                    return;
                                }

                                res.send(buildResponse("ERROR", error, null));
                            }
                        }
                    });
                } else {
                    METRICS.custom("tos_count");
                    res.send(buildResponse("TOS_REQUEST", "The College Board has requested that you accept their Terms of Service.", null));
                }
                return;
            }

            if (body.includes(PAGE_STATE["AP_NUMBER_REQUEST"])) {
                /* AP NUMBER REQUEST... */
                $ = cheerio.load(body);
                var apNumberForm = $("#verifyAccount").html();
                if (!apNumberForm) {
                    METRICS.custom("ap_number_form_error_count");
                    res.send(buildResponse("AP_NUMBER_ERROR", "We were unable to fetch the AP number request form. Please try again.", null))
                } else {
                    if (req.body["ap_number_info"]) {
                        var token = $("[name='token']").val()
                        var formInfo = req.body["ap_number_info"] + token;
                        request.post({url: "https://apscore.collegeboard.org/scores/verifyAccount.action", jar: jar, form: formInfo, timeout: SECONDARY_TIMEOUT}, function (error, response, body) {
                            if (!error) {
                                METRICS.custom("ap_number_form_saved_count");
                                res.send(buildResponse("AP_NUMBER_SAVED", "AP number information was likely saved. Attempting login again.", null));
                            } else {
                                if (error.code === 'ESOCKETTIMEDOUT' || error.code === "ETIMEDOUT" || error.connect === false) {
                                    METRICS.custom("timeout_count");
                                    res.send(buildResponse("TIMEOUT", "College Board timeout", null));
                                } else {
                                    if (response.statusCode == 500) {
                                        METRICS.custom("down_count");
                                        res.send(buildResponse("DOWN", "College Board down", null));
                                        return;
                                    }

                                    res.send(buildResponse("ERROR", error, null));
                                }
                            }
                        });
                    } else {
                        METRICS.custom("ap_number_form_count");
                        res.send(buildResponse("AP_NUMBER_REQUEST", "The College Board has requested more information. Please fill out this form.", apNumberForm));
                    }
                }
                return;
            }

            if (body.includes(PAGE_STATE["SCORE_PAGE"])) {
                /* SCORE PAGE!! */
                if (body.includes(PAGE_STATE["NO_SCORES"])) {
                    METRICS.custom("no_scores_count");
                    res.send(buildResponse("NO_SCORES", "College Board says: \"We weren't able to find any AP scores for you.\"", null));
                    return;
                }

                $ = cheerio.load(body);
                var scores = $("#scoresListArea").html();
                if (!scores) {
                    METRICS.custom("score_error_count");
                    res.send(buildResponse("SCORE_ERROR", "We were unable to fetch your scores for an unknown reason.", null));
                } else {
                    METRICS.custom("score_success_count");
                    res.send(buildResponse("SCORES", "You have successfully logged in.", scores));
                }
                return;
            }

            METRICS.custom("unhandled_request_count");
            res.send(buildResponse("UNKNOWN", "Unsure how to handle your request.", null));
            return;
        } else {
            if (error.code === 'ESOCKETTIMEDOUT' || error.code === "ETIMEDOUT" || error.connect === false) {
                METRICS.custom("timeout_count");
                res.send(buildResponse("TIMEOUT", "College Board timeout", null));
            } else {
                if (response.statusCode == 500) {
                    METRICS.custom("down_count");
                    res.send(buildResponse("DOWN", "College Board down", null));
                    return;
                }
            
                res.send(buildResponse("ERROR", error, null));
            }
        }
    })
}

app.use(express.json());

app.use(function(req, res, next) {
    METRICS.custom("request");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post("/scores", function (req, res) {
    performLogin(req, res);
});

app.post('/', function (req, res) {
    res.status(200).send("Early Scores API " + VERSION)
});

app.get("/", function (req, res) {
    res.status(200).send("Early Scores API " + VERSION)
});

app.listen(8080, () => console.log('EarlyScores API. Version ' + + VERSION))