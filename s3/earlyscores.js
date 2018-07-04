/**
 * EARLYSCORES API | June 19, 2018
 * Created by Jacob B.
 * AP is a trademark registered by the College Board, which is not affiliated with, and does not endorse, EarlyScores. 
 */

const API = "https://api.earlyscores.com/scores"

var STATUS = {
    "ERROR": generalError,
    "LOGIN_ERROR": loginError,
    "SCORE_ERROR": scoreError,
    "AP_NUMBER_ERROR": apNumberError,
    "AP_NUMBER_REQUEST": apNumber,
    "SCORES": scores,
    "AP_NUMBER_SAVED": apNumberSave,
    "TOS_REQUEST": tosRequest,
    "TOS_ACCEPTED": tosAccepted,
    "TIMEOUT": timeout,
    "DOWN": down
}

function message(message) {
    $(".loading-messages").text(message).slideDown();
}

function sendMessage(message) {
    $(".loading-messages").text(message).slideDown();
}

function foreverMessage(message) {
    $(".long-message").html(message).slideDown();
}


function scores(response) {
    ga('send', 'event', 'login', 'scores');
    $(".loading").hide();
    $(".error-message").hide();
    $(".form-container").hide();
    $(".loading").hide();
    $(".top-share").show();
    $(".score-container").html(response.contents).show()
}


function apNumber(response) {
    ga('send', 'event', 'login', 'ap_number');
    $(".loading").hide();

    $(".ap-number-confirmation-container").show();

    $(".ap-number-message").html(response.message);

    var number = $(response.contents);
    number.find(".control-group").addClass("form-group");
    number.find("input").addClass("form-control");
    number.find(".outsideUsOnly").hide();
    number.find("[for=\"inputOutsideUS\"]").hide();
    number.find(".radio-inline").addClass("form-check form-check-inline");
    number.find("#birthDateLabel").parent().addClass("form-inline");
    number.find("[for=\"verifyAccount_aiCode\"]").text("High school code:");
    number.find("#find_high_school_link").hide();
    number.find("#verifyAccount_userProfile_person_aiCode").attr("type", "text");

    $(".ap-number-form-container").html(number);

    $(".ap-number-form-container").find(".box-padding-5").hide();
    $(".ap-number-form-container").find("[name='token']").val("");
}

$(".ap-number-confirm").click(function () {
    ga('send', 'event', 'ap_number', 'confirm');
    $(".ap-number-confirmation-container").hide();
    $(".ap-number-container").show();
});

$(".cancel-ap-number-confirm").click(function (e) {
    ga('send', 'event', 'ap_number', 'cancel');
    $(".ap-number-confirmation-container").hide();
    $(".form-container").show();
});

function loginError(response) {
    ga('send', 'event', 'scores', 'login_error');
    generalError(response);
}

function scoreError(response) {
    ga('send', 'event', 'scores', 'score_error');
    generalError(response);
}

function apNumberError(response) {
    ga('send', 'event', 'scores', 'ap_number_error');
    generalError(response);
}


function generalError(response) {
    $(".loading").hide();
    $(".error-message").text(response.message).show();
    $(".form-container").show();
}

function unknownError(response) {
    ga('send', 'event', 'scores', 'unknown_error');
    $(".loading").hide();
    $(".error-message").text("A success response was received from the server but we can not process it.").show();
    $(".form-container").show();
}

function timeout(response) {
    ga('send', 'event', 'scores', 'timeout');
    $(".loading").hide();
    $(".error-message").text("The College Board website is down. Please try fetching your scores again.").show();
    $(".form-container").show();
}

function down(response) {
    ga('send', 'event', 'scores', 'down');
    $(".loading").hide();
    $(".error-message").text("The College Board website is down. Please try fetching your scores again.").show();
    $(".form-container").show();
}

var scrollToError = null;

function fieldSuccess(field) {
    $(field).removeClass("is-invalid").parent().parent().find(".control-message").text("").hide();
    return true;
}

function fieldError(field, message) {
    $(field).addClass("is-invalid").parent().parent().find(".control-message").text(message).addClass("invalid-feedback").show();
    if (scrollToError == null) {
        scrollToError = $(field);
    }
    return false;
}

function validate(field, message, invalidation = "") {
    if ($(field).val() == invalidation) {
        return fieldError(field, message);
    } else {
        return fieldSuccess(field);
    }
}

function validateTest(field, message, invalidation) {
    if (invalidation) {
        return fieldError(field, message);
    } else {
        return fieldSuccess(field);
    }
}

function validateAPNumberForm() {
    scrollToError = null;
    var valid = validate("#inputFirstName", "No first name entered.");
    valid = valid && validate("#inputLastName", "No last name entered.");
    valid = valid && validate("#inputAddress1", "No primary address entered.");
    valid = valid && validate("#inputCity", "No city entered.");
    valid = valid && validate("#inputState", "No state entered.");
    valid = valid && validate("#inputZip", "No zip code entered.");
    valid = valid && validate("#inputEmail", "No email entered.");
    valid = valid && validateTest("#inputEmailConfirm", "Input confirmation does not match", 
                          $("#inputEmailConfirm").val() == "" || $("#inputEmailConfirm").val() != $("#inputEmail").val());
    valid = valid && validate("#verifyAccount_userProfile_person_aiCode", "Please enter a highschool code.");
    valid = valid && validate("#inputAPYear", "AP Year is required.");
    valid = valid && validateTest("#inputAPNumber", "You must enter a student ID or an AP number", 
                          $("#inputAPNumber").val() == "" && $("#inputStudentID").val() == "");
    valid = valid && validateTest("#inputStudentID", "You must enter a student ID or an AP number", 
                          $("#inputAPNumber").val() == "" && $("#inputStudentID").val() == "");
    if (scrollToError) {
        $('html, body').animate({
            scrollTop: parseInt(scrollToError.offset().top - 30)
        }, 150);
    }
    scrollToError = null;
    
    return valid;
}

function tosRequest(resp) {
    ga('send', 'event', 'scores', 'tos_request');
    $(".loading").hide();
    $(".tos-request").show();
}

function tosAccepted(resp) {
    ga('send', 'event', 'scores', 'tos_accept');
    message("Terms of service were accepted. Attempting to log show scores.");
    var username = $("input[name=username]");
    var password = $("input[name=password]");
    login(username, password);
}

$(".accept-terms-check").change(function () {
    if ($(this).is(":checked")) {
        $(".tos-request-accept").removeClass("disabled");
    } else {
        $(".tos-request-accept").addClass("disabled");
    }
})

$(".tos-request-accept").click(function () {
    ga('send', 'event', 'tos', 'tos_accepted');
    if (!$(".accept-terms-check").is(":checked")) {
        $(".tos-request-accept").addClass("disabled");
        return;
    }

    $(".tos-request").hide();
    $(".loading").show();
    message("Accepted terms of service. Contacting College Board.")
    var username = $("input[name=username]");
    var password = $("input[name=password]");
    sendAPIRequest({username: username.val(), password: password.val(), tos_accept: true});
});

$(".tos-request-cancel").click(function () {
    ga('send', 'event', 'tos', 'tos_cancelled');
    $(".tos-request").hide();
    $(".form-container").show();
});

function sendAPIRequest(data) {
    $(".error-message").text("").hide();
    $.ajax({
        type: 'POST',
        url: API,
        data: JSON.stringify(data),
        success: function (r) {
            ga('send', 'event', 'api_request', 'success');
            if (typeof r === "string") r = JSON.parse(r);
            if (STATUS[r.status]) {
                STATUS[r.status](r)
            } else {
                unknownError()
            }
        },
        error: function (_, status, error) {
            ga('send', 'event', 'api_request', 'exception');
            $(".loading").hide();
            $(".error-message").text("There was an error connecting to the EarlyScores servers. Please try again.").show();
            $(".form-container").show();
        },
        contentType: "application/json",
        dataType: 'json'
    });
}

function login(username, password) {
    ga('send', 'event', 'scores', 'login');
    var data = {username: username.val(), password: password.val()}
    sendAPIRequest(data)
}

function apNumberSave(response) {
    ga('send', 'event', 'scores', 'ap_number_saved');
    message("Your AP number has been saved successfully. Attempting to log in again.");
    var username = $("input[name=username]");
    var password = $("input[name=password]");
    login(username, password);
}

$(".ap-number-form-container").submit(function (e) {
    e.preventDefault();
});

$("form.view-scores").submit(function (e) {
    e.preventDefault();
});

$(".view-scores").submit(function (e) {
    //fetch the username and password
    var that = $(".form-container");
    e.preventDefault();
    var username = $("input[name=username]");
    var password = $("input[name=password]");
    that.hide();
    $(".loading").show();
    message("Securely logging into the College Board website");
    login(username, password);
});


$(".ap-number-form-actions .cancel-ap-number").click(function (e) {
    e.preventDefault();
    $(".ap-number-container").hide();
    $(".ap-number-form-container").html("");
    $(".form-container").show();
});

$(".ap-number-form-actions .submit-ap-number").click(function (e) {
    e.preventDefault();

    if (!validateAPNumberForm()) {
        return;
    }
    
    $(".ap-number-container").hide();
    var form_values = $(".ap-number-form-container").serialize();
    $(".ap-number-form-container").html("");
    var username = $("input[name=username]");
    var password = $("input[name=password]");
    $('html, body').animate({
        scrollTop: parseInt($(".loading").offset().top)
    }, 200);
    $(".loading").show();
    message("Securely sending AP number information to the College Board.");
    sendAPIRequest({username: username.val(), password: password.val(), ap_number_info: form_values});
});