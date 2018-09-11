/// <reference path="PxlSlideLabel.js" />
/// <reference path="PxlViewer.js" />
/// <reference path="PxlViewerAnnotations.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL
(function (PxlViewer) {


    /**
     *
     * The class which takes care of menu creation and event handling.
     *
     * @class Viewer
     * @classdesc The PxlViewer Menu class.
     *
     * @memberof PxlViewer
     * @param {PxlViewer.Menu} options - Viewer menu options.
     * @param {PxlViewer.Base} base - The PxlViewer.Base instance
     *
     **/
    PxlViewer.Menu = function (options, base) {

        PxlViewer.util.Debug.log("menu.base");
        this.options = {
            debug: false, // displays the debug button
            showZoomControl: true,
            showFullScreen: true,
            showImageInfo: false,
            showBrowse: false,
            showLayers: false,
            showSplitScreen: false,
            showRotationDrawer: false,
            showAnnotationDrawer: true,
            showRotationControl: false,
            showCarousel: false,
            showRegions: false,
            showAdjustmentsLink: false,
            showDebugLink: false,
            showLabelLink: false,
            showMeasurementsLink: false,
            showScalebarLink: false,
            showThumbnailLink: false,
            showViewLink: false,
            showZStacks: false,
            showPublishAnnotations: false,
            showScreenshotControl: true,
            menuScale: "normal",
            _menuIDs: {
                fullscreen: "menuFullScreen",
                magnification: "menuMagnification",
                drawerAppender: "Drawer",
                annotation: "menuAnnotation",
                measurements: "menuMeasurements",
                label: "menuLabel",
                regions: "menuRegions",
                slides: "menuSlides",
                info: "menuInfo",
                scalebar: "menuScalebar",
                screenshot: "menuScreenshot",
                thumbnail: "menuThumbnail",
                view: "menuView",
                adjustments: "menuAdjustments",
                rotate: "rotateDrawer",
                zstacks: "menuZStacks",
                close: "menuClose"
            },
            _menuPanels:
            {
                annotationsPanel: "annoPanel",
                slidesPanel: "carouselControl",
                measurementsPanel: "measurementsPanel"
            },
            _floatingPanels:
            {
                imageAdjustmentsPanelID: "imageAdjustmentsPanel",
            },
            positions:
            {
                expandedWidth: 350 + "px",
                menuWidth: 82 + "px"
            },
            rotationControl: {
                control: null,
                visible: false
            }
        };
        this.options.buttonsToHideOnError = [
            this.options._menuIDs.fullscreen,
            this.options._menuIDs.magnification + this.options._menuIDs.drawerAppender + "Container",
            this.options._menuIDs.annotation,
            this.options._menuIDs.measurements,
            this.options._menuIDs.info,
            this.options._menuIDs.scalebar,
            this.options._menuIDs.screenshot + this.options._menuIDs.drawerAppender + "Container",
            this.options._menuIDs.view,
            this.options._menuIDs.adjustments,
            this.options._menuIDs.rotate,
            this.options._menuIDs.regions,
            this.options._menuIDs.zstacks,
            this.options._menuIDs.label,
            this.options._menuIDs.thumbnail
        ];
        this.options._menuOptionsThatTriggerPanel = [this.options._menuIDs.annotation, this.options._menuIDs.info, this.options._menuIDs.regions, this.options._menuIDs.slides, this.options._menuIDs.measurements];
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
    };

    PxlViewer.Menu.isNewMenu = false;
    PxlViewer.Menu.hidingMenuAction = false;
    PxlViewer.Menu.AnimatingOverflow = false;
    PxlViewer.Menu.AllowClosingofMag = true;
    PxlViewer.Menu.viewportUpdateTimeout = null;
    PxlViewer.Menu.scalingmenu = false; // used when the user tries to do a pinch event on the menu

        $.extend(PxlViewer.Menu.prototype,
        {
            /**
     * Generates and appends the menu's HTML into the <body>.
     *
     * @function
     * @param {ImageInfo} info - The image info object as supplied by the image server.
     */
        inject: function () {
                PxlViewer.util.Debug.log("menu.inject");
                PxlViewer.Menu.isNewMenu = false;
                if (typeof this.html == 'undefined' && $('#viewerMenu').length == 0) {
                    PxlViewer.Menu.isNewMenu = true;
                    var contents = "";
                    this.html = "<div id='viewerMenu'>"; // start viewermenu
                    this.html += "<div class='nonscrollingmenusection'>"; // start nonscrolling menu section
                    this.html += this._createlinkButton("pathXLMenuHomeLink", null, null);
                    if (this.options.showFullScreen) {
                    this.html += this._createButton(this.options._menuIDs.fullscreen, "menubadge", null, "Fullscreen");
                    }

                    if (this.options.showZoomControl) {
                        var btn = this._createButton(this.options._menuIDs.magnification, "drawerBtn mag1", null);
                        contents = "";
                        contents += this._createButton("mag1", "setMag", "<span>Overview</span>");
                        contents += this._createButton("mag2_5", "setMag", "<span>x2.5</span>");
                        contents += this._createButton("mag5", "setMag", "<span>x5</span>");
                        contents += this._createButton("mag10", "setMag", "<span>x10</span>");
                        contents += this._createButton("mag20", "setMag", "<span>x20</span>");
                        contents += this._createButton("mag40", "setMag", "<span>x40</span>");
                        contents += this._createButton("mag60", "setMag", "<span>x60</span>");
                        contents += this._createButton("mag83", "setMag", "<span>x100</span>");

                    this.html += this._createDrawer(this.options._menuIDs.magnification, "menubadge", btn, contents, "x1");
                    }
                    this.html += "</div>";

                    this.html += "<div class='scrollablemenusection'>"; // start scollable menu section

                    if (pxl.options.showAnnotationDrawer)
                    {
                        if (pxl.options.annotations.startNumber == 0 && pxl.options.annotations.permissions.length == 0)
                        {
                            // if the user has no permissions to add annotaitons and there are no annotations
                            // then the annotaitons button should not be visible
                            this.options.showAnnotationDrawer = false;
                        }
                    }

                    if (this.options.showAnnotationDrawer) {
                        // Count annotations here
                        var btn = this._createButton(this.options._menuIDs.annotation, "menubadge", null, "Annotations", pxl.options.annotations.startNumber);
                        this.html += btn;
                    }

                    if (this.options.showMeasurementsLink)
                    {
                        this.html += this._createButton(this.options._menuIDs.measurements, "menubadge", null, "Measure", pxl.options.measurements.startNumber);
                    }

                    // Label
                    var labelAddCss = " ";
                    if (this.options.showLabelLink && this.base.images[this.base.currentImage].info.label == 1) {
                        // No Extra CSS needed
                    } else {
                        labelAddCss += "hidden";
                    }
                this.html += this._createButton(this.options._menuIDs.label, "menubadge" + labelAddCss, null, "Label");

                    var ZstackAddCss = " ";
                    if (this.options.showZStacks && this.base.images[this.base.currentImage].info.layers > 1) {
                        // No Extra CSS needed
                    } else {
                        ZstackAddCss += "hidden";
                    }
                this.html += this._createButton(this.options._menuIDs.zstacks, "menubadge" + ZstackAddCss, null, "ZStacks");


                    // Carousel
                    if (this.options.showCarousel) {
                    var btn = this._createButton(this.options._menuIDs.slides, "menubadge", null, "Slides", this.base.images.length);
                        this.html += btn;
                    }

                    // Regions
                    var regionsAddCss = " ";
                    if (!this.options.showRegions) {
                        regionsAddCss += "hidden";
                    }
                    buttontitle = "Regions";
                    var regionsCount = PxlViewer.Regions.getRegionsCount(pxl);
                var btn = this._createButton("menuRegions", "menubadge" + regionsAddCss, null, buttontitle, regionsCount);
                    this.html += btn;

                    // View menu

                    var slideInfoAddCss = " ";

                    if (this.options.showImageInfo && this.base.images[this.base.currentImage].info != null) {

                    } else {
                        slideInfoAddCss += "hidden";
                    }
                    if (this.options.showImageInfo) {
                        var btn = this._createButton("menuInfobtn", "button", null);
                        contents = "";
                        contents += this._createViewRow("imageInfoIcon", "Image Information");
                        contents += this._createViewRow("labelIcon", "Label");
                        this.html += this._createMenu(this.options._menuIDs.info, "menubadge" + slideInfoAddCss, btn, contents, "Information");
                    }

                    // Create scaleBar button
                    if (this.options.showScalebarLink) {
                        this.html += this._createButton(this.options._menuIDs.scalebar, "menubadgeActive", null, "Scalebar");
                    }

                    if (this.options.showThumbnailLink) {
                        this.html += this._createButton(this.options._menuIDs.thumbnail, "menubadgeActive", null, "Thumbnail");
                    }

                    if (this.options.showViewLink) {
                        // will be turned off for sprint 1
                    this.html += this._createButton(this.options._menuIDs.view, "menubadge", null, "View");
                    }

                    if (this.options.showAdjustmentsLink) {
                    // will be turned off for sprint 1
                    this.html += this._createButton(this.options._menuIDs.adjustments, "menubadge", null, "Adjustments");
                    }

                if (this.options.showRotationControl) {

                    this.html += this._createButton(this.options._menuIDs.rotate, "menubadge", null, "Rotate");
                }

                if (this.options.showScreenshotControl && pxl.Screenshot.canSeeScreenshot()) {
                    var btn = this._createButton(this.options._menuIDs.screenshot, "drawerBtn screenshot", null);
                        contents = "";
                    contents += this._createButton("screenshot", "takeScreenshot", "<span>Whole</span>");
                    contents += this._createButton("drawScreenshot", "drawScreenshot", "<span>Draw</span>");

                    this.html += this._createDrawer(this.options._menuIDs.screenshot, "menubadge", btn, contents, "Screenshot");
                    }

                    if (this.options.showDebugLink) {
                        // will usually be turned off
                        this.html += this._createButton("panelExpand", "menubadge", null, "Expand");
                        this.html += this._createButton("panelShrink", "menubadge", null, "Shrink");
                    }
                    if (this.options.debug) {
                        this.html += this._createButton("viewerDebug", "menubadge", null, "Debug");
                    }
                    //this.html += "<div class='menuSectionOverflowTopSection'></div>"; // this is the transparent gif holder when the user scrolls over the screen size
                    this.html += this._createBottomPadder();
                    this.html += "</div>"; // end scrollable menu section
                //start static area for the back button
                this.html += "<div class='menuSectionOverflowTopSection'></div>"; // this is the transparent gif holder when the user scrolls over the screen size
                this.html += "<div class='menuSectionOverflowBottomSection'></div>"; // this is the transparent gif holder when the user scrolls over the screen size
                this.html += "<div class='nonscrollingmenusection nonscrollingmenusection2'>";
                //this.html += this._createButton(this.options._menuIDs.close, "menubadge", null, "Close Slide");
                this.html += "</div>"; //end static area for the back button
                    this.html += "</div>"; // start viewermenu
                    $('#leftMenuHolder').append(this.html);
                if (this.canSeeZoomControl()) {
                    $('#' + this.options._menuIDs.magnification + "DrawerContainer").show();
                }
                else {
                    $('#' + this.options._menuIDs.magnification + "DrawerContainer").hide();
                }
            }

                if (PxlViewer.Menu.isNewMenu) {
                    var pThis = this;
                    if (this.options.showRotationControl) {
                    this.createRotationControl(pThis);
                }
                this._hookupEvents();
                this.ScaleMenu();
                setTimeout("pxl.menu.setScrollablemenuArea();pxl.menu.positionAllSlideOutPanels();pxl.menu.toggleScalebarButtonControl();", 300);
            }
        },

        toggleScalebarButtonControl: function () {
            if (!this.base.canSeeScalebar(this.base.images[this.base.currentImage].info)) {
                // hide the scalebar if viewing a jpeg
                $('#' + this.options._menuIDs.scalebar).hide();
                this.SetActiveOff(this.options._menuIDs.scalebar);
            } else {
                $('#' + this.options._menuIDs.scalebar).show();
                this.SetActiveOn(this.options._menuIDs.scalebar);
                this.scalebarButtonHookup(this);
            }
        },

        toggleMeasurementsButtonControl: function ()
        {
            if((pxl.measurements != undefined ) && (!pxl.measurements.isAvailable()))
            {
                $('#' + this.options._menuIDs.measurements).hide();
            }
            else
            {
                $('#' + this.options._menuIDs.measurements).show();
            }
        },
        
        createRotationControl: function (pThis) {
            if (this.options.menuScale == "desktop") {
                        YUI().use('dial', function(Y) {
                        var dial = new Y.Dial({
                            min: -36000,
                            max: 36000,
                            stepsPerRevolution: 360,
                            value: 0,
                            strings: { label: 'Rotation', resetStr: 'Reset', tooltipHandle: 'Drag to rotate' },
                            after: {
                                    valueChange: function(e) {
                                    pThis.base.viewer.viewport.setRotation(e.newVal);
                                $('.yui3-dial-value-string').css("display", "none");
                                if ($('.yui3-dial-value-string2').length == 0) {
                                    $('.yui3-dial-value-string').parent().append("<span class='yui3-dial-value-string2'>");
                                    $('.yui3-dial-value-string2').click(function () { dial._resetDial();});
                                }
                                var rv = e.newVal;
                                if (e.newVal < 0) {
                                    rv = 360 - Math.abs(parseInt(e.newVal) % 360);
                                } else {
                                    rv = Math.abs(parseInt(e.newVal) % 360);
                                }
                                $('.yui3-dial-value-string2').text(rv);
                                    }
                                }
                        });


                    pThis.options.rotationControl.control = dial;
                        var div = document.createElement("div");
                        div.id = "rotateDial_" + (new Date).getTime();
                        div.className = "rotateDial";
                        $('body').append(div);
                        dial.render('#' + div.id);
                    if (pThis.options.showRotationControl && pThis.options.rotationControl.visible) {
                        $('.rotateDial').show();
                        pThis.base.menu.SetActiveOn(pThis.options._menuIDs.rotate);
                    } else {
                        $('.rotateDial').hide();
                        pThis.base.menu.SetActiveOff(pThis.options._menuIDs.rotate);
                    }

                    });
                }
        },
        destroyRotationControl: function(pThis) {
            $('.rotateDial').remove();
            pThis.options.rotationControl.control = null;
        },
        // This will destroy the rotation control and then add it again so that it is reset
        refreshRotationControl: function(pThis) {
            pThis.destroyRotationControl(pThis);
            pThis.createRotationControl(pThis);
        },
        toggleRotationControl: function () {
            if (this.options.showRotationControl && !this.options.rotationControl.visible ){
                $('.rotateDial').show();
                this.base.menu.SetActiveOn(this.options._menuIDs.rotate);
                this.options.rotationControl.visible = true;
            } else {
                $('.rotateDial').hide();
                this.base.menu.SetActiveOff(this.options._menuIDs.rotate);
                this.options.rotationControl.visible = false;
                }
            },
        canSeeZoomControl: function () {
                PxlViewer.util.Debug.log("menu.canSeeZoomControl");
                var mag = this.base.images[this.base.currentImage].info.mag;
                var ext = this.base.images[this.base.currentImage].info.ext;
                if (mag == "-1" || ext == "Jpeg") {
                    return false;
                }
                return true;
            },
        setScrollablemenuArea: function () {
            var pThis = this;
                PxlViewer.util.Debug.log("menu.setScrollablemenuArea");
                var offsetheight = PxlViewer.util.GetWindowSize();
            var browserspecificOffset = 0;
            // the offset for tablets differs depending on the tablet so this counters that
            if (this.options.menuScale != "desktop") {
                browserspecificOffset = 12;
                if ($('body').hasClass(PxlViewer.util.BROWSERS.SAFARI)) {
                    // safari needs an extra 20px for the overflow area not be hidden behind the close button
                    browserspecificOffset = 32;
                }
            }
            //AA added the 82 for the new static
            var heightOffetdiff = (parseInt(offsetheight[1]) - parseInt($('.nonscrollingmenusection')[0].offsetHeight)) -
                parseInt($('.nonscrollingmenusection2')[0].offsetHeight) - browserspecificOffset;
            $('.scrollablemenusection').css("height", heightOffetdiff + "px");
            var menuSectionOverflowTopSection = 'div.menuSectionOverflowTopSection';
            //$(menuSectionOverflowTopSection)
            //.css("top", $('.scrollablemenusection')[0].offsetTop)
            //.css("left", $('#viewerMenu')[0].offsetLeft);
            $('.scrollablemenusection').unbind('scroll').scroll(function () {
                //$(menuSectionOverflowTopSection).css("left", $('#viewerMenu')[0].offsetLeft);
                    if (!PxlViewer.Menu.AnimatingOverflow) {
                        PxlViewer.Menu.AnimatingOverflow = true;
                        if ($(this).scrollTop() > 10) {
                            $(menuSectionOverflowTopSection).show();
                            $(menuSectionOverflowTopSection).css({ opacity: 1 });
                            PxlViewer.Menu.AnimatingOverflow = false;
                        } else {
                            $(menuSectionOverflowTopSection).hide();
                            PxlViewer.Menu.AnimatingOverflow = false;
                        }
                    }
                    // hack for ipad to detect when the user stops scrolling past the top of the scrollable area
                $('.scrollablemenusection').unbind("touchend").on("touchend", function () {
                        if ($(this).scrollTop() <= 10) {
                            $(menuSectionOverflowTopSection).hide();
                            PxlViewer.Menu.AnimatingOverflow = false;
                        }
                        $('.scrollablemenusection').unbind("touchend");
                    });
                $('.scrollablemenusection').scroll(function () {
                    pThis._positionSlideOutPanel($('#' + pThis.options._menuIDs.screenshot), ".drawer");
                });
            });
            },

            /**
     * Updates the buttons which are present in the menu. Uses the specified image info object to determine
     * which magnification buttons should be shown.
     *
     * @function
     * @param {ImageInfo} info - The image info object as supplied by the image server.
     */
        update: function (info) {
                PxlViewer.util.Debug.log("menu.update");
                var mag = parseInt(info.mag);

                if (mag < 83) {
                    $('#mag83').css('visibility', 'hidden');
                } else {
                    $('#mag83').css('visibility', 'visible');
                }

            if (mag < 60) {
                $('#mag60').css('visibility', 'hidden');
            } else {
                $('#mag60').css('visibility', 'visible');
            }

                if (mag < 40) {
                    $('#mag40').css('visibility', 'hidden');
                } else {
                    $('#mag40').css('visibility', 'visible');
                }

                if (mag < 20) {
                    $('#mag20').css('visibility', 'hidden');
                } else {
                    $('#mag20').css('visibility', 'visible');
                }

                if (mag < 10) {
                    $('#mag10').css('visibility', 'hidden');
                } else {
                    $('#mag10').css('visibility', 'visible');
                }

                if (info.mag < 5) {
                    $('#mag5').css('visibility', 'hidden');
                } else {
                    $('#mag5').css('visibility', 'visible');
                }

                if (info.mag < 2.5) {
                    $('#mag2_5').css('visibility', 'hidden');
                } else {
                    $('#mag2_5').css('visibility', 'visible');
                }

                if (info.mag < 1) {
                    // Surely we should support at least this button.
                    // TODO: Error message?
                }

                //update the overview button
                $('#mag1 span').text("x" + parseFloat(this.base.viewer.viewport.viewportToImageZoom(this.base.viewer.viewport.getHomeZoom() * info.mag)).toFixed(1));

                if (info.stacks <= 1) {
                    // TODO: Removed for testing.
                    //$('#menuLayers').remove();
                }

                if (info.label != 1) {
                    $('#' + this.options._menuIDs.label).hide();
                } else {
                    if (this.options.showLabelLink) {
                        $('#' + this.options._menuIDs.label).show();
                        $('#' + this.options._menuIDs.label).removeClass("hidden");
                    }
                }

                if (this.base.regions.isRegionsAvailable(pxl)) {
                    var regionsCount = PxlViewer.Regions.getRegionsCount(pxl);
                    this.UpdateCount(this.options._menuIDs.regions, regionsCount);
                $('#' + this.options._menuIDs.regions).removeClass("hidden");

            }
            else {
                    $('#' + this.options._menuIDs.regions).hide();
                }

            this.base.ImageAdjustments.prepareImageAdjustments();
            $('#' + this.options._menuIDs.adjustments).show();

            if (PxlViewer.Carousel.isCarouselAvailable(this.base))
            { // if the carousel is available update the count .
                    this.UpdateCount(this.options._menuIDs.slides, this.base.images.length);
                }

                // Toggle the visibility of the zoom control drawer
            if (this.canSeeZoomControl())
            {
                $('#' + this.options._menuIDs.magnification + "DrawerContainer").show();
            }
            else
            {
                $('#' + this.options._menuIDs.magnification + "DrawerContainer").hide();
            }
            pxl.menu.toggleMeasurementsButtonControl();

                if (PxlViewer.ZStacks.isZStacksAvailable(this.base)) {
                    $('#' + this.options._menuIDs.zstacks).show();
                $('#' + this.options._menuIDs.zstacks).removeClass("hidden");
                this.base.zstacks.toggleZStacksPanel(this.base, true);
            }
            else {
                $('#' + this.options._menuIDs.zstacks).hide();
                    PxlViewer.ZStacks.destroySlider();
                }
                var elem = $('#view1')[0];
                //if (!elem.msRequestFullscreen && !elem.requestFullscreen && !elem.mozRequestFullScreen && !elem.webkitRequestFullscreen) {
                //    // Remove the fullscreen button if fullscreen is not supported.
                //    //$('#menuFullScreen').remove(); 23/10/14 - This line of code has been removed on the discovery that Ipad and Ipad mini do not support the fullscreen API . this code will always remove the fullscreen button for IOS devices.
                //}

                //aa add handleer to the update
                var pThis = this;
            this.base.viewer.addHandler("update-viewport", function (a) {
                    // Hide drawers, menus and panels.
                if (pxl.annotations != undefined && pxl.options.AnnotationUpdateMode) { pxl.annotations.viewerUpdateAnnotations(); }
                    if (pxl.viewer.viewport != null) {
                    var currZoom = pxl.GetZoom();
                        if (currZoom != null) {
                            //info,ag is the scanned mag returned from the imageserver
                            currZoom = currZoom * info.mag;
                            currZoom = pxl.viewer.viewport.viewportToImageZoom(currZoom);
                            //tofixed cuts the zoom to 1 decimal places and then the second parse flot removes the .0 if it ends in 0
                            currZoom = parseFloat(currZoom).toFixed(1);
                            currZoom = parseFloat(currZoom);
                            pxl.menu._updateMenuMagnification(currZoom);
                        }
                    }
                });
            },
        SetActiveOn: function (idOfElementToToggle) {
            PxlViewer.util.Debug.log("menu.SetActiveOn");
            $('#' + idOfElementToToggle).removeClass('menubadge');
            $('#' + idOfElementToToggle).addClass('menubadgeActive');
        },
        SetActiveOff: function (idOfElementToToggle) {
            PxlViewer.util.Debug.log("menu.SetActiveOff");
            $('#' + idOfElementToToggle).removeClass('menubadgeActive');
            $('#' + idOfElementToToggle).addClass('menubadge');
        },
        SetActiveOffAll: function () {
            PxlViewer.util.Debug.log("menu.SetActiveOffAll");
            var mThis = this;
            $('#viewerMenu > div > div').each(function () { mThis.SetActiveOff($(this).attr('id')); });
        },
        SetActiveOffAllPanelItems: function () {
            PxlViewer.util.Debug.log("menu.SetActiveOffAllPanelItems");
            var mThis = this;
            $(this.options._menuOptionsThatTriggerPanel).each(function () { mThis.SetActiveOff(this); });
        },
        ToggleActive: function (idOfElementToToggle) {
            PxlViewer.util.Debug.log("menu.ToggleActive");
            if ($('#' + idOfElementToToggle).hasClass('menubadge')) {
                this.SetActiveOn(idOfElementToToggle);
            } else {
                this.SetActiveOff(idOfElementToToggle);
            }
        },
        UpdateCount: function (idOfElementToUpdate, value) {
            PxlViewer.util.Debug.log("menu.UpdateCount");
            $('#' + idOfElementToUpdate + " .counterbadge, .annoHeaderCounter").text(value);

            if (value > 99)
            { // if the value of any element that has a counter on it is greater than 99 then we move it to the left to allow all of the contetn to appear .
                $('#' + idOfElementToUpdate + " .counterbadge").css("left", "35px");
            } else {

            }
        },
        _createlinkButton: function (id, cssClass, href, textContent) {
                return Mustache.render("<a id='{{id}}' class='imageLinkButton {{cssClass}}' href='{{{href}}}'>{{{textContent}}}</a>", { id: id, cssClass: cssClass, href: href, textContent: textContent });
            },
        _createButton: function (id, cssClass, contents, buttontitle, counter) {
                var titleholder = "";
                var counterholder = "";
            if (!PxlViewer.util.IsNullOrEmpty(buttontitle)) { titleholder = "<span class='buttonNameHolder'>" + buttontitle + "</span>"; }
            if (!PxlViewer.util.IsNullOrEmpty(counter)) { counterholder = "<div class='counterbadge'" + "id=" + id + 'counter' + ">" + counter + "</div>"; } // Added an ID to make it eaiser to access the counter .
                return Mustache.render("<div class='{{cssClass}}' id='{{id}}' title='{{buttontitle}}'><div class='backgroundholder'></div>{{{contents}}}{{{titleholder}}}{{{countersection}}}</div>", { id: id, cssClass: cssClass, contents: contents, titleholder: titleholder, buttontitle: buttontitle, countersection: counterholder });
            },
        _createDrawer: function (id, containerclass, btn, contents, buttontitle, counter) {
                var titleholder = "";
                var counterholder = "";
            if (!PxlViewer.util.IsNullOrEmpty(buttontitle)) { titleholder = "<span class='buttonNameHolder'>" + buttontitle + "</span>"; }
            if (!PxlViewer.util.IsNullOrEmpty(counter)) { counterholder = "<div class='counterbadge'>" + counter + "</div>"; }

                var tmpl = "\
                <div id='{{id}}Container' class='drawerContainer {{containerclass}}' title='{{buttontitle}}'> \
                    {{{btn}}} \
                    <div style='display: none;' class='drawer' id='{{id}}'> \
                      {{{contents}}} \
                    </div> \
                    <div class='backgroundholder'></div>{{{titleholder}}}{{{countersection}}}\
                </div>";
            return Mustache.render(tmpl, { id: id + this.options._menuIDs.drawerAppender, containerclass: containerclass, btn: btn, contents: contents, titleholder: titleholder, buttontitle: buttontitle, countersection: counterholder });
            },
        _createMenu: function (id, containerclass, btn, contents, buttontitle, counter) {
                var titleholder = "";
                var counterholder = "";
            if (!PxlViewer.util.IsNullOrEmpty(buttontitle)) { titleholder = "<span class='buttonNameHolder'>" + buttontitle + "</span>"; }
            if (!PxlViewer.util.IsNullOrEmpty(counter)) { counterholder = "<div class='counterbadge'>" + counter + "</div>"; }

                var tmpl = "\
                <div id='{{id}}' class='menuContainer {{containerclass}}' title='{{buttontitle}}'> \
                    {{{btn}}} \
                    <div style='display: none;' class='menu'> \
                      {{{contents}}} \
                    </div> \
                    <div class='backgroundholder'></div>{{{titleholder}}}{{{countersection}}}\
                </div>";
                return Mustache.render(tmpl, { id: id, containerclass: containerclass, btn: btn, contents: contents, titleholder: titleholder, buttontitle: buttontitle, countersection: counterholder });
            },
        _createViewRow: function (id, text) {
                var tmpl = "\
                <div class='viewRow'> \
                    <div class='viewIcon' id='{{id}}'> \
                    </div> \
                    <div class='favIcon'></div> \
                    <input type='checkbox' class='viewCheckbox' id='{{id}}_chkBox'> \
                    <label class='checkboxLabel checkboxImage' for='{{id}}_chkBox' id='{{id}}_lbl'>{{text}}</label> \
                </div>";
                return Mustache.render(tmpl, { id: id, text: text });
            },
        _createPanel: function (id, btn, contents) {
                var tmpl = "\
                <div class='panelContainer'> \
                    {{{btn}}} \
                    <div style='display: none;' class='panel' id='{{id}}'> \
                      {{{contents}}} \
                    </div> \
                </div>";
                return Mustache.render(tmpl, { id: id, btn: btn, contents: contents });
            },
        _createBottomPadder: function () {
                return "<div class='panelBottomPadder'></div>";
            },
        hideAllSlideoutPanels: function () {
                PxlViewer.util.Debug.log("menu.hideAllSlideoutPanels");
                var pThis = this;
                if (!PxlViewer.Menu.hidingMenuAction && $('.drawer,.menu,.panel').is(':visible')) {
                    PxlViewer.Menu.hidingMenuAction = true;
                    this.SetScaleParameters();
                $('.drawerBtn,.menuBtn,.panelBtn').each(function () {
                        var btn = this;
                        var drawerid = $(btn).attr("id") + pThis.options._menuIDs.drawerAppender;
                        var drawer = $('#' + drawerid);
                        $(drawer).css({ "opacity": "0" });
                        $(drawer).hide();
                        PxlViewer.Menu.hidingMenuAction = false;

                        $(drawer).removeClass("active");
                        $(btn).removeClass("active");
                        pThis.base.menu.SetActiveOff(drawerid + "Container");
                    });
                }
            },
        positionAllSlideOutPanels: function () {
                PxlViewer.util.Debug.log("menu.positionAllSlideOutPanels");
                var pThis = this;
            $('.drawerBtn').each(function () { pThis._positionSlideOutPanel(this, ".drawer"); });
            $('.menuBtn').each(function () { pThis._positionSlideOutPanel(this, ".menu"); });
            $('.panelBtn').each(function () { pThis._positionSlideOutPanel(this, ".panel"); });
            },
        _positionSlideOutPanel: function (btn, selector) {
                var drawerid = $(btn).attr("id") + this.options._menuIDs.drawerAppender;
                var drawer = $('#' + drawerid);
                if ($(btn).parent().children(selector).length > 0) {
                    // the children are still associated with the menu so move them
                    $(drawer).appendTo("#container");
                }
                var totalOffsetWidth = parseFloat($(drawer).css("padding-left")) + parseFloat($(drawer).css("padding-right"));
                $(drawer).children("div").each(function () {
                        if ($(this).css("visibility") != "hidden") {
                        var widthaddition = parseInt($(this).css("width")) + parseFloat($(this).css("margin-left")) + parseFloat($(this).css("margin-right")) + 1;
                            totalOffsetWidth += widthaddition;
                        }
                    });
                if ($(btn).attr("id") == this.options._menuIDs.screenshot) {
                    $(drawer).css({
                        top: $(btn)[0].offsetTop +
                            $(btn).parent()[0].offsetTop + $(btn).parent().parent()[0].offsetTop +
                            ((parseFloat($(btn)[0].offsetHeight) / 2) + 10) - ($(btn).parent().parent()[0].scrollTop) + "px"
                    });
                } else {
                    var divisor = 2;
                    var popoutnudge = -5;
                    if (this.options.menuScale == "desktop") {
                        // on the desktop styles it needs to be pushed down more so increase the divisor used in the next calculation
                        divisor = 4;
                        popoutnudge = 0;
                    }
                    $(drawer).css({
                        top: $(btn)[0].offsetTop +
                            $(btn).parent()[0].offsetTop +
                            ((parseFloat($(btn)[0].offsetHeight) / 2) - ((parseFloat($(drawer).css("height")) / divisor))) + popoutnudge + "px"
                    });
                }
                $(drawer).css({
                    left: parseFloat($("#viewerMenu")[0].offsetLeft) + parseFloat(this.options.positions.menuWidth) + 6 + "px",
                    width: totalOffsetWidth + "px"
                });
        },
        _slideOut: function (btnID, selector, fullWidth) {
                PxlViewer.util.Debug.log("menu._slideOut");
            PxlViewer.util.Debug.log("btnID: " + btnID + "\nselector: " + selector + "\nfullWidth: " + fullWidth);
                // this function preforms the fade in-out animation that displays and hides the drawer used in the viewer.
                var drawerid = btnID + this.options._menuIDs.drawerAppender;
                var drawer = $('#' + drawerid);
                this._positionSlideOutPanel($('#' + btnID), selector);

                if ($(drawer).hasClass("active")) { // if menu item's drawer is open ( has the class 'active' assigned to it) we should fade it out
                    $(drawer).css({ "opacity": "0" });
                    $(drawer).hide();
                    $(drawer).removeClass("active");
                    $('#' + btnID).removeClass("active");
                    this.base.menu.SetActiveOff(drawerid + "Container");
            }
            else {
                    $(drawer).show();
                    $('#' + btnID).css("position", "absolute"); // set the position to absolute . this is needed as the drawer seems to jump down the page if set to relative .

                    $(drawer).animate({ "opacity": "1" });
                    $(drawer).show();
                    $(drawer).addClass("active"); // add active class . needed so that we knw when to display / hide the drawer
                    $('#' + btnID).addClass("active");
                    this.base.menu.SetActiveOn(drawerid + "Container");
                }
            },
        _calculateDrawerWidth: function (drawerBtnID) {
                PxlViewer.util.Debug.log("menu._calculateDrawerWidth");
                var wasShown = $('#' + drawerBtnID).parent().children(".drawer").is(':visible');
                $('#' + drawerBtnID).parent().children(".drawer").show(); // We need to show it here, otherwise clientWidth is 0.

                var firstDrawerBtn = $("#" + $('#' + drawerBtnID).attr("id") + this.options._menuIDs.drawerAppender + ">div").first();
                var drawerBtnWidth = firstDrawerBtn[0].clientWidth + parseFloat(firstDrawerBtn.css("marginLeft")) + parseFloat(firstDrawerBtn.css("marginRight"));

                var btnCount = $("#" + $('#' + drawerBtnID).attr("id") + this.options._menuIDs.drawerAppender + ">div").length;
                var fullDrawerWidth = (drawerBtnWidth * btnCount);
                if (!wasShown) {
                    $("#" + $('#' + drawerBtnID).attr("id") + this.options._menuIDs.drawerAppender).hide();
                }
                $('#' + drawerBtnID).parent().children(".drawer").css("width", (fullDrawerWidth + fullDrawerWidth * 0.05)); // this code calculates the minimum width in pixels needed to display all elements of the drawer . I have also added a small buffer of 5% as without it some elments do not appear in the drawer on firefox.

                return fullDrawerWidth;
            },
        _calculateMenuWidth: function (menuBtn) {
                PxlViewer.util.Debug.log("menu._calculateMenuWidth");
                if (menuBtn.length == 0) {
                    return 0;
                }
                $(menuBtn).parent().children(".menu").show();
                var result = $(menuBtn).parent().children(".menu")[0].clientWidth;
                $(menuBtn).parent().children(".menu").css("left", "0");
                $(menuBtn).parent().children(".menu").css("width", "900px"); // Get rid of wrapping of text.
                $(menuBtn).parent().children(".menu").hide();
                return result;
            },
        _calculatePanelWidth: function (menuBtn) {
                PxlViewer.util.Debug.log("menu._calculatePanelWidth");
                if (menuBtn.length == 0) {
                    return 0;
                }
                $(menuBtn).parent().children(".panel").show();
                var result = $(menuBtn).parent().children(".panel")[0].clientWidth;
                $(menuBtn).parent().children(".panel").css("right", "-310px");
                $(menuBtn).parent().children(".panel").hide();
                return result - 40;
            },
        _expandPanel: function () {
                PxlViewer.util.Debug.log("menu._expandPanel");
            this.SetScaleParameters();
            var leftPosition = parseInt(this.options.positions.expandedWidth) - parseInt(this.options.positions.menuWidth);
                $('#leftPanel > div').hide();
            $("#viewerHolder").css({ "margin-left": this.options.positions.expandedWidth, width: $('#viewerHolder').width() - leftPosition + "px" });
            $("#leftMenuHolder").css({ width: this.options.positions.expandedWidth });
                $('#leftPanel > div').show();
                $('#leftPanel').show();
                $("#leftMenuHolder").addClass("menuexpanded");
                this._resizeControls();
                $('#ImageServerErrorOccured').css({ "margin-left": "175px" });
            $('.scrollablemenusection div.menuSectionOverflowTopSection').css({ left: leftPosition + "px" });
            },
        _shrinkPanel: function () {
                PxlViewer.util.Debug.log("menu._shrinkPanel");
                var pThis = this;
            pThis.SetScaleParameters(); // set the scale parameters for the close action
            if (pThis.base.annotations != undefined) {pThis.base.annotations.currentSelectedAnnotation = null;}

                $("#viewerHolder").css("margin-left", this.options.positions.menuWidth);
                $("#viewerHolder").width("calc(100% - " + this.options.positions.menuWidth + ")");
                $('#ImageServerErrorOccured').css("margin-left", "");
                $("#leftMenuHolder").css({ width: this.options.positions.menuWidth });
                $("#leftMenuHolder").removeClass("menuexpanded");
                $('.scrollablemenusection div.menuSectionOverflowTopSection').css({ left: "0" });
                this._resizeControls();
                $('#leftPanel').hide();
                this.SetActiveOffAllPanelItems();
            },
        setViewerWidth: function () {
                PxlViewer.util.Debug.log("menu.setViewerWidth");
            $("#viewerHolder").width(this.getViewerWidth() + "px");
            },
        _resizeControls: function () {
                PxlViewer.util.Debug.log("menu._resizeControls");
            if (pxl.SlideName == undefined) { pxl.SlideName = new PxlViewer.SlideName(pxl.options.SlideName, pxl); }
            if (pxl.SlideLabel == undefined) { pxl.SlideLabel = new PxlViewer.SlideLabel(pxl.options.SlideLabel, pxl); }
            if (pxl.AuthorName == undefined) { pxl.AuthorName = new PxlViewer.AuthorName(pxl.options.AuthorName, pxl); }
                pxl.SlideName.resize();
                pxl.SlideLabel.resize();
            if (pxl.AuthorName != undefined) { pxl.AuthorName.resize(); }
            },
        _togglePanel: function () {
                PxlViewer.util.Debug.log("menu._togglePanel");
                var pThis = this;
                if ($("#leftMenuHolder").hasClass('menuexpanded')) {
                    pThis._shrinkPanel();
                } else {
                    pThis._expandPanel();
                }
            },
        createPanelHeaderControl: function (id, text, event, cssClass) {
                var tmpl = "\
                <div class='panelHeaderControl' id='{{id}}' > \
                      <div class='{{cssClass}}' onclick='{{event}}'> {{{text}}} </div>   \
                </div>";
                return Mustache.render(tmpl, { id: id, text: text, event: event, cssClass: cssClass });
        },
        toggleFullscreen: function () {
                PxlViewer.util.Debug.log("menu.toggleFullscreen");
                var pThis = this;
                if (pThis.base.isFullScreen)
                {
                    return pThis.disableFullscreen(pThis);
                }
                return pThis.enableFullscreen(pThis);
        },
        enableFullscreen: function (pThis) {
            PxlViewer.util.Debug.log("menu.enableFullscreen");
            pxl.SlideLabel.hide();
            pxl.AuthorName.hide();
            pxl.SlideName.hide();
            $("#container").css({height:""});
            PxlViewer.util.launchIntoFullscreen(document.documentElement);
            $("#leftMenuHolder").removeClass("menuexpanded");
            $('#leftPanel,#pathXLMenuHomeLink,#' + pThis.options._menuIDs.magnification + "DrawerContainer").hide();
            pThis.SetActiveOffAllPanelItems();
            pThis.base.isFullScreen = true;
            $('#menuFullScreen').addClass("isFullScreen");
            $('.scrollablemenusection').hide();

            $('.nonscrollingmenusection2').hide();
            $('.menuSectionOverflowBottomSection').hide();

            var iconwidth = 49; var iconheight = 49;var rangeholderTop = 60;
            if (this.options.menuScale == "desktop") {
                iconwidth = 45;
                iconheight = 43;
                rangeholderTop = 55;
            }

            $('#leftMenuHolder').css({ "height": "110px", width: this.options.positions.menuWidth, background: "transparent" });

            $('#' + pThis.options._menuIDs.fullscreen).css({
                "background": "rgba(204, 204, 204, 0.5)",
                "box-shadow": "none",
                height: iconheight + "px",
                width: iconwidth + "px",
                "border": "thin solid rgba(204, 204, 204, 0.9)",
                "z-index": 50
            });

            $('#' + pThis.options._menuIDs.fullscreen + "> .buttonNameHolder").hide();
            // move the z-stacks control down so it does not cover the fullscreen button
            $('#container .rangeHolder').css({
                top: rangeholderTop + "px",
                left: 4 + "px",
                "background-color": "rgba(204, 204, 204, 0.45)"
            });

            $('#viewerMenu').css({ background: "transparent", border: "none" });
            if (pThis.base.annotations != undefined) { pThis.base.annotations.destroy(); }
            $("#viewerHolder").css({ "margin-left": "0px", width: PxlViewer.util.GetWindowSize()[0]});
            if (this.options.menuScale == "desktop") {
                // this fixes an issue with chrome that when you go to fullscreen the slide does not expand
                // to the height of the screen only the height of the body tag. This is due to the use of
                // client height instead of screen.height. but his fix does not work on chrome tablets
                // so this check limits this to only the desktop
                $("#viewerHolder").css({ height: Math.max(PxlViewer.util.GetWindowSize()[1], screen.height || 0) });
            }
            if (pThis.base.annotations != undefined) { pThis.base.annotations._loadAnnotation(pThis.base.annotations.currentSelectedAnnotation, false); }

            // when the escape key is hit this will disable fullscreen and make the menu re-appear
            PxlViewer.util.loadFullscreenCheckEvents(null, function () { pxl.menu.disableFullscreen(); });
        },
        disableFullscreen: function (calledonce) {
            PxlViewer.util.Debug.log("menu.disableFullscreen");
            pxl.SlideLabel.show(); // show the slide label again if you have permission and it was already enabled
            pxl.AuthorName.show(); // show the author label again if you have permission
            pxl.SlideName.show();  // show the slide name again if you have permission
            PxlViewer.util.exitFullscreen(); // exit the proper fullscreen
            pxl.menu.base.isFullScreen = false;
            $('#menuFullScreen').removeClass("isFullScreen");
            $('.scrollablemenusection,#pathXLMenuHomeLink').show();
            if (this.canSeeZoomControl())
            {
                $('#' + pxl.menu.options._menuIDs.magnification + "DrawerContainer").show();
            }

            pxl.menu.toggleMeasurementsButtonControl();

            // return the z-stacks control to its original position
            $('#container .rangeHolder').css({
                top: "",
                left: "",
                "background-color": ""
            });
            pxl.menu.SetScaleParameters();
            $('.nonscrollingmenusection2').show();
            $('.menuSectionOverflowBottomSection').show();
            $('#leftMenuHolder').css({ "height": "", background: "", opactiy: "" });
            $('#' + pxl.menu.options._menuIDs.fullscreen).css({ "background": "rgba(204, 204, 204, 1)", "box-shadow": "", height: "", width: "", "border": "" });
            $('#' + pxl.menu.options._menuIDs.fullscreen + "> .buttonNameHolder").show().css({display:""});
            $('#viewerMenu').css({ background: "", border: "" });
            $("#viewerHolder").css({ "margin-left": pxl.menu.options.positions.menuWidth, height: "" });
            $("#viewerHolder").width("calc(100% - " + pxl.menu.options.positions.menuWidth + ")");
            if (pxl.menu.base.annotations != null) {
                pxl.menu.base.annotations.currentSelectedAnnotation = null;
                pxl.menu.base.annotations.destroy();
            }

            if (this.options.menuScale == "desktop" && $('.browserclass_safari').length > 0) {
                var offsetheight = PxlViewer.util.GetWindowSize();
                $("#container").css({ height: offsetheight[1] });
                if (typeof calledonce == "undefined") {
                    setTimeout(function () { pxl.menu.disableFullscreen(true); },300);
                }
            }
        },
        _hookupEvents: function ()
        {
            PxlViewer.util.Debug.log("menu._hookupEvents");
            var pThis = this;
            $('#' + pThis.options._menuIDs.fullscreen).mouseup(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.menu.toggleFullscreen();";
                if ((pThis.base.annotations != undefined) && (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode))
                {
                    var activeAnnoID;
                    if ($(".measurementPanel").length)
                    {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else
                    {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                        pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                } else {
                    if (pThis.base.annotations != undefined && pThis.base.annotations.isEditMode) {
                        var activeAnnoID = $('.activeAnnotation').attr('annoid');
                        var onDeclineDialog = "";
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, onDeclineDialog);
                    } else {
                        pThis.toggleFullscreen();
                    }
                }
            });
            var panelWidth = pThis._calculatePanelWidth($('.panelBtn'));
            $('.panelBtn').mouseup(function () {
                    pThis._slideOut(this, ".panel", panelWidth, true);
                });

            $('.setMag').mouseup(function () {
                var drawerID = pThis.base.menu.options._menuIDs.magnification;
                var magOptionID = $(this).attr("id");

                if (pThis.base.annotations != undefined && pThis.base.annotations.isEditMode)
                {
                    var activeAnnoID = $('.activeAnnotation').attr('annoid');
                    var onAcceptDialog = "pxl.menu.setMagnification(\"" + magOptionID + "\");";
                    var onDeclineDialog = "pxl.menu._slideOut(\"" + drawerID + "\", \".drawer\", pxl.menu._calculateDrawerWidth(\"" + drawerID + "\"));";
                    pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, onDeclineDialog);
                }
                else
                {
                    pThis.base.menu.setMagnification(magOptionID);
                }
            });

            $('#' + pThis.options._menuIDs.screenshot + pThis.options._menuIDs.drawerAppender + "Container").mouseup(function () {
                pxl.menu.hideAllSlideoutPanels();
                pThis._slideOut(pThis.options._menuIDs.screenshot , ".drawer", pThis._calculateDrawerWidth(pThis.options._menuIDs.screenshot));
            });

            $('#' + pThis.options._menuIDs.screenshot + pThis.options._menuIDs.drawerAppender + " > .takeScreenshot").mouseup(function () {
                // take screenshot
                pxl.Screenshot.makeScreenshot();
            });

            $('#' + pThis.options._menuIDs.screenshot + pThis.options._menuIDs.drawerAppender + " > .drawScreenshot").mouseup(function () {
                // draw screenshot
                pxl.Screenshot.drawScreenshot();
            });

            // Toggle Rotate
            $('#' + pThis.options._menuIDs.rotate).mouseup(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.menu.toggleRotationControl();";
                if ((pThis.base.annotations != undefined)&&(!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode)){
                    var activeAnnoID;
                    if ($(".measurementPanel").length) {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else  if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else {
                    pxl.menu.toggleRotationControl();
                }
            });

            $('#menuTools').mouseup(function () {
                pThis.base.annotations.toggleDrawingMode();
            });

            // Toggle Annotations
            $('#' + pThis.options._menuIDs.annotation).mouseup(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.annotations.loadAnnotationsPanel( PxlViewer.Annotations.hasWebServiceBeenCalled);";
                               if (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode) {
                    var activeAnnoID;
                    if ($(".measurementPanel").length) {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else {
                    pThis.base.annotations.loadAnnotationsPanel(PxlViewer.Annotations.hasWebServiceBeenCalled);
                }
            });

            // Toggle Measurements
            $('#' + pThis.options._menuIDs.measurements).mouseup(function ()
            {
                    var onAcceptDialog = "pxl.measurements.togglePanel();";
                                   if (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode) {
                        var activeAnnoID;
                        if ($(".measurementPanel").length)
                        {
                            activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                            pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                        }
                        else
                        {
                            activeAnnoID = $('.activeAnnotation').attr('annoid');
                            pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                        }
                    }
                    else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                    {
                        pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                    }
                    else
                    {
                        pxl.menu.hideAllSlideoutPanels();
                        pThis.base.measurements.togglePanel();
                    }
            });

            // Toggle Magnification
            $('#' + pThis.options._menuIDs.magnification).mouseup(function ()
            {
                var drawerID = $(this).attr("id");
                var onAcceptDialog = "pxl.menu._slideOut(\"" + drawerID + "\", \".drawer\", pxl.menu._calculateDrawerWidth(\"" + drawerID + "\"));";
                if((pThis.base.annotations != undefined)&&  (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode)) {
                    var activeAnnoID;
                    if ($(".measurementPanel").length)
                    {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else
                    {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else
                {
                    pxl.menu.hideAllSlideoutPanels();
                    pThis._slideOut(drawerID, ".drawer", pThis._calculateDrawerWidth(drawerID));
                }
            });

            $('#panelExpand').mouseup(function ()
            {
                pThis._expandPanel();
            });

            $('#panelShrink').mouseup(function ()
            {
                pThis._shrinkPanel();
            });
            $('#viewerDebug').mouseup(function () {
                pxl.menu.ShowDebugMessage();
            });
            // Toggle Slides
            $('#' + pThis.options._menuIDs.slides).mouseup(function () {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.carousel.toggleCarouselPanel(pxl);";
                               if (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode)
                {
                    var activeAnnoID;
                    if ($(".measurementPanel").length)
                    {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else
                {
                    pThis.base.carousel.toggleCarouselPanel(pThis.base);
                }
            });

            $('#' + pThis.options._menuIDs.label).mouseup(function () {
                pxl.menu.hideAllSlideoutPanels();
                pxl.SlideLabel.toggleVisibility();
            });

            $('#' + pThis.options._menuIDs.close).mouseup(function () {
                pxl.menu.hideAllSlideoutPanels();
                window.open('', '_self').close();
            });

            // Toggle Thumbnail
            $('#' + pThis.options._menuIDs.thumbnail).mouseup(function () {
                pxl.menu.hideAllSlideoutPanels();
                var changeMade = false;

                if ($(".navigator").hasClass("vis") && changeMade == false) // if the navigatior is visible , we want to hide it .
                {

                    $(".navigator").css("visibility", "hidden");
                    $(".navigator").addClass("hid");
                    $(".navigator").removeClass("vis");
                    pThis.SetActiveOff(pThis.options._menuIDs.thumbnail);
                    changeMade = true;
                }
                if ($(".navigator").hasClass("hid") && changeMade == false) {
                    $(".navigator").css("visibility", "visible");
                    $(".navigator").addClass("vis");
                    $(".navigator").removeClass("hid");
                    pThis.SetActiveOn(pThis.options._menuIDs.thumbnail);
                    } else // this else is needed for the instance where the page has been first loaded . This can be removed when i find the initalizer for the navigator .
                {
                    $(".navigator").css("visibility", "hidden");
                    $(".navigator").addClass("hid");
                    $(".navigator").removeClass("vis");
                    pThis.SetActiveOff(pThis.options._menuIDs.thumbnail);
                }
            });

            // Toggle Regions
            $('#' + pThis.options._menuIDs.regions).mouseup(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.regions.toggleRegionsPanel(pxl);";
                               if (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode) {
                    var activeAnnoID;
                    if ($(".measurementPanel").length) {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else
                {
                    pThis.base.regions.toggleRegionsPanel(pThis.base);
                }
            });

            $('#' + pThis.options._menuIDs.zstacks).mouseup(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.zstacks.toggleZStacksPanel(pxl, false);";
                if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else
                {
                pThis.base.zstacks.toggleZStacksPanel(pThis.base, false);
            }
            });

            // Toggle Info
            $('#' + pThis.options._menuIDs.info).mouseup(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "pxl.slideInfo.toggleSlideInfoPanel(pxl);";
                if ((pThis.base.annotations != undefined) && (!pxl.internalProperties.panning.enabled || pThis.base.annotations.isEditMode))
                {
                    var activeAnnoID;
                    if ($(".measurementPanel").length) {
                        activeAnnoID = pxl.measurements.internalProperties.activeMeasurementID;
                        pThis.base.measurements.instigateDiscardMeasurementsChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                    else {
                        activeAnnoID = $('.activeAnnotation').attr('annoid');
                        pThis.base.annotations.instigateDiscardAnnotationChangesDialog(onAcceptDialog, activeAnnoID, "");
                    }
                }
                else if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else
                {
                    pThis.base.slideInfo.toggleSlideInfoPanel(pThis.base);
                }
            });

            // Toggle Adjustments
            $('#' + pThis.options._menuIDs.adjustments).mousedown(function ()
            {
                pxl.menu.hideAllSlideoutPanels();
                var onAcceptDialog = "";
                if (pThis.base.ImageAdjustments.isAdjustmentsMode)
                {
                    pThis.base.ImageAdjustments.instigateDiscardAdjustmentsChangesDialog(onAcceptDialog);
                }
                else
                {
                    if ($("#leftMenuHolder").hasClass('menuexpanded'))
                    {
                        pThis.base.menu.SetScaleParameters();
                        pThis.base.menu._shrinkPanel();
                        pThis.base.annotations.destroy();
                        var imageAdjustmentsInterval = setInterval(function ()
                        {
                            if (!$("#leftMenuHolder").hasClass('menuexpanded'))
                            {
                                clearInterval(imageAdjustmentsInterval);
                                pThis.base.ImageAdjustments.toggleImageAdjustmentsPanel();
                            }
                        }, 500);
                    }
                    else
                    {
                        pThis.base.ImageAdjustments.toggleImageAdjustmentsPanel();
                    }
                }
            });
        },
        // this sets up the scalebar button events
        scalebarButtonHookup: function (pThis) {
            $(document).off('click', '#' + pThis.options._menuIDs.scalebar).on('click', '#' + pThis.options._menuIDs.scalebar, function () {
                pxl.menu.hideAllSlideoutPanels();
                if (pThis.base.viewer.scalebarInstance.location == OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT) {
                    pThis.base.viewer.scalebar({ location: OpenSeadragon.ScalebarLocation.NONE });
                    pThis.SetActiveOff(pThis.options._menuIDs.scalebar);
                }
                else {
                    pThis.base.viewer.scalebar({ location: OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT });
                    pThis.SetActiveOn(pThis.options._menuIDs.scalebar);
                }
            });
        },
        setMagnification: function (magOptionID) {
            PxlViewer.util.Debug.log("menu.setMagnification");
            var center = this.base.viewer.viewport.getCenter(false);
            var currMag = this.base.images[this.base.currentImage].info.mag;
            var magTxt = "";
            PxlViewer.Menu.AllowClosingofMag = false; // stop the mag list closing automatically when the viewer zooms

            switch ($('#' + magOptionID).get(0).id) {
                case "mag1":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.getHomeZoom(), center, false);
                    magTxt = "x" + parseFloat(parseFloat(this.base.viewer.viewport.getHomeZoom()).toFixed(1));
                    break;
                case "mag2_5":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(2.5 / currMag), center, false);
                    magTxt = "x2.5";
                    break;
                case "mag5":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(5 / currMag), center, false);
                    magTxt = "x5";
                    break;
                case "mag10":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(10 / currMag), center, false);
                    magTxt = "x10";
                    break;
                case "mag20":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(20 / currMag), center, false);
                    magTxt = "x20";
                    break;
                case "mag40":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(40 / currMag), center, false);
                    magTxt = "x40";
                    break;
                case "mag60":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(60 / currMag), center, false);
                    magTxt = "x60";
                    break;
                case "mag83":
                    this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(100 / currMag), center, false);
                    magTxt = "x100";
                    break;
            }

            $('#' + magOptionID).parent().parent().children(".drawerBtn").attr("class", "drawerBtn " + $('#' + magOptionID).get(0).id);

            $('#' + this.options._menuIDs.magnification + this.options._menuIDs.drawerAppender + "Container > .buttonNameHolder").text(magTxt);
            $('#' + this.base.internalProperties.bindKeyboardNavigarionArea).focus();
            // $(this).parent().parent().find(".drawerBtn .currentMag").text(magTxt);
        },
        _updateMenuMagnification: function (currZoom) {
            PxlViewer.util.Debug.log("menu._updateMenuMagnification");
            if (!isNaN(currZoom)) {
                var drawerContainerID = this.base.menu.options._menuIDs.magnification + this.base.menu.options._menuIDs.drawerAppender + "Container";

                $('#' + drawerContainerID + " > .buttonNameHolder").text("x" + currZoom);
                $("#" + drawerContainerID).removeClass("mag1").removeClass("mag2_5").removeClass("mag5").removeClass("mag10").removeClass("mag20").removeClass("mag40").removeClass("mag60").removeClass("mag83").removeClass("magovermax");
                // do not throw error because the info in undefined
                if (typeof this.base.images[this.base.currentImage].info != "undefined") {
                    if (currZoom > this.base.images[this.base.currentImage].info.mag) {
                        $("#" + drawerContainerID).addClass("magovermax");
                    } else if (currZoom < 2.5) {
                        $("#" + drawerContainerID).addClass("mag1");
                    } else if (currZoom < 5) {
                        $("#" + drawerContainerID).addClass("mag2_5");
                    } else if (currZoom < 10) {
                        $("#" + drawerContainerID).addClass("mag5");
                    } else if (currZoom < 20) {
                        $("#" + drawerContainerID).addClass("mag10");
                    } else if (currZoom < 40) {
                        $("#" + drawerContainerID).addClass("mag20");
                    } else if (currZoom < 60) {
                        $("#" + drawerContainerID).addClass("mag40");
                    } else if (currZoom >= 60 && currZoom < 83) {
                        $("#" + drawerContainerID).addClass("mag60");
                    } else {
                        $("#" + drawerContainerID).addClass("mag83");
                    }
                }
            }
        },
        SetScaleParameters: function () {
            PxlViewer.util.Debug.log("menu.SetScaleParameters");
            switch (this.options.menuScale) {
                case "custom":
                    break;
                case "small":
                    $.extend(this.options.positions, {
                        menuWidth: 68 + "px"
                    });
                    break;
                case "desktop":
                    $.extend(this.options.positions, {
                        expandedWidth: 318 + "px",
                        menuWidth: 72 + "px"
                    });
                    if (this.base.annotations != undefined) {
                        this.base.annotations.options.cornerSize = 20;
                    }
                    break;
                case "normal":
                default:
                    $.extend(this.options.positions, {
                        menuWidth: 82 + "px"
                    });
            }
        },
        ScaleMenu: function() {
            PxlViewer.util.Debug.log("menu.ScaleMenu");
            var mThis = this;
            mThis.SetScaleParameters();
            $("body,#viewerMenu,#container").removeClass(this.options.menuScale).addClass(this.options.menuScale);

            $("#viewerMenu,#leftMenuHolder").css("width", this.options.positions.menuWidth);
            mThis._shrinkPanel();
        },
        HideButtonsOnError: function () {
            PxlViewer.util.Debug.log("menu.HideButtonsOnError");
            for (i in this.options.buttonsToHideOnError) {
                buttonToBeRemoved = this.options.buttonsToHideOnError[i];
                $('#' + buttonToBeRemoved).hide();
            }
        },
        ShowButtonsWhenErrorResolved: function () {
            PxlViewer.util.Debug.log("menu.ShowButtonsWhenErrorResolved");
            if (PxlViewer.errorOccured) {
                this.HideButtonsOnError();
            } else {
                for (i in this.options.buttonsToHideOnError) {
                    buttonToBeRemoved = this.options.buttonsToHideOnError[i];
                    $('#' + buttonToBeRemoved).show();
                }
            }
        },
        // get Attributes
        getViewerSize: function () {
            PxlViewer.util.Debug.log("menu.getViewerSize");
            return [this.getViewerWidth(), this.getViewerHeight()];
        },
        getViewerHeight: function () {
            PxlViewer.util.Debug.log("menu.getViewerHeight");
            return parseFloat($("#viewerHolder")[0].offsetHeight);
        },
        getViewerWidth: function () {
            PxlViewer.util.Debug.log("menu.getViewerWidth");
            var offsetwidth = PxlViewer.util.GetWindowSize()[0];
            if (this.base.isFullScreen) {
                return parseFloat(offsetwidth);
            } else {
                return (parseFloat(offsetwidth) - $('#leftMenuHolder')[0].offsetWidth);
            }
        },
        // START Debug methods to produce the debug message
        ShowDebugMessage: function () {
            var realCenter = this.base.GetRealCentre();
            // default debug information
            PxlViewer.util.options.additionalDebugInformation.unshift(["TrueZoom", this.base.GetTrueZoom()]);
            PxlViewer.util.options.additionalDebugInformation.unshift(["Zoom", this.base.GetZoom()]);
            PxlViewer.util.options.additionalDebugInformation.unshift(["RealCentreY", realCenter.y]);
            PxlViewer.util.options.additionalDebugInformation.unshift(["RealCentreX", realCenter.x]);
            PxlViewer.util.options.additionalDebugInformation.unshift(["Browser Type", $("body").attr("class").split(" ")[1]]);
            PxlViewer.util.options.additionalDebugInformation.unshift(["menuclass", $("#viewerMenu").attr("class")]);

            var debugInformation = "";
            var debuglen = PxlViewer.util.options.additionalDebugInformation.length;
            for (var i = 0; i < debuglen; i++) {
                debugInformation += "<div><label>" + PxlViewer.util.options.additionalDebugInformation[i][0] + ":</label> " + PxlViewer.util.options.additionalDebugInformation[i][1] + "</div>";
            }
            PxlViewer.util.Debug.DisplayAlertMessage(debugInformation, "Debug");
        },
        // END Debug message
        // reset and destroy
        Reset: function () {
            PxlViewer.util.Debug.log("menu.Reset");
            PxlViewer.Menu.isNewMenu = false;
            PxlViewer.Menu.hidingMenuAction = false;
            PxlViewer.Menu.AnimatingOverflow = false;
            PxlViewer.Menu.AllowClosingofMag = true;
            $('#' + this.options._menuIDs.fullscreen).off("click");
            $('.drawerBtn').off("click");
            $('.menuBtn').off("click");
            $('.panelBtn').off("click");
            $('.setMag').off("click");
            $('.rotateBtn').off("click");
            $('#menuTools').off("click");
            $('#' + this.options._menuIDs.annotation).off("click");
            $('#' + this.options._menuIDs.measurements).off("click");
            $('#panelExpand').off("click");
            $('#panelShrink').off("click");
            $('#' + this.options._menuIDs.slides).off("click");
            $('#' + this.options._menuIDs.label).off("click");
            $('#menuRegions').off("click");
            $('#' + this.options._menuIDs.info).off("click");
            $('#' + this.options._menuIDs.scalebar).off("click");
            $('#menuFullScreen, .scrollablemenusection>div').off("click");
            $('.scrollablemenusection').off("touchend");
            $('.scrollablemenusection').off('scroll');
        },
        /**
         * Destroys the menu. This means that all of its associated elements are removed.
         * @function
         */
        destroy: function () {
            PxlViewer.util.Debug.log("menu.destroy");
            $('#viewerMenu').remove();
            $('.rotateDial').remove();
        }

    });

}(PxlViewer));