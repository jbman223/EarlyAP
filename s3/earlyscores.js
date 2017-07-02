/**
 * Created by jacob on 6/27/17.
 */

var encodedScores = "";

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

function getScore(username, password) {
    var salt = "";
    var decryptionKey = generate_key(username + password + password + username, salt, 10000);
    var encryptedScores = toByteArray(encodedScores);
    var iv = encryptedScores.subarray(0, 16);
    console.log(iv);
    encryptedScores = encryptedScores.subarray(16);
    console.log(encryptedScores);
    var aesCbc = new aesjs.ModeOfOperation.cbc(decryptionKey, iv);
    var decryptedBytes = aesCbc.decrypt(encryptedScores);
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    $(".scores").html(decryptedText)
}

$(function () {
    getScore("username", "password")
});