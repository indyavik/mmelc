/// <reference path="PxlSlideLabel.js" />
/// <reference path="PxlViewer.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL
(function (PxlViewer) {


    /**
     *
     * The class which takes care of annotation creation and handling.
     *
     * @class Viewer
     * @classdesc The PxlViewer Annotations class.
     *
     * @memberof PxlViewer
     * @param {PxlViewer.Base} base - The PxlViewer.Base instance
     *
     **/
    PxlViewer.Annotations = function (base, creationPermissions, options) {
        PxlViewer.util.Debug.log("Annotations.base");
        this.options = {
            startNumber: 0,
            createPermissions: {
            },
            initialising: false,
            showControls: false,
            isScreenshot: false,
            cornerSize: 34
        };

        PxlViewer.Annotations.hasWebServiceBeenCalled = false;
        // this will be true when an annotaiton is being switched so that two calls to 
        // load an annotation cannot be called at the same time
        PxlViewer.Annotations.processingAnnotationLoad = false; 
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        $.extend(this.options.createPermissions, creationPermissions);
        this.currentSelectedAnnotation = null;
        this.base = base;
        this._init(base, false, this.options.createPermissions);
    };

    $.extend(PxlViewer.Annotations.prototype, {
        _init: function(base, parent, creationPermissions) {
            PxlViewer.util.Debug.log("Annotations._init");
            var pThis = this;
            this.base = base;
            if (base.viewer != null && base.viewer.viewport != null) {
                this.origImgSize = this._getWindowImageSize();
                if (this.canvas != null) {
                    this.canvas.clear();
                    this.canvas.dispose();
                    this.canvas = null;
                }
                $('#annoCanvas1').empty();
                $(base.viewer.canvas).find("canvas").each(function() {
                    var id = $(this).attr("id");
                    if (id != undefined && id.startsWith("annotationCanvas")) {
                        base.viewer.removeOverlay($(this)[0]);
                        $(this).remove();
                    }
                });

                var bounds = base.viewer.viewport.getBounds();
                var canvasElement = document.createElement("canvas");
                var currentdate = new Date();
                var datetime = currentdate.getSeconds();
                canvasElement.id = "annotationCanvas" + datetime;
                canvasElement.style["position"] = "absolute";
                canvasElement.style["top"] = "0px";
                canvasElement.style["left"] = "0px";
                canvasElement.setAttribute("class", "annotationHolder");
                if (!parent) {
                    // This is an optimisation. StaticCanvas contains no support for drawing/selectable objects.
                    $(base.viewer.canvas).append(canvasElement);
                    base.viewer.addOverlay(canvasElement,
                        new OpenSeadragon.Rect(0, 0, bounds.width, bounds.height),
                        OpenSeadragon.OverlayPlacement.CENTER,
                        function(pos, size, element) {
                            if (pxl != null && !pxl.options.AnnotationUpdateMode)
                            {
                                if (pxl.annotations != undefined)
                                {
                                    pxl.annotations.viewerUpdateAnnotations();
                                }
                            }
                        });
                    // setup the overlay for the annotations to use
                    this.canvas = new fabric.StaticCanvas(canvasElement);
                    this.canvas.selection = false;

                } else {
                    // Use the canvas which supports drawing when we are in drawing mode.
                    $(parent).append(canvasElement);
                    this.canvas = new fabric.Canvas(canvasElement);
                    this.canvas.freeDrawingBrush.width = 3;
                    this.canvas.selection = true;
                }

                this.canvas.setWidth(base.viewer.element.clientWidth);
                this.canvas.setHeight(base.viewer.element.clientHeight);

                // this.base = base;
                this.objects = new Array();

                this.group = new fabric.Group([]);
                this.group.selectable = false;
                this.group.width = base.viewer.element.clientWidth / this.base.viewer.viewport.getZoom(true);
                this.group.height = base.viewer.element.clientHeight / this.base.viewer.viewport.getZoom(true);
                this.group.centeredRotation = true;
                this.group.origScaleX = this.group.scaleX;
                this.group.origScaleY = this.group.scaleY;
                this.group.originX = 'center';
                this.group.originY = 'center';
                this.group.perPixelTargetFind = true;

                //create the freehand group
                this.freeHandGroup = new fabric.Group([]);
                this.freeHandGroup.selectable = false;
                this.freeHandGroup.width = this.base.viewer.element.clientWidth / this.base.viewer.viewport.getZoom(true);
                this.freeHandGroup.height = this.base.viewer.element.clientHeight / this.base.viewer.viewport.getZoom(true);
                this.freeHandGroup.centeredRotation = true;
                this.freeHandGroup.origScaleX = this.group.scaleX;
                this.freeHandGroup.origScaleY = this.group.scaleY;
                this.freeHandGroup.originX = 'center';
                this.freeHandGroup.originY = 'center';
                this.freeHandGroup.perPixelTargetFind = true;

                this.canvas.add(this.group);
                this.canvas.add(this.freeHandGroup);
            }
        },
        viewerUpdateAnnotations: function () {
            PxlViewer.util.Debug.log("Annotations.viewerUpdateAnnotations");
            if (($("#leftMenuHolder").hasClass('menuexpanded') && $('#annoPanel').is(":visible")) || ($("#leftMenuHolder").hasClass('menuexpanded') && $('#measurementPanel').is(":visible")) || pxl.isFullScreen) {
                if (PxlViewer.Menu.viewportUpdateTimeout != null) {
                    clearTimeout(PxlViewer.Menu.viewportUpdateTimeout);
                    PxlViewer.Menu.viewportUpdateTimeout = null;
                }
                if (pxl.options.AnnotationUpdateTimeout == undefined || pxl.options.AnnotationUpdateTimeout == 0) {
                    // We dont want to update when we are in edit mode, this causes the annotation to go back to its original position, 
                    // The canvas is locked anyway so we do not need to update
                    if (!pxl.annotations.isEditMode) {
                        this.update();
                    }
                } else {
                    PxlViewer.Menu.viewportUpdateTimeout = setTimeout("pxl.annotations.update();PxlViewer.Menu.viewportUpdateTimeout = null;", pxl.options.AnnotationUpdateTimeout);
                }
            }
        },
        update: function () {
            PxlViewer.util.Debug.log("Annotations.update");
            if (this.canvas != null && this.base.viewer != null && this.base.viewer.viewport != null) {
                // Set location of group object.
                var canvasCentre = this.canvas.getCenter();
                var winCoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(this.base.images[this.base.currentImage].info.width / 2, this.base.images[this.base.currentImage].info.height / 2));
                this.group.left = winCoords.x;
                this.group.top = winCoords.y;

                // Change rotation
                var currRotation = this.base.viewer.viewport.getRotation();
                var centrePoint = new fabric.Point(canvasCentre.left, canvasCentre.top);
                var objectOrigin = new fabric.Point(this.group.left, this.group.top);
                var newLoc = fabric.util.rotatePoint(objectOrigin, centrePoint, currRotation * (Math.PI / 180));

                PxlViewer.util.Debug.debug("currRotation: " + currRotation);
                this.group.left = newLoc.x;
                this.group.top = newLoc.y;

                // Set correct scale.
                var currZoom = this.base.viewer.viewport.getZoom(true);
                //write downt the values
                var zzz = parseInt(this.base.images[this.base.currentImage].info.mag / this.base.viewer.viewport.viewportToImageZoom(this.base.viewer.viewport.getZoom() * this.base.images[this.base.currentImage].info.mag));

                this.group.scaleX = this.group.origScaleX;
                this.group.scaleY = this.group.origScaleY;
                this.group.scaleX *= currZoom;
                this.group.scaleY *= currZoom;
                for (var i = 0; i < this.objects.length; i++) {
                    var annot = this.objects[i];
                    annot.obj.strokeWidth = 3 * (1 / currZoom);
                    //annot.obj.angle = annot.AnnotationAngle - currRotation;
                    annot.obj.angle = currRotation + annot.AnnotationAngle;
                    if (!this.editMode || annot.type == "free") {
                        var ct = this.base.viewer.viewport.viewportToImageCoordinates(this.base.viewer.viewport.getCenter(true));
                        var gxy = this._imageToGroupCoordinates(new OpenSeadragon.Point(annot.origDimensions.x, annot.origDimensions.y));
                        var gwhStart = this._imageToGroupCoordinates(new OpenSeadragon.Point(annot.origDimensions.x, annot.origDimensions.y), true);
                        var gwh = this._imageToGroupCoordinates(new OpenSeadragon.Point(annot.origDimensions.x + annot.origDimensions.width, annot.origDimensions.y + annot.origDimensions.height), true);

                        //annot.obj.angle = currRotation - annot.AnnotationAngle;

                        annot.obj.left = gxy.x;
                        annot.obj.top = gxy.y;

                        annot.obj.width = gwh.x - gwhStart.x;
                        annot.obj.height = gwh.y - gwhStart.y;

                        if (annot.type == "ellipse") {
                            annot.obj.rx = gwh.x - gwhStart.x;
                            annot.obj.ry = gwh.y - gwhStart.y;
                            annot.obj.rx = annot.obj.rx / 2;
                            annot.obj.ry = annot.obj.ry / 2;
                        }
                        else if (annot.type == "arrow") {
                            annot.obj.left = gxy.x;
                            annot.obj.top = gxy.y;
                            var path = "";
                            //this is put in to cover jpegs that have a mag of 0
                            if (zzz == 0) {
                                zzz = 1;
                            }

                            var arrowWidth = annot.origDimensions.width;
                            var arrowHeight = annot.origDimensions.height;
                            PxlViewer.util.Debug.debug("Annotations.update w=" + arrowWidth + " , h=" + arrowHeight);

                            var lengthOfArrowBody = Math.sqrt((arrowWidth * arrowWidth) + (arrowHeight * arrowHeight));
                            var legAngle = Math.acos(arrowHeight / lengthOfArrowBody);
                            var inDegrees = legAngle * 180 / Math.PI;
                            var AngRad = (90 - inDegrees) * (Math.PI / 180);
                            var LegDif = 32 * (Math.PI / 180);
                            var headlen = lengthOfArrowBody / 5;

                            var leg1x = headlen * Math.cos(AngRad + LegDif);
                            var leg1y = headlen * Math.sin(AngRad + LegDif);
                            var leg2x = headlen * Math.cos(AngRad + -LegDif);
                            var leg2y = headlen * Math.sin(AngRad + -LegDif);


                            if (arrowWidth < 0) {
                                leg1x = -leg1x;
                                leg2x = -leg2x;
                            }


                            PxlViewer.util.Debug.debug(headlen + "|" + leg1x + "|" + leg1y + "|" + leg2x + "|" + leg2y + "|");

                            path += this.base.annotations._createAnnotationMove(0, 0);
                            path += this.base.annotations._createAnnotationDrawLine((arrowWidth / zzz) / currZoom, (arrowHeight / zzz) / currZoom);
                            path += this.base.annotations._createAnnotationMove(0, 0);
                            path += this.base.annotations._createAnnotationDrawLine(((leg1x / zzz) / currZoom), ((leg1y / zzz) / currZoom));
                            path += this.base.annotations._createAnnotationMove(0, 0);
                            path += this.base.annotations._createAnnotationDrawLine(((leg2x / zzz) / currZoom), ((leg2y / zzz) / currZoom));
                            path += " z";

                            annot.obj.path = (new fabric.Path(path)).path;

                        }
                        else if (annot.type == "free" || annot.type == "linear")
                        {
                            var path = "";
                            var mag = this.base.images[this.base.currentImage].info.mag;
                            var viewportzoom = this.base.viewer.viewport.imageToViewportZoom(this.base.images[this.base.currentImage].info.mag);
                            var viewportBaseZoom = viewportzoom / mag;
                            //PxlViewer.util.Debug.debug("CC debug: ((annot.origDimensions.x) - ct.x): " + ((annot.origDimensions.x) - ct.x) + "\nannot.origDimensions.x: " + annot.origDimensions.x);
                            var xx = ct.x + ((annot.origDimensions.x - ct.x));
                            var yy = ct.y + ((annot.origDimensions.y - ct.y));

                            //PxlViewer.util.Debug.debug("CC debug: ct.x: " + ct.x + "\nxx: " + xx);
                            //The slide will position to the center of the annotation so the we need to position the annotation relative to its own center 
                            if (annot.type == "free")
                            {
                                xx -= annot.origDimensions.width / 2;
                                yy -= annot.origDimensions.height / 2;
                            }

                            if (mag == "-1")
                            {
                                xx += (annot.obj.width / 2);
                                yy += (annot.obj.height / 2);
                            }

                            //PxlViewer.util.Debug.debug("CC debug: annot.origDimensions.height / 2: " + annot.origDimensions.height / 2 + "\nxx: " + xx);

                            //PxlViewer.util.Debug.debug("CC debug: xx: " + xx + "\nannot.origDimensions.width: " + annot.origDimensions.width);

                            //calulate the centre point of the annotation and then rotate it to reposition the annotation inline wiht the current rotation
                            var viewerCoOrds2 = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(xx,yy));
                            var viewAnnotationLocation = fabric.util.rotatePoint(new fabric.Point(viewerCoOrds2.x, viewerCoOrds2.y), centrePoint, currRotation * (Math.PI / 180));

                            //PxlViewer.util.Debug.debug("CC debug: viewerCoOrds2");
                            //PxlViewer.util.Debug.debug(viewerCoOrds2);
                            //PxlViewer.util.Debug.debug("CC debug: viewAnnotationLocation");
                            //PxlViewer.util.Debug.debug(viewAnnotationLocation);
                            //make sure the freehand group is in the correct place
                            this.freeHandGroup.width = this.base.viewer.element.clientWidth;
                            this.freeHandGroup.height = this.base.viewer.element.clientHeight;
                            this.freeHandGroup.left = 0;
                            this.freeHandGroup.top = 0;
                            //PxlViewer.util.Debug.debug("CC debug: this.base.viewer.element.clientWidth: " + this.base.viewer.element.clientWidth);

                            annot.obj.strokeWidth = annot.origStrokeWidth * annot.origZoom;
                            
                            //scale the group for the current zoom
                            var scaleFactor = currZoom / viewportBaseZoom;
                            annot.obj.strokeWidth = annot.origStrokeWidth / scaleFactor;
                            this.freeHandGroup.scale(scaleFactor);
                            this.freeHandGroup._objects = new Array();
                         
                            annot.obj.left = viewAnnotationLocation.x / this.freeHandGroup.scaleX;
                            annot.obj.top = viewAnnotationLocation.y / this.freeHandGroup.scaleY;

                            //PxlViewer.util.Debug.debug("CC debug: currZoom: " + currZoom + "\nviewportBaseZoom:" + viewportBaseZoom + "\nscaleFactor:" + scaleFactor + "\nviewAnnotationLocation.x:" + viewAnnotationLocation.x + "\nviewAnnotationLocation.x:" + viewAnnotationLocation.x + "\nthis.freeHandGroup.scaleX:" + this.freeHandGroup.scaleX + "\nannot.obj.left:" + annot.obj.left);
                            //add this freehand to the current freehand group
                            this.freeHandGroup.add(annot.obj);
                        }
                    }
                    else
                    {
                        annot.obj.strokeWidth = 3;

                        var vxy = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annot.origDimensions.x, annot.origDimensions.y));
                        var vwh = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annot.origDimensions.x + annot.origDimensions.width, annot.origDimensions.y + annot.origDimensions.height));

                        annot.obj.left = vxy.x;
                        annot.obj.top = vxy.y;
                        annot.obj.width = vwh.x - vxy.x;
                        annot.obj.height = vwh.y - vxy.y;

                        if (annot.type == "ellipse")
                        {
                            annot.obj.rx = vwh.x - vxy.x;
                            annot.obj.ry = vwh.y - vxy.y;
                            annot.obj.rx = annot.obj.rx / 2;
                            annot.obj.ry = annot.obj.ry / 2;
                        }

                        if (annot.type == "arrow")
                        {
                            annot.obj.left = vxy.x;
                            annot.obj.top = vxy.y;
                            var path = "";
                            //this is put in to cover jpegs that have a mag of 0
                            if (zzz == 0) {
                                zzz = 1;
                            }
                            var arrowWidth = (annot.origDimensions.width / zzz);
                            var arrowHeight = (annot.origDimensions.height / zzz);
                            var lengthOfArrowBody = Math.sqrt((arrowWidth * arrowWidth) + (arrowHeight * arrowHeight));
                            var legAngle = Math.acos(arrowHeight / lengthOfArrowBody);
                            var inDegrees = legAngle * 180 / Math.PI;
                            var AngRad = (90 - inDegrees) * (Math.PI / 180);
                            var LegDif = 32 * (Math.PI / 180);

                            var headlen = lengthOfArrowBody / 5;
                            var leg1x = headlen * Math.cos(AngRad + LegDif);
                            var leg1y = headlen * Math.sin(AngRad + LegDif);
                            var leg2x = headlen * Math.cos(AngRad + -LegDif);
                            var leg2y = headlen * Math.sin(AngRad + -LegDif);

                            if (arrowWidth < 0) {
                                leg1x = -leg1x;
                                leg2x = -leg2x;s
                            }

                            //write downt the values
                            path += this.base.annotations._createAnnotationMove(0, 0);
                            path += this.base.annotations._createAnnotationDrawLine(arrowWidth, arrowHeight);
                            path += this.base.annotations._createAnnotationMove(0, 0);
                            path += this.base.annotations._createAnnotationDrawLine(leg1x, leg1y);
                            path += this.base.annotations._createAnnotationMove(0, 0);
                            path += this.base.annotations._createAnnotationDrawLine(leg2x, leg2y);
                            path += " z";

                            annot.obj.path = (new fabric.Path(path)).path;
                            
                            
                        }
                        //we dont need to have a case for the freehand objects since they do not currently use the drawing canvas. This might be changed when freehand annotations come in
                    }
                }


                // Redraw
               this.canvas.renderAll();

                
                $(this.base.viewer.canvas).find("canvas:hidden").each(function() {
                    var id = $(this).attr("id");
                    if (id != undefined && id.startsWith("annotationCanvas")) {
                        $(this).css({ "display": "block" });
                    }
                });
            }
        },

        loadAnnotationsPanel: function (autoOpen, outputControlID)
        {
            PxlViewer.util.Debug.log("Annotations.loadAnnotationsPanel");
            if (this.base.measurements != null) {
                if (this.base.annotations.canvas != null) {
                    this.base.annotations.canvas.clear();
                }
            }

            if ($("#" + this.base.menu.options._menuIDs.annotation).hasClass('menubadgeActive')) {
                pxl.menu._shrinkPanel();
                pxl.annotations.destroy();
            } else {
                var outputControl;
                if ($("#" + outputControlID).length > 0) {
                    outputControl = $("#" + outputControlID);
                } else {
                    outputControl = $(document.createElement('div'));
                    outputControl.attr("id", "annoPanel");
                    outputControl.attr("class", "annoPanel");
                    outputControlID = "annoPanel";
                }

                $("#leftPanel").html(outputControl);
                //this.retrieveAnnotations(outputControlID, PxlViewer.Annotations.hasWebServiceBeenCalled);
                this.retrieveAnnotations(outputControlID, false);
            }
        },

        addAnnotationToPanel: function(annotation) {
            PxlViewer.util.Debug.log("Annotations.addAnnotationToPanel");
            this.base.annotations.completeAnnotationList.push(annotation);
            this.base.annotations._exitAnotationDetailsEditMode(-1); //exit all editing
            var isEditable = true;
            var newAnnoPanel = this.base.annotations._createAnnotationDataContol(annotation.ID, annotation.Name, annotation.Description, annotation.Url, annotation.Shape, annotation.Published, annotation.CanPublishAnnotation, annotation.CanDeleteAnnotation, isEditable, annotation.Color);
            $(newAnnoPanel).insertAfter($('#anHeaderControl'));
            this.options.showControls = true;
            this.base.annotations._setAnnotationDetailsActive(annotation.ID, this.options.showControls);
            this.base.menu.UpdateCount(this.base.menu.options._menuIDs.annotation, this.base.annotations.completeAnnotationList.length); // updates the count for the annotations .

            this._hookGeneralEvents();
            this._hookEditEvents();

            // Remove the mousedown event to avoid events from under the text elements
            $('#annodetails_' + annotation.ID).off('mousedown');
        },

        retrieveAnnotations: function (outputControlID, webServiceCalled) {
            PxlViewer.util.Debug.log("Annotations.retrieveAnnotations");
            var pThis = this;
            if (this.base.images[this.base.currentImage].id > 0) {
                if (webServiceCalled == false)
                {
                     var ccID = getQueryStringValueFromParameter("clin");
                    var clinicalCaseID = parseInt(ccID);
                    if (ccID != "")
                    {
                        
                        ViewerWebService.GetAnnotationsForXpert($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, clinicalCaseID,
                           function (response) {
                             
                               var ob = jQuery.parseJSON(response);
                               pThis.base.annotations.completeAnnotationList = new Array();
                               PxlViewer.Annotations.hasWebServiceBeenCalled = true;
                               for (var i = 0; i < ob.length; i++) {
                                   pThis.base.annotations.completeAnnotationList.push(ob[i][0]); // push the annotation object onto the annotation array
                               }

                               pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.annotation, pThis.base.annotations.completeAnnotationList.length);

                           }, function () { PxlViewer.console.log("Could not retrieve annotations "); });
                        }
                      else
                     {
                         ViewerWebService.GetAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id,
                           function (response) {
                               var ob = jQuery.parseJSON(response);
                               pThis.base.annotations.completeAnnotationList = new Array();
                               PxlViewer.Annotations.hasWebServiceBeenCalled = true;
                               for (var i = 0; i < ob.length; i++) {
                                   pThis.base.annotations.completeAnnotationList.push(ob[i][0]); // push the annotation object onto the annotation array
                               }

                               pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.annotation, pThis.base.annotations.completeAnnotationList.length);
                           }, function () { PxlViewer.console.log("Could not retrieve annotations "); });
                     }
                    
                }

                if (PxlViewer.Annotations.hasWebServiceBeenCalled) { // if we have already called the webservice , then lets not waste performance in reloading the annotations through the webservice , instead load from local annotations array
                    PxlViewer.util.Debug.debug("Annotations._createAnnotationDataContol - webServiceCalled");
                    $("#" + outputControlID).empty();
                    $("#" + outputControlID).append(pThis.base.menu.createPanelHeaderControl("annoHeader", "Annotations (<span class='annoHeaderCounter'>" + pThis.base.annotations.completeAnnotationList.length + "</span>)", "", "panelHeader"));
                    $("#" + outputControlID).append(pThis.base.annotations._createAnnotationHeaderContol(pxl.annotations.options.createPermissions));
                    for (var i = 0; i < pThis.base.annotations.completeAnnotationList.length; i++) {
                        if (pThis.base.annotations.completeAnnotationList[i] && pThis.base.annotations.completeAnnotationList[i].Shape != "linear")
                        {
                            var isEditable = false;
                            $("#" + outputControlID).append(pThis.base.annotations._createAnnotationDataContol(pThis.base.annotations.completeAnnotationList[i].ID, pThis.base.annotations.completeAnnotationList[i].Name, pThis.base.annotations.completeAnnotationList[i].Description, pThis.base.annotations.completeAnnotationList[i].Url, pThis.base.annotations.completeAnnotationList[i].Shape, pThis.base.annotations.completeAnnotationList[i].Published, pThis.base.annotations.completeAnnotationList[i].CanPublishAnnotation, pThis.base.annotations.completeAnnotationList[i].CanDeleteAnnotation, isEditable, pThis.base.annotations.completeAnnotationList[i].Color));
                            if (pThis.base.annotations.completeAnnotationList[i].Url == "Weblink" || pThis.base.annotations.completeAnnotationList[i].Url == "") {
                                $('#annoHyperLink_' + pThis.base.annotations.completeAnnotationList[i].ID).hide();
                            }
                        }
                    }
                    pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.annotation, pThis.base.annotations.completeAnnotationList.length);
                    pThis._hookEvents();

                    if (!$("#leftMenuHolder").hasClass('menuexpanded')) {
                        PxlViewer.util.Debug.debug("Annotations._createAnnotationDataContol - !$('#leftMenuHolder').hasClass('menuexpanded')");
                        pThis._hookGeneralEvents();
                        pThis._hookReadOnlyEvents();
                        pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.annotation, pThis.base.annotations.completeAnnotationList.length);

                        pThis.base.menu._expandPanel();
                        pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.annotation);
                    } else {
                        PxlViewer.util.Debug.debug("Annotations._createAnnotationDataContol - $('#leftMenuHolder').hasClass('menuexpanded')");
                        var shrinkPanel = true;
                        for (x in pThis.base.menu.options._menuOptionsThatTriggerPanel) {
                            if (pThis.base.menu.options._menuOptionsThatTriggerPanel[x] != pThis.base.menu.options._menuIDs.annotation) {
                                if ($('#' + pThis.base.menu.options._menuOptionsThatTriggerPanel[x]).hasClass('menubadgeActive')) {
                                    shrinkPanel = false;
                                    break;
                                }
                            }
                        }
                        pxl.menu.SetScaleParameters();
                        if (shrinkPanel) {
                            pThis.base.menu._shrinkPanel(); // close menu
                            pThis.base.annotations.canvas.clear(); // clear the canvas
                        } else {
                            pThis._hookGeneralEvents(); // hookup events
                            pThis._hookReadOnlyEvents();
                            pThis.base.menu.SetActiveOffAllPanelItems();
                            pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.annotation);
                        }
                        
                    }
                }

                setTimeout(function() { pxl.onRotate(); }, 0); // refresh the canvas so that it realises that it has been updated
            }
            PxlViewer.util.Debug.log("Annotations._createAnnotationDataContol - End");
        },


        _hookReadOnlyEvents: function ()
        {
            PxlViewer.util.Debug.log("Annotations._hookReadOnlyEvents");
            $('.hyperlinkIcon').unbind('click').click(function() {
                var url = $(this).attr("href");
                window.open(url);
            });
        },

        // Hook the events needed for the edit mode
        _hookEditEvents: function () {
            PxlViewer.util.Debug.log("Annotations._hookEditEvents");
            var pThis = this;
            $(".strokeColor").spectrum({
                showPaletteOnly: true,
                clickoutFiresChange: true,
                hideAfterPaletteSelect: true,
                change: function (color) {
                    var id = $(this).parent().parent().parent().parent().attr("annoID");
                    var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                    annoObj.Color = $(this).spectrum("get").toHexString();
                    pThis.base.annotations._updateCanvasColor($(this).spectrum("get").toHexString());
                },
                showPalette: true,
                palette: [
                    [
                        '#000000', '#FFFFFF', '#FFEBCD',
                        '#FF8000', '#243229'
                    ],
                    ['#FF0000', '#FFFF00', '#008000', '#0000FF', '#EE82EE']
                ]
            });

            $('.cancelBtn').click(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: Edit Annotaiton Cancel");
                var id = $(this).parent().parent().parent().parent().attr("annoID");
                pThis.base.annotations.cancelAnnotaionChanges(id);
            }),

            // Saves any changes made the information / physical annotation and reverts details to read only mode
            $('.saveBtn').click(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: Edit Annotaiton Save");
                var id = $(this).parent().parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                $('#annoPanel').css('height', 'auto');
                annoObj.Name = $("#annoName_" + id).val().trim();
                annoObj.Url = $("#annoURL_" + id).val().trim();
                annoObj.Description = $("#annoDes_" + id).val().trim();
                pThis.base.annotations._saveAnnotation(annoObj, false);
                var isEditable = false;
                $('#innerDetailsContianer_' + id).html(pThis.base.annotations._createAnnotationsDetailsDiv(id, annoObj.Name, annoObj.Shape, annoObj.Description, annoObj.Url, isEditable, annoObj.Color));

                if (annoObj.Url.toLowerCase() == "weblink" || annoObj.Url == "") {
                    $('#annoHyperLink_' + id).hide();
                }
                $('#anno_' + id).addClass("activeAnnotation");
                $('#annoDes_' + id).removeClass("verticalEllipsis");

                pThis.base.annotations.exitEditMode();
                //pThis.base.annotations._loadAnnotation(annoObj);
                pThis.base.annotations._hookReadOnlyEvents();

            });

            // when the form field is selected then all the text within is also selected
            $(document).off('click', '.annoEditableTextArea')
                        .off('blur', '.annoEditableTextArea')
                        .off('focus', '.annoEditableTextArea')
                        .on('click', '.annoEditableTextArea', function (e) {
                            if ($(e.target).hasClass("justfocused")) {
                                $(e.target).removeClass("justfocused");
                                $('.annoEditableTextArea').removeClass("selected");
                                $(e.target).addClass("selected");
                                $(e.target).select();
                            }
                            else if (!$(e.target).hasClass("selected")) {
                                $('.annoEditableTextArea').removeClass("selected");
                                $(e.target).addClass("selected");
                                $(e.target).select();
                             }
                        })
                        .on('blur', '.annoEditableTextArea', function (e) {
                            $(e.target).removeClass("selected");
                        })
                        .on('focus', '.annoEditableTextArea', function (e) {
                            if (!$(e.target).hasClass("selected")) {
                                $('.annoEditableTextArea').removeClass("selected");
                                $(e.target).addClass("selected").addClass("justfocused");
                                $(e.target).select();
                            }
            });

        },

        // Buttons that are always visible at the bottom of the annotation
        _hookGeneralEvents: function () {
            PxlViewer.util.Debug.log("Annotations._hookGeneralEvents");
            var pThis = this;
            // toggles the sharing of an annotation

            


            $(".sharingSwitch>input[type='checkbox']").off('change').change(function () {
                var id = $(this).parent().parent().parent().parent().parent().attr("annoID");
               
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                pThis.base.annotations._publishAnnotation(annoObj);
            });
            
            // Deletes an annotation and removes it from the list
            $('.deleteBtn').off('click').click(function () {
                PxlViewer.util.Debug.debug("Event: deleteBtn click");
                var id = $(this).parent().parent().parent().attr("annoID");
                var dialogHeader = "Delete Annotation";
                var dialogMessage = "Are you sure you would like to delete this annotation?";
                var dialogAcceptText = "Yes";
                var dialogAcceptEvent = "window.pxl.annotations._deleteAnnotation(" + id + ");";
                var dialogDeclineText = "No";

                // Create custom dialog for deleting an annotation
                $('body').append(pThis._getBlackoutOverlay(id));
                $('body').append(PxlViewer.util.CreateCustomDialog(id, dialogHeader, dialogMessage, dialogAcceptText, dialogAcceptEvent, dialogDeclineText, ""));
            });

            // Shows a pop up with additional annotation information
            $('.infoBtn').off('click').click(function () {
                PxlViewer.util.Debug.debug("Event: infoBtn click");
                // Setup custom dialog parameters for additional information of an annotation
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);

                var dialogHeader = "Annotation Information";
                var dialogMessage = "Created on: " + annoObj.CreatedOn + "<br /> Created by: " + annoObj.CreatedBy;
                var dialogAcceptText = "Close";

                // Create custom dialog for showing additional information of an annotation
                $('body').append(pThis._getBlackoutOverlay(id));
                $('body').append(PxlViewer.util.CreateCustomDialog(id, dialogHeader, dialogMessage, dialogAcceptText, "", "", ""));
            });

            // Enters edit mode for annotation and its details
            $('.editBtn').off('click').click(function () {
                PxlViewer.util.Debug.debug("Event: editBtn click");
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                $('#annoPanel').css('height', '6000px');
                pThis.base.annotations._editAnnotation(annoObj);
                var isEditable = true;
                $('#innerDetailsContianer_' + id).html(pThis.base.annotations._createAnnotationsDetailsDiv(id, annoObj.Name, annoObj.Shape, annoObj.Description, annoObj.Url, isEditable, annoObj.Color));
                $('#annoDes_' + id).elastic();
                $('#annoURL_' + id).elastic();
                pThis.base.annotations._hookEditEvents();
                $(this).parent().parent().parent().addClass("editAnnotationMode");
            });

            if (pThis.base.options.annotations.isHoldToEdit) {
                // Apply class to annotations details to initiate animation
                $('.detailsDiv').off('taphold').bind('taphold', function () {
                    PxlViewer.util.Debug.debug("event: detailsDiv - mousedown 1");
                    if (!$(this).parent().hasClass("activeAnnotation")) {
                        pThis.options.showControls = true;
                        pThis.base.annotations._activateAnnotation(this, pThis.options.showControls);
                    }
                });
                // Apply class to annotations details to initiate animation
                $('.detailsDiv').off('click').click(function () {
                    PxlViewer.util.Debug.debug("event: detailsDiv - mousedown 2");
                    if (!$(this).parent().hasClass("activeAnnotation")) {
                        pThis.options.showControls = false;
                        pThis.base.annotations._activateAnnotation(this, pThis.options.showControls);
                    }
                });
            }
            else {
                // Apply class to annotations details to initiate animation
                $('.detailsDiv').off('click').click(function () {
                    if (!$(this).parent().hasClass("activeAnnotation")) {
                        PxlViewer.util.Debug.debug("event: detailsDiv - mousedown 3");
                        pThis.options.showControls = true;
                        pThis.base.annotations._activateAnnotation(this, pThis.options.showControls);
                    } 
                });
                // this will catch the user clicking on the description after the anntoation has already loaded
                $('.innerDetailsDiv').off('click').click(function () {
                    PxlViewer.util.Debug.debug("Event: innerDetailsDiv click");
                    if ($(this).parent().parent().parent().hasClass("activeAnnotation") &&
                        !$(this).parent().parent().parent().hasClass("editAnnotationMode")) {
                        var openingID = $(this).parent().parent().parent().attr("annoID");
                        var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", openingID);
                        pThis.base.annotations._loadAnnotation(annoObj);
                    }
                });
            }

            $(document).off('keyup').keyup(function (event) {
                // If enter is pressed then hide keyboard.
                if (event.keyCode == 13) {
                    $("input").blur();
                }
            });

        },

        instigateDiscardAnnotationChangesDialog: function (onAccept, id, onDecline) {
            PxlViewer.util.Debug.log("Annotations.instigateDiscardAnnotationChangesDialog");
            //check if it has already been created, 
            var alreadyExists = ($("#customDialog_" + id).length > 0);
            if (!alreadyExists) {
                var dialogHeader = "Unsaved changes";
                var dialogMessage = "Are you sure you would like to discard your unsaved changes?";
                var dialogAcceptText = "Yes";
                var dialogAcceptEvent = "pxl.annotations.cancelAnnotaionChanges(" + id + "); " + onAccept;
                var dialogDeclineText = "No";

                $('body').append(this._getBlackoutOverlay(id));
                $('body').append(PxlViewer.util.CreateCustomDialog(id, dialogHeader, dialogMessage, dialogAcceptText, dialogAcceptEvent, dialogDeclineText, onDecline));
            }
        },

        cancelAnnotaionChanges: function (id) {
            PxlViewer.util.Debug.log("Annotations.cancelAnnotaionChanges");
            var annoObj = this.base.annotations._getAnnotationObjectFromArray(this.base.annotations.completeAnnotationList, "ID", id);
            $('#annoPanel').css('height', 'auto');
            var isEditable = false;
            $('#innerDetailsContianer_' + id).html(this.base.annotations._createAnnotationsDetailsDiv(id, annoObj.Name, annoObj.Shape, annoObj.Description, annoObj.Url, isEditable, annoObj.Color));
            this.base.annotations.exitEditMode();
            this.base.annotations.canvas.clear();
            this.base.annotations._loadAnnotation(annoObj);
        },

        _updateCanvasColor: function (color) {
            PxlViewer.util.Debug.log("Annotations._updateCanvasColor");
            var activeAnno = 0;

            for (var i = 0; i < this.canvas._objects.length; i++)
            {
                if (this.canvas._objects[i].type != "group") {
                    activeAnno = i;
                }
            }

            this.canvas.freeDrawingBrush.color = color;
            this.canvas._objects[activeAnno].stroke = color;
            this.canvas._objects[activeAnno].cornerColor = color;
            this.canvas._objects[activeAnno].borderColor = color;
            this.canvas._objects[activeAnno].bringForward();
            this.canvas.renderAll();
        },

        _updateAnnotation: function (annoObj) {
            PxlViewer.util.Debug.log("Annotations._updateAnnotation");
            var activeAnno = 0;
            for (var i = 0; i < this.canvas._objects.length; i++) {

                if (this.canvas._objects[i].type != "group") {
                    activeAnno = i;
                }
            }

            var vxy = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
            var vwh;


            if (this.canvas._objects[activeAnno]._controlsVisibility != null) {
                vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].currentWidth, this.canvas._objects[activeAnno].currentHeight));
            }
            else {
                vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].width, this.canvas._objects[activeAnno].height));
            }

            annoObj.Width = parseInt(vwh.x - vxy.x);
            annoObj.Height = parseInt(vwh.y - vxy.y);

            var coords = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].left, this.canvas._objects[activeAnno].top));
            annoObj.X = parseInt(coords.x);
            annoObj.Y = parseInt(coords.y);

            annoObj.AnnotationAngle = parseInt(this.canvas._objects[activeAnno].angle);
        },

        _activateAnnotation: function (object, showControls) {
            PxlViewer.util.Debug.log("Annotations._activateAnnotation");
            var openingID = $(object).parent().attr("annoID");
            if ($(".annoEditableTextArea.annoName").length > 0) {
                var onAcceptDialog = "window.pxl.annotations._switchAnnotation(" + openingID + ", " + showControls + ");";
                this.instigateDiscardAnnotationChangesDialog(onAcceptDialog, openingID, "");
            } else {
                $(object).off('mousedown');
                this.base.annotations._switchAnnotation(openingID, showControls);
            }
        },

        _switchAnnotation: function (openingID, showControls) {
            PxlViewer.util.Debug.log("Annotations._switchAnnotation");
            if (!PxlViewer.Annotations.processingAnnotationLoad) {
                this.base.annotations._setAnnotationDetailsActive(openingID, showControls);
                this.base.annotations._exitAnotationDetailsEditMode(openingID);
                this.base.annotations.exitEditMode();

                //drive to the annotation
                var annoObj = this.base.annotations._getAnnotationObjectFromArray(this.base.annotations.completeAnnotationList, "ID", openingID);
                this.base.annotations._loadAnnotation(annoObj);
            }
        },


        _stopPropogation: function (id, event) {
            PxlViewer.util.Debug.log("Annotations._stopPropogation");
            $(id).off(event).on(event, function (e) {
                e.stopPropagation();
                return false;
            });
        },

        _closeCustomDialog: function (id) {
            PxlViewer.util.Debug.log("Annotations._closeCustomDialog");
            $('#customDialog_' + id).remove();
            this.base.annotations._removeBlackoutOverlay(id);
        },

        _getBlackoutOverlay: function (id) {
            PxlViewer.util.Debug.log("Annotations._getBlackoutOverlay");
            return PxlViewer.util.GetHTMLDiv("overlay_" + id, "blackoutOverlay", "");
        },

        _removeBlackoutOverlay: function (id) {
            PxlViewer.util.Debug.log("Annotations._removeBlackoutOverlay");
            $('#overlay_' + id).remove();
        },

        _hookEvents: function () {
            PxlViewer.util.Debug.log("Annotations._hookEvents");
            var pThis = this;

            $('#annoFree').mouseup(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: annoFree mouseup");
                pThis.base.annotations.enterEditMode(true);
                var centerPoint = pThis.base.viewer.viewport.getCenter(true);
                centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
                var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
                var startWidth = parseInt(200 * startZoom);
                var startHeight = parseInt(200 * startZoom);
                var startColor = "#FF0000";

                //pThis.base.annotations.toggleDrawingMode();

                var newAnno = new Object();
                newAnno.ID = 0;
                newAnno.Name = "Name";
                newAnno.Description = "";
                newAnno.Url = "";
                newAnno.StrokeWidth = 3;
                newAnno.Published = false;
                newAnno.AnnotationAngle = 0;
                newAnno.ImageAngle = 0;
                newAnno.Shape = "free";
                newAnno.X = parseInt(centerPoint.x);
                newAnno.Y = parseInt(centerPoint.y);
                newAnno.Width = parseInt(startWidth * startZoom);
                newAnno.Height = parseInt(startHeight * startZoom);
                newAnno.Color = startColor;

                var vxy = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                var vwh = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(200, 200));
                newAnno.Width = parseInt(vwh.x - vxy.x);
                newAnno.Height = parseInt(vwh.y - vxy.y);
                pThis.base.annotations._saveAnnotation(newAnno, false);
                //pThis.base.viewer.forceRedraw();
            });

            $('#annoCirc').mouseup(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: annoCirc mouseup");
                try {
                    pThis.base.annotations.enterEditMode();
                    var centerPoint = pThis.base.viewer.viewport.getCenter(true);
                    centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
                    var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
                    var startWidth = parseInt(200 * startZoom);
                    var startHeight = parseInt(200 * startZoom);
                    var startColor = "#FF0000";
                    var currRotation = pThis.base.viewer.viewport.getRotation();
                    pThis.base.annotations.addEllipse(0, new OpenSeadragon.Rect(centerPoint.x, centerPoint.y, startWidth, startHeight), startColor, startZoom, -currRotation, true, false);
                    var newAnno = new Object();
                    newAnno.ID = 0;
                    newAnno.Name = "Name";
                    newAnno.Description = "";
                    newAnno.Url = "";
                    newAnno.StrokeWidth = 3;
                    newAnno.Published = false;
                    newAnno.AnnotationAngle = 0;
                    newAnno.ImageAngle = currRotation;
                    newAnno.Shape = "ellipse";
                    newAnno.X = parseInt(centerPoint.x);
                    newAnno.Y = parseInt(centerPoint.y);
                    newAnno.Width = parseInt(startWidth * startZoom);
                    newAnno.Height = parseInt(startHeight * startZoom);
                    newAnno.Color = startColor;

                    var vxy = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                    var vwh = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(200, 200));
                    newAnno.Width = parseInt(vwh.x - vxy.x);
                    newAnno.Height = parseInt(vwh.y - vxy.y);
                    pThis.base.annotations._saveAnnotation(newAnno, false);
                } catch (ex) {
                    PxlViewer.util.Debug.DisplayAlertMessage(ex);
                }
            });

            $('.hyperlinkIcon').unbind('click').click(function () {
                PxlViewer.util.Debug.debug("Event: hyperlinkIcon click");
                var url = $(this).attr("href");
                window.open(url);
            });

            $('#annoSq').click(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: annoSq click");
                pThis.base.annotations.enterEditMode();
                var centerPoint = pThis.base.viewer.viewport.getCenter(true);
                centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
                var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
                var startWidth = parseInt(200 * startZoom);
                var startHeight = parseInt(200 * startZoom);
                var startColor = "#FF0000";
                var currRotation = pThis.base.viewer.viewport.getRotation();
                pThis.base.annotations.addRectangle(0, new OpenSeadragon.Rect(centerPoint.x, centerPoint.y, startWidth, startHeight), startColor, startZoom, -currRotation, true, false);

                var newAnno = new Object();
                newAnno.ID = 0;
                newAnno.Name = "Name";
                newAnno.Description = "";
                newAnno.Url = "";
                newAnno.StrokeWidth = 3;
                newAnno.Published = false;
                newAnno.AnnotationAngle = 0;
                newAnno.ImageAngle = currRotation;
                newAnno.Shape = "rect";
                newAnno.X = parseInt(centerPoint.x);
                newAnno.Y = parseInt(centerPoint.y);
                newAnno.Width = parseInt(startWidth * startZoom);
                newAnno.Height = parseInt(startHeight * startZoom);
                newAnno.Color = startColor;

                var vxy = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                var vwh = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(200, 200));
                newAnno.Width = parseInt(vwh.x - vxy.x);
                newAnno.Height = parseInt(vwh.y - vxy.y);
                pThis.base.annotations._saveAnnotation(newAnno, false);
            });

            $('#annoArrow').click(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: annoArrow click");
                pThis.base.annotations.enterEditMode();
                var centerPoint = pThis.base.viewer.viewport.getCenter(true);
                centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
                var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
                var startWidth = parseInt(200 * startZoom);
                var startHeight = parseInt(200 * startZoom);
                var startColor = "#FF0000";
                var currRotation = pThis.base.viewer.viewport.getRotation();
                var newArrow =
                {
                    path: pThis.base.annotations._getArrowPath(1),
                    x: centerPoint.x,
                    y: centerPoint.y,
                    width: startWidth,
                    height: startHeight
                };

                pThis.base.annotations.addArrow(0, newArrow, startColor, startZoom, currRotation, true, false);

                var newAnno = new Object();
                newAnno.ID = 0;
                newAnno.Name = "Name";
                newAnno.Description = "";
                newAnno.Url = "";
                newAnno.StrokeWidth = 3;
                newAnno.Published = false;
                newAnno.AnnotationAngle = 0;
                newAnno.ImageAngle = currRotation;
                newAnno.Shape = "arrow";
                newAnno.Path = pThis.base.annotations._getArrowPath(1);
                newAnno.X = parseInt(centerPoint.x);
                newAnno.Y = parseInt(centerPoint.y);
                newAnno.Width = parseInt(startWidth * startZoom);
                newAnno.Height = parseInt(startHeight * startZoom);
                newAnno.Color = startColor;

                var vxy = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                var vwh = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(100, 300));
                newAnno.Width = parseInt(vwh.x - vxy.x);
                newAnno.Height = parseInt(vwh.y - vxy.y);

                pThis.base.annotations._saveAnnotation(newAnno, false);
            });

            $('#annoSave').click(function () {
                PxlViewer.util.Debug.AddLogEvent();
                PxlViewer.util.Debug.debug("Event: annoSave click");
                if (pThis.base.annotations.isEditMode) {
                    for (var i = 0; i < pThis.base.annotations.objects.length; i++) {
                        if (pThis.base.annotations.objects[i].isActive) {
                            var img = pThis.base.viewer.viewport.windowToImageCoordinates(new OpenSeadragon.Point(pThis.base.annotations.objects[i].obj.left, pThis.base.annotations.objects[i].obj.top));
                        }
                    }
                    pThis.base.annotations.exitEditMode();
                } else {
                    PxlViewer.console.log("Annotation not saved as it is not in edit mode");
                }
            });

        },
        annoScreenshotSqClickEvent: function (pThis, event) {
            PxlViewer.util.Debug.log("Annotations.annoScreenshotSqClickEvent");
            var newAnno = null;
            if (pThis.base.annotations.options.isScreenshot) {
                var mouse = canvas.getPointer(event.memo.e);
                pxl.Screenshot.internalProperties.drawAttributes.started = true;
                pxl.Screenshot.internalProperties.drawAttributes.xstart = mouse.x;
                pxl.Screenshot.internalProperties.drawAttributes.ystart = mouse.y;

                newAnno = new fabric.Rect({
                    width: 0,
                    height: 0,
                    left: x,
                    top: y,
                    fill: 'rgba(0,0,0,0)'
                });

                canvas.add(newAnno);
                canvas.renderAll();
                canvas.setActiveObject(newAnno);

            }
            return newAnno;
        },

        driveToArea: function (imageX, imageY, imageZ, imageAngle, relativeWidth, relativeHeight, annoRotation)
        {
            PxlViewer.util.Debug.log("Annotations.driveToArea");
            PxlViewer.util.Debug.log("imageX: " + imageX + "\nimageY: " + imageY + "\nimageZ: " + imageZ + "\nimageAngle: " + imageAngle + "\nrelativeWidth: " + relativeWidth + "\nrelativeHeight: " + relativeHeight + "\nannoRotation: " + annoRotation);
            // Get the width and height relative to the annotations rotation
            var centrePoint = new fabric.Point(relativeWidth / 2, relativeHeight / 2);
            var objectOrigin1 = new fabric.Point(0, 0);
            var objectOrigin2 = new fabric.Point(relativeWidth, relativeHeight);
            var rotatedCoords1 = fabric.util.rotatePoint(objectOrigin1, centrePoint, -annoRotation * (Math.PI / 180));
            var rotatedCoords2 = fabric.util.rotatePoint(objectOrigin2, centrePoint, -annoRotation * (Math.PI / 180));
            relativeHeight = Math.abs(rotatedCoords1.y - rotatedCoords2.y);
            relativeWidth = Math.abs(rotatedCoords2.x - rotatedCoords1.x);

            // Calculate the size of the viewer container relative to the size of the image
            var padding = 100;
            var containerSize = this.base.viewer.viewport.getContainerSize();
            var containerWidth = (containerSize.x - padding) * imageZ;
            var containerHeight = (containerSize.y - padding) * imageZ;
            PxlViewer.util.Debug.debug("Annotations.driveToArea 1 currRotation: " + this.base.viewer.viewport.getRotation());

            var imageToViewportZoom;
            // If our viewport is too small for the annotation
            if (containerHeight < relativeHeight || containerWidth < relativeWidth) {
                // Get the widh asnd height ratios relative to the image
                var zoomWidthRatio = (relativeWidth / containerWidth) * imageZ;
                var zoomHeightRatio = (relativeHeight / containerHeight) * imageZ;

                // Zoom ratio is set the the largest of the ratios
                var zoomRatio = Math.max(zoomWidthRatio, zoomHeightRatio);
                imageToViewportZoom = this.base.viewer.viewport.imageToViewportZoom(1 / zoomRatio);
            }
            else {
                imageToViewportZoom = this.base.viewer.viewport.imageToViewportZoom(1 / imageZ);
            }
            PxlViewer.util.Debug.debug("Annotations.driveToArea 2 currRotation: " + this.base.viewer.viewport.getRotation());
            // Navigate to the annotation
            var zPoint = this.base.viewer.viewport.imageToViewportCoordinates(new OpenSeadragon.Point(imageX, imageY));
            this.base.viewer.viewport.panTo(zPoint, true);
            this.base.viewer.viewport.zoomTo(imageToViewportZoom, null, true);
        },

        _createAnnotationMove: function (x, y) {
            PxlViewer.util.Debug.log("Annotations._createAnnotationMove");
            return "M " + x + " " + y + " ";
        },

        _createAnnotationDrawLine: function (x, y)
        {
            PxlViewer.util.Debug.log("Annotations._createAnnotationDrawLine");
            return "L " + x + " " + y + " ";
        },

        _getArrowPath: function (scaleFactor) {
            PxlViewer.util.Debug.log("Annotations._getArrowPath");
            var bodyHeight = 300 * scaleFactor;
            var x = 50 * scaleFactor;
            var y = 70 * scaleFactor;

            var path = "";
            path += this.base.annotations._createAnnotationMove(0, 0);
            path += this.base.annotations._createAnnotationDrawLine(0, bodyHeight);
            path += " z";
            return path;
        },

        _exitAnotationDetailsEditMode: function (annoID) {
            PxlViewer.util.Debug.log("Annotations._exitAnotationDetailsEditMode");
            var openingID = annoID;
            var pThis = this;
            $(".annoEditableTextArea.annoName").each(function () {
                var id = $(this).parent().parent().parent().parent().parent().attr("annoID");
                if (id != openingID) {
                    var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                    var isEditable = false;
                    $('#innerDetailsContianer_' + id).html(pThis.base.annotations._createAnnotationsDetailsDiv(id, annoObj.Name, annoObj.Shape, annoObj.Description, annoObj.Url, isEditable, annoObj.Color));
                }
            });
        },

        _deactivateAllAnnotationDetails: function (annotationID) {
            PxlViewer.util.Debug.log("Annotations._deactivateAllAnnotationDetails");
            var pThis = this;
            var openingID = annotationID;
            $(".detailsDiv").each(function () {
                var id = $(this).parent().attr("annoID");
                if (id != openingID) {
                    $(this).unbind('mousedown').mousedown(function () {
                        pThis.options.showControls = true;
                        if (pThis.base.options.annotations.isHoldToEdit) {
                            pThis.options.showControls = false;
                        }
                        pThis.base.annotations._activateAnnotation(this, pThis.options.showControls);
                    });
                }
            });

            $('.anDataControl').removeClass("activeAnnotation");
            $('.anDataControl').removeClass("editAnnotationMode");
            $('.annoDes').addClass("verticalEllipsis");
        },

        _setAnnotationDetailsActive: function (annotationID, showControls) {
            PxlViewer.util.Debug.log("Annotations._setAnnotationDetailsActive");
            this.base.annotations._deactivateAllAnnotationDetails(annotationID);

            if (showControls) {
                $('#innerDetailsContianer_' + annotationID).removeClass("noBorder");
                $('#annodetails_' + annotationID).removeClass("blendBackground");
                $('#innerControls_' + annotationID).show();
            }
            else {
                $('#innerDetailsContianer_' + annotationID).addClass("noBorder");
                $('#annodetails_' + annotationID).addClass("blendBackground");
                $('#innerControls_' + annotationID).hide();
            }

            $('#anno_' + annotationID).addClass("activeAnnotation");
            $('#annoDes_' + annotationID).removeClass("verticalEllipsis");
        },

        _getHTMLInput: function (id, classes, value, type, styling) {
            PxlViewer.util.Debug.log("Annotations._getHTMLInput");
            var tmpl = "<input id='{{{id}}}' class='{{{classes}}}' value='{{{value}}}' style='{{{styling}}}'></input>";
            return Mustache.render(tmpl, { id: id, classes: classes, value: value, styling: styling });
        },

        _getHTMLInputWithPlaceholder: function (id, classes, placeholder, type, styling) {
            PxlViewer.util.Debug.log("Annotations._getHTMLInputWithPlaceholder");
            var tmpl = "<input id='{{{id}}}' class='{{{classes}}}' placeholder='{{{placeholder}}}' style='{{{styling}}}'></input>";
            return Mustache.render(tmpl, { id: id, classes: classes, placeholder: placeholder, styling: styling });
        },

        _getHTMLColourPicker: function (id, classes, colour) {
            PxlViewer.util.Debug.log("Annotations._getHTMLColourPicker");
            var tmpl = "<input id='{{{id}}}' class='{{{classes}}}' value='{{{colour}}}'></input>";
            return Mustache.render(tmpl, { id: id, classes: classes, colour: colour });
        },

        _getHTMLDiv: function (id, classes, controls) {
            PxlViewer.util.Debug.log("Annotations._getHTMLDiv");
            var tmpl = "<div id='{{{id}}}' class='{{{classes}}}'>{{{controls}}}</div>";
            return Mustache.render(tmpl, { id: id, classes: classes, controls: controls });
        },

        _getHTMLTextArea: function (id, classes, text) {
            PxlViewer.util.Debug.log("Annotations._getHTMLTextArea");
            var tmpl = "<textarea id='{{{id}}}' class='{{{classes}}}'  autocapitalize='off' autocorrect='off' >{{{text}}}</textarea>";

            var userAgent = navigator.userAgent.toLowerCase(); // this is user agent that detects if we are using an android device .
            var isAndroid = userAgent.indexOf("android") > -1;  // this will be true if we are on an android device , otherwise false .
            if (isAndroid && id.toString().indexOf("URL") > -1)
            {   // if we are on an android device and we are generating the html content for the weblink ( contains the word URL), render the information through an input tag to allow chrome to support autocapitalization off
                tmpl = "<input id='{{{id}}}' class='{{{classes}}}' autocapitalize='off' autocorrect='off' value='{{{text}}}'></input>";
            }

            return Mustache.render(tmpl, { id: id, classes: classes, text: text });
        },

        _getHTMLTextAreaWithPlaceholder: function (id, classes, placeholder) {
            PxlViewer.util.Debug.log("Annotations._getHTMLTextAreaWithPlaceholder");
            var tmpl = "<textarea id='{{{id}}}' class='{{classes}}' autocorrect='off' autocapitalize='off' autocomplete='off' placeholder={{{placeholder}}}></textarea>";

            var userAgent = navigator.userAgent.toLowerCase(); // this is user agent that detects if we are using an android device .
            var isAndroid = userAgent.indexOf("android") > -1; // this will be true if we are on an android device this is true , otherwise false .
            if (isAndroid && id.toString().indexOf("URL") > -1)
            { // if we are on an android device and we are generating the html content for the weblink ( contains the word URL) , render the information through an input tag to allow chrome to support autocapitalization off

                tmpl = "<input id='{{{id}}}' class='{{classes}}' autocorrect='off' autocapitalize='off' autocomplete='off' placeholder={{{placeholder}}}></input>";
            }

            return Mustache.render(tmpl, { id: id, classes: classes, placeholder: placeholder });
        },

        _getHTMLLabel: function (id, classes, text) {
            PxlViewer.util.Debug.log("Annotations._getHTMLLabel");
            var tmpl = "<label id='{{id}}' class='{{{classes}}}'>{{{text}}}</label>";

            return Mustache.render(tmpl, { id: id, classes: classes, text: text });
        },

        _getHTMLHyperLink: function (id, classes, url) {
            PxlViewer.util.Debug.log("Annotations._getHTMLHyperLink");
            var tmpl = "<div id='{{{id}}}' class='{{{classes}}}' href='{{{url}}}'></div>";
            return Mustache.render(tmpl, { id: id, classes: classes, url: url });
        },

        _getHTMLDivButton: function (id, classes, text, onclickEvent) {
            PxlViewer.util.Debug.log("Annotations._getHTMLDivButton");
            var tmpl = "<div id='{{{id}}}' class='{{{classes}}}' onclick='{{{onclickEvent}}}'>{{{text}}}</div>";
            return Mustache.render(tmpl, { id: id, classes: classes, onclickEvent: onclickEvent, text: text });
        },

        _createCustomDialog: function (id, headerText, message, acceptButtonTxt, acceptButtonOnClickEvent, declineButtonTxt, declinButtonOnClickEvent) {
            PxlViewer.util.Debug.log("Annotations._createCustomDialog");
            var closeDialogEvent = " window.pxl.annotations._closeCustomDialog(" + id + ");";
            var headerLabel = this._getHTMLLabel("dialogHeaderLabel_" + id, "dialogHeaderLabel", headerText);
            var headerContent = this._getHTMLDiv("dialogHeaderDiv_" + id, "dialogHeaderDiv", headerLabel);

            var messageLabel = this._getHTMLLabel("dialogMessageLabel_" + id, "dialogMessageLabel", message);

            var acceptBtn = this._getHTMLDivButton("acceptDialogBtn_" + id, "cutomDialogBtn", acceptButtonTxt, acceptButtonOnClickEvent + closeDialogEvent);

            var cancelBtn = "";
            if (declineButtonTxt != "") {
                cancelBtn = this._getHTMLDivButton("declineDialogBtn_" + id, "cutomDialogBtn", declineButtonTxt, declinButtonOnClickEvent + closeDialogEvent);
            }
            var customDialogDiv = this._getHTMLDiv("customDialog_" + id, "customDialog", headerContent + messageLabel + acceptBtn + cancelBtn);
            return customDialogDiv;
        },

        _createAnnotationsDetailsDiv: function (id, name, shape, description, url, isEditable, colour) {
            PxlViewer.util.Debug.log("Annotations._createAnnotationsDetailsDiv");
            if (isEditable) {
                var nameTextBox = "";
                if (name == "Name")
                    nameTextBox = PxlViewer.util.GetHTMLTextArea("annoName_" + id, "annoEditableTextArea annoName", name);
                else
                    nameTextBox = PxlViewer.util.GetHTMLTextArea("annoName_" + id, "annoEditableTextArea annoName", name);

                var annoShapeIcon = PxlViewer.util.GetHTMLDiv("annoType_" + id, "annoType " + shape + "Anno", "");

                var hyperLinkIconHidden = this._getHTMLHyperLink("annoHyperLink_" + id, "hyperlinkIcon hidden", url);
                var headerDivEditable = this._getHTMLDiv("annoHeader_" + id, "annoHeader", nameTextBox + annoShapeIcon + hyperLinkIconHidden);

                var descriptionTextBox = "";
                if (description == "Description" || description == "")
                    descriptionTextBox = PxlViewer.util.GetHTMLTextArea("annoDes_" + id, "annoEditableTextArea annoDes annoDetails", "Description");
                else
                    descriptionTextBox = PxlViewer.util.GetHTMLTextArea("annoDes_" + id, "annoEditableTextArea annoDes annoDetails", description);

                var urlTextBox = "";
                if (url == "Weblink" || url == "")
                    urlTextBox = PxlViewer.util.GetHTMLTextArea("annoURL_" + id, "annoEditableTextArea annoURL annoDetails", "Weblink");
                else
                    urlTextBox = PxlViewer.util.GetHTMLTextArea("annoURL_" + id, "annoEditableTextArea annoURL annoDetails", url);

                var colourPicker = PxlViewer.util.GetHTMLColourPicker("annoColour_" + id, "strokeColor annoColourControl", colour);

                var saveBtnLbl = PxlViewer.util.GetHTMLLabel("saveLbl_" + id, "annoActionsText", "Save");
                var saveBtnDiv = PxlViewer.util.GetHTMLDiv("saveBtn_" + id, "annoActionsBtn saveBtn", saveBtnLbl);

                var cancelBtnLbl = PxlViewer.util.GetHTMLLabel("cancelLbl_" + id, "annoActionsText", "Cancel");
                var editBtnDiv = PxlViewer.util.GetHTMLDiv("cancelBtn_" + id, "annoActionsBtn cancelBtn", cancelBtnLbl);

                return PxlViewer.util.GetHTMLDiv("innerDetailsDiv_" + id, "innerDetailsDiv", headerDivEditable + descriptionTextBox + urlTextBox + colourPicker + saveBtnDiv + editBtnDiv);
            }
            else {
                var hiddenClass = "hidden";
                var nameField = PxlViewer.util.GetHTMLLabel("annoName_" + id, "annoName annoDetails", name);
                var annoShapeIconReadOnly = PxlViewer.util.GetHTMLDiv("annoType_" + id, "annoType " + shape + "Anno", "");
                if (url != "" && url != "Weblink") {
                    hiddenClass = "";
                }
                var hyperLinkIcon = this._getHTMLHyperLink("annoHyperLink_" + id, "hyperlinkIcon" + hiddenClass, url);
                var headerDivRead = this._getHTMLDiv("annoHeader_" + id, "annoHeader", nameField + annoShapeIconReadOnly + hyperLinkIcon);

                var descriptionField = PxlViewer.util.GetHTMLLabel("annoDes_" + id, "annoDes annoDetails verticalEllipsis", description);

                var urlHidden = PxlViewer.util.GetHTMLInput("annoURL_" + id, "annoEditableTextArea annoDes annoDetails hidden", url, "text", "");

                return PxlViewer.util.GetHTMLDiv("innerDetailsDiv_" + id, "innerDetailsDiv", headerDivRead + descriptionField + urlHidden);
            }
        },

        _createAnnotationsInnerControlsDiv: function (id, canPublish, canDelete, published) {
            PxlViewer.util.Debug.log("Annotations._createAnnotationsInnerControlsDiv");
            var sharingDiv = "";
            var editDiv = "";
            var deleteDiv = "";
            var infoDiv = "";
            var publishLbl = "";
            if (canPublish) {
                var sharingCheckBox = PxlViewer.util.GetToggleSwitch(id, published, "sharingSwitch");
                publishLbl = PxlViewer.util.GetHTMLLabel("PublishLbl_" + id, "annoActionsLbl publishLbl", "Sharing","myonoffswitch_"+id);
                sharingDiv = PxlViewer.util.GetHTMLDiv("publishDiv_" + id, "onoffswitch ", sharingCheckBox);
            }

            if (canDelete) {
                var editIconDiv = PxlViewer.util.GetHTMLDiv("editAnnoIcon_" + id, "edit", "");
                var editLbl = PxlViewer.util.GetHTMLLabel("editLbl_" + id, "annoEditLbl", "Edit");

                if (!canPublish)
                    editDiv = PxlViewer.util.GetHTMLDiv("editDiv_" + id, "annoEditDiv editBtn noBorder noMargin", editIconDiv + editLbl);
                else
                    editDiv = PxlViewer.util.GetHTMLDiv("editDiv_" + id, "annoEditDiv editBtn", editIconDiv + editLbl);

                var deleteIconDiv = PxlViewer.util.GetHTMLDiv("deleteAnnoIcon_" + id, "delete", "");
                var deleteLbl = PxlViewer.util.GetHTMLLabel("deleteLbl_" + id, "annoDeleteLbl", "Delete");
                deleteDiv = PxlViewer.util.GetHTMLDiv("deleteDiv_" + id, "annoDeleteDiv deleteBtn", deleteIconDiv + deleteLbl);
            }

            var infoIconDiv = PxlViewer.util.GetHTMLDiv("annoInfo_" + id, "info", "");
            var infoLbl = PxlViewer.util.GetHTMLLabel("infoLbl_" + id, "annoInfoLbl", "Info");

            if (!canDelete)
                infoDiv = PxlViewer.util.GetHTMLDiv("infoDiv_" + id, "annoInfoDiv infoBtn noBorder", infoIconDiv + infoLbl);
            else
                infoDiv = PxlViewer.util.GetHTMLDiv("infoDiv_" + id, "annoInfoDiv infoBtn", infoIconDiv + infoLbl);

            return PxlViewer.util.GetHTMLDiv("innerControls_" + id, "innerControls", sharingDiv + publishLbl + editDiv + deleteDiv + infoDiv);
        },

        _createAnnotationDataContol: function (id, name, description, url, shape, published, canPublish, canDelete, isEditable, colour) {
            PxlViewer.util.Debug.log("Annotations._createAnnotationDataContol");
            var innerDetailsDiv = this._createAnnotationsDetailsDiv(id, name, shape, description, url, isEditable, colour);
            var innerControlsDiv = this._createAnnotationsInnerControlsDiv(id, canPublish, canDelete, published);
            var tmpl = "\
                <div class='anDataControl' id='anno_{{id}}' annoID='{{id}}' > \
                    <div id='annodetails_{{id}}' class='detailsDiv blendBackground'>\
                        <div id='innerDetailsContianer_{{id}}' class='innerDetailsContainer noBorder'>\
                            {{{innerDetailsDiv}}}\
                        </div>\
                        {{{innerControlsDiv}}}\
                        </div>\
               </div >";
            return Mustache.render(tmpl, { id: id, innerDetailsDiv: innerDetailsDiv, innerControlsDiv: innerControlsDiv });
        },

        _createAnnotationHeaderContol: function (permissionSet) {
            PxlViewer.util.Debug.log("Annotations._createAnnotationHeaderContol");
            var additionalClasses = "";
            // if the user does not have any annotation add permissions then hide the control area
            if (permissionSet.permissions.length == 0) {
                additionalClasses = "noAddAnnotationsPermissions";
            }
            var outertmpl = "\
                    <div class='anHeaderControl {{additionalClasses}}' id='anHeaderControl' > \
                    {{{innerContent}}}\
                    </div>";
            var tmpl = "{{#permissions}} \
                      <div id='{{name}}' class='{{cssClass}}' onclick='{{event}}'>  </div>   \
                 {{/permissions}}";
            var innerTemplate = Mustache.render(tmpl, permissionSet);
            return Mustache.render(outertmpl, { additionalClasses: additionalClasses, innerContent: innerTemplate.toString() });
        },

        _getAnnotationObjectFromArray: function (array, key, val) {
            PxlViewer.util.Debug.log("Annotations._getAnnotationObjectFromArray");
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] == val) { return array[i]; }
            }
            return null;
        },

        _getIndexOfAnnotationObjectFromArray: function (array, key, val) {
            PxlViewer.util.Debug.log("Annotations._getIndexOfAnnotationObjectFromArray");
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] == val) {
                    return i;
                }
            }
            return null;
        },


        /**
         * This function is called whenever the user resizes the window.
         * @function
         */
        resize: function () {
            PxlViewer.util.Debug.log("Annotations.resize");
            if (this.canvas != null) {
                //if ($('#' + pThis.base.menu.options._menuIDs.annotation).hasClass('menubadgeActive'))
                //{
                // Calculate new scale for annotations.
                var origImgSize = this.origImgSize;
                if (origImgSize != 0) {
                    var newImgSize = this._getWindowImageSize();
                    var ratioX = newImgSize.x / origImgSize.x;
                    var ratioY = newImgSize.y / origImgSize.y;

                    // Store the base and the current objects to restore them
                    // together with the annotation holder.
                    var base = this.base;
                    var objects = this.objects;

                    // Reset the annotation holder.
                    //this.canvas.clear();
                    //this.destroy();
                    this._init(base, false, pxl.annotations.options.createPermissions);

                    //Ryan TODO: Do we need two updates here
                    //// This update is required for correct coordinate calculations.
                    this.update();

                    // Re-add the annotations.
                    this.canvas.renderOnAddRemove = false;
                    for (var i = 0; i < objects.length; i++) {
                        var grpCoords = this._imageToGroupCoordinates(new fabric.Point(objects[i].origDimensions.x, objects[i].origDimensions.y));
                        var rotated = this._rotatePoint(new fabric.Point(grpCoords.x, grpCoords.y));
                        objects[i].obj.left = grpCoords.x;
                        objects[i].obj.top = grpCoords.y;
                        objects[i].obj.scaleX = ratioX;
                        objects[i].obj.scaleY = ratioY;
                        this.group.add(objects[i].obj);
                        this.objects.push(objects[i]);
                    }
                    this.canvas.renderOnAddRemove = true;
                    this.update();

                    // Restore origImgSize
                    this.origImgSize = origImgSize;
                    //}
                }
            }
        },

        _rotatePoint: function (origin) {
            PxlViewer.util.Debug.log("Annotations._rotatePoint");
            var canvasCentre = this.canvas.getCenter();
            var currRotation = this.base.viewer.viewport.getRotation();
            var centrePoint = new fabric.Point(canvasCentre.left, canvasCentre.top);
            var rotated = fabric.util.rotatePoint(origin, centrePoint, currRotation * (Math.PI / 180));
            return rotated;
        },

        /**ddrect
         * Converts image coordinates (which are the coordinates which are
         * stored inside the annotation object's origDimensions Point) to group coordinates.
         * @function
         * @param {OpenSeadragon.Point} - point
         * @returns {OpenSeadragon.Point} - group coordinates
         */
        _imageToGroupCoordinates: function (point, ignoreAngle) {
            PxlViewer.util.Debug.log("Annotations._imageToGroupCoordinates");
            //@ zero degrees
            try {
                var viewerElementCoords = this.base.viewer.viewport.imageToViewerElementCoordinates(point);

                //rotate
                var currRotation = this.base.viewer.viewport.getRotation();
                if (currRotation != 0 && !ignoreAngle) {
                    viewerElementCoords = fabric.util.rotatePoint(new fabric.Point(viewerElementCoords.x, viewerElementCoords.y), this.base.viewer.pivotPoint, currRotation * (Math.PI / 180));
                }
                return this._windowToGroupCoordinates(viewerElementCoords);
            } catch (ex) {
                PxlViewer.util.Debug.DisplayAlertMessage("_imageToGroupCoordinates");
            }
        },

        _imageToGroupWidth: function (width) {
            PxlViewer.util.Debug.log("Annotations._imageToGroupWidth");
            //get the
            var currZoom = this.base.viewer.viewport.getZoom(true);
            var coords = this.group.getPointByOrigin("left", "top"); // Get the top-left coords of the group.
            var currZoom = this.base.viewer.viewport.getZoom(true);
            return new OpenSeadragon.Point(((point.x - coords.x) / currZoom) - (this.group.width / 2),
                ((point.y - coords.y) / currZoom) - (this.group.height / 2));
        },
        /**
         * Converts window coordinates to group coordinates. Second param (centerOrigin) determines
         * whether the coordinate's origin is based on the center of the window.
         * @function
         * @param {OpenSeadragon.Point} - point
         * @returns {OpenSeadragon.Point} - group coordinates
         */
        _windowToGroupCoordinates: function (point) {
            PxlViewer.util.Debug.log("Annotations._windowToGroupCoordinates");
            var coords = this.group.getPointByOrigin("left", "top"); // Get the top-left coords of the group.
            var currZoom = this.base.viewer.viewport.getZoom(true);
            return new OpenSeadragon.Point(((point.x - coords.x) / currZoom) - (this.group.width / 2),
                ((point.y - coords.y) / currZoom) - (this.group.height / 2));
        },
        enterEditMode: function (freedrawing) {
            PxlViewer.util.Debug.log("Annotations.enterEditMode");
            var base = this.base;
            this.currentSelectedAnnotation = null;
            this.isEditMode = true;
            $('.rotateDial').hide();
            this._init(base, "#annoCanvas1", pxl.annotations.options.createPermissions);
            this.base.viewer.setMouseNavEnabled(false);
            this.base.viewer.navigator.setMouseNavEnabled(false);
            this.canvas.renderOnAddRemove = false;
            this.canvas.isDrawingMode = false;

            if (freedrawing) {
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.color = "#FF0000";
            }          
            this.canvas.renderOnAddRemove = true;
            this.update();
        },
        exitEditMode: function() {
            PxlViewer.util.Debug.log("Annotations.exitEditMode");
            var base = this.base;
            this.isEditMode = false;
            if (this.base.viewer != null && this.base.viewer.navigator != null) {
                this.base.viewer.setMouseNavEnabled(true);
                this.base.viewer.navigator.setMouseNavEnabled(true);
                //objects are save so that they can be redrawn later
                this._init(base, false, pxl.annotations.options.createPermissions);
            }
            if (pxl.menu.options.showRotationControl && pxl.menu.options.rotationControl.visible) {
                // make the rotate control re-appear if it is allowed
                $('.rotateDial').show();
            }
            this.canvas.isDrawingMode = false;
            this.canvas.renderOnAddRemove = false;
            this.canvas.isDrawingMode = false;
            this.canvas.renderOnAddRemove = true;
            $('.anDataControl').removeClass("editAnnotationMode");
            this.update();
        },

        _saveAnnotation: function (annotationObject, reload)
        {
            PxlViewer.util.Debug.log("Annotations._saveAnnotation");
            PxlViewer.util.Debug.log(annotationObject);
            var activeAnno = 0;

            // TODO Ryan: May need to create a new attribute for the annotation class "Measurement / Annotation" 
            // Get the current active annotation from the annotations canvas
            if (annotationObject.Shape != "linear")
            {
                //work out what annotation object on the canvas we want to capture
                for (var i = 0; i < this.canvas._objects.length; i++)
                {
                    if (this.canvas._objects[i].type != "group")
                    {
                        activeAnno = i;
                    }
                }
            }
            else // Otherwise we need to get the active measurement from the measurements canvas
            {
                activeAnno = this.base.measurements._getActiveMeasurementID();
            }

            var imageRotation = this.base.viewer.viewport.getRotation();
            imageRotation = Math.ceil(imageRotation);
            annotationObject.ImageAngle = imageRotation;
            annotationObject.Z = (this.base.images[this.base.currentImage].info.mag / this.base.viewer.viewport.viewportToImageZoom(this.base.viewer.viewport.getZoom() * this.base.images[this.base.currentImage].info.mag));

            // We go in here if we are updating an edited annotation or measurement
            if (annotationObject.ID > 0)
            {
                // Give valid default values to each of the textual attribtues
                if (PxlViewer.util.IsNullOrEmpty(annotationObject.Name))
                {
                    annotationObject.Name = "Name";
                }

                if (annotationObject.Description == "Description") {
                    annotationObject.Description = "";
                }

                if (annotationObject.Url.toLowerCase().trim() == "weblink")
                {
                    annotationObject.Url = "";
                }

                // If the current annotation / measurement is a path based object (i.e. Freehand / Arrow / Linear Measurement)
                if (annotationObject.Shape != "free" || (annotationObject.Shape == "free" && (annotationObject.FreeHandX == undefined || annotationObject.FreeHandX == null)))
                {
                    //Calculate the width and height relative to the image
                    var vxy = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                    var vwh;
                    var fabricPath;

                    // TODO Ryan: May need to create a new attribute for the annotation class "Measurement / Annotation" 
                    // We could maybe keep this method in the PxlviewerMeasurements.js file
                    if (annotationObject.Shape == "linear")
                    {
                        // If the object is a measruement we reference a different canvas in order to get the relevant attributes
                        var canvas = this.canvas;

                        // We use abespoke canvas for drawing measurements, but use the annotaions canvas to display them
                        // Set the variable to the relevant canvas
                        if (pxl.measurements.internalProperties.drawAttributes.drawingCanvas != null)
                        {
                            canvas = pxl.measurements.internalProperties.drawAttributes.drawingCanvas;
                        }

                        vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(canvas._objects[activeAnno].getWidth(), canvas._objects[activeAnno].getHeight()));

                        // Get the path from the active annotation of the relevant canvas
                        fabricPath = canvas._objects[activeAnno].path;

                        // This is to save the fabric path for the first time
                        if (fabricPath != undefined)
                        {
                            // These values make up the points of the path in the case of linear there are only two, the start and the end (the bookends are added in code when we first load the object)
                            var arrX = annotationObject.FreeHandX.split(',');
                            var arrY = annotationObject.FreeHandY.split(',');

                            var freeHandXArray = new Array();
                            var freeHandYArray = new Array();

                            // Transpose the points into a format suitable for iScope
                            for (var j = 0; j < arrX.length; j++)
                            {
                                //we to add on the left property of the annotataion to get the screen position of the points
                                var pxlPointX = arrX[j];
                                var pxlPointY = arrY[j];

                                //if its rotated we need to calculate their position at 0 degrees to be stored
                                if (imageRotation != 0 && imageRotation != undefined)
                                {
                                    var viewerElementCoords = fabric.util.rotatePoint(new fabric.Point(pxlPointX, pxlPointY), this.base.viewer.pivotPoint, -imageRotation * (Math.PI / 180));
                                    freeHandXArray.push(parseInt(viewerElementCoords.x * annotationObject.Z));
                                    freeHandYArray.push(parseInt(viewerElementCoords.y * annotationObject.Z));
                                }
                                else
                                {
                                    freeHandXArray.push(parseInt(pxlPointX * annotationObject.Z));
                                    freeHandYArray.push(parseInt(pxlPointY * annotationObject.Z));
                                }

                            }

                            // Set x and y co-ordinates to the new transposed one
                            annotationObject.FreeHandX = freeHandXArray.toString();
                            annotationObject.FreeHandY = freeHandYArray.toString();

                            var objectLeft = canvas._objects[activeAnno].left;
                            var objectTop = canvas._objects[activeAnno].top;

                            // Convert the x and y to be relative to the image
                            var objectPos = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(objectLeft, objectTop));
                            annotationObject.X = parseInt(objectPos.x);
                            annotationObject.Y = parseInt(objectPos.y);

                            // We need to store the canvas width and height in order to make seadragon annotations compatible with iscope.
                            annotationObject.CanvasX = parseInt(objectLeft);
                            annotationObject.CanvasY = parseInt(objectTop);

                            annotationObject.Color = canvas._objects[activeAnno].stroke;
                            annotationObject.AnnotationAngle = parseInt(canvas._objects[activeAnno].angle);
                        }
                        else
                        {
                            // We fall in here if we are saving an measurement with no path
                            // So lets set some default values
                            annotationObject.Width = 0;
                            annotationObject.Height = 0;
                            annotationObject.FreeHandX = "0, 0";
                            annotationObject.FreeHandY = "0, 0";
                            annotationObject.CanvasX = 0;
                            annotationObject.CanvasY = 0;
                            var ct = this.base.viewer.viewport.viewportToImageCoordinates(this.base.viewer.viewport.getCenter(true));
                            annotationObject.X = parseInt(ct.x);
                            annotationObject.Y = parseInt(ct.y);
                            annotationObject.AnnotationAngle = 0;
                        }
                    }
                    else if (annotationObject.Shape == "free")
                    {
                        vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].getWidth(), this.canvas._objects[activeAnno].getHeight()));
                        annotationObject.Width = parseInt(vwh.x - vxy.x);
                        annotationObject.Height = parseInt(vwh.y - vxy.y);
                        fabricPath = this.canvas._objects[activeAnno].path;
                        if (fabricPath != undefined) {
                            var pxlPoints = new Array();
                            for (var i = 0; i < fabricPath.length; i++)
                            {
                                var svgPoint = fabricPath[i];
                                if (svgPoint.length == 5) {
                                    svgPoint.shift();
                                    svgPoint.pop();
                                    svgPoint.pop();
                                } else if (svgPoint.length == 3)
                                {
                                    svgPoint.shift();
                                }

                                if (svgPoint.length == 2) {
                                    pxlPoints.push(svgPoint);
                                }

                            }

                            //Scale the freehand co-ordinates
                            var freeHandXArray = new Array();
                            var freeHandYArray = new Array();
                            for (var j = 0; j < pxlPoints.length; j++) {

                                //we to add on the left property of the annotataion to get the screen position of the points
                                var pxlPointX = pxlPoints[j][0] + this.canvas._objects[activeAnno].left;
                                var pxlPointY = pxlPoints[j][1] + this.canvas._objects[activeAnno].top;

                                //if its rotated we need to calculate their position at 0 degrees to be stored
                                if (imageRotation != 0 && imageRotation != undefined) {
                                    var viewerElementCoords = fabric.util.rotatePoint(new fabric.Point(pxlPointX, pxlPointY), this.base.viewer.pivotPoint, -imageRotation * (Math.PI / 180));
                                    freeHandXArray.push(parseInt(viewerElementCoords.x * annotationObject.Z));
                                    freeHandYArray.push(parseInt(viewerElementCoords.y * annotationObject.Z));
                                } else {
                                    freeHandXArray.push(parseInt(pxlPointX * annotationObject.Z));
                                    freeHandYArray.push(parseInt(pxlPointY * annotationObject.Z));
                                }

                            }
                            annotationObject.FreeHandX = freeHandXArray.toString();
                            annotationObject.FreeHandY = freeHandYArray.toString();

                            var objectLeft = this.canvas._objects[activeAnno].left;
                            var objectTop = this.canvas._objects[activeAnno].top;

                            var aWidth = annotationObject.Width;
                            var aHeight = annotationObject.Height;


                            //we need to rotated the width, height, x and y values so that these can be stored at angle 0 in the database 
                            if (imageRotation != 0 && imageRotation != undefined)
                            {
                                var rotatedObject = fabric.util.rotatePoint(new fabric.Point(objectLeft, objectTop), this.base.viewer.pivotPoint, -imageRotation * (Math.PI / 180));
                                objectLeft = rotatedObject.x;
                                objectTop = rotatedObject.y;

                                var rotatedWHObject = fabric.util.rotatePoint(new fabric.Point(aWidth, aHeight), new fabric.Point(0, 0), -imageRotation * (Math.PI / 180));
                                aWidth = rotatedWHObject.x;
                                aHeight = rotatedWHObject.y;

                                annotationObject.Width = Math.abs(aWidth);
                                annotationObject.Height = Math.abs(aHeight);
                            }

                            //convert the x and y to be relative to the image
                            var objectPos = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(objectLeft, objectTop));
                            annotationObject.X = parseInt(objectPos.x);
                            annotationObject.Y = parseInt(objectPos.y);

                            // We need to store the canvas width and height in order to make seadragon annotations compatible with iscope.
                            annotationObject.CanvasX = parseInt(objectLeft + (aWidth / 2) / annotationObject.Z);
                            annotationObject.CanvasY = parseInt(objectTop + (aHeight / 2) / annotationObject.Z);
                            annotationObject.Color = this.canvas._objects[activeAnno].stroke;
                            annotationObject.AnnotationAngle = parseInt(this.canvas._objects[activeAnno].angle);
                        }
                        else
                        {
                            // We fall in here if we are saing a freehand annotation with no path
                            // So lets set some default values
                            annotationObject.Width = 10;
                            annotationObject.Height = 10;
                            annotationObject.FreeHandX = "0, 0";
                            annotationObject.FreeHandY = "0, 0";
                            annotationObject.CanvasX = 0;
                            annotationObject.CanvasY = 0;
                            var ct = this.base.viewer.viewport.viewportToImageCoordinates(this.base.viewer.viewport.getCenter(true));
                            annotationObject.X = parseInt(ct.x); // parseInt((this._getMaxValue(coordsPathX) + this._getMinValue(coordsPathX)) / 2);
                            annotationObject.Y = parseInt(ct.y);
                            annotationObject.Color = "#FFFFFF";
                            annotationObject.AnnotationAngle = 0;
                        }
                    }
                    else {

                        // We are in here becuase we need to calculate other shapes different to freehand /  Linear Measurements
                        var vxy = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                        var vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].getWidth(), this.canvas._objects[activeAnno].getHeight()));

                        annotationObject.Width = parseInt(vwh.x - vxy.x);
                        annotationObject.Height = parseInt(vwh.y - vxy.y);
                        var coords = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].left, this.canvas._objects[activeAnno].top));
                        if (imageRotation != 0 && imageRotation != undefined)
                        {
                            var viewerElementCoords = fabric.util.rotatePoint(new fabric.Point(this.canvas._objects[activeAnno].left, this.canvas._objects[activeAnno].top), this.base.viewer.pivotPoint, -imageRotation * (Math.PI / 180));
                            var coords2 = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(viewerElementCoords.x, viewerElementCoords.y));
                            coords = coords2;
                        }

                        annotationObject.X = parseInt(coords.x);
                        annotationObject.Y = parseInt(coords.y);

                        // We need to store the canvas width and height in order to make seadragon annotations compatible with iscope.
                        annotationObject.CanvasX = parseInt(this.base.viewer.drawer.canvas.width / 2);
                        annotationObject.CanvasY = parseInt(this.base.viewer.drawer.canvas.height / 2);
                        annotationObject.Color = this.canvas._objects[activeAnno].stroke;
                        annotationObject.AnnotationAngle = parseInt(this.canvas._objects[activeAnno].angle);

                        if (annotationObject.Color == null)
                        {
                            annotationObject.Color = "#FF0000";
                        }
                    }
                }
                else
                {
                    // This is to update the text fields and colours of freehand annotations that do not have a freehandX and Y array
                    annotationObject.Color = this.canvas._objects[activeAnno].stroke;
                    var encodedAnnotation = "[" + JSON.stringify(annotationObject) + "]";
                    ViewerWebService.UpdateAnnotationTextAndColor($("#hiddenGuid").val(), encodedAnnotation,
                        function(response) {},
                        function() { PxlViewer.util.Debug.DisplayAlertMessage("failed"); });
                    return;
                }
            }
            else // We are here if the annotation / measurement is being saved for the first time
            {
                // Create a new date time string so that it can be saved and displayed as a part of the information 
                // when the user clicks on the information button under an annotaion or measurement
                var date = new Date();
                var day = date.getDate();
                var month = date.getMonth();
                var year = date.getFullYear();
                var hours = date.getHours();
                var minutes = date.getMinutes();

                if (minutes == "0")
                {
                    minutes += "0";
                }
                else if (minutes.length == 1)
                {
                    minutes = "0" + minutes;
                }

                annotationObject.CreatedOn = day + "/" + month + "/" + year + " " + hours + ":" + minutes;
                annotationObject.CreatedBy = this.base.options.userName;

                // We need to store the canvas width and height in order to make seadragon annotations compatible with iscope.
                annotationObject.CanvasX = parseInt(this.base.viewer.drawer.canvas.width / 2);
                annotationObject.CanvasY = parseInt(this.base.viewer.drawer.canvas.height / 2);
            }

            // If regions is available, save the stack number so that it can be saved to the database
            if (this.base.regions.isRegionsAvailable(pxl))
            {
                annotationObject.Stack = PxlViewer.Regions.getActiveRegionID(pxl);
            }

            // These options are set so that the correct markup is generated
            // (i.e.) the publish / delete / edit buttons appear
            annotationObject.CanDeleteAnnotation = true;
            annotationObject.CanPublishAnnotation = this.base.options.menu.showPublishAnnotations;

            // We need to know the Co-Ordinates of the object in Viewer Element termsfor sothat they can be displayed on iscope.
            var tempX = annotationObject.X;
            var tempY = annotationObject.Y;

            // This is so that the origin is in the center of the annotation / measurement
            // Arrows remain to have an origin of top left
            if (annotationObject.Shape != "arrow")
            {
                tempX = tempX - (annotationObject.Width / 2);
                tempY = tempY - (annotationObject.Height / 2);
            }

            var elementCoordinates = this.base.viewer.viewport.imageToViewerElementCoordinates((new OpenSeadragon.Point(tempX, tempY)));
            annotationObject.ElemX = parseInt(elementCoordinates.x);
            annotationObject.ElemY = parseInt(elementCoordinates.y);

            //the zomming issue is here
            PxlViewer.util.Debug.debug("pre-save Anno");
            PxlViewer.util.Debug.debug(annotationObject);
            var tester = "[" + JSON.stringify(annotationObject) + "]";
            // call webservice
            var pThis = this;
            PxlViewer.util.Debug.debug("EVENT Annotations._saveAnnotation About to send webservice save request");
            PxlViewer.util.Debug.AddLogEvent();

            // If the annotation object already exists, we are just updating it (the reason this is exclusive from initial save is the difference in the events that follow)
            if (annotationObject.ID > 0)
            {
                // Ryan: May need to create a new attribute for the annotation class "Measurement / Annotation" 
                if (annotationObject.Shape != "linear")
                {
                    // If the object is an annotation do this
                    ViewerWebService.SaveAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, tester, function (response)
                    {
                        PxlViewer.util.Debug.debug("EVENT Annotations._saveAnnotation -> webservice save request returned");
                        PxlViewer.util.Debug.AddLogEvent();
                        var ob = jQuery.parseJSON(response);

                        // replace the annotation in the completed array
                        var annoIndex = pThis.base.annotations._getIndexOfAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", ob[0][0].ID);
                        pThis.base.annotations.completeAnnotationList[annoIndex] = ob[0][0];
                        annotationObject = ob[0][0];
                        pThis._hookGeneralEvents();
                        pThis.base.annotations._loadAnnotation(ob[0][0]);
                    }, function(ex) { PxlViewer.util.Debug.DisplayAlertMessage("failed"); });
                }
                else
                {
                    // If the Object is a measurement do this 
                    //(the only difference from the previous method is that on success we retrieve the object from a list of meaurements instead of the list of annotations)
                    // This section could be half the size it is
                    ViewerWebService.SaveAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, tester, function (response)
                    {
                        PxlViewer.util.Debug.debug("EVENT Annotations._saveAnnotation -> webservice save request returned");
                        PxlViewer.util.Debug.AddLogEvent();
                        var ob = jQuery.parseJSON(response);

                        var annoIndex = pThis.base.annotations._getIndexOfAnnotationObjectFromArray(pxl.measurements.completeMeasurementList, "ID", ob[0][0].ID);
                        pThis.base.annotations.completeAnnotationList[annoIndex] = ob[0][0];
                        pxl.measurements.completeMeasurementList[annoIndex] = ob[0][0];
                        annotationObject = ob[0][0];
                        pxl.measurements._bindGeneralEvents();
                        pThis.base.annotations._loadAnnotation(ob[0][0]);
                    }, function () { PxlViewer.util.Debug.DisplayAlertMessage("failed"); });
                }
            }
            else // We are here if we are saving the annotaion / measurement for the first time
            {
                ViewerWebService.SaveAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, tester, function (response)
                {
                    PxlViewer.util.Debug.debug("EVENT Annotations._saveAnnotation -> webservice save request returned");
                    PxlViewer.util.Debug.AddLogEvent();

                    // called when the first save is called to add an empty annotation
                    var ob = jQuery.parseJSON(response);
                    annotationObject.ID = ob[0][0].ID;

                    // Ryan: May need to create a new attribute for the annotation class "Measurement / Annotation" 
                    // We are explicit in a few palces that we can share code between the two different types
                    if (annotationObject.Shape != "linear")
                    {
                        // Add the annotation to the annotations panel and add the class to the div so that we know its in "Edit" mode
                        pThis.addAnnotationToPanel(annotationObject);
                        $("#anno_" + annotationObject.ID).addClass("editAnnotationMode");
                    }
                    else
                    {
                        // Add the measurement to the measurement panel and add the class to the div so that we know its in "Edit" mode
                        pThis.base.measurements._addMeasurementToPanel(annotationObject);
                        $("#measure" + annotationObject.ID).addClass("editMeasurementMode");
                    }

                    // Reload the annotation with the refreshed object returned from he server
                    if (reload)
                    {
                        pThis._loadAnnotation(annotationObject);
                    }
                }, function() { PxlViewer.util.Debug.DisplayAlertMessage("failed"); });
            }
            //update saving text
            //fade out saving text
        },

        _loadAnnotation: function (annotationObject, driveToArea) {
            PxlViewer.util.Debug.log("Annotations._loadAnnotation");
            PxlViewer.util.Debug.log(annotationObject);
            if (!PxlViewer.Annotations.processingAnnotationLoad) {
                PxlViewer.Annotations.processingAnnotationLoad = true;
                var requiresRegionChange = false;
                if (annotationObject != null) {
                    if (driveToArea == undefined) {
                        driveToArea = true;
                    }
                    if (this.base.regions.isRegionsAvailable(pxl)) {
                        if (PxlViewer.Regions.getActiveRegionID(pxl) != annotationObject.Stack) {
                            PxlViewer.Regions.LoadRegion(annotationObject.Stack, annotationObject.ID);
                            requiresRegionChange = true;
                        }
                    }

                    if (!requiresRegionChange) {
                        PxlViewer.util.Debug.debug("Annotations._loadAnnotation - !requiresRegionChange");
                        var base = this.base;
                        this.currentSelectedAnnotation = annotationObject;
                        this._init(base, false, pxl.annotations.options.createPermissions);
                        this.canvas.isDrawingMode = false;
                        this.base.viewer.setMouseNavEnabled(true);
                        var annoAngle = annotationObject.AnnotationAngle - annotationObject.ImageAngle;
                        if (annotationObject.Shape == "rect") {
                            this.base.annotations.addRectangle(annotationObject.ID, new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annoAngle, false, driveToArea);
                        } else if (annotationObject.Shape == "ellipse") {
                            this.base.annotations.addEllipse(annotationObject.ID, new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annoAngle, false, driveToArea);
                        }
                        else if (annotationObject.Shape == "arrow")
                        {
                            var newArrow =
                            {
                                path: this.base.annotations._getArrowPath(1),
                                x: annotationObject.X,
                                y: annotationObject.Y,
                                width: annotationObject.Width,
                                height: annotationObject.Height
                            };

                            this.base.annotations.addArrow(annotationObject.ID, newArrow, annotationObject.Color, annotationObject.Z, annoAngle, false, driveToArea);
                        }
                        else if (annotationObject.Shape == "linear") {
                            var arrX = annotationObject.FreeHandX.split(',');
                            var arrY = annotationObject.FreeHandY.split(',');
                            var newLinearObject = pxl.measurements._GetStaticLinearBookendSVGPathTEST(arrX[0], arrY[0], arrX[arrX.length - 1], arrY[arrY.length - 1], annotationObject.Z);
                            var p = new fabric.Path(newLinearObject.path);
                            var linear =
                            {
                                path: p.path,
                                startX: arrX[0],
                                endX: arrX[arrX.length - 1],
                                startY: arrY[0],
                                endY: arrY[arrY.length - 1],
                                x: annotationObject.X + newLinearObject.xAdjustment,
                                y: annotationObject.Y + newLinearObject.yAdjustment,
                                width: annotationObject.Width,
                                height: annotationObject.Height
                            };
                            this.base.annotations.addLinear(annotationObject.ID, linear, annotationObject.Color, annotationObject.Z, annoAngle, false, driveToArea);
                        }
                        else if (annotationObject.Shape == "free") {
                            //convert the pathxlPoints to svg co ords for the fabric object
                            var arrX = annotationObject.FreeHandX.split(',');
                            var arrY = annotationObject.FreeHandY.split(',');
                            var points = new Array();
                            for (var i = 0; i < arrX.length; i++) {
                                var x = arrX[i];
                                var y = arrY[i];
                                var point = new fabric.Point(x, y);
                                points.push(point);
                            }

                            var pathData = this.convertPointsToSVGPath(points, 0, 0);
                            var p = new fabric.Path(pathData);

                            if (points.length <= 1) {
                                // there is no path then point the viewer to the centre of the screen
                                var winpoints = this.base.viewer.viewport.viewportToImageCoordinates(this.base.viewer.viewport.homeBounds.getCenter(true));
                                annotationObject.Width = 0;
                                annotationObject.Height = 0;
                                annotationObject.X = winpoints.x;
                                annotationObject.Y = winpoints.y;
                            }

                            var newFreehand =
                            {
                                path: p.path,
                                x: annotationObject.X,
                                y: annotationObject.Y,
                                width: annotationObject.Width,
                                height: annotationObject.Height
                            };
                            this.base.annotations.addFreehand(annotationObject.ID, newFreehand, annotationObject.Color, annotationObject.Z, annoAngle, false, driveToArea);
                        }
                    }

                }
                if(!requiresRegionChange){PxlViewer.Annotations.processingAnnotationLoad = false;}
            } 
        },

        _getMaxValue: function (array) {
            PxlViewer.util.Debug.log("Annotations._getMaxValue");
	        return Math.max.apply(Math, array);
        },
        _getMinValue: function (array) {
            PxlViewer.util.Debug.log("Annotations._getMinValue");
            return Math.min.apply(Math, array);
        },
        _getScaleFactor: function () {
            PxlViewer.util.Debug.log("Annotations._getScaleFactor");
            return 0.05;
            //return 0.035;
        },
        
        _editAnnotation: function (annotationObject, driveToArea) {
            PxlViewer.util.Debug.log("Annotations._editAnnotation");
            if (driveToArea == null || driveToArea == "undefined") {
                driveToArea = true;
            }
            this.base.annotations.enterEditMode();
            var annoAngle = annotationObject.AnnotationAngle - annotationObject.ImageAngle;
            if (annotationObject.Shape == "rect") {
                this.base.annotations.addRectangle(annotationObject.ID, new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annoAngle, true, driveToArea);
            }
            else if (annotationObject.Shape == "ellipse") {
                this.base.annotations.addEllipse(annotationObject.ID, new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annoAngle, true, driveToArea);
            }
            else if (annotationObject.Shape == "arrow") {
                var newArrow =
                {
                    path: this.base.annotations._getArrowPath(1),
                    x: annotationObject.X,
                    y: annotationObject.Y,
                    width: annotationObject.Width,
                    height: annotationObject.Height
                };
                var currRotation = this.base.viewer.viewport.getRotation();
                this.base.annotations.addArrow(annotationObject.ID, newArrow, annotationObject.Color, annotationObject.Z, currRotation, true, driveToArea);
            }
            else if (annotationObject.Shape == "linear")
            {
                var arrX = annotationObject.FreeHandX.split(',');
                var arrY = annotationObject.FreeHandY.split(',');

                var newLinearObject = pxl.measurements._GetStaticLinearBookendSVGPathTEST(arrX[0], arrY[0], arrX[arrX.length - 1], arrY[arrY.length - 1], annotationObject.Z);
                var p = new fabric.Path(newLinearObject.path);
                var linear =
                {
                    path: p.path,
                    startX: arrX[0],
                    endX: arrX[arrX.length - 1],
                    startY: arrY[0],
                    endY: arrY[arrY.length - 1],
                    x: annotationObject.X + newLinearObject.xAdjustment,
                    y: annotationObject.Y + newLinearObject.yAdjustment,
                    width: annotationObject.Width,
                    height: annotationObject.Height
                };
                this.base.annotations.addLinear(annotationObject.ID, linear, annotationObject.Color, annotationObject.Z, annoAngle, true, driveToArea);
            }
            else if (annotationObject.Shape == "free") {
                //get the pathXL freehand points and convert them to svg for the fabric annotation
                var arrX = annotationObject.FreeHandX.split(',');
                var arrY = annotationObject.FreeHandY.split(',');
                var points = new Array();
                for (var i = 0; i < arrX.length; i++) {
                    var point = new fabric.Point(arrX[i], arrY[i]);
                    points.push(point);
                }

                var pathData = this.convertPointsToSVGPath(points, 0, 0);
                var p = new fabric.Path(pathData);
                var newFreehand =
                {
                    path: p.path,
                    x: annotationObject.X,
                    y: annotationObject.Y,
                    width: annotationObject.Width,
                    height: annotationObject.Height
                };
                this.base.annotations.addFreehand(annotationObject.ID, newFreehand, annotationObject.Color, annotationObject.Z, annoAngle, true, driveToArea);
            }
        },

        _deleteAnnotation: function (annotationObjectID) {
            PxlViewer.util.Debug.log("Annotations._deleteAnnotation");
            var annotationID = annotationObjectID;
            var pThis = this;

            ViewerWebService.DeleteAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, annotationID, function (response) {
                var annoIndex = pThis.base.annotations._getIndexOfAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", annotationID);
                pThis.base.annotations.completeAnnotationList.splice(annoIndex, 1);
                $('#anno_' + annotationID).remove();
                pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.annotation, pThis.base.annotations.completeAnnotationList.length);

                if (pThis.base.annotations.canvas != null)
                {
                    pThis.base.annotations.canvas.clear();
                }

                if (pThis.base.annotations.isEditMode) {
                    pThis.base.annotations.exitEditMode();
                }
                this.currentSelectedAnnotation = null;
                pxl.options.annotations.startNumber -= 1;
            }, function () { PxlViewer.console.log("Could not delete annotation"); });

            this.update();
        },

        _publishAnnotation: function (annotationObject) {
            PxlViewer.util.Debug.log("Annotations._publishAnnotation");
            var annotationID = annotationObject.ID;

            ViewerWebService.ShareAnnotation($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, annotationID, function (response) {
                var labelText = $('#publishLbl_' + annotationID).text();
                if (labelText == "Share") {
                    $('#publishLbl_' + annotationID).text("Unshare");
                } else {
                    $('#publishLbl_' + annotationID).text("Share");
                }

                // invert the published status in the local array so that when the menu is closed 
                // and opened again the annotation hve the correct published state
                var index = pxl.annotations._getIndexOfAnnotationObjectFromArray(pxl.annotations.completeAnnotationList, "ID", annotationID);
                pxl.annotations.completeAnnotationList[index].Published = !pxl.annotations.completeAnnotationList[index].Published;
            }, function () { PxlViewer.console.log("Could not share annotation"); });
        },
        /**
         * Returns the current window image size. That is, the size of the image currently in the window.
         * @function
         * @returns {OpenSeadragon.Point} - image size
         */
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

        addFreehand: function (id, freehand, strokeColor, zoom, angle, allowEdit, driveToArea) {
            PxlViewer.util.Debug.log("Annotations.addFreehand");
            var newAnnotation = {
                ID: id,
                type: 'free',
                imageAngle: 0,
                origDimensions: freehand,
                coOrds: freehand.pxlCoOrds,
                obj: new fabric.Path(freehand.path),
                AnnotationAngle: 0
            };
            
            newAnnotation.obj.set({
                left: freehand.x,
                top: freehand.y,
                width: freehand.width,
                height: freehand.height,
                fill: 'rgba(0,0,0,0)',
                stroke: strokeColor,
                borderColor: strokeColor,
                strokeWidth: 3,
                originX: "center",
                originY: "center",
                selectable: false,
                hasBorders:false,
                centeredScaling: true,
                cornerColor: strokeColor,
                cornerSize: 34
            });
            
            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;

            this.editMode = allowEdit;
            var alreadyDriven = false;
            if (allowEdit) {

                if (newAnnotation.ID != 0 && driveToArea) {
                    this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
                    alreadyDriven = true;
                    this.base.viewer.viewport.update();
                }

                var p = new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y);
                var vc = this.base.viewer.viewport.imageToViewportCoordinates(p);
                var pFp = this.base.viewer.viewport.pixelFromPoint(vc, true);
                var bounds = this.base.viewer.viewport.getBounds(true);
                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));

                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;
                newAnnotation.obj.width = newAnnotation.origDimensions.width;
                newAnnotation.obj.height = newAnnotation.origDimensions.height;
                this.canvas.add(newAnnotation.obj);
            }
            else {
                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;
                ////closer scaling issue
                this.freeHandGroup.add(newAnnotation.obj);
                this.group.add(newAnnotation.obj);
            }

            if (driveToArea && !alreadyDriven) {
                this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
            }
           
            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();


        },

        /**
         * Creates a new rectangle annotation. The rect parameter specifies the
         * position and dimensions of the rectangle to be drawn, the coordinates
         * specified should be image coordinates.
         * @function
         * @param {OpenSeadragon.Rect} - rect
         * @param {String} - strokeColor - Specifies the rectangle's border color.
         */
        addRectangle: function (id, rect, strokeColor, zoom, angle, allowEdit, driveToArea) {
            PxlViewer.util.Debug.log("Annotations.addRectangle");
            //left and right are currently dummy values for the constructor. THer are overwritten below in the group
            var newAnnotation = {
                ID: id,
                type: 'rect',
                imageAngle: 0,
                AnnotationAngle: angle,
                origDimensions: rect,
                obj: new fabric.Rect({
                    left: rect.x,
                    top: -9999,
                    width: rect.width,
                    height: rect.height,
                    fill: 'rgba(0,0,0,0)',
                    borderColor: strokeColor,
                    cornerColor: strokeColor,
                    cornerSize: this.options.cornerSize,
                    stroke: strokeColor,
                    strokeWidth: 3,
                    selectable: true,
                    originX: "center",
                    originY: "center",
                    strokeLineJoin: "round",
                    angle: angle,
                    transparentCorners: false
                })
            };

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;
            
            this.editMode = allowEdit;
            var alreadyDriven = false;
            if (allowEdit) {
                if (newAnnotation.ID != 0 && driveToArea) {
                    this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
                    alreadyDriven = true;
                    this.base.viewer.viewport.update();
                }
                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;
                newAnnotation.obj.width = newAnnotation.origDimensions.width;
                newAnnotation.obj.height = newAnnotation.origDimensions.height;
                //add them to the annotation group
                this.canvas.add(newAnnotation.obj);
            }
            else {

                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;
                this.group.add(newAnnotation.obj);
                // this.canvas.add(this.group);
            }

            if (driveToArea && !alreadyDriven) {
                this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
            }
            //
            //this.base.viewer.viewport.zoomTo( this.base.viewer.viewport.imageToViewportZoom(newAnnotation.origZoom), new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y), true);
            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();
        },

        addScreenshot: function (rect, strokeColor, zoom, angle) {
            PxlViewer.util.Debug.log("Annotations.addScreenshot");
            //left and right are currently dummy values for the constructor. THer are overwritten below in the group
            var newAnnotation = {
                type: 'rect',
                imageAngle: 0,
                AnnotationAngle: angle,
                origDimensions: rect,
                obj: new fabric.Rect({
                    left: rect.x,
                    top: -9999,
                    width: rect.width,
                    height: rect.height,
                    fill: 'rgba(0,0,0,0)',
                    borderColor: strokeColor,
                    cornerColor: strokeColor,
                    cornerSize: this.options.cornerSize,
                    stroke: strokeColor,
                    strokeWidth: 2,
                    selectable: true,
                    originX: "center",
                    originY: "center",
                    strokeLineJoin: "round",
                    angle: angle,
                    transparentCorners: false,
                    hasRotatingPoint: false
                })
            };

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;

            this.editMode = true;

            var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
            newAnnotation.obj.left = wincoords.x;
            newAnnotation.obj.top = wincoords.y;
            newAnnotation.obj.width = newAnnotation.origDimensions.width;
            newAnnotation.obj.height = newAnnotation.origDimensions.height;
            //add them to the annotation group
            this.canvas.add(newAnnotation.obj);

            this.objects.push(newAnnotation);
            this.update();
        },

        addArrow: function (id, arrow, strokeColor, zoom, angle, allowEdit, driveToArea) {
            PxlViewer.util.Debug.log("Annotations.addArrow");
            //left and right are currently dummy values for the constructor. THer are overwritten below in the group
            var newAnnotation =
                {
                    ID: id,
                    type: 'arrow',
                    imageAngle: angle,
                    AnnotationAngle: 0,
                    origDimensions: arrow,
                    obj: new fabric.Path(arrow.path)
                };

            newAnnotation.obj.set({
                left: arrow.x,
                top: arrow.y,
                width: arrow.width,
                height: arrow.height,
                fill: 'rgba(0,0,0,0)',
                borderColor: strokeColor,
                cornerColor: strokeColor,
                cornerSize: this.options.cornerSize,
                stroke: strokeColor,
                strokeWidth: 6,
                selectable: allowEdit,
                angle: angle,
                transparentCorners: true,
                centeredScaling: false,
                centeredRotation: false,
                hasBorders: false
            });

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;

            this.editMode = allowEdit;
            var alreadyDriven = false;
            if (allowEdit) {
                if (newAnnotation.ID != 0 && driveToArea) {
                    this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
                    alreadyDriven = true;
                    this.base.viewer.viewport.update();
                }

                var p = new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y);
                var vc = this.base.viewer.viewport.imageToViewportCoordinates(p);
                var pFp = this.base.viewer.viewport.pixelFromPoint(vc, true);
                var bounds = this.base.viewer.viewport.getBounds(true);
                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
               
                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;

                //newAnnotation.obj.width = newAnnotation.origDimensions.width;
                //newAnnotation.obj.height = newAnnotation.origDimensions.height;
                newAnnotation.obj.width = 200;
                newAnnotation.obj.height = 300;
                newAnnotation.obj.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false, tl: false, bl: false, tr: false });
               this.canvas.add(newAnnotation.obj);
            }
            else {
                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;
                ////closer scaling issue
                this.group.add(newAnnotation.obj);
            }

            if (driveToArea && !alreadyDriven) {
                this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
            }

            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();
        },

        addLinear: function (id, linearObject, strokeColor, zoom, angle, allowEdit, driveToArea)
        {
            var newAnnotation = {
                ID: id,
                type: 'linear',
                imageAngle: 0,
                origDimensions: linearObject,
                coOrds: linearObject.pxlCoOrds,
                obj: new fabric.Path(linearObject.path),
                AnnotationAngle: 0
            };

            newAnnotation.obj.set({
                left: linearObject.x,
                top: linearObject.y,
                width: linearObject.width,
                height: linearObject.height,
                fill: 'rgba(0,0,0,0)',
                stroke: strokeColor,
                borderColor: strokeColor,
                strokeWidth: 3,
                selectable: false,
                hasBorders: false,
                centeredScaling: true,
                cornerColor: strokeColor,
                cornerSize: 34,

            });

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;

            this.editMode = allowEdit;
            var alreadyDriven = false;
            if (allowEdit) {

                if (newAnnotation.ID != 0 && driveToArea)
                {
                    this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
                    alreadyDriven = true;
                    this.base.viewer.viewport.update();
                }
                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));

                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;
                newAnnotation.obj.width = newAnnotation.origDimensions.width;
                newAnnotation.obj.height = newAnnotation.origDimensions.height;
                this.canvas.add(newAnnotation.obj);
            }
            else {
                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;

                ////closer scaling issue
                this.freeHandGroup.add(newAnnotation.obj);
                this.group.add(newAnnotation.obj);
            }

            if (driveToArea && !alreadyDriven) {

                this.driveToArea(newAnnotation.origDimensions.x + (Math.abs(newAnnotation.origDimensions.width) / 2), newAnnotation.origDimensions.y + (Math.abs(newAnnotation.origDimensions.height) / 2), newAnnotation.origZoom, newAnnotation.imageAngle, Math.abs(newAnnotation.origDimensions.width), Math.abs(newAnnotation.origDimensions.height), newAnnotation.obj.angle);
            }

            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();
        },

        addEllipse: function (id, rect, strokeColor, zoom, angle, allowEdit, driveToArea) {
            PxlViewer.util.Debug.log("Annotations.addEllipse");
            //left and right are currently dummy values for the constructor. THer are overwritten below in the group
            var newAnnotation = {
                ID: id,
                type: 'ellipse',
                imageAngle: 0,
                AnnotationAngle: angle,
                origDimensions: rect,
                obj: new fabric.Ellipse({
                    left: rect.x,
                    top: rect.y,
                    rx: rect.width,
                    ry: rect.height,
                    fill: 'rgba(0,0,0,0)',
                    borderColor: strokeColor,
                    cornerColor: strokeColor,
                    cornerSize: this.options.cornerSize,
                    stroke: strokeColor,
                    strokeWidth: 3,
                    selectable: allowEdit,
                    originX: "center",
                    originY: "center",
                    //strokeLineJoin: "round",
                    angle: angle,
                    transparentCorners: false,
                    centeredScaling: true
                })
            };

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;
            this.editMode = allowEdit;
            var alreadyDriven = false;
            if (allowEdit) {
                if (newAnnotation.ID != 0 && driveToArea) {
                    this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
                    alreadyDriven = true;
                    this.base.viewer.viewport.update();
                }

                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;
                newAnnotation.obj.rx = newAnnotation.origDimensions.width;
                newAnnotation.obj.ry = newAnnotation.origDimensions.height;
                newAnnotation.obj.width = newAnnotation.origDimensions.width + 100;
                newAnnotation.obj.height = newAnnotation.origDimensions.height + 100;
                newAnnotation.obj.rx = newAnnotation.obj.rx / 2;
                newAnnotation.obj.ry = newAnnotation.obj.ry / 2;
                this.canvas.add(newAnnotation.obj);
            }
            else {
                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;
                this.group.add(newAnnotation.obj);
            }

            if (driveToArea && !alreadyDriven) {
                this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle, newAnnotation.origDimensions.width, newAnnotation.origDimensions.height, newAnnotation.obj.angle);
            }
            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();
        },

        convertPointsToSVGPath: function (points, minX, minY) {
            PxlViewer.util.Debug.log("Annotations.convertPointsToSVGPath");
            if (points.length > 1) {
                var path = [],
                    p1 = new fabric.Point(points[0].x - minX, points[0].y - minY),
                    p2 = new fabric.Point(points[1].x - minX, points[1].y - minY);

                path.push('M ', points[0].x - minX, ' ', points[0].y - minY, ' ');
                for (var i = 1, len = points.length; i < len; i++) {
                    var midPoint = p1.midPointFrom(p2);
                    // p1 is our bezier control point
                    // midpoint is our endpoint
                    // start point is p(i-1) value.
                    path.push('Q ', p1.x, ' ', p1.y, ' ', midPoint.x, ' ', midPoint.y, ' ');
                    p1 = new fabric.Point(points[i].x - minX, points[i].y - minY);
                    if ((i + 1) < points.length) {
                        p2 = new fabric.Point(points[i + 1].x - minX, points[i + 1].y - minY);
                    }
                }
                path.push('L ', p1.x, ' ', p1.y, ' ');
                return path.join('');
            }
            var winpoints = this.base.viewer.viewport.viewportToImageCoordinates(this.base.viewer.viewport.homeBounds.getCenter(true));
            winpoints.x = winpoints.x / -2;
            winpoints.y = winpoints.y / -2;
            var path2 = [];
            // if the aanotation hasa no path then set the only point in the path to be the centre of the screen
            path2.push('M ', winpoints.x, ' ', winpoints.y, ' ');
            path2.push('Q ', winpoints.x , ' ', winpoints.y , ' ', winpoints.x, ' ', winpoints.y, ' ');
            path2.push('L ', winpoints.x, ' ', winpoints.y, ' ');
            return path2.join('');
        },

        toggleDrawingMode: function () {
            PxlViewer.util.Debug.log("Annotations.toggleDrawingMode");
            var base = this.base;
            //objects are save so that they can be redrawn later
            var objects = this.objects;
            if (this.canvas.isDrawingMode) {
                //destroy is required here to remove the static canvas to make way for the writeable canavs
                this._init(base, false, pxl.annotations.options.createPermissions);
                this.canvas.isDrawingMode = false;
                this.base.viewer.setMouseNavEnabled(true);
            }
            else {
                this._init(base, "#annoCanvas1", pxl.annotations.options.createPermissions);
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush.color = "#FF0000";
                this.base.viewer.setMouseNavEnabled(false);
            }
            this.canvas.renderOnAddRemove = false;
            for (var i = 0; i < objects.length; i++) {
                this.group.add(objects[i].obj);
                this.objects.push(objects[i]);
            }
            this.canvas.renderOnAddRemove = true;
            this.update();
        },

        clear: function () {
            PxlViewer.util.Debug.log("Annotations.clear");
            if (this.canvas != null) {
                this.canvas.clear();
                this.canvas.dispose();
            }
        },
        destroy: function () {
            PxlViewer.util.Debug.log("Annotations.destroy");
            this.options.showControls = false;
            this.isEditMode = false;
            if (this.canvas != null) {
                this.canvas.clear();
                this.canvas.dispose();
                this.canvas = null;
            }
            this.objects = null;
            this.group = null;
            $(pxl.viewer.canvas).find("canvas").each(function () {
                var id = $(this).attr("id");
                if (id != undefined && id.startsWith("annotationCanvas")) {
                    pxl.viewer.removeOverlay($(this)[0]);
                    $(this).remove();
                }
            });
            $('#annoCanvas1').empty();
        }
    });

}(PxlViewer));