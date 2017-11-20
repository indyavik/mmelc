/*** 
* Global javascript utility methods
***/
window.PxlUtil = window.PxlUtil ||
function (options) {
    return new PxlUtil.Base(options);
};

(function(PxlUtil) {
    PxlUtil.console = window.console || {
        log: nullfunction,
        debug: nullfunction,
        info: nullfunction,
        warn: nullfunction,
        error: nullfunction
    };
    PxlUtil.preloadImagesList = [];
    if (typeof jQuery === 'undefined') {
        throw new Error("PxlUtil requires jQuery.");
    }
    PxlUtil.Base = function(options) {
        // no options yet but this could be extended
        this.options = {
            fullscreenCheckEventsSet: false,
            additionalDebugInformation: [] // the list of information to be included in the debug 5 values will be automatically populated in ShowDebugMessage()
        };
        this.browsersclassPrefix = "browserclass_";
        this.BROWSERS = {
            IE: this.browsersclassPrefix + "ie",
            FIREFOX: this.browsersclassPrefix + "firefox",
            SAFARI: this.browsersclassPrefix + "safari",
            CHROME: this.browsersclassPrefix + "chrome",
            UNKNOWN: this.browsersclassPrefix + "unknown"
        };
        $.extend(this.options, options);
    };
    PxlUtil.DebugBase = {
        /// <summary>
        /// For use with tablets as the console is not available this will output the console to the screen.
        /// alternatively this could just be called directly to add specific console events
        /// </summary>
        logDisplay: function (msg) {
            if (typeof msg != "undefined" && msg.toString().trim().length > 0) {
                var maxDisplaySize = 500;
                var msgContents = msg;
                var controlNames = { button: "errorDisplayConsoleButton", buttonInfo: "errorDisplayConsoleButtonInfo", contents: "consoleMessageContents", contentsOpen: "consoleMessageContentsOpen", message: "errorDisplayConsoleMessge" };
                if ($('#errorDisplayConsole').length == 0) {
                    $("body").append("<div id='errorDisplayConsole'><div class='" + controlNames.button + "'>Console <span class='" + controlNames.buttonInfo + "'></span> <a href='#' onclick='$(\"#errorDisplayConsole>div." + controlNames.contents + "\").empty();$(\"#errorDisplayConsole ." + controlNames.buttonInfo + "\").text(\"(0)\");return false;'>clear</a></div><div class='" + controlNames.contents + "'></div></div>");
                    $(document).on('click', '#errorDisplayConsole>.' + controlNames.button, function (event) {
                        $(this).parent().css('height', "auto");
                        if ($(this).siblings('.' + controlNames.contents).hasClass(controlNames.contentsOpen)) {
                            $(this).siblings('.' + controlNames.contents).removeClass(controlNames.contentsOpen).css({
                                'height': "0",
                                "overflow": "hidden"
                            });
                        } else {
                            var heightoffset = 60;
                            $(this).siblings('.' + controlNames.contents).addClass(controlNames.contentsOpen).css({
                                'height': Math.max(document.documentElement.clientHeight - heightoffset, window.innerHeight - heightoffset || 0) + "px",
                                "overflow": "auto"
                            });
                        }
                    });
                }
                $('#errorDisplayConsole>div.' + controlNames.contents).append("<div class='" + controlNames.message + "'>" + msgContents + "</div>");
                $('#errorDisplayConsole .' + controlNames.buttonInfo).text("(" + $("#errorDisplayConsole>div." + controlNames.contents + ">." + controlNames.message).length + ")");
                $('#errorDisplayConsole>div.' + controlNames.contents).scrollTop($('#errorDisplayConsole>div.' + controlNames.contents)[0].scrollHeight);

                if (maxDisplaySize > 0 && $('#errorDisplayConsole>div.' + controlNames.contents + '>.' + controlNames.message).length > maxDisplaySize) {
                    $('#errorDisplayConsole>div.' + controlNames.contents + '>.' + controlNames.message).first().remove();
                    $('#errorDisplayConsole .' + controlNames.buttonInfo).text("(limit " + maxDisplaySize + ")");
                }
            }
        },
        AddLogDisplayNode: function () {
            if ($('#errorDisplayConsole').length != 0) {
                $('#errorDisplayConsole>div.consoleMessageContents>.errorDisplayConsoleMessge').last().addClass("errorDisplayConsoleMessgeLastClosed");
            }
        }
    };

    $.extend(PxlUtil.Base.prototype, {
        /**
        * Determins if a string is null or empty
        * @function
        * @param {String} the string to be checked
        */
        IsNullOrEmpty: function(string) {
            if (string == null || string == 'undefined' || string.length == 0) {
                return true;
            }
            return false;
        },
        RoundToXPlaces: function (startvalue, places) {
            return parseFloat(+(Math.round(startvalue + "e+" + places) + "e-" + places));
        },
        /// <summary>
        /// this will search the debug values array and override it if it already exists
        /// call by using the following 
        /// PxlViewer.util.AddDebugMessageComment(["{name}", "{value}"]);
        /// </summary>
        AddDebugMessageComment: function (commentArray, ignoreUpdate) {
            if (typeof commentArray == "object" && commentArray.length == 2) {
                var found = false;
                var index = 0;
                var debuglen = this.options.additionalDebugInformation.length;
                for (var i = 0; i < debuglen; i++) {
                    if (this.options.additionalDebugInformation[i][0] == commentArray[0]) {
                        found = true;
                        break;
                    }
                    index++;
                }
                if (found) {
                    this.options.additionalDebugInformation.splice(index, 1, commentArray);
                } else {
                    this.options.additionalDebugInformation.push(commentArray);
                }
                if (typeof ignoreUpdate == "undefined") {
                    this.AddDebugMessageComment(["LastUpdate", new Date().toUTCString()], true);
                }
            }
        },
        /**
        * Gets the available size of window
        * @function
        */
        GetWindowSize: function() {
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

            return [w, h];
        },
        Debug: {
            log: nullfunction, //  PxlUtil.console.info, //PxlUtil.DebugBase.logDisplay,// 
            AddLogEvent: nullfunction, //PxlUtil.DebugBase.AddLogDisplayNode,// 
            debug: nullfunction, //PxlUtil.console.log,//PxlUtil.DebugBase.logDisplay,//
            warn: nullfunction, //PxlUtil.DebugBase.logDisplay,//PxlUtil.console.warn,//
            /**
            * Breaks apart an object and returns a string of it's properties and values useful for debugging
            * @function
            * @param {Object} the inputobject
            */
            DebugObjectString: function(inputobject) {
                var output = "";
                for (x in inputobject) {
                    output += x + ": " + inputobject[x] + "\n";
                }
                return output;
            },
            /**
            * Breaks apart an object and then outputs to the console a string of it's properties and 
            * values useful for debugging. uses DebugObjectString
            * @function
            * @param {Object} the inputobject
            */
            DebugObject: function(inputobject) {
                PxlUtil.console.info(this.DebugObjectString(inputobject));
            },
            DisplayAlertMessage: function (message, title) {
                alert(message+" | "+title);
                if (!new PxlUtil().IsNullOrEmpty(message)) {
                    message = message.replace("\n", "<br />");
                    $("<div class='debugAlertMessage' " + (typeof title != "undefined" ? "title='" + title + "'" : "") + ">" + message.toString() + "</div>").dialog({
                        modal: true,
                        buttons: {
                            "Close": function () {
                                $(this).dialog("close");
                                $('.debugAlertMessage').remove();
                            }
                        },
                        width:"auto"
                    });
                }
            }
        },
        /**
        * this will set the body tag of the page to include the browser type
        * @function
        * @param {Object} the inputobject
        */
        setBrowserCSSClass: function() {
            var vendor = window.OpenSeadragon.Browser.vendor;
            if ($('body').filter(function () { return $(this).attr('class')[0].match(/browserclass_+/); }).length == 0) {
                if (vendor == window.OpenSeadragon.BROWSERS.IE) {
                    $('body').addClass(this.BROWSERS.IE);
                } else if (vendor == window.OpenSeadragon.BROWSERS.FIREFOX) {
                    $('body').addClass(this.BROWSERS.FIREFOX);
                } else if (vendor == window.OpenSeadragon.BROWSERS.SAFARI) {
                    $('body').addClass(this.BROWSERS.SAFARI);
                } else if (vendor == window.OpenSeadragon.BROWSERS.CHROME) {
                    $('body').addClass(this.BROWSERS.CHROME);
                } else {
                    $('body').addClass(this.BROWSERS.UNKNOWN);
                }
            }
        },
        /**
        * launches the selected element into fullscreen mode if it can
        * @param {Object} the element document.documentElement ==  the whole page 
        *                 or document.getElementById("elementid")
        */
        launchIntoFullscreen: function (element) {
            //removed for tablet full screen, the viewer not resizing right. this will need fixed for desktop
            if (pxl == null || pxl.menu == null || pxl.menu.options.menuScale == "desktop") {
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                }
            }
        },
        /**
        * exits out of fullscreen mode
        */
        exitFullscreen: function () {
            if (pxl == null || pxl.menu == null || pxl.menu.options.menuScale == "desktop") {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        },

        /**
        * When full screen loads call enterFullscreenAction or exitFullScreenAction
        */
        loadFullscreenCheckEvents: function (enterFullscreenAction, exitFullScreenAction) {
            if (!this.options.fullscreenCheckEventsSet) {
                document.addEventListener("fullscreenchange", function (evt) { if (enterFullscreenAction != null && document.fullscreen) { enterFullscreenAction(); } else if (exitFullScreenAction != null && !document.fullscreen) { exitFullScreenAction(); } evt.stopPropagation(); }, false);
                document.addEventListener("mozfullscreenchange", function (evt) { if (enterFullscreenAction != null && document.mozFullScreen) { enterFullscreenAction(); } else if (exitFullScreenAction != null && !document.mozFullScreen) { exitFullScreenAction(); } evt.stopPropagation(); }, false);
                document.addEventListener("webkitfullscreenchange", function (evt) { if (enterFullscreenAction != null && document.webkitIsFullScreen) { enterFullscreenAction(); } else if (exitFullScreenAction != null && !document.webkitIsFullScreen) { exitFullScreenAction(); } evt.stopPropagation(); }, false);
                document.addEventListener("MSFullscreenChange", function (evt) { if (enterFullscreenAction != null && document.msFullscreenElement) { enterFullscreenAction(); } else if (exitFullScreenAction != null && !document.msFullscreenElement) { exitFullScreenAction(); } evt.stopPropagation(); }, false);
                this.options.fullscreenCheckEventsSet = true;
            }
        },
        preloadImages: function (array, calltime) {
            if (calltime == undefined || calltime < 5) {
                if (calltime == undefined) {calltime = 0;}
                for (var i = 0; i < array.length; i++) {
                    var img = new Image();
                    img.onload = function() {
                        var index = PxlUtil.preloadImagesList.indexOf(this);
                        if (index !== -1) {
                            // remove this one from the array once it's loaded
                            // for memory consumption reasons
                            PxlUtil.preloadImagesList.splice(index, 1);
                        }
                    };
                    img.onerror = function () {
                        setTimeout("PxlViewer.util.preloadImages(['" + this.src + "']," + (calltime + 1) + ");", 2000);
                    };
                    PxlUtil.preloadImagesList.push(img);
                    img.src = array[i];
                }
            }
        },
        /// <summary>
        /// returns the base of the current url i.e. http://pathxl.com/ or whatever domain it is running under
        /// </summary>
        returnbaseurl: function () {
            var currentlocation = location.href;
            var parts = String(currentlocation).split("/");
            currentlocation = parts[0] + "/" + "/" + parts[2] + "/";
            return currentlocation;
        },
        /// <summary>
        /// detects if the current browser is a mobile browser
        /// </summary>
        isTablet: function() {
            var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;
            if (($.browser.mobile || ($.browser.name == "msie" && supportsTouch > 0) || supportsTouch > 0)) {
                return true;
            }
            return false;
        },
        destroy: function () { },

        //HTML Markup Area
        GetHTMLInput: function (id, classes, value, onChangeEvent) {
            var tmpl = "<input id='{{{id}}}' class='{{{classes}}}' value='{{{value}}}' onchange='{{{onChangeEvent}}}'></input>";
            return Mustache.render(tmpl, { id: id, classes: classes, value: value, onChangeEvent : onChangeEvent });
        },

        GetHTMLInputWithPlaceholder: function (id, classes, placeholder, type, styling) {
            var tmpl = "<input id='{{{id}}}' class='{{{classes}}}' placeholder='{{{placeholder}}}' style='{{{styling}}}'></input>";
            return Mustache.render(tmpl, { id: id, classes: classes, placeholder: placeholder, styling: styling });
        },

        GetHTMLColourPicker: function (id, classes, colour) {
            var tmpl = "<input id='{{{id}}}' class='{{{classes}}}' value='{{{colour}}}'></input>";
            return Mustache.render(tmpl, { id: id, classes: classes, colour: colour });
        },

        GetHTMLDiv: function (id, classes, controls) {
            var tmpl = "<div id='{{{id}}}' class='{{{classes}}}'>{{{controls}}}</div>";
            return Mustache.render(tmpl, { id: id, classes: classes, controls: controls });
        },

        GetHTMLTextArea: function (id, classes, text) {
            var tmpl = "<textarea id='{{{id}}}' class='{{classes}}'  autocapitalize='off' autocorrect='off' >{{{text}}}</textarea>";

            var userAgent = navigator.userAgent.toLowerCase(); // this is user agent that detects if we are using an android device .
            var isAndroid = userAgent.indexOf("android") > -1;  // this will be true if we are on an android device , otherwise false .
            if (isAndroid && id.toString().indexOf("URL") > -1) {   // if we are on an android device and we are generating the html content for the weblink ( contains the word URL), render the information through an input tag to allow chrome to support autocapitalization off

                tmpl = "<input id='{{{id}}}' class='{{classes}}'  autocapitalize='off' autocorrect='off' value='{{{text}}}' ></input>";
            }

            return Mustache.render(tmpl, { id: id, classes: classes, text: text });
        },

        GetHTMLTextAreaWithPlaceholder: function (id, classes, placeholder) {
            var tmpl = "<textarea id='{{{id}}}' class='{{classes}}' autocorrect='off' autocapitalize='off' autocomplete='off' placeholder={{{placeholder}}}></textarea>";

            var userAgent = navigator.userAgent.toLowerCase(); // this is user agent that detects if we are using an android device .
            var isAndroid = userAgent.indexOf("android") > -1; // this will be true if we are on an android device this is true , otherwise false .
            if (isAndroid && id.toString().indexOf("URL") > -1) { // if we are on an android device and we are generating the html content for the weblink ( contains the word URL) , render the information through an input tag to allow chrome to support autocapitalization off

                tmpl = "<input id='{{{id}}}' class='{{classes}}' autocorrect='off' autocapitalize='off' autocomplete='off' placeholder={{{placeholder}}}></input>";
            }

            return Mustache.render(tmpl, { id: id, classes: classes, placeholder: placeholder });
        },

        GetHTMLLabel: function (id, classes, text, forElement) {
            var tmpl = "<label id='{{id}}' class='{{{classes}}}' for={{{forElement}}}>{{{text}}}</label>";

            return Mustache.render(tmpl, { id: id, classes: classes, text: text , forElement: forElement});
        },

        GetHTMLHyperLink: function (id, classes, url) {
            var tmpl = "<div id='{{{id}}}' class='{{{classes}}}' href='{{{url}}}'></div>";
            return Mustache.render(tmpl, { id: id, classes: classes, url: url });
        },

        GetHTMLDivButton: function (id, classes, text, onclickEvent) {
            var tmpl = "<div id='{{{id}}}' class='{{{classes}}}' onclick='{{{onclickEvent}}}'>{{{text}}}</div>";
            return Mustache.render(tmpl, { id: id, classes: classes, onclickEvent: onclickEvent, text: text });
        },

        GetToggleSwitch: function (id, checked, switchClass) {
            var checkedText = "checked";
            if (!checked)
                checkedText = "";
            var theid = "myonoffswitch_" + id;
            var tmpl = "<div class='onoffswitch {{{switchClass}}}'>\
                            <input type='checkbox' name='{{{theid}}}' class='onoffswitch-checkbox hidden' id='{{{theid}}}' {{{checkedText}}}>\
                            <label class='onoffswitch-label' for='{{{theid}}}'>\
                                <span class='onoffswitch-inner'></span>\
                                <span class='onoffswitch-switch'></span>\
                            </label>\
                        </div>";
            return Mustache.render(tmpl, { theid: theid, checkedText: checkedText, switchClass : switchClass});
        },

        GetToggleSwitchWithOutFor: function (id, checked, switchClass) {
            var checkedText = "checked";
            if (!checked)
                checkedText = "";
            //note there is not FOR inthe label HTML
            var theid = "myonoffswitch_" + id;
            var tmpl = "<div class='onoffswitch {{{switchClass}}}'>\
                            <input type='checkbox' name='{{{theid}}}' class='onoffswitch-checkbox hidden' id='{{{theid}}}' {{{checkedText}}}>\
                            <label class='onoffswitch-label'>\
                                <span class='onoffswitch-inner'></span>\
                                <span class='onoffswitch-switch'></span>\
                            </label>\
                        </div>";
            return Mustache.render(tmpl, { theid: theid, checkedText: checkedText, switchClass: switchClass });
        },

        CreateCustomDialog: function (id, headerText, message, acceptButtonTxt, acceptButtonOnClickEvent, declineButtonTxt, declinButtonOnClickEvent) {
            var closeDialogEvent = " window.pxl.annotations._closeCustomDialog(" + id + ");";
            var headerLabel = this.GetHTMLLabel("dialogHeaderLabel_" + id, "dialogHeaderLabel", headerText);
            var headerContent = this.GetHTMLDiv("dialogHeaderDiv_" + id, "dialogHeaderDiv", headerLabel);

            var messageLabel = this.GetHTMLLabel("dialogMessageLabel_" + id, "dialogMessageLabel", message);

            var acceptBtn = this.GetHTMLDivButton("acceptDialogBtn_" + id, "cutomDialogBtn", acceptButtonTxt, acceptButtonOnClickEvent + closeDialogEvent);

            var cancelBtn = "";
            if (declineButtonTxt != "") {
                cancelBtn = this.GetHTMLDivButton("declineDialogBtn_" + id, "cutomDialogBtn", declineButtonTxt, declinButtonOnClickEvent + closeDialogEvent);
            }
            var customDialogDiv = this.GetHTMLDiv("customDialog_" + id, "customDialog", headerContent + messageLabel + cancelBtn + acceptBtn);
            return customDialogDiv;
        },

        GetBlackoutOverlay: function (id)
        {
            return PxlViewer.util.GetHTMLDiv("overlay_" + id, "blackoutOverlay", "");
        },


        GetSlider: function(id, cssClass, defaultValue, min, max, onChangeEvent) 
        {
            var tmpl = "<div id='{{{id}}}' onChange='{{{onChangeEvent}}}' sliderValue='{{{defaultValue}}}' minValue='{{{min}}}' maxValue='{{{max}}}' class='{{{cssClass}}}'></div>";
            var renderedSlider = Mustache.render(tmpl, { id: id, cssClass: cssClass, defaultValue: defaultValue, onChangeEvent: onChangeEvent, min : min, max : max });
            return this.GetHTMLDiv("sliderControlPanel_" + id, "sliderControl", renderedSlider);
        },

        GetToggleSwitchPanelWithLabel: function (id, checked, labelText, panelCss, switchCss, labelCSS)
        {
            var switchLbl = this.GetHTMLLabel("switchLabel" + id, labelCSS, labelText);
            var toggleSwitch = this.GetToggleSwitch(id, checked, switchCss);
            var switchPanel = this.GetHTMLDiv("switchPanel_" + id, panelCss, switchLbl + toggleSwitch);
            return switchPanel;
        },
        GetToggleSwitchPanelWithLabelButNoFOR: function (id, checked, labelText, panelCss, switchCss, labelCSS) {
            var switchLbl = this.GetHTMLLabel("switchLabel" + id, labelCSS, labelText);
            var toggleSwitch = this.GetToggleSwitchWithOutFor(id, checked, switchCss);
            var switchPanel = this.GetHTMLDiv("switchPanel_" + id, panelCss, switchLbl + toggleSwitch);
            return switchPanel;
        },

        GetSliderPanel: function (id, panelClass, iconClass, textBoxClass, sliderClass, defaultValue, min, max, onChangeEvent)
        {
            var sliderIcon = this.GetHTMLDiv("sliderIcon_" + id, "SliderIcon " + iconClass, "");
            var sliderControl = this.GetSlider("sliderControl_" + id, sliderClass, defaultValue, min, max, onChangeEvent);
            var sliderTxtBox = this.GetHTMLInput("sliderTextBox", textBoxClass, defaultValue, onChangeEvent);
            var sliderPanel = this.GetHTMLDiv("sliderPanel_" + id, panelClass, sliderIcon + sliderControl + sliderTxtBox);
            return sliderPanel;
        },

        GetLoadingPanel: function (id, labelText, cssClass)
        {
            var loadingLabel = this.GetHTMLLabel("loadingLbl" + id, "loadingLbl", labelText);
            var loadingIcon = this.GetHTMLDiv("loadingSpinner" + id, "loadingIcon", "");
            var loadingPanel = this.GetHTMLDiv("loadingPanel_" + id, "loadingPanel " + cssClass, loadingLabel + loadingIcon);
            return loadingPanel;
        },

        GetUnavailablePanel: function (id, header, message, onCloseEvent, cssClass)
        {
            var unavailableHeader = this.GetHTMLLabel("unavailablePnlHeader_" + id, "unavailableHeader", header);
            var unavailableMessage = this.GetHTMLLabel("unavailablePnlMessage_" + id, "unavailableMessage", message);
            var closeBtn = this.GetHTMLDivButton("unavailablePnlBtn_" + id, "unavailableBtn", "Close", onCloseEvent);
            var unavailablePnl = this.GetHTMLDiv("unavailablePanel_" + id, cssClass, unavailableHeader + unavailableMessage + closeBtn);
            return unavailablePnl;
        },
        //END HTML Markup Area
        ArrayContains: function (array, obj) {
            var i = array.length;
            while (i--) {
                if (array[i] === obj) {
                    return true;
                }
            }
            return false;
        }
    });
}(PxlUtil));
PxlUtilGeneric = new PxlUtil(); 

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
}
