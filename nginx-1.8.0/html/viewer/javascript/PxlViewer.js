/// <reference path="PxlSlideLabel.js" />
/// <reference path="PxlViewerMenu.js" />
/// <reference path="PxlViewerAnnotations.js" />
/// <reference path="PxlViewerSlideName.js" />
/// <reference path="PxlViewerAuthorName.js" />
/// <reference path="PxlViewerScreenshot.js" />
/// <reference path="PxlViewerImageAdjustments.js" />
/// <reference path="PxlViewerHeatmap.js"/>
/// <reference path="PxlViewerMeasurements.js" />

function xxx(info)
{
	PxlViewer.created[0].onGetInfo(info)
};

// PxlViewer v0.1.0
// Copyright (C) PathXL
window.PxlViewer = window.PxlViewer ||
    function (options) {
        return new PxlViewer.Base(options);
    };

(function (PxlViewer) {
    PxlViewer.pxlCount = -1;
    PxlViewer.created = new Array(); // PxlViewers that have been created.

    // Create a fallback console to prevent errors on browsers which do not have a console.
    var nullfunction = function (msg) {
        //document.location.hash = msg;
    };

    PxlViewer.console = window.console || {
        log: nullfunction,
        debug: nullfunction,
        info: nullfunction,
        warn: nullfunction,
        error: nullfunction
    };


    // Verify dependencies. http://stackoverflow.com/a/858193
    if (typeof jQuery === 'undefined') {
        throw new Error("PxlViewer requires jQuery.");
    }
    if (typeof PxlUtil === 'undefined') {
        throw new Error("PxlViewer requires PxlUtil.");
    }
    PxlViewer.util = PxlUtilGeneric;
    if (typeof OpenSeadragon === 'undefined') {
        throw new Error("PxlViewer requires OpenSeadragon.");
    }
    if (typeof Mustache === "undefined") {
        throw new Error("PxlViewer requires Mustache.");
    }
    if (typeof YUI === "undefined") {
        throw new Error("PxlViewer requires YUI.");
    }
    if (typeof fabric === "undefined") {
        throw new Error("PxlViewer requires fabricjs.");
    }

    /**
     * Initialises the viewer.
     * @function
     * @param {Options} options
     * @returns {PxlViewer}
     * @private
     */
    PxlViewer.Base = function (options) {
        PxlViewer.util.Debug.warn("viewer.base");
        if (!('id' in options)) {
            throw new Error("The 'id' parameter needs to be specified");
        }
        if (!('images' in options) || options.images.length == 0) {
            throw new Error("The 'images' parameter must be specified and must be non-empty.");
        }
        this.options = {
            AnnotationUpdateMode: false, // if set to true it uses the more efficent method but this breaks on rotate on the ipad
            AnnotationUpdateTimeout: 0, // the length of time the code will wait before updating annotations 0 = no timeout
            isTablet: false
        };
        this.internalProperties = {
            bindKeyboardNavigarionArea: "BindKeyboardNavigarionArea", // this area has the keyboard navigation bound to it
            unboundKeyboardNavigarionArea: "UnBoundKeyboardNavigarionArea", // this is another area next to it with no events bound so when focused on there will be no cursor events
            panning: {
                enabled: true,
                keyspressed: [], // the keys that have been pressed
                panning: false, // is the screen currently being panned
                keyPanningTimeout: null, // the timeout event
                keyPanningTicker: 20 // the length of time between each pan move
            }
        }
        $.extend(this.options, options);
        this.images = options.images;
        // This is used for the GetInfoJson callback.
        PxlViewer.pxlCount++;
        this.pxlIndex = PxlViewer.pxlCount;
        PxlViewer.created[PxlViewer.pxlCount] = this;

        var startIndex = 0;
        for (var i = 0; i < this.images.length; i++) {
            if (this.images[i].id == this.options.startImage) {
                startIndex = i;
                break;
            }
        }
        // this disables tablet gesture events, meaning that the windows tablet will allow editing of annotations
        $("body").css("touch-action", "none");
        // Load the first image.
        PxlViewer.util.setBrowserCSSClass();
        // disable right click
        $("#view1").unbind("click").click(function (event) { if (event.button == 2) { event.preventDefault(); return false; } return true; });
        this.loadImage(startIndex);
    };
    PxlViewer.errorOccured = false;
    PxlViewer.ImageLoaded = false;
    PxlViewer.loadCheckErrorTimeout = null;
    PxlViewer.loadCheckErrorTimeoutTime = 10000;
    PxlViewer.error2343Triggered = false;
    $.extend(PxlViewer.Base.prototype, {
        /**
         * Loads an image into the viewer as specified by the first parameter.
         * @function
         * @param {Object} image
         */
        loadImage: function(i) {
            PxlViewer.util.Debug.log("viewer.loadImage");
            PxlViewer.ImageLoaded = false;
            PxlViewer.error2343Triggered = false;
            this.resizeViewerForTabletSafari();
            var image = this.images[i];
            if (typeof image === 'undefined') {
                throw new Error("Invalid index.");
            }
            if (!'url' in image) {
                throw new Error("Image object must have an 'url' parameter.");
            }

            this.currentImage = i;


            var startingStackID = 0;
            if (image.url.toLowerCase().indexOf("databaseid") != -1) {
                startingStackID = -1;
            }


            // Request image info from cathe image server.
            var script = document.createElement("script");
            script.id = "GetInfoJsonScript";
            script.type = "text/javascript";
            script.src = image.url + "?GetInfoJson?&callback=xxx&stackid=" + startingStackID;
            $("body").append(script);

            if (PxlViewer.loadCheckErrorTimeout != null) {
                clearTimeout(PxlViewer.loadCheckErrorTimeout);
                PxlViewer.loadCheckErrorTimeout = null;
            }
            PxlViewer.loadCheckErrorTimeout = setTimeout(function() { pxl.loadCheckError(); }, PxlViewer.loadCheckErrorTimeoutTime);


            if (pxl.annotations != undefined) {
              //  setTimeout("pxl.annotations.retrieveAnnotations('', false);", 250); // I've added this code ,  to ensure that when the user switches images the webservice will be called . Also this code means that the first time we load the viewer two webservices are called . Anytime after that only one is called per image . This makes the tablet perfrom better for longer
            }
            if (pxl.measurements != undefined) {
              //  setTimeout("pxl.measurements.getMeasurements('', true);", 250);
            }
        },
        loadCheckError: function() {
            PxlViewer.util.Debug.log("loadCheckError");
            if (!PxlViewer.ImageLoaded) {
                PxlViewer.error2343Triggered = true;
                if (pxl.menu != null) {
                    pxl.menu._shrinkPanel(); // if an error has occured then the panel should be closed as this is lesss confusing when the bug detailed in DEV 672 occurs .

                };
                pxl.onGetInfo({ ERROR: "2343" });
            }
            if (PxlViewer.loadCheckErrorTimeout != null) {
                clearTimeout(PxlViewer.loadCheckErrorTimeout);
                PxlViewer.loadCheckErrorTimeout = null;
            }
        },
        loadRegion: function(imageKey, regionKey, annotationID) {
            PxlViewer.util.Debug.log("loadRegion");
            PxlViewer.ImageLoaded = false;
            PxlViewer.error2343Triggered = false;
            var image = this.images[imageKey];
            if (typeof image === 'undefined') {
                throw new Error("Invalid index.");
            }
            if (!'url' in image) {
                throw new Error("Image object must have an 'url' parameter.");
            }

            this.currentImage = imageKey;

            // Request image info from the image server.
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = image.url + "?GetInfoJson?&stackid=" + regionKey + "&callback=";

            if (annotationID > 0) {
                script.src += "PxlViewer.onLoadDriveToAnnotation(" + this.pxlIndex + "," + annotationID + ")";
            } else {
                script.src += "xxx";
            }

            $("body").append(script);
            if (PxlViewer.loadCheckErrorTimeout != null) {
                clearTimeout(PxlViewer.loadCheckErrorTimeout);
                PxlViewer.loadCheckErrorTimeout = null;
            }
            PxlViewer.loadCheckErrorTimeout = setTimeout(function() { pxl.loadCheckError(); }, PxlViewer.loadCheckErrorTimeoutTime);

            if (this.viewer.ZstackCallCount == null || this.viewer.ZstackCallCount == undefined) {
                this.viewer.ZstackCallCount = 1;
            }

            if (this.viewer.ZstackCallCount == 1) {
                var destinationCtx;
                var sourceCanvas = this.viewer.drawer.canvas;
                var destinationCanvas = document.getElementById("backgroundCanvas");


                destinationCanvas.width = sourceCanvas.width;
                destinationCanvas.height = sourceCanvas.height;

                $("#backgroundCanvas").css("width", sourceCanvas.width + "px");
                $("#backgroundCanvas").css("height", sourceCanvas.height + "px");
                $("#backgroundCanvas").css("top", "0px");
                $("#backgroundCanvas").css("left", "0px");
                $("#backgroundCanvas").css("position", "absolute");
                $("#backgroundCanvas").css("display", "inline");

                //draw the source image to the source canvas
                ctx = sourceCanvas.getContext('2d');

                //get the destination context
                destinationCtx = destinationCanvas.getContext('2d');

                //copy the data
                destinationCtx.drawImage(sourceCanvas, 0, 0);
                //this current only uses one background layer, for better visual performance we could look at using two.

            }
            this.viewer.ZstackCallCount++;
            if (!('url' in image)) {
                throw new Error("Image object must have an 'url' parameter.");
            }

            if (typeof image === 'undefined') {
                throw new Error("Invalid index.");
            }

            //copy the data
            //$("#backgroundCanvas").css("z-index", "10");
            var viewer = this.viewer;
            this.viewer.animationTime = 0;
            this.viewer.blendTime = 0;
            viewer.drawer.reset();
            viewer.forceRedraw();
            viewer.viewport.update();

            //setTimeout(function() {
            //    $("#backgroundCanvas").css("z-index", "0");
            //}, 1000);
        },
		        copyCachedImageToBackgroundCanvas()
        {
//        return false;
            //console.log("copyCachedImageToBackgroundCanvas");

            var backgroundCanvasId = "backgroundCanvas";
            var backgroundCanvas = $('#' + backgroundCanvasId);
            var sourceCanvas = this.viewer.drawer.canvas;
            var destinationCanvas = document.getElementById(backgroundCanvasId);

            var cachedCanvasID = pxl.getfocus();
            var cachedCanvas = pxl.viewer.drawer.ZStackCanvasCache[cachedCanvasID];

            if(cachedCanvas == undefined)
            {
                //console.log ("cached canvas NOT found for " + cachedCanvasID); 
                //console.log("pxl.viewer.drawer.isZCacheAutoPreCaching = " + pxl.viewer.drawer.isZCacheAutoPreCaching);
                if(pxl.viewer.drawer.isZCacheAutoPreCaching == false)
                {
                    var backgroundCanvasId = "backgroundCanvas";
                    var backgroundCanvas = $('#' + backgroundCanvasId);
                    $(backgroundCanvas).css("z-index", "1");
                    $(backgroundCanvas).css("display", "none");
                }
                else
                {
                    var backgroundCanvasId = "backgroundCanvas";
                    var backgroundCanvas = $('#' + backgroundCanvasId);
                    $(backgroundCanvas).css("z-index", "1");
                    $(backgroundCanvas).css("display", "inline");

                    pxl.debugCanvasFill(destinationCanvas, "green");
                }

                /*console.log("No cached image found, hide overlay");
                var backgroundCanvasId = "backgroundCanvas" + pxl.PxlIndex;
                var backgroundCanvas = $('#' + backgroundCanvasId);
                $(backgroundCanvas).css("z-index", "-1");
                $(backgroundCanvas).css("display", "none");*/

                return false;
            }

            //console.log("Found cached canvas for " + cachedCanvasID);

            destinationCanvas.width = sourceCanvas.width;
            destinationCanvas.height = sourceCanvas.height;

            $(backgroundCanvas).css("width", sourceCanvas.width + "px");
            $(backgroundCanvas).css("height", sourceCanvas.height + "px");
            $(backgroundCanvas).css("top", "0px");
            $(backgroundCanvas).css("left", "0px");
            $(backgroundCanvas).css("position", "absolute");
            //$(backgroundCanvas).css("display", "inline");
            $(backgroundCanvas).css("pointer-events", "none");

            $(backgroundCanvas).css("z-index", "1");
            $(backgroundCanvas).css("display", "inline");
            //$(backgroundCanvas).css("left", "350px");
    
            //draw the source image to the source canvas
            ctx = sourceCanvas.getContext('2d');

            //get the destination context
            destinationCtx = destinationCanvas.getContext('2d');

            //console.log("Copying from cached image");

            destinationCtx.drawImage(cachedCanvas.canvas, 0, 0);
            return true;
        },
		        copyCachedImageToBackgroundCanvas()
        {
//        return false;
            //console.log("copyCachedImageToBackgroundCanvas");

            var backgroundCanvasId = "backgroundCanvas";
            var backgroundCanvas = $('#' + backgroundCanvasId);
            var sourceCanvas = this.viewer.drawer.canvas;
            var destinationCanvas = document.getElementById(backgroundCanvasId);

            var cachedCanvasID = pxl.getfocus();
            var cachedCanvas = pxl.viewer.drawer.ZStackCanvasCache[cachedCanvasID];

            if(cachedCanvas == undefined)
            {
                //console.log ("cached canvas NOT found for " + cachedCanvasID); 
                //console.log("pxl.viewer.drawer.isZCacheAutoPreCaching = " + pxl.viewer.drawer.isZCacheAutoPreCaching);
                if(pxl.viewer.drawer.isZCacheAutoPreCaching == false)
                {
                    var backgroundCanvasId = "backgroundCanvas";
                    var backgroundCanvas = $('#' + backgroundCanvasId);
                    $(backgroundCanvas).css("z-index", "1");
                    $(backgroundCanvas).css("display", "none");
                }
                else
                {
                    var backgroundCanvasId = "backgroundCanvas";
                    var backgroundCanvas = $('#' + backgroundCanvasId);
                    $(backgroundCanvas).css("z-index", "1");
                    $(backgroundCanvas).css("display", "inline");

                    pxl.debugCanvasFill(destinationCanvas, "green");
                }

                /*console.log("No cached image found, hide overlay");
                var backgroundCanvasId = "backgroundCanvas" + pxl.PxlIndex;
                var backgroundCanvas = $('#' + backgroundCanvasId);
                $(backgroundCanvas).css("z-index", "-1");
                $(backgroundCanvas).css("display", "none");*/

                return false;
            }

            //console.log("Found cached canvas for " + cachedCanvasID);

            destinationCanvas.width = sourceCanvas.width;
            destinationCanvas.height = sourceCanvas.height;

            $(backgroundCanvas).css("width", sourceCanvas.width + "px");
            $(backgroundCanvas).css("height", sourceCanvas.height + "px");
            $(backgroundCanvas).css("top", "0px");
            $(backgroundCanvas).css("left", "0px");
            $(backgroundCanvas).css("position", "absolute");
            //$(backgroundCanvas).css("display", "inline");
            $(backgroundCanvas).css("pointer-events", "none");

            $(backgroundCanvas).css("z-index", "1");
            $(backgroundCanvas).css("display", "inline");
            //$(backgroundCanvas).css("left", "350px");
    
            //draw the source image to the source canvas
            ctx = sourceCanvas.getContext('2d');

            //get the destination context
            destinationCtx = destinationCanvas.getContext('2d');

            //console.log("Copying from cached image");

            destinationCtx.drawImage(cachedCanvas.canvas, 0, 0);
            return true;
        },
		loadZStacks: function(image, focusKey, regionKey) {
			
       //console.log("loadZStacks focusKey = " + focusKey + ", regionKey = " + regionKey);    
            if (focusKey != regionKey || this.viewer.ZstackCallOnce == undefined) {
                this.viewer.ZstackCallOnce = false;
            }

            var backgroundCanvasId = "backgroundCanvas" + pxl.PxlIndex;
            var backgroundCanvas = $('#' + backgroundCanvasId);

            // If the focus changed, clone the current one.
            if (!this.viewer.ZstackCallOnce || ADJUST_SLIDE) {
                //pxl.copyCurrentImageToBackgroundCanvas();

                //this current only uses one background layer, for better visual performance we could look at using two.
                this.viewer.ZstackCallOnce = true;
            }

            if (!('url' in image)) {
                throw new Error("Image object must have an 'url' parameter.");
            }

            if (typeof image === 'undefined') {
                throw new Error("Invalid index.");
            }



            pxl.setUpForZStack();
	},
        setUpForZStack: function()
        {
            pxl.viewer.drawer.immediateRender = true;
            pxl.viewer.drawer.clearRectOnRedraw = false;

            pxl.copyCachedImageToBackgroundCanvas();
            this.viewer.drawer.resetForNewZStack();
        },
        drawCachedBarForZStack: function(ZStackIndex){
            var borderOffset = 8;
            var rectSize = 10;
//            var visualIndex = ZStackIndex + offset;

            var sliderValue = parseInt($("#range").val());

            //console.log("sliderValue = " + sliderValue);
            //console.log("ZStackIndex = " + ZStackIndex);

            var sliderMin = $('#range').noUiSlider('options').range.min[0];
            var sliderMax = $('#range').noUiSlider('options').range.max[0];

            canvas = pxl.viewer.drawer.ZStackCanvasCache[ZStackIndex].canvas;
            context = canvas.getContext("2d");

            var visualOffset = -sliderMin;

            for(var i = sliderMin; i <= sliderMax ; i++)
            {
                context.strokeStyle = "#005500";
                x = borderOffset;
                y = canvas.height - borderOffset - rectSize - ( rectSize * (i + visualOffset) );
                context.strokeRect(x,y,rectSize,rectSize);
                if( pxl.viewer.drawer.ZStackCanvasCache[i] != undefined )
                {
                    if(ZStackIndex == i)
                    {
                        context.fillStyle = "#00cc00";
                    }
                    else
                    {
                        context.fillStyle = "#008800";
                    }

                    context.fillRect(x+1,y+1,rectSize-2, rectSize-2);
                }
            }

        },
        drawPreCachedBarsInAllCachedImages: function(){
            var sliderMin = $('#range').noUiSlider('options').range.min[0];
            var sliderMax = $('#range').noUiSlider('options').range.max[0];
            for(var i = sliderMin; i <= sliderMax ; i++)
            {
                if( pxl.viewer.drawer.ZStackCanvasCache[i] )
                {
                    pxl.drawCachedBarForZStack(i);
                }
            }
        },
        getfocus: function() {
            if (this.Images[this.currentImage].info != null) {
                if(pxl.viewer.drawer.isZCacheAutoPreCaching == true)
                {
                    //console.log("getFocus using ZCacheAutoPreCachingIndex " + pxl.viewer.drawer.ZCacheAutoPreCachingIndex);
                    cachedCanvasID = pxl.viewer.drawer.ZCacheAutoPreCachingIndex;
                    return cachedCanvasID;
                }
                if (this.Images[this.currentImage].info.layers > 1 && $("#range").length > 0) {

                    return parseInt($("#range").val());
                }
            }
            return 0;
        },
		cleanUpAfterZStack: function()
        {
            if (pxl.viewer.drawer)
            {
                //console.log("cleanUpAfterZStack");
                if (pxl.viewer.drawer.immediateRender == true) 
                {
                    // this is set to true when moving between ZStacks
                    pxl.viewer.drawer.immediateRender = false;
                    pxl.viewer.drawer.clearRectOnRedraw = true;
                    // remove background div

                    // the first image could be cached, even if zooming hasn't started
                    var sliderValue = parseInt($("#range").val());
                    var sliderMin = $('#range').noUiSlider('options').range.min[0];
                    var sliderMax = $('#range').noUiSlider('options').range.max[0];

                    for(i = sliderMin ; i <= sliderMax ; i++ )
                    {
                        if(pxl.viewer.drawer.ZStackCanvasCache[i])
                        {
                            //debugger;
                            //pxl.viewer.drawer.ZStackCanvasCache[i].remove();
                            pxl.viewer.drawer.ZStackCanvasCache[i] = null;
                        }
                    }
                    pxl.viewer.drawer.ZStackCanvasCache = [];
                    pxl.viewer.drawer.isZCacheAutoPreCaching = false;
                    //console.log("isZCacheAutoPreCaching = " + pxl.viewer.drawer.isZCacheAutoPreCaching);

                    //$("#range").val(pxl.viewer.drawer.sliderValue);

                    //console.log("pxl.viewer.drawer.sliderValue = " + pxl.viewer.drawer.sliderValue);
                    //console.log("parseInt($(#range).val() = " + parseInt($("#range").val()));

                    //pxl.viewer.drawer.sliderValue = parseInt($("#range").val());
                    pxl.options.drawToBackgroundCanvasWhenAnimationIsFinished = false;

                    var backgroundCanvasId = "backgroundCanvas";
                    var backgroundCanvas = $('#' + backgroundCanvasId);

                    //console.log("pxl.viewer.drawer.sliderValue = " + pxl.viewer.drawer.sliderValue);
                    //console.log("sliderValue = " + sliderValue);
                    //if(pxl.viewer.drawer.sliderValue != sliderValue)
                    //console.log("pxl.viewer.drawer.isZCacheAutoPreCaching = " + pxl.viewer.drawer.isZCacheAutoPreCaching);
                    if(pxl.viewer.drawer.isZCacheAutoPreCaching == false)
                    {
                        if(pxl.viewer.drawer.tilesMatrixBackup != null)
                        {
                            //console.log("RESTORE MAIN TILES MATRIX");
                            //debugger;


                            pxl.viewer.drawer.tilesMatrix = pxl.viewer.drawer.tilesMatrixBackup;
                            pxl.viewer.drawer.tilesMatrixBackup = null;
                        }
                    }
                }
//                console.log("set z-index to -1 and set display to none");
                $(backgroundCanvas).css("z-index", "-1");
                $(backgroundCanvas).css("display", "none");
            }
        },

        onLoadDriveToAnnotation: function(annotationID) {
            var loadingPanelInterval = setInterval(function() {
                if (PxlViewer.ImageLoaded) {
                    PxlViewer.Annotations.processingAnnotationLoad = false;
                    pxl.annotations._switchAnnotation(annotationID, true);
                    clearInterval(loadingPanelInterval);
                }
            }, 1000);
        },

        /**
        * Callback for image server.
        * @function
        * @param {Object} info
        */
        onGetInfo: function(info) {
            PxlViewer.util.Debug.log("onGetInfo");
            PxlViewer.ImageLoaded = true;
            PxlViewer.errorOccured = false;
            $('#ImageServerErrorOccured').remove();
            this.images[this.currentImage].info = info;
            if (info.ERROR != undefined || PxlViewer.error2343Triggered) {
                PxlViewer.errorOccured = true;
                // if the timeout occurs then enforce the 2343 error when/if a successful response is returned.
                if (PxlViewer.error2343Triggered) {
                    info.ERROR = "2343";
                }
            }
            // TODO: Multiple tile sources?
            // TODO: Only create OpenSeaDragon if 'viewer' is undefined.

            this.currentTileUrl = "";
            var pxl = this;
            var stackId = -1;
            if (info.startStack != undefined) {
                // if the image server returns an optimal stackid then use that
                stackId = info.startStack;
            } else if (pxl.regions != undefined) {
                stackId = PxlViewer.Regions.getActiveRegionID(pxl);
            }

            this.images[this.currentImage].stackID = stackId;
            if (pxl.zstacks != undefined) {
                focusId = parseInt(PxlViewer.ZStacks.getActiveFocusValue(pxl));
            }
            if (this.viewer != undefined) {
                this.resetBackgroundCanvas();
                this.viewer.destroy();
            }
            if (!PxlViewer.errorOccured) {
                $("#" + this.options.id).css({ width: "", height: "", margin: "" });
                var dirList = info.dirList.split("|");
                this.images[this.currentImage].isFake = false;
                this.images[this.currentImage].xRes = info.xres;
                this.viewer = new OpenSeadragon({
                    id: this.options.id,
                    tileSources: {
                        height: parseInt(info.height),
                        width: parseInt(info.width),
                        tileSize: parseInt(1024),
                        minLevel: 0,
                        maxLevel: 9,
                        tileOverlap: 0,
                        getTileUrl: function(level, x, y) {
                            var zoom = Math.pow(2, 9 - level);
                            for (var i = 1; i < dirList.length; i++) {
                                if (zoom == Math.floor(parseFloat(dirList[i]))) {
                                    zoom = parseFloat(dirList[i]);
                                }
                            }
                            var w = parseInt(this.tileSize);
                            var h = parseInt(this.tileSize);
                            var x2 = x * w;
                            var y2 = y * h;


                            var xStart = x2 * zoom;
                            var xEnd = xStart + (this.tileSize * zoom);
                            if (xEnd > this.width) {
                                var dif = xEnd - this.width;
                                var tileDif = (dif / zoom);
                                w = parseInt(this.tileSize - tileDif);
                            }

                            var yStart = y2 * zoom;
                            var yEnd = yStart + (this.tileSize * zoom);
                            if (yEnd > this.height) {
                                var dif = yEnd - this.height;
                                var tileDif = (dif / zoom);
                                h = parseInt(this.tileSize - tileDif);
                            }
                            // if the width or height is less than 16 (the minimum width or height 
                            // the image server will return) then set the value to the minimum.
                            if (w < 16) {
                                w = 16;
                            }
                            if (h < 16) {
                                h = 16;
                            }
                            var url = pxl.images[pxl.currentImage].url + "?" +
                                "GetImage?x=" + x2 + "&y=" + y2 + "&width=" + w + "&height=" + h + "&zoom=" + zoom + "&compression=70" + "&stackid=" + stackId + "&focus=" + pxl.getfocus() + "&gamma=" + pxl.ImageAdjustments.getGammaValueForImageServer() + "&sharpen=" + PxlViewer.ImageAdjustments.IsSharpen();
                            return url;
                        }
                    },
                    crossOriginPolicy: "anonymous",
                    prefixUrl: "static/",
                    showNavigator: true,
                    blendTime: 0.1,
                    constrainDuringPan: true,
                    maxZoomPixelRatio: 1,
                    visibilityRatio: 1,
                    showRotationControl: true,
                    timeout: 120000,
                    autoHideControls: false,
                    showNavigationControl: false,
                    debugMode: false,
                    zoomPerClick: 0,
                    springStiffness: 6.5,
                    animationTime: 0.5,
                    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, pinchRotate: true, flickEnabled: true, flickMinSpeed: 120, flickMomentum: 0.25 },
                    gestureSettingsTouch: { pinchRotate: true, flickEnabled: true, flickMinSpeed: 1400, flickMomentum: 0.5 }
                });
            } else {
                $("#" + this.options.id).css({ width: "60%", height: "60%", margin: "auto" });
                // viewer to render on error
                this.images[this.currentImage].isFake = true;
                this.viewer = new OpenSeadragon({
                    id: this.options.id,
                    tileSources: {
                        height: 76.4,
                        width: 200,
                        tileSize: 200,
                        getTileUrl: function(level, x, y) {
                            return "../../images/noslide.jpg";
                        }
                    },
                    showNavigator: false,
                    blendTime: 0.1,
                    constrainDuringPan: true,
                    maxZoomPixelRatio: 1,
                    visibilityRatio: 1,
                    showRotationControl: true,
                    timeout: 120000,
                    autoHideControls: false,
                    showNavigationControl: false,
                    debugMode: false,
                    zoomPerClick: 0,
                    springStiffness: 6.5,
                    animationTime: 0.5,
                    gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, pinchRotate: true, flickEnabled: true, flickMinSpeed: 70, flickMomentum: 0.3 },
                    gestureSettingsTouch: { flickEnabled: true, flickMinSpeed: 1400, flickMomentum: 0.5 }
                });
                this.displayViewerError(info);
                pxl.carousel = new PxlViewer.Carousel(pxl);
                pxl.options.menu.showCarousel = PxlViewer.Carousel.isCarouselAvailable(pxl);
                pxl.SlideName = new PxlViewer.SlideName(pxl.options.SlideName, pxl);
                pxl.AuthorName = new PxlViewer.AuthorName(pxl.options.AuthorName, pxl);
                if (pxl.menu == undefined) {
                    pxl.menu = new PxlViewer.Menu(pxl.options.menu, pxl);
                }
                pxl.regions = new PxlViewer.Regions(pxl);
                pxl.Screenshot = new PxlViewer.Screenshot(pxl.options.Screenshot, pxl);
                pxl.menu.inject();
                pxl.SlideName.Refresh();
                pxl.AuthorName.Refresh();
                pxl.ImageAdjustments = new PxlViewer.ImageAdjustments(pxl.options.ImageAdjustments, pxl);
                pxl.Measurements = new PxlViewer.Measurements(pxl.options.measurements, pxl);
                pxl.Heatmap = new PxlViewer.Heatmap(pxl.options.Heatmap, pxl);
            }
            if (!PxlViewer.errorOccured) {
                // Add the scaleBar
                var pThis = this;
                if (this.canSeeScalebar(info)) {
                    this.viewer.scalebar({
                        location: OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT,
                        type: OpenSeadragon.ScalebarType.MAP,
                        stayInsideImage: false,
                        pixelsPerMeter: 1000000 / info.xres,
                        color: "black",
                        fontColor: "black",
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        fontSize: (pThis.options.isTablet ? "14px" : "12px")
                    });
                    this.viewer.scalebarInstance.divElt.style.zIndex = "50";
                }
                this.viewer.addHandler("pan", function() {
                    PxlViewer.util.Debug.debug("event: pan");
                    // Hide drawers, menus and panels.
                    if ($('#magnificationDrawer.drawer').hasClass("active")) {
                        $('#menuMagnification.drawerBtn').mouseup();
                    }

                    if ($('#viewMenuPanel.menu').hasClass("active")) {
                        $('#menuView.menuBtn').mouseup();
                    }

                    pxl.resetBackgroundCanvas();
                });
                this.viewer.addHandler("zoom", function() {
                    PxlViewer.util.Debug.debug("event: zoom");
                    // stop the mag list closing automatically when the viewer zooms via the mag menu
                    if (PxlViewer.Menu.AllowClosingofMag) {
                        new PxlViewer.Menu(pxl.options.menu, pxl).hideAllSlideoutPanels();
                    }
                    PxlViewer.Menu.AllowClosingofMag = true;
                    pxl.resetBackgroundCanvas();
                    if (pxl.annotations != undefined && pxl.options.AnnotationUpdateMode) {
                        pxl.annotations.viewerUpdateAnnotations();
                    }

                });
                this.viewer.addHandler("rotate", function() {
                    // clear the z-stacks canvas on rotate 
                    pxl.onRotate();
                });
                this.viewer.addHandler("canvas-drag", function() {
                    PxlViewer.util.Debug.debug("event: canvas-drag");
                    if ($('#magnificationDrawer.drawer').hasClass("active")) {
                        $('#menuMagnification.drawerBtn').mouseup();
                    }

                    if ($('#viewMenuPanel.menu').hasClass("active")) {
                        $('#menuView.menuBtn').mouseup();
                    }

                    new PxlViewer.Menu(pxl.options.menu, pxl).hideAllSlideoutPanels();

                    if (pxl.annotations != undefined && pxl.options.AnnotationUpdateMode) {
                        pxl.annotations.viewerUpdateAnnotations();
                    }
                    pxl.resetBackgroundCanvas();
                });
                this.viewer.addHandler("canvas-pinch", function() {
                    if (pxl.annotations != undefined && pxl.options.AnnotationUpdateMode) {
                        pxl.annotations.viewerUpdateAnnotations();
                    }
                });
                this.viewer.addHandler("canvas-double-click", function(e) {
                    PxlViewer.util.Debug.debug("event: canvas-double-click");
                    var lenses = [2.5, 5, 10, 20, 40, 60, 83];
                    var currZoom = pxl.viewer.viewport.getZoom(true);
                    var currMag = pxl.images[pxl.currentImage].info.mag;
                    currZoom = currZoom * info.mag;
                    currZoom = pxl.viewer.viewport.viewportToImageZoom(currZoom);

                    if (currZoom > 2.4) {
                        currZoom = Math.ceil(currZoom);
                    }
                    var targetZoom = currZoom;

                    if (targetZoom > currMag) {
                        targetZoom = currMag;
                    } else {
                        var lastIndex = lenses.indexOf(parseInt(currMag));
                        for (var i = 0; i <= lastIndex; i++) {
                            if (currZoom < lenses[i]) {
                                targetZoom = lenses[i];
                                break;
                            }
                        }
                    }
                    var zoomTarget = pxl.viewer.viewport.imageToViewportZoom(targetZoom / currMag);
                    pxl.viewer.viewport.zoomTo(zoomTarget, pxl.viewer.viewport.pointFromPixel(e.position, true), false);
                });

                this.viewer.addHandler("full-screen", function(args) {
                    PxlViewer.util.Debug.debug("event: full-screen");
                    if (args.fullScreen) {
                        this.menu.inject();
                        // hides everything except the fullscreen button.
                        $('#viewerMenu > .nonscrollingmenusection > div:not(.special)').remove();
                        $('#viewerMenu > .scrollablemenusection > div:not(.special)').remove();
                        $('#viewerMenu > .nonscrollingmenusection2 > div:not(.special)').remove();

                        $("#menuFullScreen").addClass("isFullScreen");
                    } else {
                        $('#viewerMenu').remove();
                    }
                    if (pxl.annotations != undefined && pxl.options.AnnotationUpdateMode) {
                        pxl.annotations.viewerUpdateAnnotations();
                    }
                });
                $(window).on("orientationchange", function(event) {

                    PxlViewer.util.Debug.debug("event: orientationchange");

                    // update the
                    pxl.menu.UpdateCount(pxl.menu.options._menuIDs.slides, pxl.images.length);
                    setTimeout(
                        function() {
                            pxl.annotations.resize();
                            if (!pxl.isFullScreen) {
                                //AA this was removed as it was playing havok with the menu perhaps it will need to go back, if so watch for things deleting when you rotate
                                //pxl.menu.Reset();
                                //pxl.menu.destroy();
                                //pxl.menu = new PxlViewer.Menu(pxl.options.menu, pxl);
                                //pxl.menu.inject();

                                // Because we recreated the menu, there is no concept of the z-stack control being in an 
                                // opened or a closed state prior to the orientationchange - we need to reload the menu state
                                if (pxl.options.menu.showZStacks) {
                                    if ($("#zStackRangeHolder").length) {
                                        pThis.menu.SetActiveOn(pThis.menu.options._menuIDs.zstacks);
                                    }
                                }
                            }
                            pxl.menu.setScrollablemenuArea();
                            pxl.menu.hideAllSlideoutPanels();
                            pxl.resizeViewerForTabletSafari();
                            pxl.menu.setViewerWidth();
                            pxl.menu.UpdateCount(pxl.menu.options._menuIDs.slides, pxl.images.length);
                            if (pxl.annotations != undefined) {
                                pxl.annotations.destroy();
                            }
                             if (pxl.annotations.completeAnnotationList != undefined) {
                                pxl.menu.UpdateCount(pxl.menu.options._menuIDs.annotation, pxl.annotations.completeAnnotationList.length);
                            }
                            if (pxl.measurements.completeMeasurementList != undefined) {
                                pxl.menu.UpdateCount(pxl.menu.options._menuIDs.measurements, pxl.annotations.completeMeasurementList.length);
                            }
                        }, 300);


                });
                this.viewer.addHandler("resize", function(args) {
                    try {
                        PxlViewer.util.Debug.debug("event: resize");
                        pxl.menu.setScrollablemenuArea();
                        pxl.menu.hideAllSlideoutPanels();
                        pxl.menu.setViewerWidth();
                        pxl.resizeViewerForTabletSafari();
                        pxl.resetBackgroundCanvas();
                        if (pxl.annotations != undefined && pxl.annotations.currentSelectedAnnotation != null) {
                            pxl.annotations._loadAnnotation(pxl.annotations.currentSelectedAnnotation, false);
                        }
                    } catch (ex) {
                        PxlViewer.util.Debug.DisplayAlertMessage(ex);
                    }
                });

                this.viewer.addHandler("open", function(args) {
                    PxlViewer.util.Debug.debug("event: open");
                    if (pxl.menu == undefined) {
                        var permissions = { permissions: [] };
                        if (typeof pxl.options.annotations != "undefined" && typeof pxl.options.annotations.permissions != "undefined") {
                            permissions = {
                                permissions: pxl.options.annotations.permissions
                            };
                        }
                        if (pxl.annotations == undefined) {
                            if (pxl.options.menu.showAnnotationDrawer) {
                                pxl.annotations = new PxlViewer.Annotations(pxl, permissions, pxl.options.annotation);
                                pxl.annotations.retrieveAnnotations("", PxlViewer.Annotations.hasWebServiceBeenCalled);
                            }
                        }

                        if (pxl.ImageAdjustments == undefined) { pxl.ImageAdjustments = new PxlViewer.ImageAdjustments(pxl.options.ImageAdjustments, pxl); }
                        if (pxl.measurements == undefined)
                        {
                            if (pxl.options.menu.showMeasurementsLink) {
                                pxl.measurements = new PxlViewer.Measurements(pxl.options.measurements, pxl);
                                pxl.measurements.getMeasurements("", true);
                            }
                        }
                        if (pxl.carousel == undefined) { pxl.carousel = new PxlViewer.Carousel(pxl); }
                        pxl.options.menu.showCarousel = PxlViewer.Carousel.isCarouselAvailable(pxl);
                        if (pxl.regions == undefined) {
                            pxl.regions = new PxlViewer.Regions(pxl);
                            // on the first load the pxl regions will be null and the active stack id will be -1
                            // this will check this and override it with the actual base id of 0 unless it is 
                            // olympus and has a startStack
                            if (typeof info.startStack == "undefined" &&
                                PxlViewer.Regions.getActiveRegionID(pxl) == -1 &&
                                PxlViewer.Regions.getRegionsCount(pxl) > 0) {
                                stackId = 0;
                                pThis.images[pThis.currentImage].stackID = stackId;
                            }
                        }
                        pxl.regions.options.activeStackId = pThis.images[pThis.currentImage].stackID;
                        // preload the regions thumbnails
                        PxlViewer.util.preloadImages(PxlViewer.Regions.CreateRegionsThumbnailArray(pxl));

                        pxl.options.menu.showRegions = pxl.regions.isRegionsAvailable(pxl);

                        pxl.zstacks = new PxlViewer.ZStacks(pxl);
                        pxl.options.menu.showZStacks = PxlViewer.ZStacks.isZStacksAvailable(pxl);

                        if (pxl.slideInfo == undefined) {
                            pxl.slideInfo = new PxlViewer.SlideInfo(pxl);
                        }
                        if (pxl.menu == undefined) {
                            pxl.menu = new PxlViewer.Menu(pxl.options.menu, pxl);
                        }
                       
                            pxl.Screenshot = new PxlViewer.Screenshot(pxl.options.Screenshot, pxl);
                            pxl.Screenshot._init();
                        
                        pxl.menu.inject();
                        pxl.menu.update(info);

                        if (pxl.SlideLabel == undefined) {
                            pxl.SlideLabel = new PxlViewer.SlideLabel(pxl.options.SlideLabel, pxl);
                        }
                        pxl.SlideLabel._init();
                        pxl.options.menu.showLabelLink = pxl.SlideLabel.canSeeSlideLabel();
						
                        if (pxl.Heatmap == undefined) {
                            pxl.Heatmap = new PxlViewer.Heatmap(pxl.options.Heatmap, pxl);
                        }
                    }
                    else
                    {
                        if (pxl.annotations == undefined) { pxl.annotations = new PxlViewer.Annotations(pxl, permissions, pxl.options.annotation); }
                        if (pxl.measurements == undefined) { pxl.measurements = new PxlViewer.Measurements(pxl.options.measurements, pxl); }

                        if (pxl.SlideLabel == undefined) {
                            pxl.SlideLabel = new PxlViewer.SlideLabel(pxl.options.SlideLabel, pxl);
                        }
                        if (pxl.SlideName == undefined) {
                            pxl.SlideName = new PxlViewer.SlideName(pxl.options.SlideName, pxl);
                        }
                        if (pxl.AuthorName == undefined) {
                            pxl.AuthorName = new PxlViewer.AuthorName(pxl.options.AuthorName, pxl);
                        }

                        // update the slidelabel if it is on the screen
                        pxl.SlideLabel.update();
                        setTimeout("pxl.SlideLabel.resize();", 100);

                        //pxl.menu._shrinkPanel();
                        pxl.menu.toggleMeasurementsButtonControl();
                        pxl.menu.toggleScalebarButtonControl();
                        pxl.SlideName.Refresh();
                        pxl.AuthorName.Refresh();
                        pxl.regions.options.activeStackId = pThis.images[pThis.currentImage].stackID;
                        // preload the regions thumbnails
                        PxlViewer.util.preloadImages(PxlViewer.Regions.CreateRegionsThumbnailArray(pxl));
                        pxl.menu.refreshRotationControl(pxl.menu);
                    }

                    if (pxl.options.menu.showZStacks) {
                        pxl.zstacks.toggleZStacksPanel(pxl, true);
                    }


                    if (pxl.SlideLabel == undefined) {
                        pxl.SlideLabel = new PxlViewer.SlideLabel(pxl.options.SlideLabel, pxl);
                    }
                    if (pxl.SlideName == undefined) {
                        pxl.SlideName = new PxlViewer.SlideName(pxl.options.SlideName, pxl);
                    }
                    if (pxl.AuthorName == undefined) {
                        pxl.AuthorName = new PxlViewer.AuthorName(pxl.options.AuthorName, pxl);
                    }
                    pxl.menu.update(info);
                    pxl.menu._resizeControls();

                    pThis.viewer.navigator.addHandler("resize", function(args) {
                        pxl.SlideName.resize();
                        pxl.AuthorName.resize();
                    });
                    $(".navigator").off("touchstart").on("touchstart", function() {
                        pxl.menu.hideAllSlideoutPanels();
                    });
                    $(".navigator").off("click").on("click", function() {
                        pxl.menu.hideAllSlideoutPanels();
                    });

                    pxl.bindKeyboardNavigation();
                });
            }
            if (pxl.menu != null) {
                pxl.menu.ShowButtonsWhenErrorResolved();
            }
            pxl.resizeViewerForTabletSafari();

        },
        onRotate: function() {
            var canvas = document.getElementById('backgroundCanvas');
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            pxl.viewer.pivotPoint = pxl.viewer.viewport.viewportToViewerElementCoordinates(pxl.viewer.viewport.getCenter(false));
            if (pxl.annotations != undefined && pxl.options.AnnotationUpdateMode) {
                pxl.annotations.viewerUpdateAnnotations();
            }
        },
        // the scalebar should only be visible if there is imageinfo and there is an xres
        canSeeScalebar: function(info) {
            if (info != null && info.xres != null && info.xres != -1 && info.xres != 0) {
                return true;
            }
            return false;
        },
		        reload: function (resourceObject) {

            var mockImageArray = [{
                url: "http://89.185.129.11:80/E:/customers/ChrisFoster/BL14-1717-Anon.jpg",
                id: 70396,
                slideName: "BL14-1717-Anon"
            }, {
                url: "http://89.185.129.11:80/E:/customers/ChrisFoster/BL14-1717-Anon.jpg",
                id: 70396,
                slideName: "BL14-1717-Anon"
            }, {
                url: "http://89.185.129.11:80/E:/customers/ChrisFoster/BL14-1717-Anon.jpg",
                id: 70396,
                slideName: "BL14-1717-Anon"
            }];
          //  resourceObject = mockImageArray; // comment this out when we are ready to pass an image in

            this.base.Images = resourceObject;

            //todo - What happens if a question has zero resources ? do we pass in a blank image like we do with philips currently ? .

             // todo - remove all annotations for the current resource before switching to the new resource of the new question
            this.loadImage(0);


        },
        resizeViewerForDesktop: function () {
            try {
                PxlViewer.util.Debug.debug("event: resize");


                if (this.base.Menu != undefined)
                {

                    this.base.Menu.setScrollablemenuArea();

                    this.base.Menu.hideAllSlideoutPanels();
                    this.base.Menu.setViewerWidth();

                }

                if (pxl.SplitScreen != null) {
                    pxl.SplitScreen.ResizeNavigator();
                }
                pxl.resizeViewerForTabletSafari();

                pxl.resetBackgroundCanvas();

                if (pxl.annotations != undefined) {
                    if (pxl.annotations.currentSelectedAnnotation != null && pxl.annotations != undefined) {
                        pxl.annotations._loadAnnotation(pxl.annotations.currentSelectedAnnotation, false);
                    }
                }
            } catch (ex) {
                PxlViewer.util.Debug.DisplayAlertMessage(ex);
            }
        },

        resizeViewerForTabletSafari: function() {
            PxlViewer.util.Debug.log("resizeViewerForTabletSafari");
            var vendor = window.OpenSeadragon.Browser.vendor;
            if (vendor == window.OpenSeadragon.BROWSERS.SAFARI || vendor == window.OpenSeadragon.BROWSERS.CHROME) {
                var height = parseInt(window.innerHeight);
                $('#container').css("height", height + "px");
            }

        },

        resize: function() {
            PxlViewer.util.Debug.log("resize");
            pxl.annotations.resize();
            pxl.menu.setScrollablemenuArea();
            pxl.menu.hideAllSlideoutPanels();
            pxl.resizeViewerForTabletSafari();
            pxl.menu.setViewerWidth();
            pxl.Screenshot.resize();
        },
        keypressadd: function(additem) { // add a unique item to the array
            if (!PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, additem)) {
                pxl.internalProperties.panning.keyspressed.push(additem);
            }
        },
        keypressremove: function(itemtoremove) { // remove an item from the array
            var index = pxl.internalProperties.panning.keyspressed.indexOf(itemtoremove);
            if (index > -1) {
                pxl.internalProperties.panning.keyspressed.splice(index, 1);
            }
        },
        startpanning: function() {
            if (!pxl.internalProperties.panning.panning) {
                pxl.keypanningevent();
            }
        },
        keypanningevent: function() {
            if (pxl.internalProperties.panning.keyspressed.length > 0) {
                // at least one key has been pressed
                pxl.internalProperties.panning.panning = true;
                var currZoom = pxl.viewer.viewport.getZoom(true);
                var panby = 0.05 / currZoom;
                var negativepan = panby * -1;
                if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "up")) {
                    // up
                    if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "right")) {
                        // diagonal up-right
                        pxl.viewer.viewport.panBy(new OpenSeadragon.Point(panby, negativepan));
                    } else if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "left")) {
                        // diagonal up-left
                        pxl.viewer.viewport.panBy(new OpenSeadragon.Point(negativepan, negativepan));
                    } else {
                        // just up
                        pxl.viewer.viewport.panBy(new OpenSeadragon.Point(0, negativepan));
                    }
                } else if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "down")) {
                    // down
                    if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "right")) {
                        // diagonal down-right
                        pxl.viewer.viewport.panBy(new OpenSeadragon.Point(panby, panby));
                    } else if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "left")) {
                        // diagonal down-left
                        pxl.viewer.viewport.panBy(new OpenSeadragon.Point(negativepan, panby));
                    } else {
                        // just down
                        pxl.viewer.viewport.panBy(new OpenSeadragon.Point(0, panby));
                    }
                } else if (PxlViewer.util.ArrayContains(pxl.internalProperties.panning.keyspressed, "left")) {
                    // left only
                    pxl.viewer.viewport.panBy(new OpenSeadragon.Point(negativepan, 0));
                } else {
                    // right
                    pxl.viewer.viewport.panBy(new OpenSeadragon.Point(panby, 0));
                }
                pxl.viewer.viewport.applyConstraints();
                // call itself until it is instructed to stop
                pxl.internalProperties.panning.keyPanningTimeout = setTimeout(function() {
                    pxl.keypanningevent();
                }, pxl.internalProperties.panning.keyPanningTicker);
            } else {
                // no keys have been pressed
                pxl.internalProperties.panning.panning = false;
                if (pxl.internalProperties.panning.keyPanningTimeout != null) {
                    // clear the existing timeout
                    clearTimeout(pxl.internalProperties.panning.keyPanningTimeout);
                    pxl.internalProperties.panning.keyPanningTimeout = null;
                }
            }
        },
        // sets up the keyboard navigation
        bindKeyboardNavigation: function() {
            PxlViewer.util.Debug.log("pxl.bindKeyboardNavigation");
            var pThis = this;
            if (!pThis.options.isTablet) {
                if ($('#' + pThis.internalProperties.bindKeyboardNavigarionArea).length == 0) {
                    // the navigation binding are is unboundKeyboardNavigarionArea
                    $("#view1").append("<textarea id='" + pThis.internalProperties.bindKeyboardNavigarionArea + "'></textarea>");
                    $("#view1").append("<textarea id='" + pThis.internalProperties.unboundKeyboardNavigarionArea + "'></textarea>");
                }
                setTimeout(function() {
                    // set the keyboard navigation on mousedown, also sets a global variable of which keys are pressed
                    $('#' + pThis.internalProperties.bindKeyboardNavigarionArea).unbind("keydown").bind("keydown", function(event) {
                        if (pxl.internalProperties.panning.enabled) {
                            var currZoom = parseFloat(pxl.viewer.viewport.getZoom(true));
                            var currMag = pxl.images[pxl.currentImage].info.mag;
                            var maxzoom = parseFloat(pxl.viewer.viewport.getMaxZoom());
                            var center = pxl.viewer.viewport.getCenter(false);

                            if (!event.preventDefaultAction) {
                                // close the mag panel on keyboard navigation
                                PxlViewer.Menu.AllowClosingofMag = true;
                                pxl.menu.hideAllSlideoutPanels();

                                switch (event.keyCode) {
                                case 38: //up arrow
                                    if (event.shiftKey) {
                                        pxl.viewer.viewport.zoomBy(1.1);
                                    } else {
                                        pxl.keypressadd("up");
                                        pxl.startpanning();
                                    }
                                    return false;
                                case 40: //down arrow
                                    if (event.shiftKey) {
                                        pxl.viewer.viewport.zoomBy(0.9);
                                    } else {
                                        pxl.keypressadd("down");
                                        pxl.startpanning();
                                    }
                                    return false;
                                case 37: //left arrow
                                    pxl.keypressadd("left");
                                    pxl.startpanning();
                                    return false;
                                case 39: //right arrow
                                    pxl.keypressadd("right");
                                    pxl.startpanning();
                                    return false;
                                case 61: //=|+
                                case 187: // =
                                case 107: // numpad +
                                    if (currZoom <= maxzoom) {
                                        pxl.viewer.viewport.zoomBy(1.1);
                                        pxl.viewer.viewport.applyConstraints();
                                    }
                                    return false;
                                case 45: //-|_
                                case 109: // numpad -
                                case 189: // dash
                                case 173: // dash firefox as of v15
                                    pxl.viewer.viewport.zoomBy(0.9);
                                    pxl.viewer.viewport.applyConstraints();
                                    return false;
                                case 81: // q key
                                case 33: // the page up control
                                    PxlViewer.ZStacks.HookupEvents.up();
                                    return false;
                                case 65: // a key
                                case 34: // the page down control
                                    PxlViewer.ZStacks.HookupEvents.down();
                                    return false;
                                // zoom by keypress numbers
                                case 49: //1|)
                                case 97: // numpad 1
                                case 48: //0|)
                                case 96: // numpad 0
                                    // go to overview
                                    pxl.viewer.viewport.goHome();
                                    pxl.viewer.viewport.applyConstraints();
                                    return false;
                                case 50: //2|)
                                case 98: // numpad 2
                                    // zoom to 2.5x
                                    if (currMag < 2.5) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(2.5 / currMag), center, false);
                                    return false;
                                case 51: //3|)
                                case 99: // numpad 3
                                    // zoom to 5x
                                    if (currMag < 5) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(5 / currMag), center, false);
                                    return false;
                                case 52: //4|)
                                case 100: // numpad 4
                                    // zoom to 10x
                                    if (currMag < 10) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(10 / currMag), center, false);
                                    return false;
                                case 53: //5|)
                                case 101: // numpad 5
                                    // zoom to 20x
                                    if (currMag < 20) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(20 / currMag), center, false);
                                    return false;
                                case 54: //6|)
                                case 102: // numpad 6
                                    // zoom to 40x
                                    if (currMag < 40) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(40 / currMag), center, false);
                                    return false;
                                case 55: //7|)
                                case 103: // numpad 7
                                    // zoom to 60x
                                    if (currMag < 60) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(60 / currMag), center, false);
                                    return false;
                                case 56: //8|)
                                case 104: // numpad 8
                                    // zoom to 83x
                                    if (currMag < 83) {
                                        return false;
                                    } // return false if this mag level is not available
                                    pxl.viewer.viewport.zoomTo(pxl.viewer.viewport.imageToViewportZoom(83 / currMag), center, false);
                                    return false;

                                default:
                                    return true;
                                }
                            }
                        }
                    });

                    // set the keyboard navigation on mouse, and unsets any keys pressed from the global variable
                    $('#' + pThis.internalProperties.bindKeyboardNavigarionArea).unbind("keyup").bind("keyup", function(event) {
                        if (!event.preventDefaultAction) {
                            switch (event.keyCode) {
                            case 119: //w
                            case 87: //W
                            case 38: //up arrow
                                pxl.keypressremove("up");
                                return false;
                            case 115: //s
                            case 83: //S
                            case 40: //down arrow
                                pxl.keypressremove("down");
                                return false;
                            case 97: //a
                            case 37: //left arrow
                                pxl.keypressremove("left");
                                return false;
                            case 100: //d
                            case 39: //right arrow
                                pxl.keypressremove("right");
                                return false;
                            }
                        }
                    });

                    $('#' + pThis.internalProperties.bindKeyboardNavigarionArea).focus();
                    $("#view1,#viewerMenu > div > div,.scrollablemenusection").unbind("click").click(pxl.keyboardNavigationBindEvent);
                }, 0);
            }
        },
        keyboardNavigationBindEvent: function() {
            // when the viewer or any of the menu options is clicked on then it will accept keyboard commands
            $('#' + pxl.internalProperties.bindKeyboardNavigarionArea).focus();
        },
        unbindKeyboardFocusEvents: function() {
            PxlViewer.util.Debug.log("pxl.unbindKeyboardFocusEvents");
            $("#view1,#viewerMenu > div > div,.scrollablemenusection").unbind("click", pxl.keyboardNavigationBindEvent);
        },
        /**
        * Resets the Background Canvas and ZStack Count if it exists on the page
        * @function
        * @param {Object} image
        */
        resetBackgroundCanvas: function() {

            if (this.viewer.ZstackCallCount != null && this.viewer.ZstackCallCount != undefined) {
                this.viewer.ZstackCallCount = 1;
            }
            var canvas = document.getElementById('backgroundCanvas');
            if (canvas != null) {
                var context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
            }
        },
        displayViewerError: function(errorinfo) {
            PxlViewer.util.Debug.log("displayViewerError");
            var html = Mustache.render("<div id='ImageServerErrorOccured'>Please close and try again.<br />Error code: {{{errorNumber}}}</div>", { errorNumber: errorinfo.ERROR });
            $('#container').append(html);
            if ($('#viewerMenu').length > 0) {
                var leftoffset = (parseInt($('#viewerMenu')[0].offsetLeft) > 0 ? 175 : 0);
                $('#ImageServerErrorOccured').css("margin-left", leftoffset + "px");
            }
        },
        GetViewerCanvas: function() {
            if (pxl.viewer != null) {
                return $(pxl.viewer.canvas).find('canvas').filter(function() {
                    return PxlViewer.util.IsNullOrEmpty($(this).attr("id"));
                }).first();
            }
            return null;
        },
        // get Attributes
        GetResID: function() {
            if (this.CurrentImageAvailable()) {
                return this.images[this.currentImage].id;
            }
            return 0;
        },
        GetRealCentre: function () {
            var centerPoint = pxl.viewer.viewport.getCenter(true);
            centerPoint = pxl.viewer.viewport.viewportToImageCoordinates(centerPoint);

            var currentZoom = pxl.images[pxl.currentImage].info.mag / pxl.viewer.viewport.viewportToImageZoom(pxl.viewer.viewport.getZoom() * pxl.images[pxl.currentImage].info.mag);
            var rcx = centerPoint.x / currentZoom;
            var rcy = centerPoint.y / currentZoom;
            return { x: rcx, y: rcy };
        },
        GetZoom: function () { return pxl.viewer.viewport.getZoom(true); },
        GetTrueZoom: function () { return pxl.images[pxl.currentImage].info.mag / pxl.viewer.viewport.viewportToImageZoom(pxl.viewer.viewport.getZoom(true) * pxl.images[pxl.currentImage].info.mag); },
        GetOverviewZoom: function () { return pxl.images[pxl.currentImage].info.mag / pxl.viewer.viewport.viewportToImageZoom(pxl.viewer.viewport.getHomeZoom() * pxl.images[pxl.currentImage].info.mag); },
        GetCurrentRotation: function () { return this.viewer.viewport.getRotation(); },
        GetImageWidth: function () {
            if (this.CurrentImageAvailable() && this.images[this.currentImage].info.ERROR == undefined) {
                return this.images[this.currentImage].info.width;
            }
            return 0;
        },
        GetImageHeight: function () {
            if (this.CurrentImageAvailable() && this.images[this.currentImage].info.ERROR == undefined) {
                return this.images[this.currentImage].info.height;
            }
            return 0;
        },
        // there is a current image available
        CurrentImageAvailable: function() {
            if (this.images != null && this.images.length > 0 &&
                this.currentImage != null && this.images[this.currentImage] != null) {
                return true;
            }
            return false;
        },
        /// <summary>
        /// when saving annotations the zoom is being rounded by the server which is causing a very minor 
        /// discrepency between the position of the annotaiton and where it is saved.
        /// this method will work out if the magnification is not a rounded zoom reload it to a rounded zoom
        /// </summary>
        GoToRoundedZoom: function () {
            PxlViewer.util.Debug.log("pxl.GoToRoundedZoom");
            var places = 6;
            var startZoom = parseFloat(this.images[this.currentImage].info.mag / this.viewer.viewport.viewportToImageZoom(this.viewer.viewport.getZoom() * this.images[this.currentImage].info.mag));
            var roundedZoom = PxlViewer.util.RoundToXPlaces(startZoom, places);

            if (parseFloat(startZoom) != parseFloat(roundedZoom)) {
                PxlViewer.util.Debug.debug("Event GoToRoundedZoom: trigger zoom change. \nstartZoom: " + startZoom + "\nroundedZoom:" + roundedZoom);
                // they are not equal then go to that zoom
                var center = this.viewer.viewport.getCenter(false);
                this.viewer.viewport.zoomTo(this.viewer.viewport.imageToViewportZoom(1 / startZoom), center, false);
            }
        },
        GetImageSourceForScreenSizedImage: function () {
            var src = this.images[this.currentImage].url;
            var mag = this.images[this.currentImage].info.mag;
            var z = mag / this.viewer.viewport.viewportToImageZoom(this.viewer.viewport.getZoom(true) * mag);
            var stackId = this.images[this.currentImage].stackID;
            var focus = this.getfocus();

            
            var bounds = this.viewer.viewport.viewportToImageRectangle(this.viewer.viewport.getBounds(true));
            var x = bounds.x / z;
            var y = bounds.y / z;
            var w = bounds.width / z;
            var h = bounds.height / z;
            var imageWidth = this.images[this.currentImage].info.width / z;
            var imageHeight = this.images[this.currentImage].info.height / z;
            w = Math.min(w, imageWidth);
            h = Math.min(h, imageHeight);

            //rotate all the points
            var angleRadians = this.viewer.viewport.getRotation() * (Math.PI / 180);
            var maxX = x + w;
            var maxY = y + h;
            var lt = new fabric.Point(x, y);           
            var rt = new fabric.Point(maxX, y);
            var lb = new fabric.Point(x, maxY);
            var rb = new fabric.Point(maxX,maxY);
            var centrePoint = new fabric.Point(x + ((maxX - x) / 2), y + ((maxY - y) / 2));           
            var rotated_lt = fabric.util.rotatePoint(lt, centrePoint, angleRadians);
            var rotated_rt = fabric.util.rotatePoint(rt, centrePoint, angleRadians);
            var rotated_lb = fabric.util.rotatePoint(lb, centrePoint, angleRadians);
            var rotated_rb = fabric.util.rotatePoint(rb, centrePoint, angleRadians);
            var minrX = Math.min(rotated_lt.x, rotated_rt.x, rotated_lb.x, rotated_rb.x);
            var minrY = Math.min(rotated_lt.y, rotated_rt.y, rotated_lb.y, rotated_rb.y);
            var maxrX = Math.max(rotated_lt.x, rotated_rt.x, rotated_lb.x, rotated_rb.x);
            var maxrY = Math.max(rotated_lt.y, rotated_rt.y, rotated_lb.y, rotated_rb.y);

            var requestedWidth;
            requestedWidth = (maxrX - minrX);
            
            var requestedHeight;
            requestedHeight = (maxrY - minrY);
            
            if (requestedWidth > imageWidth) {
                requestedWidth = imageWidth;
            }
            if (requestedHeight > imageHeight) {
                requestedHeight = imageHeight;
            }

            if (minrX < 0) {
                minrX = 0;
            }
            if (minrY < 0) {
                minrY = 0;
            }

            src += "?getimage?x=" + parseInt(minrX) + "&y=" + parseInt(minrY) + "&zoom=" + z + "&width=" + parseInt(requestedWidth) + "&height=" + parseInt(requestedHeight) + "&compression=70" + "&stackid=" + stackId + "&focus=" + focus + "&sharpen=" + PxlViewer.ImageAdjustments.IsSharpen();

            var imageRequestDetails = new Object();
            imageRequestDetails.x = minrX;
            imageRequestDetails.y = minrY;
            imageRequestDetails.z = z;
            imageRequestDetails.width = requestedWidth;
            imageRequestDetails.height = requestedHeight;
            imageRequestDetails.src = src;

            return imageRequestDetails;

        },
        /**
         * Destroys the viewer completely. This means that the viewer <div> is
         * emptied and any divs that have been created are destroyed.
         * @function
         */
        destroy: function () {
            PxlViewer.util.Debug.log("pxl.destroy");
            this.menu.destroy();
            this.annotations.destroy();
            this.SlideName.destroy();
            this.authorName.destroy();
            $('#' + this.options.id).empty();
            this.menu = null;
            PxlViewer.created[this.pxlIndex] = null;
        }

    });

    /* Other global static functions */

    // TODO: Change name to distinguish from instance function
    PxlViewer.onGetInfo = function (pxlIndex) {
        PxlViewer.util.Debug.log("PxlViewer.onGetInfo");
        return function (info) {
            if (PxlViewer.created[pxlIndex] === null) {
                PxlViewer.console.warn("Could not deliver image info to the correct viewer. It seems it was destroyed.");
                return;
            }
            PxlViewer.created[pxlIndex].onGetInfo(info);
        };
    };

    PxlViewer.onLoadDriveToAnnotation = function (pxlIndex, annotationID)
    {
        return function (info)
        {
            if (PxlViewer.created[pxlIndex] === null)
            {
                PxlViewer.console.warn("Could not deliver image info to the correct viewer. It seems it was destroyed.");
                return;
            }
            PxlViewer.created[pxlIndex].onGetInfo(info);
            PxlViewer.created[pxlIndex].onLoadDriveToAnnotation(annotationID);
        };
    };
}(PxlViewer));



function info(infoobject) {
    // an error has occured
    if (infoobject.ERROR != undefined) {
        pxl.onGetInfo(infoobject);
    }
}
