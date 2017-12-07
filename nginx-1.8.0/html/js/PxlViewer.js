// PxlViewer v0.1.0
// Copyright (C) PathXL
window.PxlViewer = window.PxlViewer ||
    function (options) {
        return new PxlViewer.Base(options);
    };

(function (PxlViewer)
{

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
    PxlViewer.util = new PxlUtil();
    if (typeof OpenSeadragon === 'undefined')
    {
        throw new Error("PxlViewer requires OpenSeadragon.");
    }
    if (typeof Mustache === "undefined")
    {
        throw new Error("PxlViewer requires Mustache.");
    }
    if (typeof YUI === "undefined")
    {
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
        if (!('id' in options))
        {
            throw new Error("The 'id' parameter needs to be specified");
        }
        if (!('images' in options) || options.images.length == 0)
        {
            throw new Error("The 'images' parameter must be specified and must be non-empty.");
        }
        this.options = options;
        this.images = options.images;
        // This is used for the GetInfoJson callback.
        PxlViewer.pxlCount++;
        this.pxlIndex = PxlViewer.pxlCount;
        PxlViewer.created[PxlViewer.pxlCount] = this;

        // Load the first image.
        this.loadImage(0);
    };

    $.extend(PxlViewer.Base.prototype, {
        /**
         * Loads an image into the viewer as specified by the first parameter.
         * @function
         * @param {Object} image
         */
        loadImage: function (i) {
            var image = this.images[i];
            if (typeof image === 'undefined') {
                throw new Error("Invalid index.");
            }
            if (!'url' in image)
            {
                throw new Error("Image object must have an 'url' parameter.");
            }

            this.currentImage = i;
            
            // Request image info from the image server.
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = image.url + "?GetInfoJson?callback=PxlViewer.onGetInfo(" + this.pxlIndex + ")";
            $("body").append(script);
        },
        

        /**
         * Callback for image server.
         * @function
         * @param {Object} info
         */
        onGetInfo: function (info) {
            this.images[this.currentImage].info = info;
            var dirList = info.dirList.split("|");
            // TODO: Multiple tile sources?
            // TODO: Only create OpenSeaDragon if 'viewer' is undefined.
            var pxl = this;

            if (this.viewer != undefined) {
                this.viewer.destroy();
            }

            this.viewer = new OpenSeadragon({
                id: this.options.id,
                tileSources: {
                    height: parseInt(info.height),
                    width: parseInt(info.width),
                    tileSize: parseInt(info.tileWidth),
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

                        var w = parseInt(info.tileWidth);
                        var h = parseInt(info.tileHeight);
                        var x2 = x * w;
                        var y2 = y * h;
                        return pxl.images[pxl.currentImage].url + "?" +
                            "GetImage?x=" + x2 + "&y=" + y2 + "&width=" + w + "&height=" + h + "&zoom=" + zoom + "&compression=70";
                    }
                },
                prefixUrl: "static/",
                showNavigator: true,
                animationTime: 0.5,
                blendTime: 0.1,
                constrainDuringPan: true,
                maxZoomPixelRatio: 2,
                visibilityRatio: 1,
                showRotationControl: true,
                timeout: 120000,
                autoHideControls: false,
                showNavigationControl: false,
                debugMode: false,
                gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true, pinchRotate: true, flickEnabled: true, flickMinSpeed: 70, flickMomentum: 0.3 },
                gestureSettingsTouch: { clickToZoom: false, dblClickToZoom: true, pinchRotate: true, flickEnabled: true, flickMinSpeed: 70, flickMomentum: 0.3 }
            });
            

            this.viewer.addHandler("pan", function () {
                // Hide drawers, menus and panels.
                if ($('#magnificationDrawer.drawer').hasClass("active")) {
                    $('#menuMagnification.drawerBtn').mouseup();
                }

                if ($('#viewMenuPanel.menu').hasClass("active")) {
                    $('#menuView.menuBtn').mouseup();
                }
            });
            this.viewer.addHandler("zoom", function () {
                // stop the mag list closing automatically when the viewer zooms via the mag menu
                if (PxlViewer.Menu.AllowClosingofMag) {
                    new PxlViewer.Menu(pxl.options.menu, pxl).HidePanels();
                }
                PxlViewer.Menu.AllowClosingofMag = true;
            });
            this.viewer.addHandler("canvas-drag", function () {
                if ($('#magnificationDrawer.drawer').hasClass("active")) {
                    $('#menuMagnification.drawerBtn').mouseup();
                }

                if ($('#viewMenuPanel.menu').hasClass("active")) {
                    $('#menuView.menuBtn').mouseup();
                }

                new PxlViewer.Menu(pxl.options.menu, pxl).HidePanels();
            });
        
            this.viewer.addHandler("full-screen", function (args) {
                if (args.fullScreen) {
                    this.menu.inject();
                    // hides everything except the fullscreen button.
                    $('#viewerMenu > .nonscrollingmenusection > div:not(.special)').remove();
                    $('#viewerMenu > .scrollablemenusection > div:not(.special)').remove();

                    $("#menuFullScreen").addClass("isFullScreen");
                }
                else {
                    $('#viewerMenu').remove();
                }

            });

            this.viewer.addHandler("resize", function (args) {
                pxl.annotations.resize();
                var menu = new PxlViewer.Menu(pxl.options.menu, pxl);
                menu.setScrollablemenuArea();
                menu.hideAllSlideoutPanels();
            });

            this.viewer.addHandler("open", function (args) {

                //this annotations stuff needs moved outside the event
                var permissions = {
                    permissions: [{ name: 'annoSq', cssClass: 'squarecss annoOption' },
                    { name: 'annoCirc', cssClass: 'circlecss annoOption', event: '' },
                    { name: 'annoFree', cssClass: 'freehandcss annoOption', event: '' },
                    { name: 'annoArrow', cssClass: 'arrowcss annoOption', event: '' }]
                }

                pxl.annotations = new PxlViewer.Annotations(pxl, permissions, pxl.options.annotation);

                pxl.carousel = new PxlViewer.Carousel(pxl);
                pxl.options.menu.showCarousel = PxlViewer.Carousel.isCarouselAvailable(pxl);
                
                pxl.menu = new PxlViewer.Menu(pxl.options.menu, pxl);
                pxl.menu.inject();
                pxl.menu.update(info);
               
                pxl.SlideName = new PxlViewer.SlideName(pxl.options.SlideName, pxl);

                $(window).unbind("scroll").scroll(function () {
                    if (document.documentElement.clientHeight +
                          $(document).scrollTop() >= document.body.offsetHeight) {
                        $("html, body").animate({ scrollTop: 0 }, 200);
                    }
            });
            });
            
        },

        /**
         * Destroys the viewer completely. This means that the viewer <div> is
         * emptied and any divs that have been created are destroyed.
         * @function
         */
        destroy: function () {
            this.menu.destroy();
            this.annotations.destroy();
            this.slideName.destroy();
            $('#' + this.options.id).empty();
            this.menu = null;
            PxlViewer.created[this.pxlIndex] = null;
        }
    });

    /* Other global static functions */

    // TODO: Change name to distinguish from instance function
    PxlViewer.onGetInfo = function (pxlIndex) {
        return function (info) {
            if (PxlViewer.created[pxlIndex] === null) {
                PxlViewer.console.warn("Could not deliver image info to the correct viewer. It seems it was destroyed.");
                return;
            }
            PxlViewer.created[pxlIndex].onGetInfo(info);
        };
    };

}(PxlViewer));


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

        this.options = {
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
            showAdjustmentsLink: false,
            showDebugLink: false,
            showLabelLink: false,
            showMeasurementsLink: false,
            showRegionsLink: false,
            showScalebarLink: false,
            showThumbnailLink: false,
            showViewLink: false,
            showPublishAnnotations: false,
            menuScale: "normal",
            _menuIDs: {
                fullscreen: "menuFullScreen",
                magnification: "menuMagnification",
                drawerAppender: "Drawer",
                annotation: "menuAnnotation",
                measurements: "menuMeasurements",
                label: "menuLabel",
                region: "menuRegion",
                slides: "menuSlides",
                info: "menuInfo",
                scalebar: "menuScalebar",
                thumbnail: "menuThumbnail",
                view: "menuView",
                adjustments: "menuAdjustments",
                rotate: "rotateDrawer",
            },
            positions: {
                menuWidth: 82 + "px"
                }
        };
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
    };
    PxlViewer.Menu.hidingMenuAction = false;
    PxlViewer.Menu.AnimatingOverflow = false;
    PxlViewer.Menu.AllowClosingofMag = true;

    $.extend(PxlViewer.Menu.prototype, {
        /**
         * Generates and appends the menu's HTML into the <body>.
         *
         * @function
         * @param {ImageInfo} info - The image info object as supplied by the image server.
         */
        inject: function() {
            if (typeof this.html == 'undefined') {
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
                    contents += this._createButton("mag83", "setMag", "<span>x100</span>");
                    this.html += this._createDrawer(this.options._menuIDs.magnification, "menubadge", btn, contents, "x1");
                }
                this.html += "</div>";

                this.html += "<div class='scrollablemenusection'>"; // start scollable menu section
                if (this.options.showAnnotationDrawer) {
                  
                    var btn = this._createButton(this.options._menuIDs.annotation, "menubadge", null, "Annotations", this.base.annotations.options.startNumber);
                    this.html += btn;
                    //var contents = "";
                    //contents += this._createButton("annoSq", "button", "<span>sq</span>");
                    //contents += this._createButton("annoCirc", "button", "<span>circ</span>");
                    //contents += this._createButton("annoFree", "button", "<span>free</span>");
                    //contents += this._createButton("annoArr", "button", "<span>arr</span>");
                    //contents += this._createButton("annoSave", "button", "<span>save</span>");
                    //contents += this._createButton("annoLoad", "button", "<span>load</span>");
                    //this.html += this._createDrawer("annotationDrawer", btn, contents);
                }

                if (this.options.showMeasurementsLink) {
                    this.html += this._createButton(this.options._menuIDs.measurements, "menubadge", null, "Measure");
                }
                if (this.options.showLabelLink) {
                    this.html += this._createButton(this.options._menuIDs.label, "menubadge", null, "Label");
                }

                if (this.options.showRegionsLink) {
                    this.html += this._createButton(this.options._menuIDs.region, "menubadge", null, "Regions");
                }

                if (this.options.showCarousel) {
                    var btn = this._createButton(this.options._menuIDs.slides, "menubadge", null, "Slides", this.base.images.length);
                    this.html += btn;
                }

                // View menu
                if (this.options.showImageInfo) {
                    var btn = this._createButton("menuInfobtn", "button", null);
                    contents += this._createViewRow("imageInfoIcon", "Image Information");
                    contents += this._createViewRow("labelIcon", "Label");
                    this.html += this._createMenu(this.options._menuIDs.info, "menubadge", btn, contents, "Information");
                }
                if (this.options.showScalebarLink) {
                    this.html += this._createButton(this.options._menuIDs.scalebar, "menubadge", null, "Scalebar");
                }
                if (this.options.showThumbnailLink) {
                    this.html += this._createButton(this.options._menuIDs.thumbnail, "menubadge", null, "Thumbnail");
                }

                if (this.options.showViewLink) {
                    // will be turned off for sprint 1
                    this.html += this._createButton(this.options._menuIDs.view, "menubadge", null, "View");
                }

                if (this.options.showAdjustmentsLink) {
                    // will be turned off for sprint 1
                    this.html += this._createButton(this.options._menuIDs.adjustments, "menubadge", null, "Adjustments");
                }

                if (this.options.showRotationDrawer) {
                    var btn = this._createButton("menuRotate", "drawerBtn");
                    contents = "";
                    contents += this._createButton("rotate0", "rotateBtn");
                    contents += this._createButton("rotate90", "rotateBtn");
                    contents += this._createButton("rotate180", "rotateBtn");
                    contents += this._createButton("rotate270", "rotateBtn");
                    this.html += this._createDrawer(this.options._menuIDs.rotate, "menubadge", btn, contents);
                }

                if (this.options.showDebugLink) {
                    // will usually be turned off
                this.html += this._createButton("panelExpand", "menubadge", null, "Expand");
                this.html += this._createButton("panelShrink", "menubadge", null, "Shrink");
                }
                this.html += "<div class='menuSectionOverflowTopSection'></div>"; // this is the transparent gif holder when the user scrolls over the screen size
                this.html += this._createBottomPadder();
                this.html += "</div>"; // end scrollable menu section
                this.html += "</div>"; // start viewermenu
            }


            $('#leftMenuHolder').append(this.html);
            var pThis = this;
            if (this.options.showRotationControl) {
                YUI().use('dial', function(Y) {

                    var dial = new Y.Dial({
                        min: -180,
                        max: 180,
                        stepsPerRevolution: 180,
                        value: 0,
                        strings: { label: 'Rotation', resetStr: 'Reset', tooltipHandle: 'Drag to rotate' },
                        after: {
                            valueChange: function(e) {
                                pThis.base.viewer.viewport.setRotation(e.newVal);
                            }
                        }
                    });
                    var div = document.createElement("div");
                    div.id = "rotateDial_" + (new Date).getTime();
                    div.className = "rotateDial";
                    $('body').append(div);
                    dial.render('#' + div.id);

                });
            }
            this._hookupEvents();
            this.ScaleMenu();
            setTimeout("var tempmenu=new PxlViewer.Menu(pxl.options.menu, pxl);tempmenu.setScrollablemenuArea();tempmenu.positionAllSlideOutPanels();", 300);
        },
        setScrollablemenuArea: function() {
            var offsetheight = PxlViewer.util.GetWindowSize();
            var heightOffetdiff = (parseInt(offsetheight[1]) - parseInt($('.nonscrollingmenusection')[0].offsetHeight)) - 20;
            $('.scrollablemenusection').css("height", heightOffetdiff + "px");
            var menuSectionOverflowTopSection = '.scrollablemenusection div.menuSectionOverflowTopSection';
            $(menuSectionOverflowTopSection)
                .css("top", $('.scrollablemenusection')[0].offsetTop)
                .css("left", $('#viewerMenu')[0].offsetLeft);
            $('.scrollablemenusection').unbind('scroll').scroll(function () {
                $(menuSectionOverflowTopSection).css("left", $('#viewerMenu')[0].offsetLeft);
                if (!PxlViewer.Menu.AnimatingOverflow) {
                    PxlViewer.Menu.AnimatingOverflow = true;
                    if ($(this).scrollTop() > 10) {
                        $(menuSectionOverflowTopSection).show();
                        $(menuSectionOverflowTopSection).animate({ opacity: 1 }, 200, function () {
                            PxlViewer.Menu.AnimatingOverflow = false;
                        });
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
            });
        },

        /**
         * Updates the buttons which are present in the menu. Uses the specified image info object to determine
         * which magnification buttons should be shown.
         *
         * @function
         * @param {ImageInfo} info - The image info object as supplied by the image server.
         */
        update: function(info) {
            if (info.mag < 83) {
                $('#mag83').remove();
            }
            if (info.mag < 40) {
                $('#mag40').remove();
            }
            if (info.mag < 20) {
                $('#mag20').remove();
            }
            if (info.mag < 10) {
                $('#mag10').remove();
            }
            if (info.mag < 5) {
                $('#mag5').remove();
            }
            if (info.mag < 2.5) {
                $('#mag2_5').remove();
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
            var elem = $('#view1')[0];
            if (!elem.msRequestFullscreen && !elem.requestFullscreen && !elem.mozRequestFullScreen && !elem.webkitRequestFullscreen) {
                // Remove the fullscreen button if fullscreen is not supported.
                $('#menuFullScreen').remove();
            }

            //aa add handleer to the update
            var pThis = this;
            this.base.viewer.addHandler("update-viewport", function(a) {
                // Hide drawers, menus and panels.            
                var currZoom = a.eventSource.viewport.getZoom(true);
                if (currZoom != null) {
                    //info,ag is the scanned mag returned from the imageserver
                    currZoom = currZoom * info.mag;
                    currZoom = a.eventSource.viewport.viewportToImageZoom(currZoom);
                    //tofixed cuts the zoom to 1 decimal places and then the second parse flot removes the .0 if it ends in 0
                    currZoom = parseFloat(currZoom).toFixed(1);
                    currZoom = parseFloat(currZoom);
                    pThis._updateMenuMagnification(currZoom);
                }

            });
        },
        SetActiveOn: function (idOfElementToToggle) {
            $('#' + idOfElementToToggle).removeClass('menubadge');
            $('#' + idOfElementToToggle).addClass('menubadgeActive');
        },
        SetActiveOff: function (idOfElementToToggle) {
            $('#' + idOfElementToToggle).removeClass('menubadgeActive');
            $('#' + idOfElementToToggle).addClass('menubadge');
        },
        SetActiveOffAll: function () {
            var mThis = this;
            $('#viewerMenu > div > div').each(function() { mThis.SetActiveOff($(this).attr('id')); });
        },
        ToggleActive: function(idOfElementToToggle) {
            if ($('#' + idOfElementToToggle).hasClass('menubadge')) {
                this.SetActiveOn(idOfElementToToggle);
            } else {
                this.SetActiveOff(idOfElementToToggle);
            }
        },
        UpdateCount: function(idOfElementToUpdate, value) {
            $('#' + idOfElementToUpdate + " .counterbadge").text(value);
        },
        _createlinkButton: function(id,cssClass,href,textContent) {
            return Mustache.render("<a id='{{id}}' class='imageLinkButton {{cssClass}}' href='{{{href}}}'>{{{textContent}}}</a>", { id: id, cssClass: cssClass, href: href, textContent: textContent });
        },

        _createButton: function (id, cssClass, contents, buttontitle, counter) {
            var titleholder = "";
            var counterholder = "";
            if (!PxlViewer.util.IsNullOrEmpty(buttontitle)) { titleholder = "<span class='buttonNameHolder'>" + buttontitle + "</span>"; }
            if (!PxlViewer.util.IsNullOrEmpty(counter)) { counterholder = "<div class='counterbadge'>" + counter + "</div>"; }
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

        _createViewRow: function(id, text) {
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

        _createPanel: function(id, btn, contents) {
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
            var pThis = this;
            if ($('.drawer,.menu,.panel').is(':visible') && !PxlViewer.Menu.hidingMenuAction) {
                PxlViewer.Menu.hidingMenuAction = true;
                $('.drawerBtn,.menuBtn,.panelBtn').each(function() {
                    var btn = this;
                    var drawerid = $(btn).attr("id") + pThis.options._menuIDs.drawerAppender;
                    var drawer = $('#' + drawerid);

                    var animOptions = { "opacity": "0" }; // make the drawers opacity 0 

                    $(drawer).animate(animOptions,
                    {
                        "duration": 400,
                        "complete": function () {
                            $(drawer).hide();
                            PxlViewer.Menu.hidingMenuAction = false;
                }
                    });
                    $(drawer).removeClass("active");
                    $(btn).removeClass("active");
                    pThis.base.menu.SetActiveOff(drawerid + "Container");
                });
            }
        },
        positionAllSlideOutPanels: function () {
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
            var totalOffsetWidth = ($(drawer).children(".setMag").length + 2) + parseFloat($(drawer).css("padding-left")) + parseFloat($(drawer).css("padding-right"));
            $(drawer).children(".setMag").each(function () {
                var widthaddition = parseInt($(this).css("width")) + parseFloat($(this).css("margin-left")) + parseFloat($(this).css("margin-right"));
                totalOffsetWidth += widthaddition;
            });
            $(drawer).css({
                top: $(btn)[0].offsetTop +
                    $(btn).parent()[0].offsetTop +
                    ((parseFloat($(btn)[0].offsetHeight) / 2) - ((parseFloat($(drawer).css("height")) / 2))) + "px",
                left: parseFloat($("#viewerMenu")[0].offsetLeft) + parseFloat(this.options.positions.menuWidth) + 5 + "px",
                width: totalOffsetWidth + "px"
            });
        },

        _slideOut: function (btn, selector, fullWidth) {
            // this function preforms the fade in-out animation that displays and hides the drawer used in the viewer. 
            var drawerid = $(btn).attr("id") + this.options._menuIDs.drawerAppender;
            var drawer = $('#' + drawerid);
            this._positionSlideOutPanel(btn, selector);
            
            if ($(drawer).hasClass("active")) { // if menu item's drawer is open ( has the class 'active' assigned to it) we should fade it out
                
                var animOptions = {  "opacity": "0" }; // make the drawers opacity 0 
               
                $(drawer).animate(animOptions,
                {
                    "duration": 500,
                    "complete": function () { $(drawer).hide(); }
                });
                $(drawer).removeClass("active");
                $(btn).removeClass("active");
                this.base.menu.SetActiveOff(drawerid + "Container");
            } else {

                var animOptions = { "opacity": "1" }; // Set the drawer's opacity to 1. ( we are going to show the viewer ) 
                
                $(drawer).show();
                $(btn).css("position", "absolute"); // set the position to absolute . this is needed as the drawer seems to jump down the page if set to relative . 
              
                $(drawer).animate(animOptions,
                 {
                     "duration": 500,
                     "complete": function () { $(drawer).show(); } // show the drawer with a fade in effect . 
                 });
                $(drawer).addClass("active"); // add active class . needed so that we knw when to display / hide the drawer 
                $(btn).addClass("active");
                this.base.menu.SetActiveOn(drawerid + "Container");
            }
        },

        _calculateDrawerWidth: function(drawerBtn) {
            var wasShown = $(drawerBtn).parent().children(".drawer").is(':visible');
            $(drawerBtn).parent().children(".drawer").show(); // We need to show it here, otherwise clientWidth is 0.

            var firstDrawerBtn = $("#" + $(drawerBtn).attr("id") + this.options._menuIDs.drawerAppender + ">div").first();
            var drawerBtnWidth = firstDrawerBtn[0].clientWidth + parseFloat(firstDrawerBtn.css("marginLeft")) + parseFloat(firstDrawerBtn.css("marginRight"));
          
            var btnCount = $("#" + $(drawerBtn).attr("id") + this.options._menuIDs.drawerAppender + ">div").length;
            var fullDrawerWidth = (drawerBtnWidth * btnCount);
            if (!wasShown) {
                 $("#" + $(drawerBtn).attr("id") + this.options._menuIDs.drawerAppender).hide();
            }
            $(drawerBtn).parent().children(".drawer").css("width", (fullDrawerWidth + fullDrawerWidth * 0.05)); // this code calculates the minimum width in pixels needed to display all elements of the drawer . I have also added a small buffer of 5% as without it some elments do not appear in the drawer on firefox.   
            
            return fullDrawerWidth;
        },

        _calculateMenuWidth: function(menuBtn) {
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

        _calculatePanelWidth: function(menuBtn) {
            if (menuBtn.length == 0) {
                return 0;
            }
            $(menuBtn).parent().children(".panel").show();
            var result = $(menuBtn).parent().children(".panel")[0].clientWidth;
            $(menuBtn).parent().children(".panel").css("right", "-310px");
            $(menuBtn).parent().children(".panel").hide();
            return result - 40;
        },
        
        HidePanels : function (){
            this.SetScaleParameters();
            this.hideAllSlideoutPanels();
        },
        _expandPanel: function () {
            $("#viewerHolder").css("margin-left", "350px");
            $("#viewerHolder").width("calc(100% - 350px)");
            $('#leftPanel > div').hide();
            $("#leftMenuHolder").animate({ width: "350px" }, 500, "swing", function () {
                $('#leftPanel > div').show();
                $('#leftPanel').show();
                $(this).addClass("menuexpanded");
            });

            $('.scrollablemenusection div.menuSectionOverflowTopSection').animate({ left: "266px" }, 500);
        },
        _shrinkPanel: function () {
            $("#viewerHolder").css("margin-left", this.options.positions.menuWidth);
            $("#viewerHolder").width("calc(100% - " + this.options.positions.menuWidth + ")");
            $("#leftMenuHolder").animate({ width: this.options.positions.menuWidth }, 500, "swing", function() {
                 $(this).removeClass("menuexpanded");
            });
            $('.scrollablemenusection div.menuSectionOverflowTopSection').animate({ left: "0" }, 500);
            $('#leftPanel').hide();
            this.SetActiveOffAll();
        },
        _togglePanel: function () {
            var pThis = this;
            if ($("#leftMenuHolder").hasClass('menuexpanded')) {
                pThis.SetScaleParameters();
                pThis._shrinkPanel();
            } else {
                pThis._expandPanel();
            }
        },
        createPanelHeaderControl: function (id, text, event, cssClass) {
            var tmpl = "\
                <div class='panelHeaderControl' id='{{id}}' > \
                      <div class='{{cssClass}}' onclick='{{event}}'> {{text}} </div>   \
                </div>";
            return Mustache.render(tmpl, { id: id, text: text, event: event, cssClass: cssClass });
        },

        _hookupEvents: function () {
            var pThis = this;
            $('#' + pThis.options._menuIDs.fullscreen).mouseup(function () {
                pThis.base.viewer.setFullScreen(!this.base.isFullScreen);
                pThis.base.isFullScreen = !this.base.isFullScreen;
            });

            $('.drawerBtn').mouseup(function () {
                pThis._slideOut(this, ".drawer", pThis._calculateDrawerWidth(this));
            });

            var menuWidth = pThis._calculateMenuWidth($('.menuBtn'));
            $('.menuBtn').mouseup(function () {
                pThis._slideOut(this, ".menu", menuWidth);
            });

            var panelWidth = pThis._calculatePanelWidth($('.panelBtn'));
            $('.panelBtn').mouseup(function () {
                pThis._slideOut(this, ".panel", panelWidth, true);
            });

            $('.setMag').mouseup(function () {
                var center = pThis.base.viewer.viewport.getCenter(false);
                var currMag = pThis.base.images[pThis.base.currentImage].info.mag;
                var magTxt = "";
                PxlViewer.Menu.AllowClosingofMag = false; // stop the mag list closing automatically when the viewer zooms
                switch ($(this).get(0).id) {
                    case "mag1":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.getHomeZoom(), center, false);
                        magTxt = "x"+ parseFloat(parseFloat(pThis.base.viewer.viewport.getHomeZoom()).toFixed(1));
                        break;
                    case "mag2_5":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.imageToViewportZoom(2.5 / currMag), center, false);
                        magTxt = "x;";
                        break;
                    case "mag5":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.imageToViewportZoom(5 / currMag), center, false);
                        magTxt = "x5";
                        break;
                    case "mag10":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.imageToViewportZoom(10 / currMag), center, false);
                        magTxt = "x10";
                        break;
                    case "mag20":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.imageToViewportZoom(20 / currMag), center, false);
                        magTxt = "x20";
                        break;
                    case "mag40":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.imageToViewportZoom(40 / currMag), center, false);
                        magTxt = "x40";
                        break;
                    case "mag83":
                        pThis.base.viewer.viewport.zoomTo(pThis.base.viewer.viewport.imageToViewportZoom(100 / currMag), center, false);
                        magTxt = "x100";
                        break;
                }
                $(this).parent().parent().children(".drawerBtn").attr("class", "drawerBtn " + $(this).get(0).id);

                $('#' + pThis.options._menuIDs.magnification + pThis.options._menuIDs.drawerAppender + "Container > .buttonNameHolder").text(magTxt);
               // $(this).parent().parent().find(".drawerBtn .currentMag").text(magTxt);
            });

            $('.rotateBtn').mouseup(function () {
                var center = pThis.base.viewer.viewport.getCenter(false);
                switch ($(this).get(0).id) {
                    case "rotate0":
                        pThis.base.viewer.viewport.setRotation(0);
                        break;
                    case "rotate90":
                        pThis.base.viewer.viewport.setRotation(90);
                        break;
                    case "rotate180":
                        pThis.base.viewer.viewport.setRotation(45);
                        break;
                    case "rotate270":
                        pThis.base.viewer.viewport.setRotation(270);
                        break;

                }
                $(this).parent().parent().children(".drawerBtn").attr("class", "drawerBtn " + $(this).get(0).id);
            });

            $('#menuTools').mouseup(function () {
                pThis.base.annotations.toggleDrawingMode();
            });

            
            $('#' + pThis.options._menuIDs.annotation).mouseup(function () {
                pThis.base.annotations.loadAnnotationsPanel(true);
            });
           // $('#annoExit').mouseup(function () { pThis.base.annotations.exitEditMode(); });
            $('#panelExpand').mouseup(function () { pThis._expandPanel(); });
            $('#panelShrink').mouseup(function () {
                pThis.SetScaleParameters();
                pThis._shrinkPanel();
            });

            $('#' + pThis.options._menuIDs.slides).mouseup(function () {
                pThis.base.carousel.toggleCarouselPanel(pThis);
            });
        },

        _updateMenuMagnification: function (currZoom) {
            var drawerContainerID = this.base.menu.options._menuIDs.magnification + this.base.menu.options._menuIDs.drawerAppender + "Container";

            $('#' + drawerContainerID + " > .buttonNameHolder").text("x" + currZoom);
            $("#" + drawerContainerID).removeClass("mag1").removeClass("mag2_5").removeClass("mag5").removeClass("mag10").removeClass("mag20").removeClass("mag40").removeClass("mag83").removeClass("magovermax");
            if (currZoom > this.base.images[this.base.currentImage].info.mag) {
                $("#" + drawerContainerID).addClass("magovermax");
            }else if (currZoom < 2.5) {
                $("#" + drawerContainerID).addClass("mag1");
            } else if (currZoom < 5) {
                $("#" + drawerContainerID).addClass("mag2_5");
            }
            else if (currZoom < 10) {
                $("#" + drawerContainerID).addClass("mag5");
            }
            else if (currZoom < 20) {
                $("#" + drawerContainerID).addClass("mag10");
            }
            else if (currZoom < 40) {
                $("#" + drawerContainerID).addClass("mag20");
            }
            else if (currZoom >= 40 && currZoom < 83) {
                $("#" + drawerContainerID).addClass("mag40");
            } else {
                $("#" + drawerContainerID).addClass("mag83");
            }


        },
        SetScaleParameters: function () {
            switch (this.options.menuScale) {
                case "custom":
                    break;
                case "small":
                    $.extend(this.options.positions, {
                        menuWidth: 68 + "px"
                    });

                    break;
                case "normal":
                default:
                    $.extend(this.options.positions, {
                        menuWidth: 82 + "px"
                    });
            }
        },
        ScaleMenu: function () {
            var mThis = this;
            mThis.SetScaleParameters();
            $("#viewerMenu,#container").removeClass(this.options.menuScale).addClass(this.options.menuScale);
            
            $("#viewerMenu,#leftMenuHolder").css("width", this.options.positions.menuWidth);
            mThis._shrinkPanel();
        },
        /**
         * Destroys the menu. This means that all of its associated elements are removed.
         * @function
         */
        destroy: function ()
        {
            $('#viewerMenu').remove();
            $('.rotateDial').remove();
        }
        
    });

}(PxlViewer));

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
        this.options = {
            startNumber: 0,
            createPermissions: {
                square: false,
                ellipse: false,
                arrow: false,
                freehand: false,
            }
        };
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
        this._init(base, false, creationPermissions);
    };

    $.extend(PxlViewer.Annotations.prototype, {
        _init: function(base, parent, creationPermissions) {
            //this is essential for rendering annotations on the screen
            this.creationPermissions = creationPermissions;
            var pThis = this;
            this.base = base;
            var bounds = base.viewer.viewport.getBounds();
            var canvasElement = document.createElement("canvas");
            var currentdate = new Date();
            var datetime = currentdate.getSeconds();
            canvasElement.id = "annotationCanvas" + datetime;
            canvasElement.style["position"] = "absolute";
            canvasElement.style["top"] = "0px";
            canvasElement.style["left"] = "0px";
            if (!parent) {
                // This is an optimisation. StaticCanvas contains no support for drawing/selectable objects.

                $(base.viewer.canvas).append(canvasElement);
                this.canvas = new fabric.StaticCanvas(canvasElement);
                this.canvas.selection = false;
                base.viewer.addOverlay(canvasElement,
                    new OpenSeadragon.Rect(0, 0, bounds.width, bounds.height),
                    OpenSeadragon.OverlayPlacement.CENTER,
                    function(pos, size, element) {
                        pThis.update();
                    });
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

            this.origImgSize = this._getWindowImageSize();
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
            this.canvas.add(this.group);


            //this detects when freehand is created
            this.canvas.on("path:created", function(e) {
                // Path has been drawn, create a new annotation object.
                var canvasCentre = pThis.canvas.getCenter();
                var currRotation = pThis.base.viewer.viewport.getRotation();
                var centrePoint = pThis.group.getPointByOrigin("left", "top");
                var objectOrigin = new fabric.Point(e.path.left, e.path.top);
                var rotatedCoords = fabric.util.rotatePoint(objectOrigin, centrePoint, -currRotation * (Math.PI / 180));
                // Calculate the image coordinates for this annotation.
                // These coordinates are used when the browser window is resized.
                // They will be used for storing the annotations to the database in the future,
                // be careful when changing this.
                var imgCoords = pThis.base.viewer.viewport.windowToImageCoordinates(new OpenSeadragon.Point(rotatedCoords.x, rotatedCoords.y));
                var origDimensions = new OpenSeadragon.Rect(
                    imgCoords.x,
                    imgCoords.y,
                    e.path.width,
                    e.path.height
                );

                var newAnnotation = {
                    type: 'path',
                    origDimensions: origDimensions,
                    obj: e.path
                };

                // Calculate the group coordinates.
                var grpCoords = pThis._windowToGroupCoordinates(new fabric.Point(rotatedCoords.x, rotatedCoords.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;

                // Calculate the zoom.
                var currZoom = pThis.base.viewer.viewport.getZoom(true);
                newAnnotation.origZoom = currZoom;
                newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
                newAnnotation.obj.angle = -currRotation;


                // Calculate the scale.
                newAnnotation.obj.scaleX = 1 / currZoom;
                newAnnotation.obj.scaleY = 1 / currZoom;

                pThis.group.add(newAnnotation.obj);
                pThis.objects.push(newAnnotation);
            });

            //potentally add new events here, like hover on annotations etc

        },

        update: function() {
            // Set location of group object.
            var canvasCentre = this.canvas.getCenter();
            var winCoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(this.base.images[this.base.currentImage].info.width / 2, this.base.images[this.base.currentImage].info.height / 2));
            this.group.left = winCoords.x;
            this.group.top = winCoords.y;

            // Change rotation
            var currRotation = this.base.viewer.viewport.getRotation();
            var centrePoint = new fabric.Point(canvasCentre.left, canvasCentre.top);

            var objectOrigin = new fabric.Point(this.group.left, this.group.top);
            var new_loc = fabric.util.rotatePoint(objectOrigin, centrePoint, currRotation * (Math.PI / 180));
            this.group.left = new_loc.x;
            this.group.top = new_loc.y;
            this.group.angle = currRotation;

            // Set correct scale.
            var currZoom = this.base.viewer.viewport.getZoom(true);
            this.group.scaleX = this.group.origScaleX;
            this.group.scaleY = this.group.origScaleY;
            this.group.scaleX *= currZoom;
            this.group.scaleY *= currZoom;
            for (var i = 0; i < this.objects.length; i++) {
                var annot = this.objects[i];
                // Change stroke width.
                // Scale the stroke width to make sure it is visible when zoomed out.
                annot.obj.strokeWidth = annot.origStrokeWidth;
                annot.obj.strokeWidth *= (annot.origZoom / currZoom);
                if (annot.obj.strokeWidth > 8) {
                    annot.obj.strokeWidth = 8;
                }
                if (!this.editMode) {
                    var ct = this.base.viewer.viewport.viewportToImageCoordinates(this.base.viewer.viewport.getCenter(true));
                    var gxy = this._imageToGroupCoordinates(new OpenSeadragon.Point(annot.origDimensions.x, annot.origDimensions.y));
                    var gwh = this._imageToGroupCoordinates(new OpenSeadragon.Point(annot.origDimensions.x + annot.origDimensions.width, annot.origDimensions.y + annot.origDimensions.height));
                    annot.obj.left = gxy.x;
                    annot.obj.top = gxy.y;
                    annot.obj.width = gwh.x - gxy.x;
                    annot.obj.height = gwh.y - gxy.y;
                    annot.obj.rx = gwh.x - gxy.x;
                    annot.obj.ry = gwh.y - gxy.y;
                    annot.obj.rx = annot.obj.rx / 2;
                    annot.obj.ry = annot.obj.ry / 2;

                }
                else {
                    var vxy = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annot.origDimensions.x, annot.origDimensions.y));
                    var vwh = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(annot.origDimensions.x + annot.origDimensions.width, annot.origDimensions.y + annot.origDimensions.height));
                    annot.obj.left = vxy.x;
                    annot.obj.top = vxy.y;
                    annot.obj.width = vwh.x - vxy.x;
                    annot.obj.height = vwh.y - vxy.y;
                    annot.obj.rx = vwh.x - vxy.x;
                    annot.obj.ry = vwh.y - vxy.y;
                    annot.obj.rx = annot.obj.rx / 2;
                    annot.obj.ry = annot.obj.ry / 2;
                }
            }

            // Redraw
            this.canvas.renderAll();
        },
        loadAnnotationsPanel: function(autoOpen, outputControlID) {
            var outputControl;
            if ($("#" + outputControlID).length > 0) {
                outputControl = $("#" + outputControlID);
            } else {
                outputControl = $(document.createElement('div'));
                outputControl.attr("id", "annoPanel");
                outputControl.attr("className", "annoPanel");
                outputControlID = "annoPanel";
            }

            $("#leftPanel").append(outputControl);
            //load ticker
            //request annotations
            this.retrieveAnnotations(outputControlID, autoOpen);

        },

        addAnnotationToPanel: function (annotation) {
            this.base.annotations.completeAnnotationList.push(annotation);
            $("#annoPanel").append(this.base.annotations._createEditableAnnotationDataContol(annotation.ID, annotation.Name, annotation.Description, annotation.Url, annotation.Shape, annotation.Published, annotation.CanPublishAnnotation, annotation.CanDeleteAnnotation));
            $('.detailsDiv').removeClass("activeAnnotation");
            $('#annodetails_' + annotation.ID).addClass("activeAnnotation");
            $('#editDiv_' + annotation.ID).hide();
            $('#saveDiv_' + annotation.ID).show();
            this.base.menu.UpdateCount(this.base.menu.options._menuIDs.annotation, this.base.annotations.completeAnnotationList.length);
            this._hookEvents();
        },

        retrieveAnnotations: function(outputControlID, autoOpen) {
            if (this.base.images[this.base.currentImage].id > 0) {
                var pThis = this;
                ViewerWebService.GetAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, function (response) {
                    var ob = jQuery.parseJSON(response);
                    pThis.base.annotations.completeAnnotationList = new Array();
                    $("#" + outputControlID).empty();
                    $("#" + outputControlID).append(pThis.base.menu.createPanelHeaderControl("annoHeader", "Annotations", "", "panelHeader"));
                    $("#" + outputControlID).append(pThis.base.annotations._createAnnotationHeaderContol(pThis.base.annotations.creationPermissions));

                    for (var i = 0; i < ob.length; i++) {
                        pThis.base.annotations.completeAnnotationList.push(ob[i][0]);
                        $("#" + outputControlID).append(pThis.base.annotations._createAnnotationDataContol(ob[i][0].ID, ob[i][0].Name, ob[i][0].Description, ob[i][0].Url, ob[i][0].Shape, ob[i][0].Published, ob[i][0].CanPublishAnnotation, ob[i][0].CanDeleteAnnotation));
                        if (ob[i][0].Url == "http://" || ob[i][0].Url == "")
                        {
                            $('#annoHyperLink_' + ob[i][0].ID).hide();
                        }
                    }
                    pThis._hookEvents();
                    pThis.base.menu.UpdateCount(pThis.base.menu.options._menuIDs.annotation, pThis.base.annotations.completeAnnotationList.length);
                    
                    if (autoOpen) {
                        pThis.base.menu._expandPanel();
                        pThis.base.menu.SetActiveOn(pThis.base.menu.options._menuIDs.annotation);
                    }

                }, function() { PxlViewer.console.log("Could not retrieve annotations "); });
            }
        },

        _hookEvents: function() {
            var pThis = this;
            //aa to consider using a fareaACH HERE
            //$(".strokeWidth").spectrum({
            //        showPaletteOnly: true,
            //        clickoutFiresChange: true,
            //        hideAfterPaletteSelect: true,
            //        containerClassName: function (e) {
            //           
            //        },
            //    change: function (color) {
            //       
            //    },
            //    showPalette: true,
            //    color: 'rgb(255, 255, 255)',
            //    palette: [
            //        ['1', '2', '3',
            //        'rgb(255, 255, 251)', 'rgb(255, 255, 250)'],
            //        ['rgb(255, 255, 2549', 'rgb(255, 255, 248)', 'rgb(255, 255, 247)', 'rgb(255, 255, 246)', 'rgb(255, 255, 245)']
            //    ]
            //});
            $(".strokeColor").spectrum({
                showPaletteOnly: true,
                clickoutFiresChange: true,
                hideAfterPaletteSelect: true,
                change: function (color) {

                    var id = $(this).parent().parent().parent().attr("annoID");
                    var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                    annoObj.Color = $(this).spectrum("get").toRgbString();
                    pThis.base.annotations._editAnnotation(annoObj);
                },
                showPalette: true,
                color: 'red',
                palette: [
                    ['black', 'white', 'blanchedalmond',
                    'rgb(255, 128, 0);', 'hsv 100 70 50'],
                    ['red', 'yellow', 'green', 'blue', 'violet']
                ]
            });
            $('#annoFree').mouseup(function() {
                pThis.base.annotations.toggleDrawingMode();
            });

            $('#annoCirc').mouseup(function() {
                pThis.base.annotations.enterEditMode();
                var centerPoint = pThis.base.viewer.viewport.getCenter(true);
                centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
                var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
                var startWidth = parseInt(200 * startZoom);
                var startHeight = parseInt(200 * startZoom);
                var startColor = "red";
                pThis.base.annotations.addEllipse(new OpenSeadragon.Rect(centerPoint.x, centerPoint.y, startWidth, startHeight), startColor, startZoom, 0, true, false);
                var newAnno = new Object();
                newAnno.ID = 0;
                newAnno.Name = "Name";
                newAnno.Description = "Description";
                newAnno.Url = "http://";
                newAnno.StrokeWidth = 3;
                newAnno.Published = false;
                newAnno.AnnotationAngle = 0;
                newAnno.ImageAngle = 0;
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
            });

            $('.driveAnno').mouseup(function () {
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                pThis.base.annotations._loadAnnotation(annoObj);

            });

            // toggles the sharing of an annotation
            $('.publishBtn').mouseup(function ()
            {
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                pThis.base.annotations._publishAnnotation(annoObj);
            });

            // Deletes an annotation and removes it from the list
            $('.deleteBtn').mouseup(function () {
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                pThis.base.annotations._deleteAnnotation(annoObj);
            });

            // Saves any changes made the information / physical annotation and reverts details to read only mode
            $('.saveBtn').mouseup(function ()
            {
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);             
                pThis.base.annotations._saveAnnotation(annoObj, true);

                $('#annoName_' + id).replaceWith('<Label id=\'annoName_' + id + '\'  type=\'text\' class=\'annoName annoDetails\'>' + annoObj.Name + '</Label>');
                $('#annoDes_' + id).replaceWith('<Label id=\'annoDes_' + id + '\' class=\' annoDes annoDetails\'>' + annoObj.Description + '</Label>');
                $('#annoURL_' + id).replaceWith('<Label id=\'annoURL_' + id + '\'  type=\'text\' class=\'annoDes annoDetails\'>' + annoObj.Url + '</Label>');

                $('#editDiv_' + id).show();
                $('#saveDiv_' + id).hide();
                if (annoObj.Url == "http://" || annoObj.Url == "")
                {
                    $('#annoHyperLink' + id).hide();
                }
            });

            // Enters edit mode for annotation and its details
            $('.editBtn').mouseup(function ()
            {
                var id = $(this).parent().parent().parent().attr("annoID");
                var annoObj = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", id);
                pThis.base.annotations._editAnnotation(annoObj);
                $('#annoName_' + id).replaceWith('<input id=\'annoName_' + id + '\'  type=\'text\' class=\'annoEditableTextArea annoName\' value=' + annoObj.Name + '></input>');
                $('#annoDes_' + id).replaceWith('<textarea id=\'annoDes_' + id + '\' class=\'annoEditableTextArea annoDes annoDetails\'>' + annoObj.Description + '</textarea>');
                $('#annoURL_' + id).replaceWith('<input id=\'annoURL_' + id + '\'  type=\'text\' class=\'annoEditableTextArea annoDes annoDetails\' value=' + annoObj.Url + '></textarea>');
                $('#annoDes_' + id).elastic();

                $('#editDiv_' + id).hide();
                $('#saveDiv_' + id).show();
            });

            // Apply class to annotations details to initiate animation
            $('.detailsDiv').mouseup(function ()
            {
                $('.detailsDiv').removeClass("activeAnnotation");
                $(this).addClass("activeAnnotation");
            });
            
            $('#annoSq').mouseup(function() {
                pThis.base.annotations.enterEditMode();
                var centerPoint = pThis.base.viewer.viewport.getCenter(true);
                centerPoint = pThis.base.viewer.viewport.viewportToImageCoordinates(centerPoint);
                var startZoom = pThis.base.images[pThis.base.currentImage].info.mag / pThis.base.viewer.viewport.viewportToImageZoom(pThis.base.viewer.viewport.getZoom() * pThis.base.images[pThis.base.currentImage].info.mag);
                var startWidth = parseInt(200 * startZoom);
                var startHeight = parseInt(200 * startZoom);
                var startColor = "red";
                pThis.base.annotations.addRectangle(new OpenSeadragon.Rect(centerPoint.x, centerPoint.y, startWidth, startHeight), startColor, startZoom, 0, true, false);
                var newAnno = new Object();
                   newAnno.ID = 0;
                   newAnno.Name = "Name";
                   newAnno.Description = "Description";
                   newAnno.Url = "http://";
                   newAnno.StrokeWidth = 3;
                   newAnno.Published = false;
                   newAnno.AnnotationAngle = 0;
                   newAnno.ImageAngle = 0;
                   newAnno.Shape = "rect";
                   newAnno.X = parseInt(centerPoint.x);
                   newAnno.Y = parseInt(centerPoint.y);
                   newAnno.Width = parseInt(startWidth * startZoom);
                   newAnno.Height = parseInt(startHeight * startZoom);
                   newAnno.Color = startColor;

                   var vxy = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                   var vwh = pThis.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(200, 200));
                   newAnno.Width = parseInt( vwh.x - vxy.x);
                   newAnno.Height = parseInt( vwh.y - vxy.y);
                   
                pThis.base.annotations._saveAnnotation(newAnno, false);
            });

            $('#annoSave').mouseup(function() {
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

        driveToArea: function (imageX, imageY, imageZ, imageAngle) {
            this.base.viewer.viewport.setRotation(imageAngle);
            var zPoint = this.base.viewer.viewport.imageToViewportCoordinates(new OpenSeadragon.Point(imageX, imageY));
            this.base.viewer.viewport.panTo(zPoint, true);
            this.base.viewer.viewport.zoomTo(this.base.viewer.viewport.imageToViewportZoom(1/imageZ), null, true);
        },


        _createAnnotationDataContol: function (id, name, description, url, shape, published, canPublish, canDelete) {
            var shareTxt = "Share";
            if (published) {
                shareTxt = "Unshare";
            }
            var tmpl = "\
                <div class='anDataControl' id='anno_{{id}}' annoID='{{id}}' > \
                    <div id='annodetails_{{id}}' class='detailsDiv'>\
                        <div id='innerDetailsContianer_{{id}}' class='innerDetailsContainer'>\
                            <div id='innerDetailsDiv_{{id}}' class='innerDetailsDiv'>\
                                <div id='annoHeader_{{id}}' class='annoheader'>\
                                    <label id='annoName_{{id}}' class='annoName annoDetails'>{{{name}}}</label> \
                                    <div id='annoHyperLink_{{id}}' class='hyperlinkIcon'></div>\
                                    <div id='annoType_{{id}}' class='annoType {{shape}}Anno'></div>\
                                </div>\
                                <label id='annoDes_{{id}}' class='annoDes annoDetails'>{{{description}}}</label> \
                                <label id='annoURL_{{id}}' class='annoDes annoDetails'>{{{url}}}</label> \
                            </div>\
                        </div>\
                        <div class='innerControls'>";
            if (canPublish)
            {
                tmpl += "<div id = 'publishDiv_{{id}}' class = 'annoActionsDiv publishBtn'>\
                    <div id ='publishAnnoIcon_{{id}}' class = 'publish' ></div>\
                    <label id = 'publishLbl_{{id}}' class = 'annoActionsLbl'>{{shareTxt}}</label > \
                </div>";
            }
            if (canDelete) 
            {
                tmpl += "<div id = 'editDiv_{{id}}' class = 'annoActionsDiv editBtn'>\
                                <div id = 'editAnnoIcon_{{id}}' class = 'edit'></div>\
                                <label id = 'editLbl_{{id}}' class = 'annoActionsLbl'>Edit</label>\
                            </div>\
                            <div id = 'saveDiv_{{id}}' class = 'annoActionsDiv saveBtn'>\
                                <div id = 'saveAnnoIcon_{{id}}' class= 'save'></div>\
                                <label id = 'saveLbl_{{id}}' class = 'annoActionsLbl'>Save</label>\
                            </div>\
                            <div id = 'deleteDiv_{{id}}' class = 'annoActionsDiv deleteBtn'>\
                                <div id = 'deleteAnnoIcon_{{id}}' class = 'delete'></div>\
                                <label id = 'deleteLbl_{{id}}' class = 'annoActionsLbl'>Delete</label>\
                            </div>";
            }
            tmpl += "</div>\
                    </div>\
               </div >";
            return Mustache.render(tmpl, { id: id, name: name, description : description, url : url, shape : shape, shareTxt : shareTxt });
        },

        _createEditableAnnotationDataContol: function (id, name, description, url, shape, published, canPublish, canDelete) {
            var shareTxt = "Share";
            if (published) {
                shareTxt = "Unshare";
            }
            var tmpl = "\
                <div class='anDataControl' id='anno_{{id}}' annoID='{{id}}' > \
                    <div id='annodetails_{{id}}' class='detailsDiv'>\
                        <div id='innerDetailsContianer_{{id}}' class='innerDetailsContainer'>\
                            <div id='innerDetailsDiv_{{id}}' class='innerDetailsDiv'>\
                                <div id='annoHeader_{{id}}' class='annoheader'>\
                                    <input id='annoName_{{id}}' class='annoEditableTextArea annoName' value='{{name}}'/>\
                                    <div id='annoType_{{id}}' class='annoType {{shape}}Anno'></div>\
                                </div>\
                                <textarea id='annoDes_{{id}}' class='annoEditableTextArea annoDes annoDetails'>{{description}}</textarea>\
                                <input id='annoURL_{{id}}' class='annoEditableTextArea annoDes annoDetails' value='{{url}}'></label> \
                                <input id='annoColour_{{id}}' class='strokeColor annoColourControl'>  </input>\
                                <label id = 'saveLbl_{{id}}' class = 'annoActionsLbl'>Save</label>\
                                <label id = 'cancelLbl_{{id}}' class = 'annoActionsLbl'>Cancel</label>\
                            </div>\
                        </div>\
                        <div class='innerControls'>";
            if (canPublish) {
                tmpl += "<div id = 'publishDiv_{{id}}' class = 'annoActionsDiv publishBtn'>\
                    <div id ='publishAnnoIcon_{{id}}' class = 'publish' ></div>\
                    <label id = 'publishLbl_{{id}}' class = 'annoActionsLbl'>{{shareTxt}}</label > \
                </div>";
            }
            if (canDelete) {
                tmpl += "<div id = 'editDiv_{{id}}' class = 'annoActionsDiv editBtn'>\
                                <div id = 'editAnnoIcon_{{id}}' class = 'edit'></div>\
                                <label id = 'editLbl_{{id}}' class = 'annoActionsLbl'>Edit</label>\
                            </div>\
                            <div id = 'deleteDiv_{{id}}' class = 'annoActionsDiv deleteBtn'>\
                                <div id = 'deleteAnnoIcon_{{id}}' class = 'delete'></div>\
                                <label id = 'deleteLbl_{{id}}' class = 'annoActionsLbl'>Delete</label>\
                            </div>";
            }
            tmpl += "</div>\
                    </div>\
               </div >";
            return Mustache.render(tmpl, { id: id, name: name, description: description, url: url, shape: shape, shareTxt: shareTxt });
        },

        _createAnnotationHeaderContol: function (permissionSet) {
            var tmpl = "\
                <div class='anHeaderControl' id='anHeaderControl' > \
                    {{#permissions}} \
                      <div id='{{name}}' class='{{cssClass}}' onclick='{{event}}'>  </div>   \
                 {{/permissions}} \
                </div>";
            return Mustache.render(tmpl, permissionSet);
        },

        _getAnnotationObjectFromArray: function(array, key, val) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] == val) { return array[i]; }
            }
            return null;
        },

        _getIndexOfAnnotationObjectFromArray: function (array, key, val) {
            for (var i = 0; i < array.length; i++)
            {
                if (array[i][key] == val)
                {
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
            // Calculate new scale for annotations.
            var origImgSize = this.origImgSize;
            var newImgSize = this._getWindowImageSize();
            var ratioX = newImgSize.x / origImgSize.x;
            var ratioY = newImgSize.y / origImgSize.y;

            // Store the base and the current objects to restore them
            // together with the annotation holder.
            var base = this.base;
            var objects = this.objects;

            // Reset the annotation holder.
            this.destroy();
            this._init(base, false, this.creationPermissions);

            // This update is required for correct coordinate calculations.
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
        },

        _rotatePoint: function (origin)
        {
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
        _imageToGroupCoordinates: function (point)
        {
            var winCoords = this.base.viewer.viewport.imageToViewerElementCoordinates(point);
            return this._windowToGroupCoordinates(winCoords);
        },
        _imageToGroupWidth: function (width) {

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
        _windowToGroupCoordinates: function (point)
        {
            var coords = this.group.getPointByOrigin("left", "top"); // Get the top-left coords of the group.
            var currZoom = this.base.viewer.viewport.getZoom(true);
            return new OpenSeadragon.Point(((point.x - coords.x) / currZoom) - (this.group.width / 2),
                ((point.y - coords.y) / currZoom) - (this.group.height / 2));
        },
        enterEditMode: function () {
            var base = this.base;
            this.isEditMode = true;
            //objects are save so that they can be redrawn later
            var objects = this.objects;
            this.destroy();
            this._init(base, "#annoCanvas1", this.creationPermissions);
            this.base.viewer.setMouseNavEnabled(false);
            this.canvas.renderOnAddRemove = false;
            for (var i = 0; i < objects.length; i++) {
                this.group.add(objects[i].obj);
                this.objects.push(objects[i]);
            }
            this.canvas.renderOnAddRemove = true;
            this.update();
        },
        exitEditMode: function () {
            var base = this.base;
            this.isEditMode = false;
            this.base.viewer.setMouseNavEnabled(true);
            //objects are save so that they can be redrawn later
            var objects = this.objects;
            this.destroy();
            this._init(base, false, this.creationPermissions);
            this.canvas.isDrawingMode = false;
            this.canvas.renderOnAddRemove = false;
            for (var i = 0; i < objects.length; i++) {
                this.group.add(objects[i].obj);
                this.objects.push(objects[i]);
            }
            this.canvas.renderOnAddRemove = true;
            this.update();
        },
        _saveAnnotation: function (annotationObject, reload) {
            //add saving.. text in panel
            var activeAnno = 0;
            for (var i = 0; i < this.canvas._objects.length; i++) {
               
                if (this.canvas._objects[i].type != "group") {
                    activeAnno = i;
                }
            }

            if (annotationObject.ID > 0) {
                annotationObject.Name = $("#annoName_" + annotationObject.ID).val();
                annotationObject.Description = $("#annoDes_" + annotationObject.ID).val();
                annotationObject.Url = $("#annoURL_" + annotationObject.ID).val();
            }
            //update annotation object
            if (annotationObject.ID > 0)
            {
                var vxy = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(0, 0));
                var vwh;
                

                if (this.canvas._objects[activeAnno]._controlsVisibility != null) {
                    vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].currentWidth, this.canvas._objects[activeAnno].currentHeight));
                }
                else {
                    vwh = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].width, this.canvas._objects[activeAnno].height));
                }

                annotationObject.Width = parseInt(vwh.x - vxy.x);
                annotationObject.Height = parseInt(vwh.y - vxy.y);


                var coords = this.base.viewer.viewport.viewerElementToImageCoordinates(new OpenSeadragon.Point(this.canvas._objects[activeAnno].left, this.canvas._objects[activeAnno].top));
                annotationObject.X = parseInt(coords.x);
                annotationObject.Y = parseInt(coords.y);
                annotationObject.Color = this.canvas._objects[activeAnno].borderColor;
                annotationObject.AnnotationAngle = parseInt(this.canvas._objects[activeAnno].angle);
            }

            annotationObject.CanDeleteAnnotation = true;
            annotationObject.CanPublishAnnotation = pxl.options.menu.showPublishAnnotations;

            annotationObject.Z = parseInt(this.base.viewer.viewport.getZoom() * this.base.images[this.base.currentImage].info.mag);
            
            var tester = "[" + JSON.stringify(annotationObject) + "]";

            // call webservice
            var pThis = this;
            if (annotationObject.ID > 0) {
                ViewerWebService.SaveAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, tester, function (response) {

                    if (reload) {
                        pThis._loadAnnotation(annotationObject);
                    }
                    

                }, function () { alert("failed"); });
            } else {
                ViewerWebService.SaveAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, tester, function(response) {
                    annotationObject.ID = response;
                    pThis.addAnnotationToPanel(annotationObject);
                    if (reload) {
                        pThis._loadAnnotation(annotationObject);
                    }
                }, function() { alert("failed"); });
            }

            //update saving text

            //fade out saving text
            
        },
        _loadAnnotation: function(annotationObject) {
            this.destroy();
            var base = this.base;
            this._init(base, false, this.creationPermissions);
            this.canvas.isDrawingMode = false;
            this.base.viewer.setMouseNavEnabled(true);
            if (annotationObject.Shape == "rect") {
                this.base.annotations.addRectangle(new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annotationObject.AnnotationAngle, false, true);
            }
            else if (annotationObject.Shape == "ellipse") {
                this.base.annotations.addEllipse(new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annotationObject.AnnotationAngle, false, true);
            }
            
        },

        _editAnnotation: function (annotationObject) {
            this.base.annotations.enterEditMode();
            if (annotationObject.Shape == "rect") {
                this.base.annotations.addRectangle(new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annotationObject.AnnotationAngle, true, true);
            }
            else if (annotationObject.Shape == "ellipse") {
                this.base.annotations.addEllipse(new OpenSeadragon.Rect(annotationObject.X, annotationObject.Y, annotationObject.Width, annotationObject.Height), annotationObject.Color, annotationObject.Z, annotationObject.AnnotationAngle, true, true);
            }
        },

        _deleteAnnotation: function (annotationObject) {

            var annotationID = annotationObject.ID;
            var pThis = this;

            ViewerWebService.DeleteAnnotations($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, annotationID, function (response)
            {
                var annoIndex = pThis.base.annotations._getAnnotationObjectFromArray(pThis.base.annotations.completeAnnotationList, "ID", annotationID);
                pThis.base.annotations.completeAnnotationList.splice(annoIndex, 1);
                $('#anno_' + annotationID).remove();

            }, function () { PxlViewer.console.log("Could not delete annotation"); });
        },

        _publishAnnotation: function (annotationObject) {

            var annotationID = annotationObject.ID;

            ViewerWebService.ShareAnnotation($("#hiddenGuid").val(), this.base.images[this.base.currentImage].id, annotationID, function (response) {
                var labelText = $('#publishLbl_' + annotationID).text();
                if (labelText == "Share")
                {
                    $('#publishLbl_' + annotationID).text("Unshare");
                } else
                {
                    $('#publishLbl_' + annotationID).text("Share");
                }


            }, function () { PxlViewer.console.log("Could not share annotation"); });
        },
        /**
         * Returns the current window image size. That is, the size of the image currently in the window.
         * @function
         * @returns {OpenSeadragon.Point} - image size
         */
        _getWindowImageSize: function () {
            var vp = this.base.viewer.viewport;
            var info = this.base.images[this.base.currentImage].info;
            var topleft = vp.imageToViewerElementCoordinates(new OpenSeadragon.Point(0, 0));
            var bottomright = vp.imageToViewerElementCoordinates(new OpenSeadragon.Point(info.width - 1, info.height - 1));
            return new OpenSeadragon.Point(bottomright.x - topleft.x, bottomright.y - topleft.y);
        },

        /**
         * Creates a new rectangle annotation. The rect parameter specifies the
         * position and dimensions of the rectangle to be drawn, the coordinates
         * specified should be image coordinates.
         * @function
         * @param {OpenSeadragon.Rect} - rect
         * @param {String} - strokeColor - Specifies the rectangle's border color.
         */
        addRectangle: function (rect, strokeColor, zoom, angle,  allowEdit, driveToArea) {
            //left and right are currently dummy values for the constructor. THer are overwritten below in the group
            var newAnnotation = {
                type: 'rect',
                imageAngle:0,
                origDimensions: rect,
                obj: new fabric.Rect({
                    left: rect.x,
                    top: -9999,
                    width: rect.width,
                    height: rect.height,
                    fill: 'rgba(0,0,0,0)',
                    borderColor: strokeColor,
                    cornerColor: strokeColor,
                    cornerSize : 34,
                    stroke: strokeColor,
                    strokeWidth: 3,
                    selectable: allowEdit,
                    originX: "center",
                    originY: "center",
                    strokeLineJoin: "round",
                    angle: angle,
                    transparentCorners:false

        })};

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;
            this.editMode = allowEdit;

            if (allowEdit) {
                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;
                newAnnotation.obj.width = newAnnotation.origDimensions.width;
                newAnnotation.obj.height = newAnnotation.origDimensions.height;
                //add them to the annotation group

                this.canvas.add(newAnnotation.obj);
            } else {
                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;
                this.group.add(newAnnotation.obj);
               // this.canvas.add(this.group);
            }

            if (driveToArea) {
                this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle);
            }
//
            //this.base.viewer.viewport.zoomTo( this.base.viewer.viewport.imageToViewportZoom(newAnnotation.origZoom), new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y), true);
            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();
        },
        addEllipse: function (rect, strokeColor, zoom, angle, allowEdit, driveToArea) {
            //left and right are currently dummy values for the constructor. THer are overwritten below in the group
            var newAnnotation = {
                type: 'ellipse',
                imageAngle: 0,
                origDimensions: rect,
                obj: new fabric.Ellipse({
                    left: rect.x,
                    top: rect.y,
                    rx: rect.width,
                    ry: rect.height,
                    fill: 'rgba(0,0,0,0)',
                    borderColor: strokeColor,
                    cornerColor: strokeColor,
                    cornerSize: 34,
                    stroke: strokeColor,
                    strokeWidth: 3,
                    selectable: allowEdit,
                    originX: "center",
                    originY: "center",
                    //strokeLineJoin: "round",
                    angle: angle,
                    transparentCorners: false
                })
            };

            newAnnotation.isActive = true;
            newAnnotation.origStrokeWidth = newAnnotation.obj.strokeWidth;
            newAnnotation.origZoom = zoom;
            this.editMode = allowEdit;

            if (allowEdit) {
                var wincoords = this.base.viewer.viewport.imageToViewerElementCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = wincoords.x;
                newAnnotation.obj.top = wincoords.y;
                newAnnotation.obj.rx = newAnnotation.origDimensions.width;
                newAnnotation.obj.ry = newAnnotation.origDimensions.height;
                newAnnotation.obj.width = newAnnotation.origDimensions.width+100;
                newAnnotation.obj.height = newAnnotation.origDimensions.height + 100;

                newAnnotation.obj.rx = newAnnotation.obj.rx/2;
                newAnnotation.obj.ry = newAnnotation.obj.ry/2;



                this.canvas.add(newAnnotation.obj);
            } else {
                var grpCoords = this._imageToGroupCoordinates(new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y));
                newAnnotation.obj.left = grpCoords.x;
                newAnnotation.obj.top = grpCoords.y;
                this.group.add(newAnnotation.obj);
                // this.canvas.add(this.group);
            }

            if (driveToArea) {
                this.driveToArea(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y, newAnnotation.origZoom, newAnnotation.imageAngle);
            }
            //
            //this.base.viewer.viewport.zoomTo( this.base.viewer.viewport.imageToViewportZoom(newAnnotation.origZoom), new OpenSeadragon.Point(newAnnotation.origDimensions.x, newAnnotation.origDimensions.y), true);
            //add them back to the objects holder for easy access
            this.objects.push(newAnnotation);
            this.update();
        },

        toggleDrawingMode: function () {
            //these two lines are for debug
            /*this.addRectangle(new OpenSeadragon.Rect(0, 0, 200, 200), "red");
            this.canvas.renderAll(); return;*/

            var base = this.base;
            //objects are save so that they can be redrawn later
            var objects = this.objects;
            if (this.canvas.isDrawingMode)
            {
                //destroy is required here to remove the static canvas to make way for the writeable canavs
                this.destroy();
                this._init(base, false, this.creationPermissions);
                this.canvas.isDrawingMode = false;
                this.base.viewer.setMouseNavEnabled(true);
            }
            else
            {
                this.destroy();
                this._init(base, "body", this.creationPermissions);
                this.canvas.isDrawingMode = true;
                this.base.viewer.setMouseNavEnabled(false);
            }
            this.canvas.renderOnAddRemove = false;
            for (var i = 0; i < objects.length; i++)
            {
                this.group.add(objects[i].obj);
                this.objects.push(objects[i]);
            }
            this.canvas.renderOnAddRemove = true;
            this.update();
        },

        destroy: function () {
            this.canvas.clear();
            $(this.canvas.getElement()).remove();
            $(this.canvas.wrapperEl).remove();
            
            this.canvas.dispose();
           
            this.objects = null;
            this.group = null;
            this.canvas = null;
        }


    });

}(PxlViewer));

(function (PxlViewer) {
PxlViewer.SlideName = function (options, base) {
    this.options = {
        showControl: true,
        attachElementID: "viewertoppanel",
        holderID: "ViewerSlideNameHolder",
        className: null
    };
    this.internalProperties = {
        boxwidth: function () {
            return (parseInt(base.viewer.navigator.container.clientWidth) - 8) + "px";
        }
    };

    // Overrides default options with the passed in user options.
    $.extend(this.options, options);
    this.base = base;
    this._init();
};

$.extend(PxlViewer.SlideName.prototype, {
    /**
        * Generates and appends the SlideName's HTML into the <body>.
        **/
    _init: function() {
        if (this.canSeeSlideName()) {
        if (PxlViewer.util.IsNullOrEmpty(this.options.attachElementID)) {
            $('#viewerHolder').append("<div id='viewertoppanel'></div>");
            this.options.attachElementID = "viewertoppanel";
        }
            $('#viewertoppanel').show();
        if (PxlViewer.util.IsNullOrEmpty(this.options.holderID)) {
            this.options.holderID = "ViewerSlideNameHolder";
        }
        if (typeof this.html == 'undefined') {
                this.html = "<div id='" + this.options.holderID + "'" + (this.options.className != null ? " class='" + this.options.className + "'" : "") + " style='width:" + this.internalProperties.boxwidth() + "'>";
            this.html += "<span class='nameholder' title='" + this.base.images[this.base.currentImage].slideName + "'>" + this.base.images[this.base.currentImage].slideName + "</span>";
            this.html += "</div>";
        }

        var pThis = this;
        $('#' + this.options.attachElementID).html(this.html);
            this.base.viewer.navigator.addHandler("resize", function(args) {
            pThis.resize();
        });
            setTimeout("new PxlViewer.SlideName(pxl.options.menu, pxl).resize();", 100);
        } 
    },
    canSeeSlideName: function () {
        if (!PxlViewer.util.IsNullOrEmpty(this.base.images[this.base.currentImage].slideName)) {
            return true;
        }
        return false;
    },
    update: function() {
        $("#" + this.options.holderID + '>.nameholder').text(this.base.images[this.base.currentImage].slideName).attr("title", this.base.images[this.base.currentImage].slideName);
    },

    resize: function () {
        if (this.canSeeSlideName()) {
            $("#" + this.options.holderID).css('width', this.internalProperties.boxwidth());
            this.positionNavigator();
        }
    },
    positionNavigator : function() {
        $(".navigator").css('top', $('#' + this.options.holderID)[0].offsetHeight);
    },

    /**
        * Destroys the Slide Name holder. This means that all of its associated elements are removed.
        * @function
        */
    destroy: function ()
    {
        $('#' + this.options.holderID).remove();
    }
});
}(PxlViewer));