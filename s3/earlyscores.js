/**
 * Created by jacob on 6/27/17.
 */
var STATUS_CODES = {
    "-4": "Accept terms and conditions.",
    "-3": "No scores available.",
    "-2": "Unknown invalid fetch attempt",
    "-1": "Invalid College Board Account",
    "0": "Entered into queue",
    "1": "Fetching Scores",
    "2": "Success",
    "7": "AP Number Requested"
};

function generate_key(password, salt, iterations) {
    if (iterations <= 0) throw RangeException();

    var key = password + salt;

    for (var i = 0; i < iterations; i++)
        key = sha256.digest(key)

    return key
}

function toByteArray(base64) {
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for(i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

function getScore(encodedScores, username, password, salt) {
    var decryptionKey = generate_key(username + password + password + username, salt, 10000);
    var encryptedScores = toByteArray(encodedScores);
    var iv = encryptedScores.subarray(0, 16);
    encryptedScores = encryptedScores.subarray(16);
    var aesCbc = new aesjs.ModeOfOperation.cbc(decryptionKey, iv);
    var decryptedBytes = aesCbc.decrypt(encryptedScores);
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

function fetchScoresFromS3(S3Url, username, password) {
    console.log(username, password);
    $.getJSON(S3Url, function (data) {
        console.log(data, S3Url);
        if (data.tempuser) {
            foreverMessage("Showing scores found in temporary password mode.");
        }

        if (data.status == -2) {
            error("Unable to fetch scores due to unknown error.");
            return false
        } else if (data.status == -1) {
            if (data.scores){
                message("Securely decrypting scores...");
                var decScores = getScore(data.scores, username, password, data.salt);
                var elapsed = "";
                if (data.elapsedTime) {
                    elapsed = "<hr /><p class='small text-center'>"+data.elapsedTime+"</p>";
                } else {
                    elapsed = "<hr /><p class='small text-center'>Score fetched in "+(data.endtime - data.starttime)+" seconds.</p>";
                }
                scores(decScores + elapsed);
            }
            error("Unable to fetch scores due to invalid account.");
            return false
        } else if (data.status == 7) {
            error("Unable to fetch scores due to an AP Number / Additional Information request.");
            return false
        } else if (data.status == 0 || data.status == 1) {
            message("Waiting for scores to be fetched...");
            setTimeout(function () { fetchScoresFromS3(S3Url, username, password) }, 3000)
        } else {
            // YIPEE!
            message("Securely decrypting scores...");
            var decScores = getScore(data.scores, username, password, data.salt);
            var elapsed = "";
            if (data.elapsedTime) {
                elapsed = "<hr /><p class='small text-center'>"+data.elapsedTime+"</p>";
            } else {
                elapsed = "<hr /><p class='small text-center'>Score fetched in "+(data.endtime - data.starttime)+" seconds.</p>";
            }
            scores(decScores + elapsed);
        }

    })
}