/*------------------------------------------------------------/
- © Copyright PathXL 2013
- 
- Unless explicitly stated otherwise, all rights 
- including those in copyright inthe content of  
- this website are owned by or controlled for these  
- purposes by PathXL. 
-  
- Except as otherwise expressly permitted under  
- copyright law or PathXL's Terms of Use,  
- the content of this site may not be copied, reproduced,  
- republished, downloaded, posted, broadcast or transmitted  
- in any way without first obtaining PathXL's  
- written permission or that of the copyright owner.

* @title: General javascript methods for UI enhancements over the admin section
* @description: 
* @author: Christopher Chestnut, PathXL 2013
* @date: 14/05/2013
* @update: 16/10/2013 - Christopher Chestnut - added SucceededGetJsonPanel & jqAlert
/------------------------------------------------------------*/


/// <summary>
/// This places a transparent spinner in the center of the page
/// </summary>
/// <author>Christopher Chestnut</author>
function placeWorkingSpinner() {
    $('.whitePanel > .savedsearchSpinner').remove();
    $('.whitePanel').append('<span class="savedsearchSpinner"></span>');
}
//SucceededGetJsonPanel

/// <summary>
/// This method handles the response from the json webservice
/// <summary>
/// <author>Mike Stewart</author>
/// <cDate>16/10/2013</cDate>
function parseJsonResponse(jsonResponse) {
    if (jsonResponse != null) {
        var jsonResponseParsed = jQuery.parseJSON(jsonResponse);
        
        $.each(jsonResponseParsed, function (i, jsonPanel) {
            
            if (jsonPanel.isModal) {
                // It modal exists - remove
                if ($("#" + jsonPanel.ID)[0]) {
                    $("#" + jsonPanel.ID).remove();
                }
                // add and apply jquery ui
                $('body').append(jsonPanel.markupHtml);
                var isConfirm = (jsonPanel.modalFunctionSubmitOnclick != null || jsonPanel.modalFunctionSubmit != null); // if set to false this will turn this into an alert message

                $("#" + jsonPanel.ID).dialog({
                    autoOpen: jsonPanel.modalAutoOpen, //new
                    dialogClass: jsonPanel.dialogClass, //new
                    draggable: jsonPanel.modalDraggable, //new
                    resizable: false,
                    width: 300,
                    title: jsonPanel.modalTitle,
                    modal: jsonPanel.modalStyleEffect, //new
                    position: { my: "center", at: "center", of: window },
                    buttons: [
                        {
                            text: (jsonPanel.modalSubmitText != null && jsonPanel.modalSubmitText != "" ? jsonPanel.modalSubmitText : "OK"),
                            click: function() {
                                if (jsonPanel.modalFunctionSubmitOnclick != null && jsonPanel.modalFunctionSubmitOnclick != "") {
                                    eval(jsonPanel.modalFunctionSubmitOnclick);
                                } else if (jsonPanel.modalFunctionSubmit != null && jsonPanel.modalFunctionSubmit != "") {
                                    runFunction(jsonPanel.modalFunctionSubmit); // run function defined in BLL
                                } else {
                                    isConfirm = false;
                                    if (typeof disableEventsForTextEntry == 'function') {
                                        disableEventsForTextEntry();
                                    }
                                    $(this).dialog("close");
                                }
                            },
                            'class': "modalOkButton"
                        },
                        {
                            text: (jsonPanel.modalCancelText != null && jsonPanel.modalCancelText != "" ? jsonPanel.modalCancelText : "Cancel"),
                            click: function() {
                                if (jsonPanel.modalFunctionCancelOnclick != null && jsonPanel.modalFunctionCancelOnclick != "") {
                                    eval(jsonPanel.modalFunctionCancelOnclick); // run function defined in BLL
                                }

                                if (typeof disableEventsForTextEntry == 'function') {
                                    disableEventsForTextEntry();
                                }
                                $(this).dialog("close");
                            },
                            'class': "modalCancelButton"
                        }
                    ],
                    close: function () {
                        if (jsonPanel.modalFunctionCancelOnclick != null && jsonPanel.modalFunctionCancelOnclick != "") {
                            eval(jsonPanel.modalFunctionCancelOnclick); // run function defined in BLL
                        }

                        if (typeof disableEventsForTextEntry == 'function') {
                            disableEventsForTextEntry();
                        }
                    }
                });
                if (!isConfirm) {
                    // if there is no submit button action then change this to an alert message
                    $("#" + jsonPanel.ID).dialog('option', 'buttons', {
                        "OK": function() {
                            $(this).dialog("close");
                        }
                    });
                }
            } else {
                if ($(jsonPanel.markupHtml).find("redirect").length > 0) {
                    window.location = $(jsonPanel.markupHtml).find("redirect").text();
                    return false;
                } else {
                    if ($("#" + jsonPanel.ID)[0]) { // if it exists already - replace
                        $("#" + jsonPanel.ID).replaceWith(function () {
                            return $(jsonPanel.markupHtml);
                        });
                    } else {
                        $("#" + jsonPanel.parentID).append(jsonPanel.markupHtml);
                    }
                }
                
            }
            // BreadCrumbs
            $(".breadCrumbHolder").each(function () {
                if (!$(this).hasClass('jBreadCrumbAdded')) {
                    $(this).jBreadCrumb({easing:'easeOutQuad'});
                    $(this).addClass('jBreadCrumbAdded');
                }
            });
            $('.PXLDDLCBList').each(function () {
                var thisObjectName = $(this).attr("title");
                var thisOnChangeEvent = $(this).attr("changeevent");
                var thisOnUncheckAllEvent = $(this).attr("uncheckAllEvent");
                var isMoreCols = $(this).hasClass("moreColumnsCtl");
                var isMoreFilters = $(this).hasClass("moreFiltersCtl");
                var colsCss = "";
                if (isMoreCols) {
                    colsCss = "moreColumns";
                }

                var boolincludeselectalloption = $.parseJSON($(this).attr("includeselectalloption").toLowerCase());
                $(this).multiselect({
                    enableFiltering: true,
                    buttonContainer: '<div class="btn-group ' + colsCss + '" />',
                    includeSelectAllOption: boolincludeselectalloption,
                    buttonText: function (options) {
                        if (options.length == 0) {
                            return thisObjectName + ': NONE';
                        }
                        else if (options.length > 2) {
                            return thisObjectName + ': ' + options.length + ' selected';
                        }
                        else {
                            var selected = thisObjectName + ': ';
                            options.each(function () {
                                selected += $(this).text() + ', ';
                            });
                            return selected.substr(0, selected.length - 2) + '';
                        }
                    },
                    onChange: function (element, checked) {
                        if (thisOnChangeEvent != undefined && thisOnChangeEvent.length > 0) {
                            // trigger event
                            eval(thisOnChangeEvent);
                        }
                    }
                   ,
                    onDropdownShow: function () {

                        if (isMoreCols)
                        {
                            var controlID = "PXLDDLCBList_ColumnsList";
                            onChangeColumnDdl("", controlID);
                        }
                        
                    },
                    onDropdownHide: function () {
                          $(".multiselect-container").scrollTop(0); 
                    }
                    
                });
            });

            // Expand Search Bofgaex
            $(".searchFilterBtn").each(function () {
                var toggleCtlID = $(this).attr('togglectlid');
                if (toggleCtlID != null) {
                    $(this).unbind("click");
                    $(this).click(function () {
                        if ($("#" + toggleCtlID).is(':visible')) {
                            $('.searchFilterExpandPnl').hide();
                            $("#" + toggleCtlID).hide();
                        } else {
                            $('.searchFilterExpandPnl').hide();
                            $("#" + toggleCtlID).show();
                        }
                     
                        return false;
                    });
                }
            });

            // Sliders
            $(".sliderCtl").each(function() {
                $(this).slider({
                    min: parseInt($(this).attr("min")),
                    max: parseInt($(this).attr("max")),
                    //animate: "fast",
                    value: parseInt($("#" + $(this).attr("childBox")).text()),
                    slide: function(event, ui) {
                        $("#" + $(this).attr("childBox")).text(ui.value);
                    },
                    change: function(event, ui) {
                    }
                });

                // Reset Button
                var start = parseInt($(this).attr("start"));
                var sliderID = $(this).attr('id');

                $(this).find(".sliderCtlResetBtn").click(function() {
                    $("#" + $("#" + sliderID).attr("childBox")).text(start);
                    $("#" + sliderID).slider("value", start);
                });
            });

            // Initialise each of the datePickers
            $(".datePicker").each(function ()
            {
                var pThis = this;
                var format = $(pThis).attr("format");
                $(this).datepicker({
                    dateFormat: format,
                    onSelect: function ()
                    {
                        var oldValue = $(pThis).attr("OldValue");
                        var currentValue = $(pThis).val();

                        if (oldValue != currentValue)
                        {
                            $(pThis).addClass("editAllFieldChanged");
                        }
                    }
                });
            });

            if ($('.inlineCtrl').length > 0) {
                //inlin edit controls
                $('.inlineCtrl').each(function() {
                    var maxlength = "";
                    if ($(this).attr("readonly") == "readonly") {
                        var readonly = "readonly = 'true'";
                    } else {
                        var readonly = "";
                    }
                    if ($(this).hasAttr("maxlength")) {
                        maxlength = "maxlength='" + $(this).attr("maxlength") + "'";
                    }
                    var has_clicked = false; 
                    var onClickOutside = "submit";
                    if ($(this).hasAttr("data-format")) {
                        onClickOutside = "submit";
                    }
                    var parentformat = $(this).attr("format");
                    $(this).editable({
                        ajaxOptions: {
                            type: 'post',
                            dataType: "json",
                            contentType: "application/json; charset=utf-8"
                        },
                        emptyclass: "inlineCtrlEmpty",
                        validate: function (value) {

                            if ($(this).attr('isnum') == "true" && value.length > 0)
                            {
                              //  value = value.toString().replace(',', '.'); // replace comma with a decimal point as the computer doesnt accept the comma decimal seperator . 
                                if (!$.isNumeric(value))
                                { // If the value is not a valid numeric value return the below error message
                                    return "Invalid entry. Please enter a valid numeric value. ";
                                }
                                else {

                                    var numericsOnlyInvalid = value.indexOf('-') == -1 && value.indexOf('.') == -1 && value.length > 9;
                                    var negativeWholeNumberInvalid = value.indexOf('-') == 0 && value.indexOf('.') == -1 && value.length > 10;
                                    var negativeDecimalNumberInvalid = value.indexOf('-') == 0 && value.indexOf('.') > 1 && value.length > 11;
                                    var positiveDecimalNumberInvalid = value.indexOf('.') > 0 && value.indexOf('-') == -1 && value.length > 10;
                                    
                                    var invalidDecimalPlacement = isNaN(value.charAt(value.indexOf('.') - 1));
                                    var indexofdecimalpoint = value.indexOf('.');
                                    var lengthofstring = value.length -1;
                                    
                                    if (lengthofstring.toString() == indexofdecimalpoint || indexofdecimalpoint == 0)
                                    {
                                        invalidDecimalPlacement = true;
                                    }
                                    
                                    
                                    var isInvalidNumber = numericsOnlyInvalid || negativeDecimalNumberInvalid || negativeWholeNumberInvalid || positiveDecimalNumberInvalid || invalidDecimalPlacement;
                                    if (invalidDecimalPlacement)
                                    {
                                        return "Invalid Decimal Number. Decimal Numbers must have at least one number before and after the decimal point. ";
                                    }
                                    
                                    if (isInvalidNumber) {
                                        return "Numeric character limit exceeded";
                                    }
                                    
                                }
                                
                               
                            }
                        },
                        mode: "inline",
                        params: function(params) {
                            //originally params contain pk, name and value
                            params.guid = $("#hiddenGuid").val();
                            params.pk = $(this).attr('pk');
                            return JSON.stringify(params);
                        },
                        url: function (params) {
                            if ($(this).hasAttr('url')) {
                                var suc = $(this).attr('onsuccess');
                                var fail = $(this).attr('onfail');
                                return $.ajax({
                                    type: 'POST',
                                    url: $(this).attr('url'), // '/MetadataWebservice.asmx/UpdateProtocolName',
                                    data: params,
                                    contentType: 'application/json; charset=utf-8',
                                    dataType: 'json',
                                    async: true,
                                    cache: false,
                                    timeout: 10000,
                                    success: function (response) {
                                        if (suc != undefined && suc.length > 0) {
                                            eval(suc);
                                        }
                                    },
                                    error: function(response) {
                                        if (fail != undefined && fail.length > 0) {
                                            eval(fail);
                                        }
                                    }
                                });
                            }
                        },
                        success: function (params, newValue) {
                            // the apply (tick) button has been clicked on the editable area
                            if (!$(this).hasAttr('url') && $(this).hasAttr('onsuccess')) {
                                if (newValue instanceof Date) {
                                    newValue = $.format.date(newValue, 'dd/MM/yyyy');
                                }
                                // sets the value property
                                $(this).val(newValue);
                                $(this).attr("value", newValue);
                                var suc = $(this).attr('onsuccess');
                                eval(suc);
                            }
                        },
                        format : (typeof (parentformat) != "undefined" ? parentformat : null),
                        onblur: onClickOutside,
                        tpl: GetTemplate(this)
                    });
                });
            }
            
            function GetTemplate(element) {


                var maxLengthHTML = " ";
                var maxLengthAttr = $(element).attr('maxlength');

                if (maxLengthAttr != "") {
                    maxLengthHTML = "maxlength=" + maxLengthAttr;
                }
                if ($(element).attr('isnum') == 'true')
                {
                    
                    return '<input type="text" isnumeric="true" ' + " onkeydown = " + $(element).attr('onkeyup') + " " + maxLengthHTML + '>';
                }
                
                else
                {

                    return '<input type="text" ' + " onkeydown = " + $(element).attr('onkeyup') + " " + maxLengthHTML + " " + '>';
                }
            }            


            if ($('.textAreaResize').length > 0) 
            {
                $('.textAreaResize').each(function ()
                {
                    $(this).elastic();
                });
            }

            try {
                $("#" + jsonPanel.ID).find("select.select2Ctrl").each(function () {
                    var selectListID = $(this).attr("id");
                    $(this).select2({});
                    $(document).off('select2:select', "#" + selectListID);
                    $(document).off('select2:unselect', "#" + selectListID);
                    $(document).on('select2:select', "#" + selectListID, function (e) {
                        if ($(e.target).attr("onadd").length > 0) {
                            eval($(e.target).attr("onadd") + "('" + JSON.stringify(e.params.data.id) + "')");
                        }
                    });
                    $(document).on('select2:unselect', "#" + selectListID, function (e) {
                        if ($(e.target).attr("onremove").length > 0) {
                            eval($(e.target).attr("onremove") + "('" + JSON.stringify(e.params.data.id) + "')");

                            $(".ui-datepicker:visible").each(function() { // for each VISIBLE datePicker control 
                                $(e.target).hide(); //remove it from the screen when exited . //  
                            });

                        }
                    });
                });

            } catch (e) {

            }
            
        });

    }
};

function addme(jsonObject) {
   // alert("added" + jsonObject);

    //alert("val=" + $('.select2Ctrl').select2("val"));
}

function removeme(jsonObject) {
    //alert("removed" + jsonObject);
}

$.fn.hasAttr = function (name) {
    return this.attr(name) !== undefined;
};

/// <summary>
/// Setup Alert Box
/// </summary>
/// <author>Mike Stewart</author>
/// <cDate>16/10/2013</cDate>
function jqAlert(title, msg, okFunc) {
    var shutting = false;
    $("#confirmDialog .message").empty();
    $("#confirmDialog .message").html(msg);
    $("#confirmDialog").dialog({ buttons: {
        "OK": function () { shutting = true; $(this).dialog("close"); if (okFunc != undefined) { okFunc(); }; }
        },
        title: title,
        close: function (event, ui) { if (!shutting) { if (okFunc != undefined) { okFunc(); }; }; },
        width: 500,
        modal: true,
        position: [(($('body')[0].offsetWidth / 2) - 250), 'center']
    });
    return false;
}
/// <summary>
/// Setup Alert Box
/// </summary>
/// <param name="rnum">number to round</param>
/// <param name="rlength">number of decimal places</param>
function roundNumber(rnum, rlength) {
    var newnumber = Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
    return parseFloat(newnumber); 
};



function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
    );
}
function runFunction(name, arguments) {
    var fn = window[name];
    if (typeof fn !== 'function')
        return;
    fn.apply(window, new Array());
}
/// <summary>
/// Loads a url if a different window
/// </summary>
/// <param name="url">The URL the new window should open in</param>
/// <param name="sectionName">(Disabled PXL-5249) The friendly name of the page to be opened. This is only used in the event of an error.</param>
function openURLInNewWindow(url, sectionName) {
    var screenWidth = $(window).width();
    var screenHeight = $(window).height();
    var viewerWindow = window.open(url,null, "status=no,resizable=yes, width=" + screenWidth + ", height=" + screenHeight + ", toolbar=no, titlebar=no, menubar=no, location=no, left=0, top=0", true);
    if (viewerWindow == null || typeof (viewerWindow) == 'undefined') {
        jqAlert("Pop-up Blocker Warning", "Your Browser is considering " + sectionName + " page to be a pop-up.<br /><br />Please check your settings and turn off your pop-up blocker to use this feature.");
    };
}

navigator.sayswho = (function () {
    var ua = navigator.userAgent, tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
        return 'IE ' + (tem[1] || '');
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
    return M.join(' ');
})();

function gup(name) {
    var query = window.location;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null) {
        return "";
    }
    else {
        return results[1];
    }
};

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode;
    if (charCode != 46 && charCode > 31
        && (charCode < 48 || charCode > 57))
        return false;

    return true;
};
$.fn.scrollTo = function (target, options, callback) {
    if (typeof options == 'function' && arguments.length == 2) { callback = options; options = target; }
    var settings = $.extend({
        scrollTarget: target,
        offsetTop: 50,
        duration: 500,
        easing: 'swing'
    }, options);
    return this.each(function () {
        var scrollPane = $(this);
        var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
        scrollPane.animate({ scrollTop: scrollY }, parseInt(settings.duration), settings.easing, function () {
            if (typeof callback == 'function') { callback.call(this); }
        });
    });
}

function OnlyAllowNumerics(elementIdentifier) { // the image control uses this method to validate numeric fields . 
    $("" + elementIdentifier).keydown(function (event) {
        
        var caretPosition = this.selectionStart;
        var unconditonalKeys = ((event.keyCode >= 35 && event.keyCode <= 40) || event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 13 || event.keyCode == 9 || event.keyCode == 16);
        var decimalPoint = event.keyCode == 190 || event.keyCode == 110;
        var decimalCharacterAdded = ($(this).val().indexOf('.') > -1 && decimalPoint);

        var minus = event.keyCode == 173 || event.keyCode == 109 || event.keyCode == 189; // represents a negative number '-'  . 
        var minusCharacterAdded = ($(this).val().indexOf('-') > -1 && minus);

        var currentCharCode = event.keyCode;

        if ((event.keyCode >= 96 && event.keyCode <= 105)) { // characters on the keypad appear as letters before being changed to their numeric values so substract 48 to get keyboard numeric values to prevent 10 characters from being entered . 
            currentCharCode = event.keyCode - 48;
        }

        if (event.keyCode != 46 && !(event.keyCode == 8                                // backspace
        || event.keyCode == 46
        || decimalPoint
        || minus
        || (event.keyCode >= 35 && event.keyCode <= 40)     // arrow keys/home/end
        || (event.keyCode >= 48 && event.keyCode <= 57)     // numbers on keyboard
        || (event.keyCode >= 96 && event.keyCode <= 105))   // number on keypad
        ) {

            event.preventDefault();
            return;
        }
        var currentString = $(this).val() + String.fromCharCode(currentCharCode); // current Text in the numeric field . 
        var numb = "";
        if (currentString != null && !unconditonalKeys) { // If the text box isnt empty and one of the unconditionalKeys ( tab , enter , delete arrows etc ) are clicked , begin validation 

            numb = (currentString).match(/\d/g); // get all of the numbers in the string . 

            if (numb != null) {
                numb = numb.join("");

                if (!minusCharacterAdded && !decimalCharacterAdded) { // if the current character entered is not a - or a . validate the numbers only . 
                    numericsOnly(numb, event);
                }

            }
            if (minusCharacterAdded && !decimalCharacterAdded) {
                // if we have just added a negative number that is whole , jsut validate a whole negative number . 
                validatenegativeWholeNumber(currentString, event);

            }
            if (decimalPoint)  // if we have entered a decimal point then validate positive and negative numbers . 
            {
                validatepositiveDecimalNumber(decimalCharacterAdded, currentString, caretPosition, event);
                validatenegativeDecimalNumber(decimalCharacterAdded, currentString, caretPosition, event);
            }

        }
        if (caretPosition > 0 && minus) { // if the caret isnt at zero ( the start of the textbox) and we try to enter a minus , prevent it , 
            event.preventDefault();
        }

        if (caretPosition == 0 && decimalPoint) {
            $(".editable-error-block").text("Invalid place to enter a decimal point / decimal comma.");

            $(".editable-error-block").addClass("ui-state-error");
            $(".editable-error-block").css("display", "block");
            event.preventDefault();
        }


        if (minusCharacterAdded) {
            event.preventDefault();
        }

        if (decimalCharacterAdded) {
            event.preventDefault();
        }

        
    });
}

function validateDateField(caller, event) {
    if (event.keyCode > 0) {
        event.preventDefault();
    }
}


function debugObjectOneAlert(inputobject) {
    obj = inputobject;
    var output = "";
    for (x in obj) {
        output += x + ": " + obj[x] + "\n";
    }
    //pxl.console(output);
    alert(output);
}

/// <summary>
/// Dynamically validates Numeric input fields in Xplore
/// </summary>
/// <param name="this">The textbox that called the method </param>
/// <param name="event"></param>

function validateNumericField(caller, event) {

    $(".editable-error-block").css("display", "none");
    var caretPosition = caller.selectionStart;
    var unconditonalKeys = ((event.keyCode >= 35 && event.keyCode <= 40) || event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 13 || event.keyCode == 9 || event.keyCode == 16);
    var decimalPoint = event.keyCode == 190 || event.keyCode == 110;
    var decimalCharacterAdded = ($(caller).val().indexOf('.') > -1 && decimalPoint);

    var minus = event.keyCode == 173 || event.keyCode == 109 || event.keyCode == 189; // represents a negative number '-'  . 
    var minusCharacterAdded = ($(caller).val().indexOf('-') > -1 && minus);

    var currentCharCode = event.keyCode;
   
    if ((event.keyCode >= 96 && event.keyCode <= 105))
    { // characters on the keypad appear as letters before being changed to their numeric values so substract 48 to get keyboard numeric values to prevent 10 characters from being entered . 
        currentCharCode = event.keyCode - 48;
    }

    if (event.keyCode != 46 && !(event.keyCode == 8                                // backspace
    || event.keyCode == 46
    || decimalPoint
    || minus
    || (event.keyCode >= 35 && event.keyCode <= 40)     // arrow keys/home/end
    || (event.keyCode >= 48 && event.keyCode <= 57)     // numbers on keyboard
    || (event.keyCode >= 96 && event.keyCode <= 105))   // number on keypad
    ) {

        event.preventDefault();   
        return;
    }
    var currentString = $(caller).val() + String.fromCharCode(currentCharCode); // current Text in the numeric field . 
    var numb = "";
    if (currentString != null && !unconditonalKeys)
    { // If the text box isnt empty and one of the unconditionalKeys ( tab , enter , delete arrows etc ) are clicked , begin validation 

        numb = (currentString).match(/\d/g); // get all of the numbers in the string . 

        if (numb != null) 
        {
            numb = numb.join(""); 

            if (!minusCharacterAdded && !decimalCharacterAdded)
            { // if the current character entered is not a - or a . validate the numbers only . 
                numericsOnly(numb, event);
            }
            
        }
        if (minusCharacterAdded && !decimalCharacterAdded) 
        {
            // if we have just added a negative number that is whole , jsut validate a whole negative number . 
           validatenegativeWholeNumber(currentString, event);

        }
            if (decimalPoint)  // if we have entered a decimal point then validate positive and negative numbers . 
            {
                validatepositiveDecimalNumber(decimalCharacterAdded, currentString, caretPosition, event);
                validatenegativeDecimalNumber(decimalCharacterAdded, currentString, caretPosition, event);
            }
            
            }
    if (caretPosition > 0 && minus)
    { // if the caret isnt at zero ( the start of the textbox) and we try to enter a minus , prevent it , 
        event.preventDefault();
    }

    if (caretPosition == 0 && decimalPoint)
    {
        $(".editable-error-block").text("Invalid place to enter a decimal point / decimal comma.");

        $(".editable-error-block").addClass("ui-state-error");
        $(".editable-error-block").css("display", "block");
        event.preventDefault();
    }
    

    if (minusCharacterAdded) {
        event.preventDefault();
    }

    if (decimalCharacterAdded) {
        event.preventDefault();
    }

    
}
function IsNullOrEmpty(string) {
    if (string == null || string == 'undefined' || string.length == 0) {
        return true;
    }
    return false;
}



function numericsOnly(currentValue,event) {
   
    if (currentValue.length > 9) {
        $(".editable-error-block").text("Numeric character limit reached.");
        $(".editable-error-block").addClass("ui-state-error");
        $(".editable-error-block").css("display", "block");
        event.preventDefault();

    }
}

function validatenegativeWholeNumber(currentValue, event)
{
   
    if (currentValue.length > 10)
    {
        $(".editable-error-block").text("Numeric character limit reached.");
        $(".editable-error-block").addClass("ui-state-error");
        $(".editable-error-block").css("display", "block");
        event.preventDefault();
    }


}

function validatepositiveDecimalNumber(decimalpointAdded, currentValue, caretPosition, event) {
    
    if(currentValue.length == 10 && !decimalpointAdded && (caretPosition == 0 || caretPosition == 9))
    {
        $(".editable-error-block").text("Invalid place to enter a decimal point / decimal comma.");
               
        $(".editable-error-block").addClass("ui-state-error");
        $(".editable-error-block").css("display", "block");
                
                
        event.preventDefault();
    }
}

function validatenegativeDecimalNumber(decimalpointAdded, currentValue, caretPosition, event) {
   
    if (currentValue.length == 11 && !decimalpointAdded && (caretPosition == 1 || caretPosition == 10)) {
        $(".editable-error-block").text("Invalid place to enter a decimal point / decimal comma.");

        $(".editable-error-block").addClass("ui-state-error");
        $(".editable-error-block").css("display", "block");


        event.preventDefault();
    }
}



function getQueryStringValueFromParameter(parameter)
{
    parameter = parameter.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + parameter + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
}
