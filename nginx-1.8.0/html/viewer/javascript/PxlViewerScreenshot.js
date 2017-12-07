/// <reference path="PxlViewer.js" />
/// <reference path="PxlViewerImageAdjustments.js" />
/// <reference path="PxlViewerHeatmap.js"/>
// PxlViewer v0.1.0
// Copyright (C) PathXL
(function (PxlViewer) {
    PxlViewer.Screenshot = function (options, base) {
        this._ns = "screenshot_";
        this.options = {
            attachElementID: "view1",
            className: null
        };
        this.internalProperties = {
            holderID: this._ns + "ViewerScreenshotHolder",
            debugMode: false,
            screenshotBaseURL: null,
            screenshotImageObject: null,
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
                whiteSpaceOffset: {x:0,y:0, xmax:0, ymax:0} // this  is the whitespace offset of the image
            },
            dialogloaded: false,
            drawScreenshotObject: null,
            drawAttributes: {
                enabled: false,
                drawingCanvas: null,
                rect: null,
                isDown: false, 
                origX: 0, 
                origY: 0
            },
            validTypes : ["1","2","4"] // jpeg, png, tiff
        };
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
    };

    $.extend(PxlViewer.Screenshot.prototype, {
        /**
            * Generates and appends the Screenshot's HTML into the <body>.
            **/
        _init: function () {
            PxlViewer.util.Debug.log("Screenshot._init");
            var pThis = this;
            if (this.canSeeScreenshot() && $("#" + this.internalProperties.holderID).length == 0) {
                $('#' + pxl.menu.options._menuIDs.screenshot + pxl.menu.options._menuIDs.drawerAppender + "Container").hide();
                ViewerWebService.GetScreenshotModal($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id,
                    this.internalProperties.holderID, this.options.attachElementID, new Date().getTime(), function (response) {
                        if (!PxlViewer.util.IsNullOrEmpty(response)) {
                            parseJsonResponse(response);
                            pxl.Screenshot.internalProperties.dialogloaded = true;
                            $('#' + pxl.menu.options._menuIDs.screenshot + pxl.menu.options._menuIDs.drawerAppender + "Container").show();
                            pxl.menu.positionAllSlideOutPanels();
                        }
                }, function () { PxlViewer.console.log("Could not get Screenshot modal"); });

            }
        },
        makeScreenshot: function () {
            PxlViewer.util.Debug.log("Screenshot.makeScreenshot");
            // if the user has been in draw mode and then clicks on the whole screenshot 
            // this will exit out of draw mode and load the whole screen screenshot
            this._exitDrawMode();

            // reset the type dropdown to jpeg
            $('#' + this._ns + 'typeDDl')[0].selectedIndex = 0;
            // reset the resolution dropdown to the first option
            $('#' + this._ns + 'resDDl')[0].selectedIndex = 0;
            // disable the keyboard / mouse navigation
            pxl.viewer.setMouseNavEnabled(false); // disable the viewer mouse navigaiton
            pxl.internalProperties.panning.enabled = false; // disable the viewer keyboard navigation

            pxl.menu.hideAllSlideoutPanels();
            pxl.menu.SetActiveOn(pxl.menu.options._menuIDs.screenshot + pxl.menu.options._menuIDs.drawerAppender + "Container");

            if (pxl.Screenshot.internalProperties.dialogloaded) {
                if ($('.' + this._ns + 'Imgholder > img').length == 0) {
                    // if the image has been removed then add it again
                    $('.' + this._ns + 'Imgholder').append(this.internalProperties.screenshotImageObject);
                }
                // for full screen image
                this.setInternalPropertiesAttributes(null,null,null, null, false);
                this.internalProperties.attributes.isDraw = false;
                this.internalProperties.attributes.lastConstructedURL = this._getScreenshotURL(this.internalProperties.attributes.varX, this.internalProperties.attributes.varY, this.internalProperties.attributes.varW, this.internalProperties.attributes.varH, this.internalProperties.attributes.truezoom, this.internalProperties.attributes.realCentreX, this.internalProperties.attributes.realCentreY, this.internalProperties.attributes.viewportW, this.internalProperties.attributes.viewportH, pxl.GetCurrentRotation(), this.internalProperties.attributes.isDraw, this.internalProperties.attributes.dx, this.internalProperties.attributes.dy, this.internalProperties.attributes.dw, this.internalProperties.attributes.dh);

                $("#" + this.internalProperties.holderID + ' .' + this._ns + 'Imgholder > img').attr("src", this.internalProperties.attributes.lastConstructedURL)
                    .css({
                        "max-width": (this.internalProperties.attributes.viewerSize[0] * 0.55) + "px",
                        "max-height": (this.internalProperties.attributes.viewerSize[1] * 0.55) + "px"
                    });

                
                setTimeout(function() {
                    $('#' + pxl.Screenshot.internalProperties.holderID).show();
                    pxl.Screenshot.resize();
                },50);
            }
        },
        drawScreenshot: function () {
            PxlViewer.util.Debug.log("Screenshot.drawScreenshot");
            var pThis = this;
            // if the user clicks whole screenshot and then while it is still open draw 
            //screenshot this will remove the screenshot window and put it into draw mode
            pxl.Screenshot._exitDrawMode();

            $('#' + pxl.Screenshot.internalProperties.holderID).hide();

            // disable the keyboard / mouse navigation
            pxl.viewer.setMouseNavEnabled(false);
            pxl.internalProperties.panning.enabled = false;
            // hide the menu item but keep it active
            pxl.menu.hideAllSlideoutPanels();
            pxl.menu.SetActiveOn(pxl.menu.options._menuIDs.screenshot + pxl.menu.options._menuIDs.drawerAppender + "Container");
           
            var viewerSize = this.base.menu.getViewerSize();
            var currentdate = new Date();
            var datetime = currentdate.getSeconds();
            var canvasElement = $("<canvas id='screenshotCanvas" + datetime + "' class='screenshotCanvasHolder' width='" + viewerSize[0] + "' height='" + viewerSize[1] + "' style='position:absolute;left:0;top:0;' />");
            $(canvasElement).insertBefore("#" + pThis.options.attachElementID);
            pxl.Screenshot.internalProperties.drawAttributes.enabled = true;
            if (this.internalProperties.debugMode) {
                var drawingMessage = $('<div id="' + this._ns + 'beginDrawMessage"><span>Start Drawing</span> <input id="' + pThis._ns + 'cancelScreenDraw" type="button" class="screenshotButtons cutomDialogBtn" value="Cancel" /></div>');
                $('#' + pThis.options.attachElementID).append(drawingMessage);
            }
            setTimeout(function () {
                $('#' + pThis._ns + "cancelScreenDraw").click(function (event) {
                    // when the debug cancel mode is clicked
                    pThis._exitDrawMode(event);
                    pThis.cancel();
                });
                pThis.internalProperties.drawAttributes.drawingCanvas = new fabric.Canvas("screenshotCanvas" + datetime, { selection: false });
                $("#screenshotCanvas" + datetime).parent().css({ "position": "absolute" });

                pThis.internalProperties.drawAttributes.drawingCanvas.on('mouse:down', pThis._mouseDownEvent);
                pThis.internalProperties.drawAttributes.drawingCanvas.on('mouse:move', pThis._mouseMoveEvent);
                pThis.internalProperties.drawAttributes.drawingCanvas.on('mouse:up', pThis._mouseUpEvent);
            }, 0);
        },
        /*
        * Mouse Events
        */
        /// <summary>
        /// occurs when drawing a screenshot and the mouse is down
        /// </summary>
        _mouseDownEvent: function(o) {
            if (!pxl.Screenshot.internalProperties.drawAttributes.enabled) { return; }
            pxl.Screenshot.internalProperties.drawAttributes.isDown = true;
            var pointer = pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas.getPointer(o.e);
            pxl.Screenshot.internalProperties.drawAttributes.origX = pointer.x;
            pxl.Screenshot.internalProperties.drawAttributes.origY = pointer.y;
            var strokeColor = "#FF0000";
            pxl.Screenshot.internalProperties.drawAttributes.rect = new fabric.Rect({
                left: pxl.Screenshot.internalProperties.drawAttributes.origX,
                top: pxl.Screenshot.internalProperties.drawAttributes.origY,
                originX: 'left',
                originY: 'top',
                width: pointer.x - pxl.Screenshot.internalProperties.drawAttributes.origX,
                height: pointer.y - pxl.Screenshot.internalProperties.drawAttributes.origY,
                angle: 0,
                fill: 'rgba(255,255,255,0)',
                transparentCorners: false,
                stroke: strokeColor,
                strokeWidth: 3
            });
            pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas.add(pxl.Screenshot.internalProperties.drawAttributes.rect);
        },
        /// <summary>
        /// occurs when drawing a screenshot and the mouse is moving
        /// </summary>
        _mouseMoveEvent: function (o) {
            if (!pxl.Screenshot.internalProperties.drawAttributes.enabled) { return; }
            if (pxl.Screenshot.internalProperties.drawAttributes.isDown == false) { return; }
            var pointer = pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas.getPointer(o.e);

            if (pxl.Screenshot.internalProperties.drawAttributes.origX > pointer.x) {
                pxl.Screenshot.internalProperties.drawAttributes.rect.set({ left: Math.abs(pointer.x) });
            }
            if (pxl.Screenshot.internalProperties.drawAttributes.origY > pointer.y) {
                pxl.Screenshot.internalProperties.drawAttributes.rect.set({ top: Math.abs(pointer.y) });
            }

            pxl.Screenshot.internalProperties.drawAttributes.rect.set({ width: Math.abs(pxl.Screenshot.internalProperties.drawAttributes.origX - pointer.x) });
            pxl.Screenshot.internalProperties.drawAttributes.rect.set({ height: Math.abs(pxl.Screenshot.internalProperties.drawAttributes.origY - pointer.y) });
                    
            pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas.renderAll();
        },
        /// <summary>
        /// occurs when drawing a screenshot and the mouse is up
        /// </summary>
        _mouseUpEvent: function (o) {
            if (!pxl.Screenshot.internalProperties.drawAttributes.enabled) { return; }
            pxl.Screenshot.internalProperties.drawAttributes.isDown = false;
            var width = pxl.Screenshot.internalProperties.drawAttributes.rect.width;
            var height = pxl.Screenshot.internalProperties.drawAttributes.rect.height;
            var top = pxl.Screenshot.internalProperties.drawAttributes.rect.top;
            var left = pxl.Screenshot.internalProperties.drawAttributes.rect.left;

            if (pxl.Screenshot.internalProperties.dialogloaded) {
                if ($('.' + pxl.Screenshot._ns + 'Imgholder > img').length == 0) {
                    // if the image has been removed then add it again
                    $('.' + pxl.Screenshot._ns + 'Imgholder').append(pxl.Screenshot.internalProperties.screenshotImageObject);
                }
                // set the image attributes for the url
                pxl.Screenshot.setInternalPropertiesAttributes(null, null, null, null, true, left, top, width, height);
                pxl.Screenshot.internalProperties.attributes.isDraw = true;
                // reset the type dropdown to jpeg
                $('#' + pxl.Screenshot._ns + 'typeDDl')[0].selectedIndex = 0;
                // reset the resolution dropdown to the first option
                $('#' + pxl.Screenshot._ns + 'resDDl')[0].selectedIndex = 0;

                // get the screenshot url

                var whiteSpace = parseInt(pxl.Screenshot.getimageTopCoordinates().y) * 2;
                if (whiteSpace < 0)
                {
                    whiteSpace = 0;
                }
                var canvasWidth = parseInt(pxl.viewer.container.clientWidth);
                var canvasHeight = parseInt(pxl.viewer.container.clientHeight) - whiteSpace;
                var centerPoint = pxl.viewer.viewport.getCenter(true);
                centerPoint = pxl.viewer.viewport.viewportToImageCoordinates(centerPoint);

                var currentZoom = pxl.images[pxl.currentImage].info.mag / pxl.viewer.viewport.viewportToImageZoom(pxl.viewer.viewport.getZoom() * pxl.images[pxl.currentImage].info.mag);
                var rcx = centerPoint.x / currentZoom;
                var rcy = centerPoint.y / currentZoom;

                pxl.Screenshot.internalProperties.attributes.lastConstructedURL = pxl.Screenshot._getScreenshotURL(pxl.Screenshot.internalProperties.attributes.varX, pxl.Screenshot.internalProperties.attributes.varY, pxl.Screenshot.internalProperties.attributes.varW, pxl.Screenshot.internalProperties.attributes.varH, pxl.Screenshot.internalProperties.attributes.truezoom, rcx, rcy, canvasWidth, canvasHeight, pxl.GetCurrentRotation(), pxl.Screenshot.internalProperties.attributes.isDraw, pxl.Screenshot.internalProperties.attributes.dx, pxl.Screenshot.internalProperties.attributes.dy, pxl.Screenshot.internalProperties.attributes.dw, pxl.Screenshot.internalProperties.attributes.dh);
                // set the width and height of the screenshot box
                $("#" + pxl.Screenshot.internalProperties.holderID + ' .' + pxl.Screenshot._ns + 'Imgholder > img').attr("src", pxl.Screenshot.internalProperties.attributes.lastConstructedURL)
                    .css({
                        "max-width": (pxl.Screenshot.internalProperties.attributes.viewerSize[0] * 0.7) + "px",
                        "max-height": (pxl.Screenshot.internalProperties.attributes.viewerSize[1] * 0.7) + "px"
                    });
                setTimeout(function () {
                    $('#' + pxl.Screenshot.internalProperties.holderID).show();
                    pxl.Screenshot.resize();
                }, 50);
                // get rid of the drawn area
                pxl.Screenshot._exitDrawMode();
            }
        },
        /*
        * END Mouse Events
        */
        _exitDrawMode: function (event) {
            PxlViewer.util.Debug.log("Screenshot._exitDrawMode");
            $("#" + pxl.Screenshot._ns + "beginDrawMessage").remove();
            pxl.viewer.setMouseNavEnabled(true); // reenable the mouse slide navigation
            pxl.internalProperties.panning.enabled = true; // reenable the viewer keyboard navigation
            if (pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas != null) {
                pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas.dispose();
                pxl.Screenshot.internalProperties.drawAttributes.drawingCanvas = null;
            }

            pxl.Screenshot.internalProperties.drawAttributes.enabled = false;
            pxl.Screenshot.internalProperties.drawAttributes.isDown = false;
            $('.screenshotCanvasHolder').parent().remove();
        },
        canSeeScreenshot: function () {
            PxlViewer.util.Debug.log("Screenshot.canSeeScreenshot");
            // should not be visible if it is not a desktop view, does not have permission, or is a fake image
            if (this.base.menu.options.menuScale == "desktop" && pxl.menu.options.showScreenshotControl && this.base.images[this.base.currentImage].isFake == false) {
                return true;
            }
            return false;
        },
        resize: function () {
            PxlViewer.util.Debug.log("Screenshot.resize");
            var viewerSize = this.base.menu.getViewerSize();
            var viewportW = viewerSize[0];
            var imageHolderW = $("#" + this.internalProperties.holderID + ' .' + this._ns + 'Imgholder').parent()[0].clientWidth;
            var addleftHandMenu = $("#leftPanel")[0].offsetWidth;
            $('.' + this._ns + 'holder').css({
                left: ((parseFloat(viewportW) / 2) - ((imageHolderW) / 2)) + addleftHandMenu + "px",
                top: "10%"
            });
        },
        /// <summary>
        /// This sets up the default url and 
        /// </summary>
        /// <param name="varX"></param>
        /// <param name="varY"></param>
        /// <param name="varW"></param>
        /// <param name="varH"></param>
        /// <param name="zoom"></param>
        /// <param name="focus"></param>
        /// <param name="realCenterX"></param>
        /// <param name="realCenterY"></param>
        /// <param name="annoScreenW"></param>
        /// <param name="annoScreenH"></param>
        /// <param name="Angle"></param>
        _getScreenshotURL: function (varX, varY, varW, varH, zoom, realCenterX, realCenterY, annoScreenW, annoScreenH, Angle, draw, dx, dy, dw, dh) {
            PxlViewer.util.Debug.log("Screenshot._getScreenshotURL");
            this.internalProperties.screenshotBaseURL = PxlViewer.util.returnbaseurl() + "iscope/viewer/loadimage.ashx?resid=" + pxl.GetResID() + "&action=viewimage&x=" + varX + "&y=" + varY + "&width=" + varW + "&height=" + varH + "&zoom=" + zoom + "&compression=80&focus=" + parseInt(PxlViewer.ZStacks.getActiveFocusValue(pxl)) + (draw != true ? "" : "&rcx=" + parseInt(realCenterX) + "&rcy=" + parseInt(realCenterY) + "&draw=" + draw + "&screenW=" + annoScreenW + "&screenH=" + annoScreenH) + "&maxW=" + pxl.GetImageWidth() + "&maxH=" + pxl.GetImageHeight() + "&rotation=" + Angle + pxl.ImageAdjustments.toString() + "&stackid=" + PxlViewer.Regions.getActiveRegionID(pxl);
            var returnURL = this.internalProperties.screenshotBaseURL;

            returnURL = returnURL + this._returnAnnotaitonAddon();
            returnURL = returnURL + this._returnHeatmapParameter();
            returnURL = returnURL; // + screenshotMarkupString; // this is the Image analysis markup
            returnURL = returnURL + this._returnTypeParam();
            returnURL = returnURL + "&wsOT=" + parseInt(this.internalProperties.attributes.whiteSpaceOffset.y); // send the White-space offset top to the serverside to process
            returnURL = returnURL + "&rand=" + new Date().getTime();
            returnURL = returnURL + "&newv=true";


            if (draw) {
                returnURL = returnURL + "&dx="+dx;
                returnURL = returnURL + "&dy="+dy;
                returnURL = returnURL + "&dw="+dw;
                returnURL = returnURL + "&dh="+dh;
            }


            return returnURL;
        },

        /// <summary>
        /// adds the annotaiton part of the url 
        /// </summary>
        _returnAnnotaitonAddon: function () {
            PxlViewer.util.Debug.log("Screenshot._returnAnnotaitonAddon");
            var annoaddon = "";
            if ($("#leftMenuHolder").hasClass('menuexpanded')) {
                if (pxl.annotations.completeAnnotationList.length > 0) {
                    if (pxl.annotations.currentSelectedAnnotation != null) {
                        // there is an annotation selected
                        return "&anno=" + pxl.annotations.currentSelectedAnnotation.ID;
                    } else {
                        // there are annotations but none have been selected
                        return annoaddon;
                    }
                } else {
                    // if there are no annotations then just return nothing
                    return annoaddon;
                }
            } else {
                // annotations menu is closed
                return annoaddon;
            }
        },
        /// <summary>
        /// Adds the Heatmap part of the url
        /// </summary>
        _returnHeatmapParameter: function () {
            PxlViewer.util.Debug.log("Screenshot._returnHeatmapParameter");
            var returnvalue = "";
            var batchid = $("#batch").val();
            if (batchid != null && batchid != "" && batchid != "false" && pxl.Heatmap.isVisible) {
                returnvalue = "&batch=" + batchid + "&hm=1";
            }
            return returnvalue;
        },
        /// <summary>
        /// Adds the File Type part of the url
        /// </summary>
        _returnTypeParam: function () {
            PxlViewer.util.Debug.log("Screenshot._returnTypeParam");
                var returnvalue = "";
                var type = $('#' + this._ns + 'typeDDl').val();
                if (!PxlViewer.util.IsNullOrEmpty(type)) {
                    for (i = 0; i < this.internalProperties.validTypes.length; i++) {
                        if (type == this.internalProperties.validTypes[i]) {
                            returnvalue = "&format=" + type;
                            break;
                        }
                    }
                }
                return returnvalue;
            },
        /// <summary>
        /// this is the image emement which will be recreated when the image is destroyed
        /// </summary>
        _imageElement: function () {
            PxlViewer.util.Debug.log("Screenshot._imageElement");
            return $('<img <img class="' + this._ns + 'Imgholder_img" alt="" title="Loading..." />');
        },

        // Actions
        /// <summary>
        /// creates the save prompt
        /// </summary>
        save: function () {
            PxlViewer.util.Debug.log("Screenshot.save");
            // get the resolution
            $('#' + this._ns + 'loadimgiframe').remove();
            var multiplier = parseInt($('#' + this._ns + 'resDDl').val());
            var leng = this.internalProperties.attributes.varW;
            if (this.internalProperties.attributes.varH > this.internalProperties.attributes.varW) {
                leng = this.internalProperties.attributes.varH;
            }
            if (leng * multiplier > 4500) {
                multiplier = 4500 / leng;
            }

            var tX = this.internalProperties.attributes.varX * multiplier;
            var tY = this.internalProperties.attributes.varY * multiplier;
            var tzoom = this.internalProperties.attributes.truezoom / multiplier;
            var tH = this.internalProperties.attributes.varH * multiplier;
            var tW = this.internalProperties.attributes.varW * multiplier;
            var trcx = this.internalProperties.attributes.realCentreX * multiplier;
            var trcy = this.internalProperties.attributes.realCentreY * multiplier;
            var tsH = parseInt(this.internalProperties.attributes.viewportH * multiplier);
            var tsW = parseInt(this.internalProperties.attributes.viewportW * multiplier);

            var tdx = parseInt(this.internalProperties.attributes.dx * multiplier);
            var tdy = parseInt(this.internalProperties.attributes.dy * multiplier);
            var tdw = parseInt(this.internalProperties.attributes.dw * multiplier);
            var tdh = parseInt(this.internalProperties.attributes.dh * multiplier);

            var src = this._getScreenshotURL(tX, tY, tW, tH, tzoom, trcx, trcy, tsW, tsH, pxl.GetCurrentRotation(), this.internalProperties.attributes.isDraw, tdx, tdy, tdw, tdh);
            var iframeloadimg = $("<iframe id='" + this._ns + "loadimgiframe' src='" + src + "' />");

            // attach the iframe
            $('#' + this.options.attachElementID).append(iframeloadimg);
            pxl.Screenshot.cancel();
        },
        /// <summary>
        /// This sets up the default url and 
        /// </summary>
        print: function () {
            PxlViewer.util.Debug.log("Screenshot.print");
            var isChrome = Boolean(window.chrome);
            var windowSize = {width:1, height:1};
            if (isChrome) {
                windowSize.width = screen.width * 0.9;
                windowSize.height = screen.height * 0.9;
            }
            var WindowObject = window.open("", "Image", "width=" + windowSize.width + ",height=" + windowSize.height + ",top=0,left=0,toolbars=no,scrollbars=no,status=no,resizable=yes");
            
            WindowObject.document.write("<style type='text/css' media='print'>@page{size: landscape;}</style>");
            WindowObject.document.write("<img src='" + this.internalProperties.attributes.lastConstructedURL + "&overrideDownload=true" + "' /img>");
            WindowObject.document.close();
            WindowObject.focus();
            if (isChrome) {
                WindowObject.onload = function () {
                    WindowObject.print();
                    setTimeout(function() {
                        WindowObject.close();
                    }, 3000);
                };
            } else {
                WindowObject.print();
                WindowObject.close();
            }
        },
        share: function () {
            PxlViewer.util.Debug.log("Screenshot.share");
            this.updateURLString();
            var sa = $(".screenshot_holder")[0];
            var popupSS = $("<div id='" + this._ns + "sharePopupSS' class='shareSS' />");
            var labelSS = $("<div class='labelSS'>Copy and Paste into email</div>");
            var txtSS = $("<input id='" + this._ns + "txtSS' type='text' class='txtSS' value='" + this.internalProperties.attributes.lastConstructedURL + "' />");
            $(sa).append(popupSS);

            $(popupSS).append(labelSS);
            $(popupSS).append(txtSS);

            var okbut = $("<input id='" + this._ns + "sharebutton' type='button' class='screenshotButtons cutomDialogBtn' value='OK' style='margin-right:10px;' />");

            $(popupSS).append(okbut);
            setTimeout(function() {
                $('.shareSS').css({
                    left: ($(sa)[0].clientWidth / 2) - ($('.shareSS')[0].clientWidth / 2) + "px",
                    top: ($(sa)[0].clientHeight / 2) - ($('.shareSS')[0].clientHeight / 2) + "px"
                });
                $('#' + pxl.Screenshot._ns + 'sharebutton').click(function () { $(this).parent().remove(); });
                $("#" + pxl.Screenshot._ns + 'txtSS').focus().select();
            },0);
        },
        // sets all the screen properties
        setInternalPropertiesAttributes: function (top, left, width, height, draw, dx, dy, dw, dh) {
            PxlViewer.util.Debug.log("Screenshot.setInternalPropertiesAttributes");
            this.internalProperties.attributes.viewerSize = this.base.menu.getViewerSize();
            this.internalProperties.attributes.viewportW = this.internalProperties.attributes.viewerSize[0];
            this.internalProperties.attributes.viewportH = this.internalProperties.attributes.viewerSize[1];
            if (height == null || (parseInt(width) <= 16 && parseInt(height) <= 16)) {
                // the user has just clicked on a single location without dragging
                // so in this case just do a whole screen grab
                width = this.internalProperties.attributes.viewportW;
                height = this.internalProperties.attributes.viewportH;
                top = 0;
                left = 0;
            }
            this.internalProperties.attributes.truezoom = pxl.GetTrueZoom();
            this.internalProperties.attributes.overviewZoom = pxl.GetOverviewZoom();
            this.internalProperties.attributes.centre = this.base.viewer.viewport.viewportToImageCoordinates(pxl.viewer.viewport.getCenter(true));
            this.internalProperties.attributes.realCentreX = this.internalProperties.attributes.centre.x / this.internalProperties.attributes.truezoom;
            this.internalProperties.attributes.realCentreY = this.internalProperties.attributes.centre.y / this.internalProperties.attributes.truezoom;
            if (height != undefined) {
                this.internalProperties.attributes.realCentreX = this.internalProperties.attributes.realCentreX - ((this.internalProperties.attributes.viewportW / 2) - (parseFloat(left) + (parseFloat(width) / 2)));
                this.internalProperties.attributes.realCentreY = this.internalProperties.attributes.realCentreY - ((this.internalProperties.attributes.viewportH / 2) - (parseFloat(top) + (parseFloat(height) / 2)));
            }
            this.internalProperties.attributes.width = (width != undefined ? width : (this.internalProperties.attributes.truezoom == this.internalProperties.attributes.overviewZoom ? parseFloat(pxl.GetImageWidth() / this.internalProperties.attributes.truezoom) : parseFloat(this.internalProperties.attributes.viewportW)));
            this.internalProperties.attributes.height = (height != undefined ? height : (this.internalProperties.attributes.truezoom == this.internalProperties.attributes.overviewZoom ? parseFloat(pxl.GetImageHeight() / this.internalProperties.attributes.truezoom) : parseFloat(this.internalProperties.attributes.viewportH)));

            this.internalProperties.attributes.varW = parseInt(this.internalProperties.attributes.width);
            this.internalProperties.attributes.varH = parseInt(this.internalProperties.attributes.height);
            this.internalProperties.attributes.varX = parseInt(this.internalProperties.attributes.realCentreX - (parseFloat(this.internalProperties.attributes.width) / 2));
            this.internalProperties.attributes.varY = parseInt(this.internalProperties.attributes.realCentreY - (parseFloat(this.internalProperties.attributes.height) / 2));
            this.internalProperties.attributes.whiteSpaceOffset = this.getimageTopCoordinates();

            // apply the whitespace offset to the screenshot coordinates
            var heightoffset = 0; var widthoffset = 0;
            if (draw) {
                this.internalProperties.attributes.dx = dx;
                this.internalProperties.attributes.dy = dy;
                this.internalProperties.attributes.dw = dw;
                this.internalProperties.attributes.dh = dh;
            }

        },
        /// <summary>
        /// this tells you the number of pixels the top of the image is fromthe top of the canvas
        /// </summary>
        getimageTopCoordinates: function () {
            // get the centre position
            var center = pxl.viewer.viewport.getCenter(false);
            // convert that into pixels on the canvas
            var vCoords = pxl.viewer.viewport.viewportToViewerElementCoordinates(center);
            // convert that to image coordinates
            var toIcoords = pxl.viewer.viewport.viewerElementToImageCoordinates(vCoords);
            var toIcoordstemp = toIcoords;
            // get the top of the image
            toIcoords.y = 0;
            // and convert that back into canvas pixel coordinates
            var toVElementY = pxl.viewer.viewport.imageToViewerElementCoordinates(toIcoords);
            toIcoords.y = toIcoordstemp.y;
            toIcoords.x = 0;
            var toVElementX = pxl.viewer.viewport.imageToViewerElementCoordinates(toIcoords);
            toIcoords.x = pxl.GetImageWidth();
            toIcoords.y = toIcoordstemp.y;
            var toVElementMaxX = pxl.viewer.viewport.imageToViewerElementCoordinates(toIcoords);
            toIcoords.x = toIcoordstemp.x;
            toIcoords.y = pxl.GetImageHeight();
            var toVElementMaxY = pxl.viewer.viewport.imageToViewerElementCoordinates(toIcoords);
            var viewerSize = pxl.menu.getViewerSize();
            // this tells you the number of pixels the top of the image is from the top of the canvas
            return { x: toVElementX.x, y: toVElementY.y, xmax: (viewerSize[0] - toVElementMaxX.x), ymax: (viewerSize[1] - toVElementMaxY.y) };
        },
        // this will re-generate the url based on the parameters provided, this will take into account if the file-type has been changed
        updateURLString: function() {

            if (this.internalProperties.attributes.lastConstructedURL != null) {
                var tX = this.internalProperties.attributes.varX;
                var tY = this.internalProperties.attributes.varY;
                var tzoom = this.internalProperties.attributes.truezoom;
                var tH = this.internalProperties.attributes.varH;
                var tW = this.internalProperties.attributes.varW;
                var trcx = this.internalProperties.attributes.realCentreX;
                var trcy = this.internalProperties.attributes.realCentreY;
                var tsH = this.internalProperties.attributes.viewportH;
                var tsW = this.internalProperties.attributes.viewportW;

                var tdx = this.internalProperties.attributes.dx;
                var tdy = this.internalProperties.attributes.dy;
                var tdw = this.internalProperties.attributes.dw;
                var tdh = this.internalProperties.attributes.dh;

                this.internalProperties.attributes.lastConstructedURL = this._getScreenshotURL(tX, tY, tW, tH, tzoom, trcx, trcy, tsW, tsH, pxl.GetCurrentRotation(), this.internalProperties.attributes.isDraw, tdx, tdy, tdw, tdh);
            }
        },
        cancel: function () {
            PxlViewer.util.Debug.log("Screenshot.cancel");
            $("#" + this._ns + "sharePopupSS").remove(); // remove the share control
            pxl.menu.SetActiveOff(pxl.menu.options._menuIDs.screenshot + pxl.menu.options._menuIDs.drawerAppender + "Container");
            this.internalProperties.screenshotImageObject = $('.' + pxl.Screenshot._ns + 'Imgholder > img').removeAttr("src").clone();
            $('.' + pxl.Screenshot._ns + 'Imgholder > img').remove();
            $('#' + pxl.Screenshot.internalProperties.holderID).hide();
            $('#' + pxl.internalProperties.bindKeyboardNavigarionArea).focus();
            pxl.viewer.setMouseNavEnabled(true); // reenable the mouse slide navigation
            pxl.internalProperties.panning.enabled = true; // reenable the viewer keyboard navigation
        },
        /**
            * Destroys the Screenshot holder. This means that all of its associated elements are removed.
            * @function
            */
        destroy: function () {
            PxlViewer.util.Debug.log("Screenshot.destroy");
            $('#' + this.options.holderID).remove();
            $('#' + this._ns + 'resDDl').remove();
        }
    });
}(PxlViewer));