/// <reference path="PxlViewer.js" />
/// <reference path="./Core/PRES/js/util.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
* Default Measurements Properties on init
* @function
*/
(function (PxlViewer)
{
    PxlViewer.Measurements = function (options, base)
    {
        this.options =
        {
            attachElementID: "view1",
        };
        this.internalProperties =
            {
            debugMode: false,
            attributes: {
                centre: null, // the seadragon coordinates of the centre prosition converted to image coordinates
                viewerSize: [], // the width and height of the viewer panel
                viewportW: 0, // the viewer panel width
                viewportH: 0, // the viewer panel height
                truezoom: 0, // the real zoom value that is sent to the image server of the curent zoom
                overviewZoom: 0, // the imageserver value for the overview zoom level
                width: 0, // the real width of the iamge being viewed i.e. taking zoom into account
                height: 0, // the real height of the iamge being viewed i.e. taking zoom into account
                varW: 0, // same as width above
                varH: 0, // same as height above
                realCentreX: 0, // the actual x coordiatres of the centre of the screen taking zoom into account
                realCentreY: 0, // the actual y coordiatres of the centre of the screen taking zoom into account
                varX: 0, // the x coordinates of the top left hand corner of the screen
                varY: 0, // the y coordinates of the top left hand corner of the screen
                lastConstructedURL: null, // the last constructed screenshot url sent to the imageserver
                isDraw: false, // is the screenshot being drawn
                dx: 0,  // the x coordinates of the top left hand corner of the draw area
                dy: 0, // the y coordinates of the top left hand corner of the draw area
                dw: 0, // the width of the draw area
                dh: 0, // the height of the draw area
                whiteSpaceOffset: { x: 0, y: 0, xmax: 0, ymax: 0 } // this  is the whitespace offset of the image
            },

            drawAttributes:
            {
                enabled: false,
                drawingCanvas: null,
                line: null,
                isDown: false,
                origX: 0,
                origY: 0,
                label: null
            },

             activeMeasurementID : 0,
            };

        // Overrides default options with the passed in user options.
        var permissions;
        if (pxl.options.measurements != null)
        {
            permissions =
            {
                 permissions: pxl.options.measurements.permissions
            }
            $.extend(this.options, options);
            this.options.createPermissions = permissions;
        }
        this.base = base;
    };

    $.extend(PxlViewer.Measurements.prototype,
        {

        _init: function (base, parent)
        {

        },

        /**
        * Toggles the Measurements panel
        **/
        togglePanel: function ()
        {
            var controlID = this.base.menu.options._menuIDs.measurements;

            // Check if we need to clear the annotations canvas when switching from annotations to measurements
            if (this.base.annotations.canvas != null)
            {
                this.base.annotations.canvas.clear();
            }

            // If the measurements panel exists
            if ($("#measurementPanel").length)
            {
                // If the panel is active shrink the panel and de-active it
                if ($("#" + controlID).hasClass('menubadgeActive'))
                {
                    pxl.menu._shrinkPanel();
                    this.base.menu.SetActiveOff(controlID);
                } 
                else // otherwise retrive the measruements and append it to the panel
                {
                    $("#leftPanel").html($('#measurementPanel'));
                    this.getMeasurements("measurementPanel", false);
                }
            } 
            else // If the measurements panel does not exist, create it from scratch
            {
                var outputControl;
                outputControl = $(document.createElement('div'));
                outputControl.attr("id", "measurementPanel");
                outputControl.attr("class", "measurementPanel");
                $("#leftPanel").html(outputControl);
                this.getMeasurements("measurementPanel", true);
            }
        },

        /**
        * Gets the measurements from the server
        *
        * outputControlID:  This is the name of the panel to which we append the measurements to
        *
        * callWebService:   Determines if we call the webservice to get the measurements, if not we just 
        *                   use whats already in the "completeMeasurementList"
        **/
        getMeasurements: function (outputControlID, callWebService)
        { 
            var pThis = this;
            var currentImageID = this.base.images[this.base.currentImage].id;

            // We obtain measurements for a fiven Image ID
            if (currentImageID > 0)
            {
                // Call the webservice in order to popualte the "completeMeasurementList"
                if (callWebService) 
                {
                    ViewerWebService.GetMeasurements($("#hiddenGuid").val(), currentImageID, function (response)
                    {
                        var ob = jQuery.parseJSON(response);

                        // Create a new array to hold the measurements returned from the server 
                        pThis.base.measurements.completeMeasurementList = new Array();

                        // For each parsed object from the response
                        for (var i = 0; i < ob.length; i++)
                        {
                            // Push the object onto the measurements list
                            pThis.base.measurements.completeMeasurementList.push(ob[i][0]);
                        }

                        // Update the counter on the left hand menu
                        pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.measurements, pThis.base.measurements.completeMeasurementList.length);

                        // Make sure that there is a valid measurements panel ID, generate the markup
                        if (outputControlID.length > 0)
                        {
                            pThis._GenerateMeasurementsMarkup(outputControlID);
                        }

                    }, function() { PxlViewer.console.log("Could not retrieve measurements "); });
                }
                else
                {
                    // We are not calling the webservice we will jsut generate the markup with whatever is in "completeMeasurementList"
                    if (pThis.base.measurements.completeMeasurementList.length)
                    {
                        pThis._GenerateMeasurementsMarkup(outputControlID);
                    }
                }

                //setTimeout(function() { pxl.onRotate(); }, 0); // refresh the canvas so that it realises that it has been updated
            }
        },

        /**
        * Gernates the markup for measurements and appends it to a given panel ID
        *
        * outputControlID:  This is the name of the panel to which we append the measurements to
        *
        **/
        _GenerateMeasurementsMarkup: function (outputControlID)
        {
            var pThis = this;
            // Clear the current contents of the panel
            $("#" + outputControlID).empty();

            // Add the header to the top of the panel
            $("#" + outputControlID).append(pThis.base.menu.createPanelHeaderControl("measurementsHeader", "Measurements (<span class='measurementsHeaderCounter'>" + pThis.base.measurements.completeMeasurementList.length + "</span>)", "", "panelHeader"));

            // Add the buttons to the top of the panel (Linear and Area)
            if (pxl.measurements.options.createPermissions.permissions.length)
            {
                $("#" + outputControlID).append(pThis.base.measurements._createMeasurementsHeaderContol(pxl.measurements.options.createPermissions));
            }

            // For each of the object in the completeMeasurementList create a new panel object
            for (var i = 0; i < pThis.base.measurements.completeMeasurementList.length; i++)
            {
                $("#" + outputControlID).append(pThis.base.measurements._createMeasurementDataContol(pThis.base.measurements.completeMeasurementList[i]), false);
            }

            // Update the count of measurements on the left hand panel
            pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.measurements, pThis.base.measurements.completeMeasurementList.length);

            // Bind the relevant events for the mesaurement type buttons (Linear / Area)
            pThis._bindEvents();

            // If the menu is has not expanded, we are opening it for the first time
            if (!$("#leftMenuHolder").hasClass('menuexpanded'))
            {
                // bind the relevant events to the new "Share" / "Edit" / "Delete" / "Info" buttons
                pThis._bindGeneralEvents();

                // Expand the panel and set the measurements badge to active
                pThis.base.menu._expandPanel();
                pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.measurements);
            }
            else // We are here if the menu has already been expanded
            {
                // Figure out if we are coming from a panel which is already in an expandable state
                var shrinkPanel = true;
                for (x in pThis.base.menu.options._menuOptionsThatTriggerPanel)
                {
                    if (pThis.base.menu.options._menuOptionsThatTriggerPanel[x] != pThis.base.menu.options._menuIDs.measurements)
                    {
                        if ($('#' + pThis.base.menu.options._menuOptionsThatTriggerPanel[x]).hasClass('menubadgeActive'))
                        {
                            shrinkPanel = false;
                            break;
                        }
                    }
                }

                pxl.menu.SetScaleParameters();

                // Either shrink or Expand the panel
                if (shrinkPanel)
                {
                    pThis.base.menu._shrinkPanel(); // close menu
                    pThis.base.annotations.canvas.clear(); // clear the canvas
                }
                else
                {
                    pThis._bindGeneralEvents(); // hookup events
                    pThis.base.menu.SetActiveOffAllPanelItems();
                    pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.measurements);
                }

            }
        },

        /**
        * Create one measurement section for the measurements panel
        *
        * measurementObject:    The measurement object the section will be based of
        * isEditMode:           If it is edit mode or not (will show different controls if we are editing the measurement)
        *                       (i.e. the colour pallette / Save / Cancel / Name Text box instead of label) 
        **/
        _createMeasurementDataContol: function (measurementObject, isEditMode)
        {
            // Get a local copy of each of the objects for readibility
            var id = measurementObject.ID;
            var name = measurementObject.Name;
            var shape = measurementObject.Shape;
            var colour = measurementObject.Color;
            var published = measurementObject.Published;
            var canDelete = measurementObject.CanDeleteAnnotation;
            var canPublish = measurementObject.CanPublishAnnotation;
            var measurement = measurementObject.Measurement;

            // Get the bulk of the section (This is any of the details of the measurement name / measurement, and the relevant controls if we are editing)
            var measureInnerDetailsDiv = this._createMeasurementsDetailsDiv(id, name, shape, isEditMode, colour, measurement);

            // Determine and markup the controls along the bottom of the section (Share / Edit / Delete / Info)
            var innerControlsDiv = this._createMeasurementsInnerControlsDiv(id, canPublish, canDelete, published);

            // Set up the "Mustache" template so that the different markup can be injected in
            var tmpl = "\
                <div class='measureDataControl' id='measure_{{id}}' annoID='{{id}}' > \
                    <div id='measureDetails_{{id}}' class='measureDetailsDiv blendBackground'>\
                        <div id='measureinnerDetailsContianer_{{id}}' class='measureinnerDetailsContainer noBorder'>\
                            {{{measureInnerDetailsDiv}}}\
                        </div>\
                        {{{innerControlsDiv}}}\
                        </div>\
               </div >";

            // Render the template with the injected markup
            return Mustache.render(tmpl, { id: id, measureInnerDetailsDiv: measureInnerDetailsDiv, innerControlsDiv: innerControlsDiv });
        },

        /**
        * Gets the Controls div (Share / Edit / Delete / Info)
        *
        * id:           The ID of the measurement
        * canPublish:   Can the user publish the measurement
        * canDelete:    Can the user delete the measurement
        * published:    Is the measurement already published
        **/
        _createMeasurementsInnerControlsDiv: function (id, canPublish, canDelete, published)
        {
            // Create some variabled to hold the various markups
            var sharingDiv = "";
            var editDiv = "";
            var deleteDiv = "";
            var publishLbl = "";
            var infoDiv = "";

            // Generate the publish button markup if the user has permission
            if (canPublish)
            {
                var sharingCheckBox = PxlViewer.util.GetToggleSwitch(id, published, "sharingMeasurementSwitch");
                publishLbl = PxlViewer.util.GetHTMLLabel("PublishLbl_" + id, "annoActionsLbl publishLbl", "Sharing", "myonoffswitch_" + id);
                sharingDiv = PxlViewer.util.GetHTMLDiv("publishDiv_" + id, "onoffswitch ", sharingCheckBox);
            }
            // Generate the delete button markup if the user has permission
            if (canDelete)
            {
                var editIconDiv = PxlViewer.util.GetHTMLDiv("editIcon_" + id, "edit", "");
                var editLbl = PxlViewer.util.GetHTMLLabel("editLbl_" + id, "annoEditLbl", "Edit");

                if (!canPublish)
                    editDiv = PxlViewer.util.GetHTMLDiv("editDiv_" + id, "annoEditDiv measureEditBtn noBorder noMargin", editIconDiv + editLbl);
                else
                    editDiv = PxlViewer.util.GetHTMLDiv("editDiv_" + id, "annoEditDiv measureEditBtn", editIconDiv + editLbl);

                var deleteIconDiv = PxlViewer.util.GetHTMLDiv("deleteIcon_" + id, "delete", "");
                var deleteLbl = PxlViewer.util.GetHTMLLabel("deleteLbl_" + id, "annoDeleteLbl", "Delete");
                deleteDiv = PxlViewer.util.GetHTMLDiv("deleteDiv_" + id, "annoDeleteDiv measurementDeleteBtn", deleteIconDiv + deleteLbl);
            }

            // All users can see the info of a measurement
            var infoIconDiv = PxlViewer.util.GetHTMLDiv("annoInfo_" + id, "info", "");
            var infoLbl = PxlViewer.util.GetHTMLLabel("infoLbl_" + id, "annoInfoLbl", "Info");

            if (!canDelete)
                infoDiv = PxlViewer.util.GetHTMLDiv("infoDiv_" + id, "annoInfoDiv infoBtn noBorder", infoIconDiv + infoLbl);
            else
                infoDiv = PxlViewer.util.GetHTMLDiv("infoDiv_" + id, "annoInfoDiv infoBtn", infoIconDiv + infoLbl);

            return PxlViewer.util.GetHTMLDiv("innerControls_" + id, "innerControls", sharingDiv + publishLbl + editDiv + deleteDiv + infoDiv);
        },

        /**
        * Gets the Main body of the measurement section
        *
        * id:           The ID of the measurement
        * name:         The name of the measurement
        * shape:        The shape of the measurement (linear / area )
        * isEditable:   Does the user have permission to edit the measurement
        * colour:       The colour of the measurement
        * measurement:  The value of the measurement
        **/
        _createMeasurementsDetailsDiv: function (id, name, shape, isEditable, colour, measurement)
        {
            // If we are in edit mode we want to have additional controls in the markup (i.e. the colour pallette / Save / Cancel / Name Text box instead of label) 
            if (isEditable)
            {
                var nameTextBox = PxlViewer.util.GetHTMLTextArea("measureName_" + id, "measureEditableTextArea measureName", name);

                var measureShapeIcon = PxlViewer.util.GetHTMLDiv("measureType_" + id, "measureType " + shape + "Anno", "");

                var descriptionlbl = PxlViewer.util.GetHTMLLabel("measureDes_" + id, "measureEditableTextArea annoDes annoDetails", measurement);

                var headerDivEditable = PxlViewer.util.GetHTMLDiv("measureHeader_" + id, "measureHeader", nameTextBox + measureShapeIcon + descriptionlbl);

                var colourPicker = PxlViewer.util.GetHTMLColourPicker("measureColour_" + id, "strokeColor annoColourControl", colour);

                var saveBtnLbl = PxlViewer.util.GetHTMLLabel("saveLbl_" + id, "annoActionsText", "Save");
                var saveBtnDiv = PxlViewer.util.GetHTMLDiv("saveBtn_" + id, "annoActionsBtn saveBtn", saveBtnLbl);

                var cancelBtnLbl = PxlViewer.util.GetHTMLLabel("cancelLbl_" + id, "annoActionsText", "Cancel");
                var editBtnDiv = PxlViewer.util.GetHTMLDiv("cancelBtn_" + id, "annoActionsBtn cancelBtn", cancelBtnLbl);

                return PxlViewer.util.GetHTMLDiv("measureInnerDetailsDiv_" + id, "measureInnerDetailsDiv", headerDivEditable + colourPicker + saveBtnDiv + editBtnDiv);
            }
            else
            {
                // Otherwise display this section in a view only mode
                var nameField = PxlViewer.util.GetHTMLLabel("measureName_" + id, "measureName measureDetails", name);

                var measureShapeIconReadOnly = PxlViewer.util.GetHTMLDiv("measureType_" + id, "measureType " + shape + "Anno", "");

                var descriptionLabel = PxlViewer.util.GetHTMLLabel("measureDes_" + id, "measureEditableTextArea annoDes annoDetails", measurement);

                var headerDivRead = PxlViewer.util.GetHTMLDiv("measureHeader_" + id, "measureHeader", nameField + measureShapeIconReadOnly + descriptionLabel);

                return PxlViewer.util.GetHTMLDiv("measureInnerDetailsDiv_" + id, "measureInnerDetailsDiv", headerDivRead);
            }
        },

        /**
        * Generate the markup for the measurement type buttons (Linear / Area)
        *
        * permissionSet:    The permission set from the options(permission for each measurement type)
        **/
        _createMeasurementsHeaderContol: function (permissionSet)
        {
            var additionalClasses = "";

            // Generate the templates
            var outertmpl = "\
                    <div class='measurementsHeaderControl {{additionalClasses}}' id='measurementsHeaderControl' > \
                    {{{innerContent}}}\
                    </div>";
            var tmpl = "{{#permissions}} \
                      <div id='{{name}}' class='{{cssClass}}' onclick='{{event}}'>  </div>   \
                 {{/permissions}}";
            // Render the inner template
            var innerTemplate = Mustache.render(tmpl, permissionSet);

            // Return the whole rendered HTML
            return Mustache.render(outertmpl, { additionalClasses: additionalClasses, innerContent: innerTemplate.toString() });
        },

        /**
        * Creates the Measurements panel and appends it to the canvas
        **/
        _createPanel: function ()
        {
            var pThis = this;
            var measurementsPanelID = pThis.base.menu.options._menuIDs.measurements;
            var headerText = "Measurements";

            // Header for panel
            var headerLabel = PxlViewer.util.GetHTMLLabel("headerLabel_" + measurementsPanelID, "dialogHeaderLabel", headerText);
            var headerPanel = PxlViewer.util.GetHTMLDiv("headerDiv_" + measurementsPanelID, "dialogHeaderDiv", headerLabel);

            // Mode Panel
            var linearButton = PxlViewer.util.GetHTMLDivButton("linearMeasurementsButton", "LinearMeasaurementsActive measurementButton", "", "");
            var areaButton = PxlViewer.util.GetHTMLDivButton("areaMeasurementsButton", "areaMeasurementsActive measurementButton", "", "");
            var modePanel = PxlViewer.util.GetHTMLDiv("innerPanel_Mode", "measurementsInnerPanel", linearButton + areaButton);

            // Info Panel
            var measurementValueTxt = "0";
            var measurementMetricText = "μm";
            var measurementValueLabel = PxlViewer.util.GetHTMLLabel("measurementValue", "measurementsContentLabel", measurementValueTxt);
            var measurementMetricLabel = PxlViewer.util.GetHTMLLabel("measurementMetric", "measurementsContentLabel", measurementMetricText);
            var measurementValuePnl = PxlViewer.util.GetHTMLDiv("innerPanel_measurementValue", "measurementsInnerPanel", measurementValueLabel + measurementMetricLabel);

            // Action Buttons
            var saveButtonLbl = PxlViewer.util.GetHTMLLabel("measaurements_saveLbl", "measurementsBtnText", "Save");
            var saveButtonDiv = PxlViewer.util.GetHTMLDiv("measaurements_saveBtn", "measurementsBtn", saveButtonLbl);
            var buttonsPanel = PxlViewer.util.GetHTMLDiv("innerPanel_MeasurementButtons", "measurementsInnerPanel", saveButtonDiv);

            var panelContent = PxlViewer.util.GetHTMLDiv("measaurementsPanelContent", "measaurementsPanelContent", modePanel + measurementValuePnl + buttonsPanel);

            var imageAdjustmentPanel = PxlViewer.util.GetHTMLDiv(measurementsPanelID, "measurementsPanel", headerPanel + panelContent);

            $("#viewerHolder").append(imageAdjustmentPanel);
            pThis._bindEvents();
        },

        /**
        * Binds relevent events for Measurements Panel
        **/
        _bindEvents: function ()
        {
            var pThis = this;
            $('#measureLinear').click(function ()
            {
                pThis.drawLinear();
            });

            $('#measureArea').click(function ()
            {

            });
        },

        /**
        * Delete a given measurement
        *
        * annotationObjectID:   The ID of the measurement
        **/
        _deleteMeasurement: function (annotationObjectID)
        {
            var annotationID = annotationObjectID;
            var pThis = this;
            // Send a request to delete the mesurement
            ViewerWebService.DeleteAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, annotationID, function (response)
            {
                // Remove the measurement object from the array
                var annoIndex = pThis.base.annotations._getIndexOfAnnotationObjectFromArray(pThis.base.measurements.completeMeasurementList, "ID", annotationID);
                pThis.base.measurements.completeMeasurementList.splice(annoIndex, 1);

                // Remove the measurement section from the panel
                $('#measure_' + annotationID).remove();

                // Update the count on the left hand menu
                pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.measurements, pThis.base.measurements.completeMeasurementList.length);

                // Clear the canvas so that the deleted measurment is no longer displayed
                pThis.base.annotations.canvas.clear();

                if (pThis.base.annotations.isEditMode)
                {
                    pThis.base.annotations.exitEditMode();
                }

                pThis.base.annotations.currentSelectedAnnotation = null;
                pxl.options.measurements.startNumber -= 1;
            }, function () { PxlViewer.console.log("Could not delete measurement"); });

            // Clear the mesaurements drawing canvas incase we were in edit mode when we deleted the measurement
            if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null)
            {
                pxl.measurements.internalProperties.drawAttributes.drawingCanvas.clear();
            }

            // Update the canvas to reflect the changes
            pThis.base.annotations.update();
        },

        /**
        * Shares a given measurement object
        *
        * annotationObjectID:   The ID of the measurement
        **/
        _publishMeasurement: function (annotationObject)
        {
            PxlViewer.util.Debug.log("Measurements._publishMeasurement");
            var annotationID = annotationObject.ID;

            ViewerWebService.ShareAnnotation($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, annotationID, function (response)
            {
                var labelText = $('#publishLbl_' + annotationID).text();
                if (labelText == "Share")
                {
                    $('#publishLbl_' + annotationID).text("Unshare");
                }
                else
                {
                    $('#publishLbl_' + annotationID).text("Share");
                }

                // Invert the published status in the local array so that when the menu is closed 
                // and opened again the measurement hve the correct published state
                var index = pxl.annotations._getIndexOfAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", annotationID);
                pxl.measurements.completeMeasurementList[index].Published = !pxl.measurements.completeMeasurementList[index].Published;
            }, function () { PxlViewer.console.log("Could not share Measurement"); });
        },

        /**
        * Check that the conditions allow measurements to be available (e.g. not available on JPEG images)
        **/
        isAvailable: function ()
        {
            var mag = this.base.images[this.base.currentImage].info.mag;
            var ext = this.base.images[this.base.currentImage].info.ext;

            if (mag == "-1" || ext == "Jpeg")
            {
                return false;
            }

            return true;
        },

        /**
        * Bind the events for each of the inner controls div (Share / Edit / Delete / info)
        **/
        _bindGeneralEvents: function ()
        {
            var pThis = this;
            // Toggles the sharing of a Measurement
            $(".sharingMeasurementSwitch>input[type='checkbox']").off('change').change(function ()
            {
                var id = $(this).parent().parent().parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.completeMeasurementList, "ID", id);
                pThis.base.measurements._publishMeasurement(annoObj);
            });

            // Deletes an Measurement and removes it from the list
            $('.measurementDeleteBtn').off('click').click(function ()
            {
                var id = $(this).parent().parent().parent().attr("annoID");
                var dialogHeader = "Delete Measurement";
                var dialogMessage = "Are you sure you would like to delete this measurement?";
                var dialogAcceptText = "Yes";
                var dialogAcceptEvent = "window.pxl.measurements._deleteMeasurement(" + id + ");";
                var dialogDeclineText = "No";

                // Create custom dialog for deleting an Measurement
                $('body').append(pThis.base.annotations._getBlackoutOverlay(id));
                $('body').append(PxlViewer.util.CreateCustomDialog(id, dialogHeader, dialogMessage, dialogAcceptText, dialogAcceptEvent, dialogDeclineText, ""));
            });

            // Shows a pop up with additional Measurement information
            $('.infoBtn').off('click').click(function ()
            {
                PxlViewer.util.Debug.debug("Event: infoBtn click");
                // Setup custom dialog parameters for additional information of an annotation
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.measurements.completeMeasurementList, "ID", id);

                var dialogHeader = "Measurement Information";
                var dialogMessage = "Created on: " + annoObj.CreatedOn + "<br /> Created by: " + annoObj.CreatedBy;
                var dialogAcceptText = "Close";

                // Create custom dialog for showing additional information of an annotation
                $('body').append(pThis.base.annotations._getBlackoutOverlay(id));
                $('body').append(PxlViewer.util.CreateCustomDialog(id, dialogHeader, dialogMessage, dialogAcceptText, "", "", ""));
            });

            // Enters edit mode for Measurement and its details
            $('.measureEditBtn').off('click').click(function ()
            {
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.completeMeasurementList, "ID", id);

                $('#measurementPanel').css('height', '6000px');
                var isEditable = true;
                // Swap the details container with one that supports editing
                $('#measureinnerDetailsContianer_' + id).html(pThis._createMeasurementsDetailsDiv(id, annoObj.Name, annoObj.Shape, isEditable, annoObj.Color, annoObj.Measurement));

                // Apply the events for the edit mode buttons (colour control / cancel / save)
                pThis._bindEditEvents();

                $(this).parent().parent().parent().addClass("editMeasurementMode");
                pxl.measurements.internalProperties.activeMeasurementID = annoObj.ID;
            });

            if (pThis.base.options.annotations.isHoldToEdit)
            {
                // Apply class to measurements details to initiate animation
                $('.measureDetailsDiv').off('taphold').bind('taphold', function ()
                {
                    if (!$(this).parent().hasClass("activeMeasurement"))
                    {
                        pThis.options.showControls = true;
                        pThis._activateMeasurement(this, pThis.options.showControls);
                    }
                });

                // Apply class to measurements details to initiate animation
                $('.measureDetailsDiv').off('click').click(function ()
                {
                    if (!$(this).parent().hasClass("activeMeasurement"))
                    {
                        pThis.options.showControls = false;
                        pThis._activateMeasurement(this, pThis.options.showControls);
                    }
                });
            }
            else
            {
                // Apply class to measurements details to initiate animation
                $('.measureDetailsDiv').off('click').click(function ()
                {
                    if (!$(this).parent().hasClass("activeMeasurement"))
                    {
                        pThis.options.showControls = true;
                        pThis._activateMeasurement(this, pThis.options.showControls);
                    }
                });

                // this will catch the user clicking on the description after the measurements has already loaded
                $('.measureInnerDetailsDiv').off('click').click(function ()
                {
                    if ($(this).parent().parent().parent().hasClass("activeMeasurement") &&
                        !$(this).parent().parent().parent().hasClass("editMeasurementMode"))
                    {
                        var openingID = $(this).parent().parent().parent().attr("annoID");
                        var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", openingID);
                        pThis.base.annotations._loadAnnotation(annoObj);
                    }
                });
            }

            $(document).off('keyup').keyup(function (event)
            {
                // If enter is pressed then hide keyboard.
                if (event.keyCode == 13) {
                    $("input").blur();
                }
            });

        },

        /**
        * Determines if there are any measurements in the canvas and returns the the index of where the measurement is in canvas objects
        **/
        _getActiveMeasurementID: function()
        {
            var activeAnno = 0;
            if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null) {
                for (var i = 0; i < pxl.measurements.internalProperties.drawAttributes.drawingCanvas._objects.length; i++) {

                    // Make sure the object is not the label applied to the canvas for the measurement
                    if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas._objects[i].type != "text")
                    {
                        activeAnno = i;
                    }
                }
            }
            return activeAnno;
        },

        /**
        * Update the colour of the measurement and the drawing colour
        * 
        * color: the colour which the measurement needs to be changed to
        *
        **/
        _updateCanvasColor: function (color)
        {
            var activeAnno = this._getActiveMeasurementID();

            pxl.measurements.internalProperties.drawAttributes.drawingCanvas.freeDrawingBrush.color = color;
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas._objects[activeAnno].stroke = color;
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas._objects[activeAnno].cornerColor = color;
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas._objects[activeAnno].borderColor = color;
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas._objects[activeAnno].bringForward();
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas.renderAll();
        },

        /**
        * This saves attribute information for a measurement (Name / Colour)
        * 
        * measurementObject: The measurement object which needs to be saved
        *
        **/
        _saveMeasurementDetails: function (measurementObject)
        {
            var encodedAnnotation = "[" + JSON.stringify(measurementObject) + "]";
            ViewerWebService.UpdateAnnotationTextAndColor($("#hiddenGuid").val(), encodedAnnotation,
                function (response) { },
                function () { PxlViewer.util.Debug.DisplayAlertMessage("failed"); });
            return;
        },

        /**
        * Binds the events for edit mode (Colour control / Cancel / Save buttons)
        **/
        _bindEditEvents: function ()
        {
            var pThis = this;

            // Renders this div element with the class to a spectrum colour control
            $(".strokeColor").spectrum({
                showPaletteOnly: true,
                clickoutFiresChange: true,
                hideAfterPaletteSelect: true,
                // Customise the onChange event
                change: function ()
                {
                    var id = $(this).parent().parent().parent().parent().attr("annoID");
                    var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.completeMeasurementList, "ID", id);

                    // Set the colour from the current selected
                    annoObj.Color = $(this).spectrum("get").toHexString();

                    // If we are drawing update the colour on measurements canvas
                    if (pxl.measurements.internalProperties.drawAttributes.enabled)
                    {
                        pThis._updateCanvasColor($(this).spectrum("get").toHexString());
                    }
                    else // Otherwise we are dispalying the measurement so update the colour on the annotation canvas
                    {
                        pThis.base.annotations._loadAnnotation(annoObj);
                    }
                },
                // Show the palette with these colours
                showPalette: true,
                palette: [
                    [
                        '#000000', '#FFFFFF', '#FFEBCD',
                        '#FF8000', '#243229'
                    ],
                    ['#FF0000', '#FFFF00', '#008000', '#0000FF', '#EE82EE']
                ]
            });

            // Set the event for the cancel button
            $('.cancelBtn').click(function ()
            {
                var id = $(this).parent().parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.measurements.completeMeasurementList, "ID", id);

                $('#measurementPanel').css('height', 'auto');
                var isEditable = false;

                // Set the markup back to the read only version
                $('#measureinnerDetailsContianer_' + id).html(pThis.base.measurements._createMeasurementsDetailsDiv(id, annoObj.Name, annoObj.Shape, isEditable, annoObj.Color, annoObj.Measurement));

                // Exit measurements edit mode
                pThis.base.annotations.exitEditMode(); // TODO Ryan: Not certian we need this
                pxl.measurements._exitMeasurementMode();

                pxl.measurements.internalProperties.drawAttributes.enabled = false;

                // Clear the canvas if we are in drawing mode
                if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null)
                {
                    pxl.measurements.internalProperties.drawAttributes.drawingCanvas.clear();
                }
                else
                {
                    // Otherwise we are in view mode so clear the annotations canvas
                    pThis.base.annotations.canvas.clear();
                }

                // If this is a brand new measurement, we may not want to save it, so when the user cancels, just delete it
                if (annoObj.ElemX != 0) // TODO Ryan: Find a better way to check if this is a brand new measurement
                {
                    pxl.measurements._deleteMeasurement(id);
                }
                else
                {
                    // Otherwise reload the annotation to its previous state
                    pThis.base.annotations._loadAnnotation(annoObj);
                }
            }),

            // Saves any changes made the information / physical annotation and reverts details to read only mode
            $('.saveBtn').click(function ()
            {
                var id = $(this).parent().parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.measurements.completeMeasurementList, "ID", id);

                $('#measurementPanel').css('height', 'auto');
                annoObj.Name = $("#measureName_" + id).val().trim();

                // If we are in drawing mode we want to save everthing for the measurement (canvas information and attributes)
                if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null)
                {
                    pThis.base.annotations._saveAnnotation(annoObj, false);
                }
                else
                {
                    // We just want to update the details for the measurement (name and colour)
                    pxl.measurements._saveMeasurementDetails(annoObj);
                }

                // Replace the HTML markup with the read only mode
                var isEditable = false;
                $('#measureinnerDetailsContianer_' + id).html(pThis.base.measurements._createMeasurementsDetailsDiv(id, annoObj.Name, annoObj.Shape, isEditable, annoObj.Color, annoObj.Measurement));

                // Add CSS classes (this is how we determine which state the annotaiton is in, in some cases)
                $('#measure_' + id).addClass("activeAnnotation");
                $('#measureDes_' + id).removeClass("verticalEllipsis");
                $('.measureDataControl').removeClass("editMeasurementMode");

                // Exit the measurements mode
                pThis.base.annotations.exitEditMode(); // TODO Ryan: do we need this
                pxl.measurements._exitMeasurementMode();

                pxl.measurements.internalProperties.drawAttributes.enabled = false;

                // Load the measurement in the annotations canvas
                pThis.base.annotations._loadAnnotation(annoObj);

                // Bind the general events again for the inner controls(Share / Edit / Delete / Info)
                pThis.base.measurements._bindGeneralEvents();
            });
        },

        /**
        * This sets a measuremtn to an active state
        * 
        * object:       The measurement object
        * showControls: Show the inner controls
        *
        **/
        _activateMeasurement: function (object, showControls)
        {
            var openingID = $(object).parent().attr("annoID");

            // If we are in edit mode for any measurement we need to instagate the dialog for discarding changes
            if ($(".measureEditableTextArea.measureName").length > 0)
            {
                var onAcceptDialog = "window.pxl.measurements._switchMeasurement(" + openingID + ", " + showControls + ");";
                this.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, openingID, "");
            }
            else // Otherwise just switch to the selected measurement straight away
            {
                $(object).off('mousedown');
                this._switchMeasurement(openingID, showControls);
            }
        },
        
        /**
        * Exit the draw measurement mode
        **/
        _exitMeasurementMode: function ()
        {
            pxl.viewer.setMouseNavEnabled(true); // reenable the mouse slide navigation
            pxl.viewer.navigator.setMouseNavEnabled(true);
            pxl.internalProperties.panning.enabled = true; // reenable the viewer keyboard navigation

            // Just check that the canvas exists
            if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null)
            {
                // Dispose of the canvas altogether its unlikely that it will be used again, and if it is just re-create it
                pxl.measurements.internalProperties.drawAttributes.drawingCanvas.dispose();
                pxl.measurements.internalProperties.drawAttributes.drawingCanvas = null;
            }

            // reset the local attributes
            pxl.measurements.internalProperties.drawAttributes.enabled = false;
            pxl.measurements.internalProperties.drawAttributes.isDown = false;

            // Remove the canvas element
            $('.measureCanvasHolder').parent().remove();
        },

        /**
        * Starts the workflow for the discard measurements dialog
        * 
        * onAccept:     Any additional things that need to be done on accepting the dialog
        * id:           The ID of the measurement
        * onDecline:    Any additional things that need to be done on declining the dialog
        *
        **/
        instigateDiscardMeasurementsChangesDialog: function (onAccept, id, onDecline)
        {
            //check if it has already been created, 
            var alreadyExists = ($("#customDialog_" + id).length > 0);
            if (!alreadyExists)
            {
                var dialogHeader = "Unsaved changes";
                var dialogMessage = "Are you sure you would like to discard your unsaved changes?";
                var dialogAcceptText = "Yes";
                var dialogAcceptEvent = "pxl.measurements.cancelMeasurementChanges(" + id + "); " + onAccept;
                var dialogDeclineText = "No";

                $('body').append(this.base.annotations._getBlackoutOverlay(id));
                $('body').append(PxlViewer.util.CreateCustomDialog(id, dialogHeader, dialogMessage, dialogAcceptText, dialogAcceptEvent, dialogDeclineText, onDecline));
            }
        },

        /**
        * Switching to another measurement
        * 
        * openingID:    The ID of the measurement we are switching to
        * showControls: Do we show the inner controls or not
        * 
        **/
        _switchMeasurement: function (openingID, showControls)
        {
            PxlViewer.util.Debug.log("Annotations._switchAnnotation");
            // Are we switching to measurement on a different region
            if (!PxlViewer.Annotations.processingAnnotationLoad)
            {
                this._setMeasurementDetailsActive(openingID, showControls);
                this._exitMeasurementDetailsEditMode(openingID);
                pxl.annotations.exitEditMode();

                //drive to the Measurement
                var annoObj = pxl.annotations._getAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", openingID);
                this.base.annotations._loadAnnotation(annoObj);
            }
        },

        /**
        * Exit the edit mode of the measurement details (moving to read from write)
        * 
        * measureID:    The ID of the measurement we are exiting from
        * 
        **/
        _exitMeasurementDetailsEditMode: function (measureID)
        {
            var openingID = measureID;
            var pThis = this;

            // For each of the meaurement details that are in edit mode
            $(".measureEditableTextArea.measureName").each(function ()
            {
                var id = $(this).parent().parent().parent().parent().parent().attr("annoID");
                if (id != openingID)
                {
                    var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", id);
                    var isEditable = false;

                    // Update the markup to show the read only markup
                    $('#measureinnerDetailsContianer_' + id).html(pxl.measurements._createMeasurementsDetailsDiv(id, annoObj.Name, annoObj.Shape, isEditable, annoObj.Color, annoObj.Measurement));
                }
            });
        },
        
        /**
        * Set the details of the given measurement to the ACTIVE state
        * 
        * measurementID:    The ID of the measurement we want to switch to
        * showControls:     Do we want to show the inner controls or not
        *
        **/
        _setMeasurementDetailsActive: function (measurementID, showControls)
        {
            // Deactivates all measurements so that we can switch to the relevant one
            this._deactivateAllMeasurementDetails(measurementID);

            if (showControls)
            {
                $('#measureinnerDetailsContianer_' + measurementID).removeClass("noBorder");
                $('#measureDetails_' + measurementID).removeClass("blendBackground");
                $('#innerControls_' + measurementID).show();
            }
            else
            {
                $('#measureinnerDetailsContianer_' + measurementID).addClass("noBorder");
                $('#measureDetails_' + measurementID).addClass("blendBackground");
                $('#innerControls_' + measurementID).hide();
            }

            $('#measure_' + measurementID).addClass("activeMeasurement");
            $('#measureDes_' + measurementID).removeClass("verticalEllipsis");
        },

        /**
        * Go thorugh all of the measurement sections and clean up so that we can open the given measurement
        * 
        * measureID:    The ID of the measurement to be excluded from the bulk closing
        *
        **/
        _deactivateAllMeasurementDetails: function (measureID)
        {
            var pThis = this;
            var openingID = measureID;

            // For each of the measurements sections close if it does not have the given measurement ID
            $(".measureDetailsDiv").each(function ()
            {
                var id = $(this).parent().attr("annoID");
                if (id != openingID)
                {
                    $(this).unbind('mousedown').mousedown(function ()
                    {
                        pThis.options.showControls = true;
                        if (pThis.base.options.annotations.isHoldToEdit)
                        {
                            pThis.options.showControls = false;
                        }
                        pThis._activateMeasurement(this, pThis.options.showControls);
                    });
                }
            });

            $('.measureDataControl').removeClass("activeMeasurement");
            $('.measureDataControl').removeClass("editAnnotationMode");
            $('.annoDes').addClass("verticalEllipsis");
        },

        /**
        * Cancel the changes from edit mode of a measurement
        * 
        * id:    The ID of the measurement that is active
        *
        **/
        cancelMeasurementChanges: function (id)
        {
            var annoObj;
            annoObj = this.base.annotations._getAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", id);

            $('#measurementPanel').css('height', 'auto');
            var isEditable = false;

            // Get the markup for read only measurement
            $('#measureinnerDetailsContianer_' + id).html(this._createMeasurementsDetailsDiv(id, annoObj.Name, annoObj.Shape, isEditable, annoObj.Color, annoObj.Measurement));
            $('.measureDataControl').removeClass("editMeasurementMode");

            // Remove the drawing canvas
            $('.measureCanvasHolder').parent().remove();

            this.base.annotations.canvas.clear();
            
            // If this is a brand new measurement, we may not want to save it, so when the user cancels, just delete it
            // TODO Ryan: Find a better way to check if this is a brand new measurement
            if (annoObj.ElemX != 0)
            {
                pxl.measurements._deleteMeasurement(id);
            }
            else
            {
                // If it is not brand new just realod the measurement on the annotations canvas
                this.base.annotations._loadAnnotation(annoObj);
            }

            pxl.internalProperties.panning.enabled = true;
        },

        _getWindowImageSize: function () {
            PxlViewer.util.Debug.log("Annotations._getWindowImageSize");
            var vp = this.base.viewer.viewport;
            if (vp != null) {
                var info = this.base.images[this.base.currentImage].info;
                var topleft = vp.imageToViewerElementCoordinates(new OpenSeadragon.Point(0, 0));
                var bottomright = vp.imageToViewerElementCoordinates(new OpenSeadragon.Point(info.width - 1, info.height - 1));
                return new OpenSeadragon.Point(bottomright.x - topleft.x, bottomright.y - topleft.y);
            }
            return 0;
        },

        /**
        * Set up the new canvas so that we can being drawing a new linear measurment
        **/
        drawLinear: function ()
        {
            var pThis = this;
            // If the annotations canvas is not null, clear it
            if (this.base.annotations.canvas != null)
            {
                this.base.annotations.canvas.clear();
            }

            // disable the keyboard / mouse navigation
            pxl.viewer.setMouseNavEnabled(false);
            pxl.viewer.navigator.setMouseNavEnabled(false);
            pxl.internalProperties.panning.enabled = false;

            // Create the new drawing canvas
            var viewerSize = this.base.menu.getViewerSize();

            // Used for a random value
            var currentdate = new Date();
            var datetime = currentdate.getSeconds();

            var canvasElement = $("<canvas id='measureCanvas" + datetime + "' class='measureCanvasHolder' width='" + viewerSize[0] + "' height='" + viewerSize[1] + "' style='position:absolute;left:0;top:0;' />");
            $(canvasElement).insertBefore("#" + pThis.options.attachElementID);
            pxl.measurements.internalProperties.drawAttributes.enabled = true;

            setTimeout(function ()
            {
                pThis.internalProperties.drawAttributes.drawingCanvas = canvasElement;

                // Create a new fabric canvas
                pThis.internalProperties.drawAttributes.drawingCanvas = new fabric.Canvas("measureCanvas" + datetime, { selection: false });
                $("#measureCanvas" + datetime).parent().css({ "position": "absolute" });

                // Bind the events for for the new canvas
                pThis.internalProperties.drawAttributes.drawingCanvas.on('mouse:down', pThis._mouseDownEvent);
                pThis.internalProperties.drawAttributes.drawingCanvas.on('mouse:move', pThis._mouseMoveEvent);
                pThis.internalProperties.drawAttributes.drawingCanvas.on('mouse:up', pThis._mouseUpEvent);
            }, 0);

            // Create the linear object and append it to the internal properties
            pThis._createLinear();
        },

        /**
        * Create a new linear object and append a new measurement section to the measurements panel
        **/
        _createLinear: function ()
        {
            var pThis = this;

            var centerPoint = pThis.base.viewer.viewport.getCenter(true);
            centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
            var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
            var startWidth = parseInt(200 * startZoom);
            var startHeight = parseInt(200 * startZoom);
            var startColor = "#FF0000";
            var currRotation = pThis.base.viewer.viewport.getRotation();

            // Assign the default values
            var newAnno = new Object();
            newAnno.ID = 0;
            newAnno.Name = "Name";
            newAnno.Url = "";
            newAnno.StrokeWidth = 3;
            newAnno.Published = false;
            newAnno.AnnotationAngle = 0;
            newAnno.ImageAngle = currRotation;
            newAnno.Shape = "linear";
            newAnno.X = parseInt(centerPoint.x);
            newAnno.Y = parseInt(centerPoint.y);
            newAnno.Width = parseInt(startWidth * startZoom);
            newAnno.Height = parseInt(startHeight * startZoom);
            newAnno.Color = startColor;
            newAnno.CanDeleteAnnotation = true;
            newAnno.CanPublishAnnotation = true;
            newAnno.Measurement = "0μm";

            var vxy = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
            var vwh = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(200, 200));
            newAnno.Width = parseInt(vwh.x - vxy.x);
            newAnno.Height = parseInt(vwh.y - vxy.y);

            // Save the preliminary object the the database so that we can generate the relevant markup for the measurments panel
            pThis.base.annotations._saveAnnotation(newAnno, false);
        },

        /**
        * Create the measurement markup and add it to the measruements panel
        **/
        _addMeasurementToPanel: function (measurementObject) {

            var objectID = measurementObject.ID;

            // Add the new measurement to the array of measurements
            this.base.measurements.completeMeasurementList.push(measurementObject);
            this.base.annotations._exitAnotationDetailsEditMode(-1); //exit all editing

            // Create the markup and insert it into the measurements panel
            var newAnnoPanel = this.base.measurements._createMeasurementDataContol(measurementObject, true);
            $(newAnnoPanel).insertAfter($('#measurementsHeaderControl'));

            // Set the CSS class so that we know what state the measurement is in 
            $("#measureDes_" + objectID).addClass("activeMeasurementValue");

            this.base.measurements.options.showControls = true;
            this.base.measurements._setMeasurementDetailsActive(objectID, this.options.showControls);
            this.base.menu.UpdateCount(this.base.menu.options._menuIDs.measurements, this.completeMeasurementList.length);

            $("#measure_" + objectID).addClass("editMeasurementMode");

            // Bind the events for the new markup that has been generated (Share / edit / delete)
            this._bindGeneralEvents();
            this._bindEditEvents();

            // Set this measurement to be the current active measurement
            pxl.measurements.internalProperties.activeMeasurementID = objectID;

            // Remove the mousedown event to avoid events from under the text elements
            $('#measureDetails_' + objectID).off('mousedown');
        },

        /**
        * Determines what happens when we first click on the canvas when making a measurement
        **/
        _mouseDownEvent: function (o)
        {
            // Clear the canvas so that we can make consecutive measurements without having to save
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas.clear();

            // If the measurements are not enabled we are being blocked by something
            if (!pxl.measurements.internalProperties.drawAttributes.enabled) { return; }

            pxl.measurements.internalProperties.drawAttributes.isDown = true;

            // Get the starting location of the pointer, this will be the starting point of our measurement
            var pointer = pxl.measurements.internalProperties.drawAttributes.drawingCanvas.getPointer(o.e);

            // Set the internal properties of the starting position for easy access during calcualtions of the measurement
            pxl.measurements.internalProperties.drawAttributes.origX = pointer.x;
            pxl.measurements.internalProperties.drawAttributes.origY = pointer.y;

            // Determine the width and height of the measurement
            var width = pointer.x - pxl.measurements.internalProperties.drawAttributes.origX;
            var height = pointer.y - pxl.measurements.internalProperties.drawAttributes.origY;

            // Instantiate the internal property with a default Meaurement
            // TODO Ryan: This will need to be conditional depending on the measurement we want to draw
            pxl.measurements.internalProperties.drawAttributes.line = new fabric.Path(pxl.measurements._GetStaticLinearBookendSVGPath(width, height));
            
            // Create the label for the linear measurement on the canvas
            // TODO Ryan : We probably wont want to do this for area measurement
            pxl.measurements.internalProperties.drawAttributes.label = new fabric.Text("0μm",
            {
                width: 100,
                height: 50,
                left: pxl.measurements.internalProperties.drawAttributes.origX,
                top: pxl.measurements.internalProperties.drawAttributes.origY,
                fontFamily: 'Nunito, Ubuntu, Arial, sans-serif',
                fontSize: 20,
                textBackgroundColor: 'rgba(255,255,255, 0.4)',
            });

            var annoObj = pxl.annotations._getAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", pxl.measurements.internalProperties.activeMeasurementID);
            var strokeColor = annoObj.Color;

            // Setup the default values for the linear measurement
            pxl.measurements.internalProperties.drawAttributes.line.set({
                left: pxl.measurements.internalProperties.drawAttributes.origX,
                top: pxl.measurements.internalProperties.drawAttributes.origY,
                width: 100,
                height: 100,
                fill: 'rgba(0,0,0,0)',
                stroke: strokeColor,
                strokeWidth: 3,
                angle: 0,
                transparentCorners: true,
                centeredScaling: false,
                centeredRotation: false,
                hasBorders: false
            });

            // Add the measurement and the label to the canvas, the label is added last so that its always ontop (helps in the case with the line intersecting the label)
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas.add(pxl.measurements.internalProperties.drawAttributes.line);
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas.add(pxl.measurements.internalProperties.drawAttributes.label);
        },

        /**
        * Returns an SVG path for the linear measurement based on a width and height
        **/
        _GetStaticLinearBookendSVGPath: function (width, height)
        {
            var linearWidth = (width);
            var linearHeight = (height);
            var lengthOflinearBody = Math.sqrt((linearWidth * linearWidth) + (linearHeight * linearHeight));
            var legAngle = Math.acos(linearHeight / lengthOflinearBody);
            var inDegrees = legAngle * 180 / Math.PI;
            var AngRad = (90 - inDegrees) * (Math.PI / 180);
            var LegDif = 90 * (Math.PI / 180);

            var headlen = 10;
            var leg1x = headlen * Math.cos(AngRad + LegDif);
            var leg1y = headlen * Math.sin(AngRad + LegDif);

            var leg2x = headlen * Math.cos(AngRad + -LegDif);
            var leg2y = headlen * Math.sin(AngRad + -LegDif);

            if (linearWidth < 0) {
                leg1x = -leg1x;
                leg2x = -leg2x;
            }
            var path = "";

            // The main linear measurement line
            path += pxl.annotations._createAnnotationMove(0, 0);
            path += pxl.annotations._createAnnotationDrawLine(linearWidth, linearHeight);

            // One "bookend"
            path += pxl.annotations._createAnnotationMove(0, 0);
            path += pxl.annotations._createAnnotationDrawLine(leg1x, leg1y);
            path += pxl.annotations._createAnnotationMove(0, 0);
            path += pxl.annotations._createAnnotationDrawLine(leg2x, leg2y);
            path += "  ";

            // Matching "Bookend"
            path += pxl.annotations._createAnnotationMove(linearWidth, linearHeight);
            path += pxl.annotations._createAnnotationDrawLine(leg1x+linearWidth, leg1y+linearHeight);
            path += pxl.annotations._createAnnotationMove(linearWidth, linearHeight);
            path += pxl.annotations._createAnnotationDrawLine(leg2x + linearWidth, leg2y + linearHeight);

            return path;
        },

        /**
        * Returns a true SVG path for the linear measurement based on starting and ending position, the "Bookends" are scaled with the given zoom
        **/
        _GetStaticLinearBookendSVGPathTEST: function (startX, startY, endX, endY, zoom)
        {
            var headlen = 10 * zoom;

            angle = Math.atan2(startY - endY, startX - endX);
            var leg1X = headlen * Math.cos(angle - Math.PI / 2);
            var leg1Y = headlen * Math.sin(angle - Math.PI / 2);
            var leg2X = headlen * Math.cos(angle + Math.PI / 2);
            var leg2Y = headlen * Math.sin(angle + Math.PI / 2);

            var path = "";
            path += pxl.annotations._createAnnotationMove(endX, endY);
            path += pxl.annotations._createAnnotationDrawLine(startX, startY);

            // the left side of the measurement bookend
            path += pxl.annotations._createAnnotationDrawLine((startX - leg1X), (startY - leg1Y));
            path += pxl.annotations._createAnnotationMove(startX, startY);
            path += pxl.annotations._createAnnotationDrawLine(startX - leg2X, startY - leg2Y);

            // the right side of the measurement bookend
            path += pxl.annotations._createAnnotationMove(endX, endY);
            path += pxl.annotations._createAnnotationDrawLine(endX - leg1X, endY - leg1Y);
            path += pxl.annotations._createAnnotationMove(endX, endY);
            path += pxl.annotations._createAnnotationDrawLine(endX - leg2X, endY - leg2Y);

            var endxcalc = 0;
            var endycalc = 0;


            // Calcualtes any position adjustments that are needed becasue of the addition of the "Bookends"
            if (Math.abs(startX) >= Math.abs(endX) && Math.abs(startY) <= Math.abs(endY)) {
                endxcalc = -(startX - (startX - leg1X));
                endycalc = -(startY - (startY - leg1Y));
            }
            else if (Math.abs(startX) <= Math.abs(endX) && Math.abs(startY) >= Math.abs(endY)) {
                endxcalc = (startX - (startX - leg1X));
                endycalc = (startY - (startY - leg1Y));
            }
            else if (Math.abs(startX) >= Math.abs(endX) && Math.abs(startY) >= Math.abs(endY))
            {
                endxcalc = (startX - (startX - leg1X));
                endycalc = -(startY - (startY - leg1Y));
            }
            else if (Math.abs(startX) <= Math.abs(endX) && Math.abs(startY) <= Math.abs(endY))
            {
                endxcalc = -(startX - (startX - leg1X));
                endycalc = (startY - (startY - leg1Y));
            }

            //endxcalc = ((startX - (startX - leg1X)) * Math.cos(angle));// - ((startY - (startY - leg1Y)) * Math.sin(angle));
            //endycalc = ((startX - (startX - leg1X)) * Math.sin(angle));// + ((startY - (startY - leg1Y)) * Math.cos(angle));

            // Returns an object containing any of the relevant positional changes and the associated path
            var linear =
            {
                xAdjustment: endxcalc,
                yAdjustment: endycalc,
                path: path
            }

            return linear;
        },

        /**
        * Updates the linear object, carried out the relevant calculations and displays them
        **/
        _mouseMoveEvent: function (o)
        {
            if (!pxl.measurements.internalProperties.drawAttributes.enabled) { return; }
            if (pxl.measurements.internalProperties.drawAttributes.isDown == false) { return; }

            // Get the position of the pointer on the canvas
            var pointer = pxl.measurements.internalProperties.drawAttributes.drawingCanvas.getPointer(o.e);

            var width;
            var height;

            // Calcualte the with and the height based on the rotation of the linear measurement
            if (pxl.measurements.internalProperties.drawAttributes.origX > pointer.x)
            {
               width = Math.abs(pxl.measurements.internalProperties.drawAttributes.origX - pointer.x)* -1;
            }
            else
            {
               width = Math.abs(pxl.measurements.internalProperties.drawAttributes.origX - pointer.x);
            }

            if (pxl.measurements.internalProperties.drawAttributes.origY > pointer.y)
            {
                height = Math.abs(pxl.measurements.internalProperties.drawAttributes.origY - pointer.y) * -1;
            }
            else
            {
                height = Math.abs(pxl.measurements.internalProperties.drawAttributes.origY - pointer.y);
            }

            // Get the zoom and calculate the current measurement value
            var zoom = (pxl.images[pxl.currentImage].info.mag / pxl.viewer.viewport.viewportToImageZoom(pxl.viewer.viewport.getZoom() * pxl.images[pxl.currentImage].info.mag));
            var measurement = pxl.measurements._calculateLinearMeasurement(pxl.measurements.internalProperties.drawAttributes.origX, pointer.x, pxl.measurements.internalProperties.drawAttributes.origY, pointer.y, zoom);

            // Update the linear measurement object based on the new positions
            pxl.measurements.internalProperties.drawAttributes.line.path = new fabric.Path(pxl.measurements._GetStaticLinearBookendSVGPath(width, height)).path;

            // Update the label text
            pxl.measurements.internalProperties.drawAttributes.label.text = measurement;

            // Update the label in the measurements panel
            $('#measureDes_' + pxl.measurements.internalProperties.activeMeasurementID).text(measurement);

            // Update the canvas with the new changes
            pxl.measurements.internalProperties.drawAttributes.drawingCanvas.renderAll();
        },

        /**
        * Determines some final attributes for a new linear measurement
        **/
        _mouseUpEvent: function (o)
        {
            if (!pxl.measurements.internalProperties.drawAttributes.enabled) { return; }
            pxl.measurements.internalProperties.drawAttributes.isDown = false;

            // Get the final value of the pointer (this is the end point)
            var pointer = pxl.measurements.internalProperties.drawAttributes.drawingCanvas.getPointer(o.e);

            // Update the annotation object
            var annoObj = pxl.annotations._getAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", pxl.measurements.internalProperties.activeMeasurementID);

            // Get the final value of the measruement
            annoObj.Measurement = $('#measureDes_' + pxl.measurements.internalProperties.activeMeasurementID).text();

            // Determine the final value fo the start and end positions
            var start = new OpenSeadragon.Point(pxl.measurements.internalProperties.drawAttributes.origX, pxl.measurements.internalProperties.drawAttributes.origY);
            var end = new OpenSeadragon.Point(pointer.x, pointer.y);

            var zoom = pxl.images[pxl.currentImage].info.mag / pxl.viewer.viewport.viewportToImageZoom(pxl.viewer.viewport.getZoom() * pxl.images[pxl.currentImage].info.mag);

            var width;
            var height;

            // Determine the width and eight based on rotation
            if (pxl.measurements.internalProperties.drawAttributes.origX > pointer.x)
            {
                width = Math.abs(pxl.measurements.internalProperties.drawAttributes.origX - pointer.x) * -1;
            }
            else
            {
                width = Math.abs(pxl.measurements.internalProperties.drawAttributes.origX - pointer.x);
            }

            if (pxl.measurements.internalProperties.drawAttributes.origY > pointer.y)
            {
                height = Math.abs(pxl.measurements.internalProperties.drawAttributes.origY - pointer.y) * -1;
            }
            else
            {
                height = Math.abs(pxl.measurements.internalProperties.drawAttributes.origY - pointer.y);
            }

            annoObj.Width = parseInt(width * zoom);
            annoObj.Height = parseInt(height * zoom);

            // Update the freehand values with the start and end positions
            annoObj.FreeHandX = start.x + "," + end.x;
            annoObj.FreeHandY = start.y + "," + end.y;
        },

        /**
        * Calculation for the measurement (currently only linear will need to be adapted for other measurement types)
        **/
        _calculateLinearMeasurement: function (startX, endX, startY, endY, annozoom)
        {
            var calcAreaOfPixels = 0;

            var annoWidth = startX - endX;
            var annoHeight = startY - endY;

            if (annoWidth < 0) 
            {
                annoWidth *= -1;
            }

            if (annoHeight < 0)
            {
                annoHeight *= -1;
            }

            calcAreaOfPixels = Math.sqrt(Math.pow(annoWidth, 2) + Math.pow(annoHeight, 2));

            if (calcAreaOfPixels < 0) 
            {
                calcAreaOfPixels *= -1;
            }

            var xscale = pxl.images[pxl.currentImage].xRes;
            var parsedval = parseFloat(calcAreaOfPixels * parseFloat(annozoom) * parseFloat(xscale));
               
            var scale = "μm";
            scale = (parsedval > 1000 ? "mm" : "μm");
            parsedval = (parsedval > 1000 ? (parsedval / 1000).toFixed(2) : Math.round(parsedval));

            return parsedval + scale;
        },

        /**
        * Clean up function when destroying the measurements object
        **/
        destroy: function ()
        {
            if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null)
            {
                pxl.measurements.internalProperties.drawAttributes.drawingCanvas.clear();
                pxl.measurements.internalProperties.drawAttributes.drawingCanvas.dispose();
                pxl.measurements.internalProperties.drawAttributes.drawingCanvas = null;
           }
        }
    });

    PxlViewer.Measurements.SomePublicFunction = function ()
    {
        return 0;
    }

}(PxlViewer));