/// <reference path="PxlViewer.js" />
/// <reference path="./Core/PRES/js/util.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL

var GAMMA;
var BRIGHTNESS;
var CONTRAST;
var RED_CHANNEL;
var GREEN_CHANNEL;
var BLUE_CHANNEL;
var SHARPEN_FILTER;

var ORIGINAL_CANVAS;
var CANVAS_WIDTH;
var CANVAS_HEIGHT;
var ADJUST_SLIDE;

/**
* Default ImageAdjustments Properties on init
* @function
*/
(function (PxlViewer) {
    PxlViewer.ImageAdjustments = function (options, base) {
        var pThis = this;

        this.options = {
            
        };
        
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
        this.populateDefaultGlobalVariables();
    };

    $.extend(PxlViewer.ImageAdjustments.prototype, {
        /**
        * Generates and appends the ImageAdjustments's HTML into the <body>.
        **/
        _init: function() {
            var pThis = this;
        },
        
        /**
        * Creates the Adjustments panel and appends it to the canvas
        **/
        _createImageAdjustmentsPanel: function ()
        {
            var pThis = this;
            var imageAdjustmentsPanelID = pThis.base.menu.options._floatingPanels.imageAdjustmentsPanelID;
            var headerText = "Image Adjustments";

            var loadingPanel = PxlViewer.util.GetLoadingPanel(imageAdjustmentsPanelID, "Preparing Adjustments Panel", "");
            var unavailablePanel = PxlViewer.util.GetUnavailablePanel(imageAdjustmentsPanelID, "The Image Adjustments panel is not supported in Internet Explorer 10.", "To make adjustments to this image please log into PathXL on an alternative browser.", "pxl.ImageAdjustments.exitAdjustmentsMode()", "unavailablePanel");

            // Header for panel
            var headerLabel = PxlViewer.util.GetHTMLLabel("headerLabel_" + imageAdjustmentsPanelID, "dialogHeaderLabel", headerText);
            var headerPanel = PxlViewer.util.GetHTMLDiv("headerDiv_" + imageAdjustmentsPanelID, "dialogHeaderDiv", headerLabel);

            // Gamma Correction Panel
            var gammaLabelText = "Gamma Correction";
            var gammaDefaultValue = GAMMA;
            var gammaMin = 0;
            var gammaMax = 3.5;
            var onChangeEvent = "";
            var gammaLabel = PxlViewer.util.GetHTMLLabel("contentLabel_GammaCorrection", "adjustmentsContentLabel", gammaLabelText);
            var gammaSliderControl = PxlViewer.util.GetSliderPanel("sliderControl_GammaCorrection", "sliderControlPanel", "gammaIcon", imageAdjustmentsPanelID + "SliderTextBox", imageAdjustmentsPanelID + "SliderControl", gammaDefaultValue, gammaMin, gammaMax, onChangeEvent);
            var gammaPanel = PxlViewer.util.GetHTMLDiv("innerPanel_GammaCorrection", "adjustmentsInnerPanel", gammaLabel + gammaSliderControl);

            // Brightness and Contrast Panel
            var brightAndConLabelText = "Brightness & Contrast";
            var generalDefaultValue = 0;
            var generalMin = -255;
            var generalMax = 255;
            var brightAndConLabel = PxlViewer.util.GetHTMLLabel("contentLabel_BrightAndCon", "adjustmentsContentLabel", brightAndConLabelText);
            var brightSliderControl = PxlViewer.util.GetSliderPanel("sliderControl_Bright", "sliderControlPanel", "brightnessIcon", imageAdjustmentsPanelID + "SliderTextBox", imageAdjustmentsPanelID + "SliderControl", generalDefaultValue, generalMin, generalMax, onChangeEvent);
            var conSliderControl = PxlViewer.util.GetSliderPanel("sliderControl_Contrast", "sliderControlPanel", "contrastIcon", imageAdjustmentsPanelID + "SliderTextBox", imageAdjustmentsPanelID + "SliderControl", generalDefaultValue, generalMin, generalMax, onChangeEvent);
            var brightAndConPanel = PxlViewer.util.GetHTMLDiv("innerPanel_BrightAndCon", "adjustmentsInnerPanel", brightAndConLabel + brightSliderControl + conSliderControl);


            // Colour Balance Panel
            var colourBalanceLabelText = "Colour Balance";
            var channelOnClickEvent = "";
            var colourBalanceLabel = PxlViewer.util.GetHTMLLabel("contentLabel_ColourBalance", "adjustmentsContentLabel", colourBalanceLabelText);
            var redCheckBoxControl = PxlViewer.util.GetHTMLDivButton("ToggleChannel_Red", "RedChannelActive ChannelButton ChannelActive", "", channelOnClickEvent);
            var greenCheckBoxControl = PxlViewer.util.GetHTMLDivButton("ToggleChannel_Green", "GreenChannelActive ChannelButton ChannelActive", "", channelOnClickEvent);
            var blueCheckBoxControl = PxlViewer.util.GetHTMLDivButton("ToggleChannel_Blue", "BlueChannelActive ChannelButton ChannelActive", "", channelOnClickEvent);
            var channelPanel = PxlViewer.util.GetHTMLDiv("ChannelPanel", "adjustmentsChannelPanel", redCheckBoxControl + greenCheckBoxControl + blueCheckBoxControl);
            var colourBalancePanel = PxlViewer.util.GetHTMLDiv("innerPanel_ColourBalance", "adjustmentsInnerPanel", colourBalanceLabel + channelPanel);

            // Filters
            //var filtersLabelText = "Filters";
            //var filtersLabel = PxlViewer.util.GetHTMLLabel("contentLabel_Filters", "adjustmentsContentLabel", filtersLabelText);
            var sharpenFilterPanel = PxlViewer.util.GetToggleSwitchPanelWithLabelButNoFOR("sharpenFilter", false, "Sharpen", "parametersChildPanel", "sharpenSwitch", "adjustmentsContentLabel");
            var filtersPanel = PxlViewer.util.GetHTMLDiv("innerPanel_Filters", "adjustmentsInnerPanel", /*filtersLabel +*/ sharpenFilterPanel);

            // Action Buttonsr
            var resetAllButtonLbl = PxlViewer.util.GetHTMLLabel("adjustments_ResetAllLbl", "adjustmentsBtnText", "Reset All");
            var resetAllBtnDiv = PxlViewer.util.GetHTMLDiv("adjustments_ResetAllBtn", "adjustmentsBtn", resetAllButtonLbl);
            var applyAllBtnLbl = PxlViewer.util.GetHTMLLabel("adjustments_ApplyAllLbl", "adjustmentsBtnText", "Apply");
            var applyAllBtnDiv = PxlViewer.util.GetHTMLDiv("adjustments_ApplyAllBtn", "adjustmentsBtn", applyAllBtnLbl);
            var buttonsPanel = PxlViewer.util.GetHTMLDiv("innerPanel_Buttons", "adjustmentsInnerPanel", applyAllBtnDiv + resetAllBtnDiv);

            var panelContent = PxlViewer.util.GetHTMLDiv("adjustmentsPanelContent", "adjustmentsPanelContent", gammaPanel + brightAndConPanel + colourBalancePanel + filtersPanel + buttonsPanel);

            var imageAdjustmentPanel = PxlViewer.util.GetHTMLDiv(pThis.base.menu.options._floatingPanels.imageAdjustmentsPanelID, "imageAdjustmentsPanel",loadingPanel + unavailablePanel + headerPanel + panelContent);
            $("#viewerHolder").append(imageAdjustmentPanel);
            pThis.base.ImageAdjustments.activateAdjustentSliderControls();
        },

        populateDefaultGlobalVariables: function()
        {
            GAMMA = 1;
            BRIGHTNESS = 0;
            CONTRAST = 0;
            RED_CHANNEL = true;
            GREEN_CHANNEL = true;
            BLUE_CHANNEL = true;
            SHARPEN_FILTER = false;
            ADJUST_SLIDE = false;
        },

        updateCanvasStore: function ()
        {
            var pThis = this;
            CANVAS_WIDTH = pThis.base.viewer.drawer.canvas.width;
            CANVAS_HEIGHT = pThis.base.viewer.drawer.canvas.height;
            ORIGINAL_CANVAS = document.getElementById("adjustmentsCanvasStore");
            var mainCanvas = pThis.base.viewer.drawer.canvas;

            ORIGINAL_CANVAS.width = CANVAS_WIDTH;
            ORIGINAL_CANVAS.height = CANVAS_HEIGHT;
            $("#adjustmentsCanvasStore").css("width", CANVAS_WIDTH + "px");
            $("#adjustmentsCanvasStore").css("height", CANVAS_HEIGHT + "px");
            $("#adjustmentsCanvasStore").css("top", "0px");
            $("#adjustmentsCanvasStore").css("left", "0px");
            $("#adjustmentsCanvasStore").css("position", "absolute");
            var canvasStoreCtx = ORIGINAL_CANVAS.getContext('2d');

            canvasStoreCtx.drawImage(mainCanvas, 0, 0);
        },

        /**
        * convert the image adjustment properties into the url string used by the viewer and screenshot
        **/
        toString: function ()
        {
            var parameters = "";
            if ($('.imageAdjustmentsPanelSliderControl').length)
            {
                $('.imageAdjustmentsPanelSliderControl').each(function() {
                    var adjustmentValue = $(this).val();
                    if ($(this).attr('id').indexOf("Gamma") > -1) {
                        parameters += "&gamma=" + parseFloat(adjustmentValue);
                    } else if ($(this).attr('id').indexOf("Bright") > -1) {
                        parameters += "&brightness=" + parseInt(adjustmentValue);
                    } else if ($(this).attr('id').indexOf("Contrast") > -1) {
                        parameters += "&contrast=" + parseInt(adjustmentValue);
                    }
                });

                $(".ChannelButton").each(function() {
                    var isActive = $(this).hasClass("ChannelActive");
                    if ($(this).attr('id').indexOf("Red") > -1) {
                        parameters += "&r=";
                    } else if ($(this).attr('id').indexOf("Green") > -1) {
                        parameters += "&g=";
                    } else if ($(this).attr('id').indexOf("Blue") > -1) {
                        parameters += "&b=";
                    }

                    if (isActive) {
                        parameters += 0;
                    } else {
                        parameters += -255;
                    }
                });

                if ($(".sharpenSwitch>input[type='checkbox']").is(':checked')) {
                    parameters += "&sharpen=1";
                } else {
                    parameters += "&sharpen=0";
                }
            }
            else
            {
                parameters += "&gamma=" + GAMMA;
            }

            return parameters;
        },

        toObject: function() 
        {
            var imageAdjustments = 
            {
                adjustmentName: [],
                adjustmentValue: []
            };
            var pThis = this;

            $('.imageAdjustmentsPanelSliderControl').each(function () 
            {
                var id = $(this).attr("id");
                var idSplit = id.split("_");
                var adjustemntName = idSplit[idSplit.length - 1];
                var adjustmentValue = $(this).val();
                imageAdjustments.adjustmentName.push(adjustemntName);
                imageAdjustments.adjustmentValue.push(adjustmentValue);
            });

            $(".ChannelButton").each(function () {
                var id = $(this).attr("id");
                var idSplit = id.split("_");
                var colour = idSplit[idSplit.length - 1];
                var isActive = $(this).hasClass("ChannelActive");
                imageAdjustments.adjustmentName.push(colour);
                imageAdjustments.adjustmentValue.push(isActive);
            });

            imageAdjustments.adjustmentName.push("sharpen");
            if ($(".sharpenSwitch>input[type='checkbox']").is(':checked')) {
                imageAdjustments.adjustmentValue.push(true);
            }
            else
            {
                imageAdjustments.adjustmentValue.push(true);
            }
            return imageAdjustments;
        },

        imageAdjustmentsPanelID: function() {
            var pThis = this.base;
            return this.options._menuIDs.adjustments;
        },

        adjustGammaCorrection: function (newValue)
        {
            GAMMA = newValue;
        },

        adjustBrightness: function (newValue)
        {
            BRIGHTNESS = newValue;
        },

        adjustContrast: function (newValue)
        {
            CONTRAST = newValue;
        },

        /**
        * This is the generic gateway to the slider image adjustment operations, 
        * This is called when any slider or textbox is called.
        **/
        applySliderChangeChange: function (id, newValue, needsUpdate)
        {
            var pThis = this;

            // Split the ID and get the action
            var idSplit = id.split("_");
            var action = idSplit[idSplit.length - 1];

            // Call a method depending on the caleld action
            switch (action)
            {
                case "Contrast":
                    pThis.adjustContrast(newValue);
                    break;
                case "Bright":
                    pThis.adjustBrightness(newValue);
                    break;
                case "GammaCorrection":
                    pThis.adjustGammaCorrection(newValue);
                    break;
                default:
            }

            if (needsUpdate)
            {
                pThis.updateImage();
            }
        },

        /**
        * On toggle Colour Channel Controls
        **/
        toggleColourChannel: function (id, needsUpdate) {
            var pThis = this;
            var idSplit = id.split("_");
            var colour = idSplit[idSplit.length - 1];
            var toggleButton = $("#" + id);
            var isActive = $(toggleButton).hasClass("ChannelActive");
            if (isActive)
            {
                $(toggleButton).removeClass('ChannelActive').addClass('ChannelDisabled');
                $(toggleButton).removeClass(colour + "ChannelActive").addClass(colour + "ChannelDisabled");
            }
            else
            {
                $(toggleButton).removeClass('ChannelDisabled').addClass('ChannelActive');
                $(toggleButton).removeClass(colour + "ChannelDisabled").addClass(colour + "ChannelActive");
            }

            switch (colour)
            {
                case "Red":
                    RED_CHANNEL = !isActive;
                    break;
                case "Green":
                    GREEN_CHANNEL = !isActive;
                    break;
                case "Blue":
                    BLUE_CHANNEL = !isActive;
                    break;
                default:
            }

            if (needsUpdate)
            {
                //set small delay to allow the styles to take effect
                setTimeout(function () { pThis.updateImage(); }, 50);
            }
        },

        updateImage: function ()
        {
            var uncorrectedImage = document.getElementById("uncorrectedImage");
            var uncorrectedImageCtx = uncorrectedImage.getContext('2d');
            var originalPixels = uncorrectedImageCtx.getImageData(0, 0, uncorrectedImage.width, uncorrectedImage.height);
            var destinationCanvas = document.getElementById("adjustmentsCanvasStore");
            destinationCanvas.width = uncorrectedImage.width;
            destinationCanvas.height = uncorrectedImage.height;
            var destinationCanvasCtx = destinationCanvas.getContext('2d');
            destinationCanvasCtx.putImageData(PxlViewer.ImageAdjustments.PxlCalculateAdjustment(originalPixels), 0, 0);
            $("#adjustmentsCanvasStore").css("width", uncorrectedImage.width + "px");
            $("#adjustmentsCanvasStore").css("height", uncorrectedImage.height + "px");
            $("#adjustmentsCanvasStore").css("top", "0px");
            $("#adjustmentsCanvasStore").css("left", "0px");
            $("#adjustmentsCanvasStore").css("position", "absolute");
            $("#adjustmentsCanvasStore").css("display", "block");
        },

        clearTileCache: function () {
            var pThis = this;
            if (pThis.base.viewer.drawer != null)
            {
                if ($("#" + pThis.base.menu.options._menuIDs.adjustments).hasClass("menubadgeActive")) {
                    pThis.base.viewer.drawer.destroy();
                    pThis.base.viewer.drawer.reset();
                    pThis.base.viewer.drawer.update();
                }
            }
        },
        
        /**
        * On toggle Sharpen Filter
        **/
        toggleSharpenFilter: function (id)
        {
            var pThis = this;
            var isChecked = $("#" + id).is(':checked');
            if (SHARPEN_FILTER != isChecked)
            {
                SHARPEN_FILTER = isChecked;
                this.updateImageRequest();
            }
        },
        
        /**
        * Attach all adjustemtns related events
        **/
        _hookAdjustmentPanelEvent: function ()
        {
            var pThis = this;
            // Colour Channel buttons
            $(".ChannelButton").mouseup(function ()
            {
                var id = $(this).attr("id");
                pThis.toggleColourChannel(id, true);
            });

            // sharpen filter on toggle
            $(".sharpenSwitch>.onoffswitch-label").mouseup(function () {
                var id = "myonoffswitch_sharpenFilter";
                var isChecked = $("#" + id).is(':checked');
                if (isChecked) {
                    $(this).removeClass("check");
                } else {
                    $(this).addClass("check");
                }
                $("#" + id).prop("checked", !isChecked);
                //time set to allow the class to change before the heavy processing of the canvas starts. This is to prevent the slow / stickyness of the on/offswitch
                setTimeout(function () {pThis.toggleSharpenFilter(id);}, 50);
                       
            });

            // Adjustments reset All Button
            $("#adjustments_ResetAllBtn").mouseup(function ()
            {
                pThis.resetAllAdjustments(true);
            });

            // Adjustments Apply Button
            $("#adjustments_ApplyAllBtn").mouseup(function () {
                pThis.applyAllAdjustments();
            });
        },

        applyAllAdjustments: function ()
        {
            this.clearTileCache();
            this.exitAdjustmentsMode();
            $("#view1,#viewerMenu > div > div,.scrollablemenusection").unbind("click").click(pxl.keyboardNavigationBindEvent);
            $('#' + this.base.internalProperties.bindKeyboardNavigarionArea).focus();
            this.base.viewer.navigator.forceRedraw();
        },

        // Reset all the image adjustments back to thei defaults.
        resetAllAdjustments: function (applyToCanvas)
        {
            var pThis = this;
            $(".sharpenSwitch>.onoffswitch-label").removeClass("check");
            // Reset the shrpen filter if it has been enabled
            if ($(".sharpenSwitch>input[type='checkbox']").is(':checked'))
            {
                $(".sharpenSwitch>input[type='checkbox']").attr("checked", false);
                SHARPEN_FILTER = false;
                pThis.updateImageRequest();
            }

            // Reset all of the sliders and text boxes
            $('.imageAdjustmentsPanelSliderControl').each(function ()
            {
                var id = $(this).attr("id");
                var start = parseInt($(this).attr("sliderValue"));
                var textBox = $(this).parent().siblings(".imageAdjustmentsPanelSliderTextBox");
                var currentValue = $(this).val();
                if (id.indexOf("GammaCorrection") > -1)
                {
                    currentValue = parseFloat($(this).val());
                    start = parseFloat($(this).attr("sliderValue"));
                }
                if (currentValue != start)
                {
                    $(this).val(start);
                    textBox.val(start);
                    pThis.applySliderChangeChange(id, start, false);
                }
            });


            // Reset all the colour channels backs to active
            $(".ChannelButton").each(function() 
            {
                var id = $(this).attr("id");
                var isDisabled = $(this).hasClass("ChannelDisabled");

                // If any of the channels have been disbled, enable them again
                if (isDisabled)
                {
                    pThis.toggleColourChannel(id, applyToCanvas);
                }
            });

            if (applyToCanvas)
            {
                pThis.updateImage();
            }

        },

        // Foreach of the textboxes
        applyTextBoxValue: function(textBox, slider, keycode, stepValue, min, max) {
            {
                var id = $(textBox).parent().attr("id");
                var finalValue;
                //If we are tabbling, we wont want to process any further
                if (keycode == 9) {
                    return false;
                }
                if (keycode == 109 || keycode == 173) {
                    return false;
                }
                if ($(textBox).val().length == 1) {
                    if ($(textBox).val() == "-")
                        return false;
                }
                if ($(textBox).val().length == 0) {
                    return false;
                }

                var currentValue = $(textBox).val();
                var indexOfComma = $(textBox).val().indexOf(',');
                if (indexOfComma > -1) {
                    currentValue[indexOfComma] = '.';
                    $(textBox).val(currentValue);
                }
                // Check that the input is valid
                if (!isNaN(parseFloat(currentValue))) {
                    // If this is a gamma slider we want to parse the value as a float
                    if (id.indexOf("GammaCorrection") > -1) {
                        finalValue = parseFloat(currentValue);
                    } else {
                        finalValue = parseInt(currentValue);
                    }
                } else {
                    // If the input is not valid, we set it to the parsed miniumum
                    finalValue = min;
                }

                // If the value is more than the max, we set it to the max
                if (finalValue > max) {
                    finalValue = max;
                }
                // And the same with the minimum
                else if (finalValue < min) {
                    finalValue = min;
                }

                // If the current key pressed is a full stop or a decimal or comma
                if (keycode == 110 || keycode == 190 || keycode == 188) {
                    // if there are 2 decimal points the value becomes invalid , so set it to the minumum
                    if (($(this).val().split('.').length - 1) >= 2) {
                        finalValue = min;
                    } else {
                        // If we are on our first decimal point, we want to let the user continue
                        return false;
                    }
                }
                // up key
                else if (keycode == 38) {
                    finalValue += stepValue;
                }
                //down key
                else if (keycode == 40) {
                    finalValue -= stepValue;
                }

                // If this is the gamma slider we want to parse as float, apply the new value to the textbox and the slider
                if (id.indexOf("GammaCorrection") > -1) {
                    $(textBox).val(parseFloat(finalValue));
                    $(slider).val(parseFloat(finalValue));
                    this.applySliderChangeChange(id, parseFloat(finalValue), true);
                } else {
                    $(textBox).val(parseInt(finalValue));
                    $(slider).val(parseInt(finalValue));
                    this.applySliderChangeChange(id, parseInt(finalValue), true);
                }

                return true;
            }
        },
        /**
        * Render the Slider controls
        **/
        activateAdjustentSliderControls: function () {
            var typingTimer;
            var typingTimerInterval = 500;
            var pThis = this;
            // For each of this type of slider control
            $('.imageAdjustmentsPanelSliderControl').each(function ()
            {
                var slider = this;
                var min = parseInt($(this).attr("minValue"));
                var max = parseInt($(this).attr("maxValue"));
                var start = parseInt($(this).attr("sliderValue"));
                var stepVal = 1;
                var id = $(this).attr("id");

                // If its a gamma slider, we want to display floats
                if (id.indexOf("GammaCorrection") > -1)
                {
                    stepVal = 0.1;
                    min = parseFloat($(this).attr("minValue"));
                    max = parseFloat($(this).attr("maxValue"));
                    start = parseFloat($(this).attr("sliderValue"));
                }

                // Render the slider
                $(this).noUiSlider({
                    orientation: "horizontal",
                    direction: "ltr",
                    start: [start],
                    range:
                    {
                        'min': [min],
                        'max': [max]
                    },
                    step: stepVal
                });

                // Get the relevant textBox
                var textBox = $(this).parent().siblings(".imageAdjustmentsPanelSliderTextBox");

                $(this).on("set", function (event) {
                    // Get the value from the slider
                    var value = parseInt($(this).val());
                    if (id.indexOf("GammaCorrection") > -1) {
                        value = parseFloat($(this).val());
                    }
                    if (event.originalEvent === undefined)
                    {
                        pThis.applySliderChangeChange(id, value, true);
                    }
                    else
                    {
                        pThis.applySliderChangeChange(id, value, false);
                    }

                });

                // On slide change the value in the textbox
                $(this).on("slide", function () {
                    // Get the value from the slider
                    var value = parseInt($(this).val());
                    // If this is a gamma slider we are working with floats
                    if (id.indexOf("GammaCorrection") > -1) {
                        value = parseFloat($(this).val());
                    }
                    // Set the textbox to the new value of the slider
                    textBox.val(value);
                });

                // On tab if the textbox is invalid, we want to set the value back to the current value fo the slider
                $(textBox).focusout(function ()
                {
                    clearTimeout(typingTimer);
                    if ($(this).val().length == 0 || isNaN(parseFloat($(this).val())))
                    {
                        if (id.indexOf("GammaCorrection") > -1)
                        {
                            $(this).val(parseFloat($(slider).val()));
                        }
                        else
                        {
                            $(this).val(parseInt($(slider).val()));
                        }
                    }
                });

                // On keydown we set an interval on .5 seconds to allow the user to complete typing in the desired value. 
                // when the interval is up we apply the value to the textbox 
                $(textBox).keydown(function (event)
                {
                    var keycode = event.keyCode;
                    if (keycode != 38 && keycode != 40)
                    {
                        clearTimeout(typingTimer);
                        typingTimer = setTimeout(function ()
                        {
                            pThis.applyTextBoxValue(textBox, slider, keycode, stepVal, min, max);
                        }, typingTimerInterval);
                    }
                    else
                    {
                        pThis.applyTextBoxValue(textBox, slider, keycode, stepVal, min, max);
                    }
                });
            });
        },

        toggleDisplaySlideStoreForLoad: function ()
        {
            $("#adjustmentsCanvasStore").toggle();
        },

        enterAdjustmentsMode: function () {
            var pThis = this;
            this.isAdjustmentsMode = true;
            this.base.viewer.setMouseNavEnabled(false);
            this.base.viewer.navigator.setMouseNavEnabled(false);
            $("#loadingPanel_imageAdjustmentsPanel").show();
            var loadingPanelInterval = setInterval(function ()
            {
                if (!pThis.base.viewer.drawer.needsUpdate())
                {
                    clearInterval(loadingPanelInterval);
                    $("#loadingPanel_imageAdjustmentsPanel").hide();
                    // focuses on an element which is not the keyboard navigation area so it does not trigger
                    // key events while in adjustments mode
                    pThis.base.unbindKeyboardFocusEvents();
                    $('#' + pThis.base.internalProperties.unboundKeyboardNavigarionArea).focus();
                }
            }, 500);
        },

        exitAdjustmentsMode: function () {
            this.base.menu.SetActiveOff(this.base.menu.options._menuIDs.adjustments);
            $('#' + this.base.menu.options._floatingPanels.imageAdjustmentsPanelID).hide();
            this.clearCanvas("adjustmentsCanvasStore");
            this.clearCanvas("uncorrectedImage");
            if (this.available) {               
                this.isAdjustmentsMode = false;
                this.base.viewer.setMouseNavEnabled(true);
                this.base.viewer.navigator.setMouseNavEnabled(true);
                ADJUST_SLIDE = true;
                this.clearTileCache();
            }
        },


        /**
        * Toggles the image adjustments panel
        **/
        toggleImageAdjustmentsPanel: function ()
        {
            var pThis = this;

            // If the panel does not exist create it
            if (!$('#' + pThis.base.menu.options._floatingPanels.imageAdjustmentsPanelID).length)
            {
                pThis._createImageAdjustmentsPanel();
                pThis._hookAdjustmentPanelEvent();
            }
            else // otherwise just show the existing one
            {
                $('#' + pThis.base.menu.options._floatingPanels.imageAdjustmentsPanelID).show();
            }

            // Are we toggling to on or off
            if ($("#" + pThis.base.menu.options._menuIDs.adjustments).hasClass("menubadgeActive"))
            {
                pThis.exitAdjustmentsMode();
            }
            else if (this.available)
            {
                pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.adjustments);
                if ($('#' + pThis.base.menu.options._menuIDs.zstacks).hasClass("menubadgeActive")) {
                    pThis.base.zstacks.toggleZStacksPanel(pThis.base, false);
                }

                if ($('#' + pThis.base.menu.options._menuIDs.rotate).hasClass("menubadgeActive")) {
                    pThis.base.menu.toggleRotationControl();
                }

                this.updateImageRequest();

                pThis.enterAdjustmentsMode();
            }
            else
            {
                pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.adjustments);
                $('#unavailablePanel_imageAdjustmentsPanel').show();
            }
        },

        updateImageRequest: function ()
        {
            var pThis = this;
            var imageRequest = pThis.base.GetImageSourceForScreenSizedImage();
            var uncorrectedImage = document.getElementById("uncorrectedImage");

            $("#uncorrectedImage").css("width", pThis.base.viewer.drawer.canvas.width + "px");
            $("#uncorrectedImage").css("height", pThis.base.viewer.drawer.canvas.height + "px");
            $("#uncorrectedImage").css("top", "0px");
            $("#uncorrectedImage").css("left", "0px");
            $("#uncorrectedImage").css("position", "absolute");
            $("#uncorrectedImage").css("display", "none");
            var uncorrectedImageCtx = uncorrectedImage.getContext('2d');
            uncorrectedImageCtx.restore();

            var img = new Image();

            //to allow image adjustments from another domain
            img.crossOrigin = 'anonymous';
            img.width = imageRequest.width;
            img.height = imageRequest.height;
            uncorrectedImage.width = pThis.base.viewer.drawer.canvas.width;
            uncorrectedImage.height = pThis.base.viewer.drawer.canvas.height;

            img.onerror = function (evt)
            {
                //exit as the imageserver cannot return the correct image
                PxlViewer.util.Debug.DisplayAlertMessage("Unable to load the required image at this time");
                pThis.exitAdjustmentsMode();
            }

            img.onload = function ()
            {
                uncorrectedImageCtx.save();
                uncorrectedImageCtx.translate(uncorrectedImage.width / 2, uncorrectedImage.height / 2);

                // Rotate the canvas degree                       
                uncorrectedImageCtx.rotate(pThis.base.viewer.viewport.getRotation() * Math.PI / 180);

                // Move registration point back to the top left corner of canvas
                uncorrectedImageCtx.translate(-uncorrectedImage.width / 2, -uncorrectedImage.height / 2);

                var ct = pThis.base.viewer.viewport.viewportToImageCoordinates(pThis.base.viewer.viewport.getCenter(true));
                var centerViewerImageX = ct.x;
                var centerViewerImageY = ct.y;
                var centerRequestedImageX = (imageRequest.x + (imageRequest.width / 2)) * imageRequest.z;
                var centerRequestedImageY = (imageRequest.y + (imageRequest.height / 2)) * imageRequest.z;

                //work out the left and top to position the image in the center.
                var left = (uncorrectedImage.width / 2) - (img.width / 2);
                var top = (uncorrectedImage.height / 2) - (img.height / 2);

                //calculate the shift between the requested images center point and the current center point on screen
                var shiftLeft = (centerViewerImageX - centerRequestedImageX) / imageRequest.z;
                var shiftTop = (centerViewerImageY - centerRequestedImageY) / imageRequest.z;
                left = left - shiftLeft;
                top = top - shiftTop;

                //draw the imaeg onto the canvas
                uncorrectedImageCtx.drawImage(img, left, top);

                //update the 
                pThis.updateImage();
                $("#loadingPanel_imageAdjustmentsPanel").hide();
                $('#' + pThis.base.internalProperties.unboundKeyboardNavigarionArea).focus();
            };

            img.src = imageRequest.src;
        },

        prepareForHamaSlide: function ()
        {
            GAMMA = 1.8;

            // If image adjustments is not available in the current browser, we want to do the GAMMA correction on the iamge server
            if (this.available)
            {
                // Set variable so that openseadragon can pre-process the tiles from the iamge server
                ADJUST_SLIDE = true;
            }
        },

        // If the broswer does not support image adjustments we need to do gmama correction for hamamatsu images on the image server
        getGammaValueForImageServer: function() 
        {
            // If the image adjustments is availbe
            if (this.available) 
            {
                return 0;
            } 
            else
            {
                return GAMMA;
            }
        },

        clearCanvas: function (id)
        {
            var canvas = document.getElementById(id);
            var context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = "none";
        },

        prepareImageAdjustments: function ()
        {
            var pThis = this;
            this.available = true;

            // Check if the browser is IE10 - CORS is not available (needed for client side canvas manipulation)
            if (window.OpenSeadragon.Browser.vendor == window.OpenSeadragon.BROWSERS.IE && window.OpenSeadragon.Browser.version == 10)
            {
                this.available = false;
            }

            // Determine the file type to see if we need any automatic pre-processing
            var url = pThis.base.images[pThis.base.currentImage].url;
            var fileType = url.substr(url.lastIndexOf('.') + 1);
            if (fileType == "ndpi")
            {
                pThis.prepareForHamaSlide();
            }
            else
            {
                pThis.populateDefaultGlobalVariables();
            }

            // Set the slider to the NEW Gamma value (if any)
            if ($('#' + pThis.base.menu.options._floatingPanels.imageAdjustmentsPanelID).length)
            {
                $('#sliderControl_sliderControl_GammaCorrection').attr('sliderValue', GAMMA);
                pThis.resetAllAdjustments(false);
            }

            return this.available;
        },

        instigateDiscardAdjustmentsChangesDialog: function (onAcceptDialog) {
            var dialogHeader = "Unapplied Image Adjustments";
            var dialogMessage = "Are you sure you would like to discard your unapplied image adjustments?";
            var dialogAcceptText = "Yes";
            var dialogAcceptEvent = "window.pxl.ImageAdjustments.resetAllAdjustments(false); window.pxl.ImageAdjustments.applyAllAdjustments(); " + onAcceptDialog;
            var dialogDeclineText = "No";

            $('body').append((PxlViewer.util.GetBlackoutOverlay(1)));
            $('body').append(PxlViewer.util.CreateCustomDialog(1, dialogHeader, dialogMessage, dialogAcceptText, dialogAcceptEvent, dialogDeclineText, ""));
        },

        /**
        * Destroys the ImageAdjustments holder. This means that all of its associated elements are removed.
        * @function
        **/
        destroy: function ()
        {
            
        }
    });

    PxlViewer.ImageAdjustments.IsSharpen = function () {
        if (SHARPEN_FILTER)
        {
            return 1;
        }
        else
        {
            return 0;
        }
    }

    PxlViewer.ImageAdjustments.AdjustPixel = function (channelValue, contrastFactor, channel)
    {
        if (!channel)
        {
            channelValue = 0;
        }
        else
        {
            if (GAMMA != 1)
            {
                channelValue = 255 * Math.pow((channelValue / 255), (1 / GAMMA));
            }
            if (BRIGHTNESS != 1)
            {
                channelValue = channelValue + BRIGHTNESS;
            }
            if (CONTRAST != 1)
            {
                channelValue = (contrastFactor * (channelValue - 128)) + 128;
            }
        }
        if (channelValue > 255)
        {
            channelValue = 255;
        }
        else if (channelValue < 0)
        {
            channelValue = 0;
        }
        return channelValue;
    }

    PxlViewer.ImageAdjustments.PxlCalculateAdjustment = function (pixels)
    {
        var d = pixels.data;
        var contrastFactor = (259 * (CONTRAST + 255)) / (255 * 259 - CONTRAST);
        for (var i = 0; i < d.length; i += 4)
        {
            var r = d[i];
            var g = d[i + 1];
            var b = d[i + 2];

            d[i] = this.AdjustPixel(r, contrastFactor, RED_CHANNEL);
            d[i+1] = this.AdjustPixel(g, contrastFactor, GREEN_CHANNEL);
            d[i+2] = this.AdjustPixel(b, contrastFactor, BLUE_CHANNEL);
        }

        return pixels;
    };
}(PxlViewer));