var gViewer; // Global OpenSeaDragon viewer instance.
var gImageInfo; // Global image info object.

// Some tracked state
var isFullScreen = false; // TODO: Dom: we should get OpenSeaDragon to export this.

// Beta pinch rotate
var pinching = false;
var initialPinchPos;

function getMenu(guid, resID, optCallback) {
    ViewerWebService.GetViewerMenu(guid, resID,
        function (resp) {
            onGetViewerMenuSuccess(resp);
            if (optCallback != undefined) {
                optCallback();
            }
        },
        function () {
            // TODO: Error.
        });
}

function parseDirList(dirList)
{
    return dirList.split("|");
}

function getInfoCallback(info) {
    gImageInfo = info;
    var dirList = parseDirList(info.dirList);
    var hiddenUrl = $("#hiddenUrl").val();
    var hiddenGuid = $("#hiddenGuid").val();
    var hiddenResID = $("#hiddenResID").val();
    gViewer = new OpenSeadragon({
        id: "view",
        tileSources: {
            height: parseInt(info.height),
            width: parseInt(info.width),
            tileSize: parseInt(info.tileWidth),
            minLevel: 0,
            maxLevel: 9,
            tileOverlap: 0,
            getTileUrl: function (level, x, y) {
                var zoom = Math.pow(2, 9 - level);
                
                for (var i = 1; i < dirList.length; i++)
                {
                    if (zoom == Math.floor(parseFloat(dirList[i])))
                    {
                        zoom = parseFloat(dirList[i]);
                    }
                }

                var w = parseInt(info.tileWidth);
                var h = parseInt(info.tileHeight);
                var x2 = x * w;
                var y2 = y * h;
                return hiddenUrl + "?" +
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
        /*gestureSettingsMouse: { flickEnabled: true, flickMinSpeed: 40, flickMomentum: 0.5 },*/
    });

    gViewer.addHandler("pan", function () {
        // Hide drawers, menus and panels.

        if ($('#magnificationDrawer.drawer').hasClass("active")) {
            $('#menuMagnification.drawerBtn').mouseup();
        }

        if ($('#viewMenuPanel.menu').hasClass("active")) {
            $('#menuView.menuBtn').mouseup();
        }
    });

    gViewer.addHandler("full-screen", function (args) {
        if (args.fullScreen) {
            getMenu(hiddenGuid, hiddenResID, function () {
                // Hide every non-special button. Currently this
                // hides everything except the fullscreen button.
                $('#viewerMenu > div:not(.special)').remove();

                $("#menuFullScreen").addClass("isFullScreen");
            });
        }
        else {
            $('#viewerMenu').remove();
        }

    });

    gViewer.addHandler("canvas-pinch", function (args) {
        function angleBetweenGestures(gesture1, gesture2)
        {
            var angle1 = Math.atan2(gesture1.currentPos.y - gesture2.currentPos.y, gesture1.currentPos.x - gesture2.currentPos.x);
            var angle2 = Math.atan2(gesture1.lastPos.y - gesture2.lastPos.y, gesture1.lastPos.x - gesture2.lastPos.x)
            return (angle1 - angle2) * (180/Math.PI);
        }
        gViewer.viewport.setRotation(gViewer.viewport.getRotation() + angleBetweenGestures(args.gesturePoints[0], args.gesturePoints[1]));
        
    });

    filterButtons()
}

function filterButtons() {
    // Remove magnifications unsupported by this image.
    if (gImageInfo) {
        if (gImageInfo.mag < 83) {
            $('#mag83').remove();
        }
        if (gImageInfo.mag < 40) {
            $('#mag40').remove();
        }
        if (gImageInfo.mag < 20) {
            $('#mag20').remove();
        }
        if (gImageInfo.mag < 10) {
            $('#mag10').remove();
        }
        if (gImageInfo.mag < 5) {
            $('#mag5').remove();
        }
        if (gImageInfo.mag < 2.5) {
            $('#mag2_5').remove();
        }
        if (gImageInfo.mag < 1) {
            // Surely we should support at least this button.
            // TODO: Error message?
        }

        if (gImageInfo.stacks <= 1) {
            // TODO: Commented this for testing.
            //$('#menuLayers').remove();
        }
        var elem = $('#view')[0];
        if (!elem.msRequestFullscreen && !elem.requestFullscreen && !elem.mozRequestFullScreen && !elem.webkitRequestFullscreen)
        {
            // Remove the fullscreen button if fullscreen is not supported.
            $('#menuFullScreen').remove();
        }
    }
}

function slideOut(btn, selector, fullWidth, useRight) {
    if ($(btn).parent().children(selector).hasClass("active")) {
        $(btn).animate({ "left": "+=" + (fullWidth + 40) + "px" }, 500);

        var animOptions = { "left": "+=" + fullWidth + "px", "opacity": "0" };
        if (useRight) {
            animOptions.left = undefined;
            animOptions.right = "-=" + fullWidth + "px";
        }

        $(btn).parent().children(selector).animate(animOptions,
            {
                "duration": 500,
                "complete": function () { $(btn).parent().children(selector).hide(); }
            });
        $(btn).parent().children(selector).removeClass("active");
        $(btn).removeClass("active");
    }
    else {

        var animOptions = { "left": "-=" + fullWidth + "px" };
        if (useRight) {
            animOptions.left = undefined;
            animOptions.right = "0px";
        }

        $(btn).parent().children(selector).show();
        $(btn).css("position", "absolute");
        $(btn).css("left", "-40px");
        $(btn).animate({ "left": "-=" + (fullWidth) + "px" }, 500);
        $(btn).parent().children(selector).css("opacity", "1");
        $(btn).parent().children(selector).animate(animOptions, 500);
        $(btn).parent().children(selector).addClass("active");
        $(btn).addClass("active");
    }
}

function calculateDrawerWidth(drawerBtn) {
    var wasShown = $(drawerBtn).parent().children(".drawer").is(':visible');
    $(drawerBtn).parent().children(".drawer").show(); // We need to show it here, otherwise clientWidth is 0.

    var firstDrawerBtn = $(drawerBtn).parent().find(".drawer > div:first");
    var drawerBtnWidth = firstDrawerBtn[0].clientWidth + parseFloat(firstDrawerBtn.css("marginLeft")) + parseFloat(firstDrawerBtn.css("marginRight"));
    var btnCount = $(drawerBtn).parent().children(".drawer").children("div").length;
    var fullDrawerWidth = (drawerBtnWidth * btnCount) - 21;
    if (!wasShown) { $(drawerBtn).parent().children(".drawer").hide(); }
    return fullDrawerWidth;
}

function calculateMenuWidth(menuBtn) {
    $(menuBtn).parent().children(".menu").show();
    var result = $(menuBtn).parent().children(".menu")[0].clientWidth;
    $(menuBtn).parent().children(".menu").css("left", "0");
    $(menuBtn).parent().children(".menu").css("width", "900px"); // Get rid of wrapping of text.
    $(menuBtn).parent().children(".menu").hide();
    return result;
}

function calculatePanelWidth(menuBtn) {
    $(menuBtn).parent().children(".panel").show();
    var result = $(menuBtn).parent().children(".panel")[0].clientWidth;
    $(menuBtn).parent().children(".panel").css("right", "-310px");
    $(menuBtn).parent().children(".panel").hide();
    return result - 40;
}

function onGetViewerMenuSuccess(resp) {
    $('body').append(resp);
    $('#menuFullScreen').mouseup(function () {
        gViewer.setFullScreen(!isFullScreen);
        isFullScreen = !isFullScreen;
    });

    $('.drawerBtn').mouseup(function () {
        slideOut(this, ".drawer", calculateDrawerWidth(this));
    });

    var menuWidth = calculateMenuWidth($('.menuBtn'));
    $('.menuBtn').mouseup(function () {
        slideOut(this, ".menu", menuWidth);
    });

    var panelWidth = calculatePanelWidth($('.panelBtn'));
    $('.panelBtn').mouseup(function () {
        slideOut(this, ".panel", panelWidth, true);
    });


    $('.setMag').mouseup(function () {
        var center = gViewer.viewport.getCenter(false);
        var magTxt = "";
        switch ($(this).get(0).id) {
            case "mag1":
                gViewer.viewport.goHome(false);
                magTxt = "x1";
                break;
            case "mag2_5":
                gViewer.viewport.zoomTo(gViewer.viewport.imageToViewportZoom(2.5 / gImageInfo.mag), center, false);
                magTxt = "x2.5";
                break;
            case "mag5":
                gViewer.viewport.zoomTo(gViewer.viewport.imageToViewportZoom(5 / gImageInfo.mag), center, false);
                magTxt = "x5";
                break;
            case "mag10":
                gViewer.viewport.zoomTo(gViewer.viewport.imageToViewportZoom(10 / gImageInfo.mag), center, false);
                magTxt = "x10";
                break;
            case "mag20":
                gViewer.viewport.zoomTo(gViewer.viewport.imageToViewportZoom(20 / gImageInfo.mag), center, false);
                magTxt = "x20";
                break;
            case "mag40":
                gViewer.viewport.zoomTo(gViewer.viewport.imageToViewportZoom(40 / gImageInfo.mag), center, false);
                magTxt = "x40";
                break;
            case "mag83":
                gViewer.viewport.zoomTo(gViewer.viewport.imageToViewportZoom(83 / gImageInfo.mag), center, false);
                magTxt = "x83";
                break;
        }
        $(this).parent().parent().children(".drawerBtn").attr("class", "drawerBtn " + $(this).get(0).id);
        $(this).parent().parent().find(".drawerBtn .currentMag").text(magTxt);
    });

    $('.rotateBtn').mouseup(function () {
        var center = gViewer.viewport.getCenter(false);
        switch ($(this).get(0).id) {
            case "rotate0":
                gViewer.viewport.setRotation(0);
                break;
            case "rotate90":
                gViewer.viewport.setRotation(90);
                break;
            case "rotate180":
                gViewer.viewport.setRotation(45);
                break;
            case "rotate270":
                gViewer.viewport.setRotation(270);
                break;

        }
        $(this).parent().parent().children(".drawerBtn").attr("class", "drawerBtn " + $(this).get(0).id);
    });

    filterButtons();
}

$(document).ready(function () {
    getMenu($("#hiddenGuid").val(), $("#hiddenResID").val());

    YUI().use('dial', function (Y) {

        var dial = new Y.Dial({
            min: -180,
            max: 180,
            stepsPerRevolution: 180,
            value: 0,
            strings: { label: 'Rotation', resetStr: 'Reset', tooltipHandle: 'Drag to rotate' },
            after: {
                valueChange: function (e) {
                    gViewer.viewport.setRotation(e.newVal);

                }
            }
        });
        dial.render('#rotateDial');

    });
});