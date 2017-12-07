/// <reference path="PxlSlideLabel.js" />
/// <reference path="PxlViewer.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL
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
                return (base.viewer.navigator != null ? (parseInt(base.viewer.navigator.container.clientWidth) + 4) : 0) + "px";
            }
        };

        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
        this._init();
    };
    this.internalProperties = {
        boxwidth: function () {
            return (base.viewer.navigator != null ? (parseInt(base.viewer.navigator.container.clientWidth) - 8) : 0) + "px";
        },
        resizeTimeout: null
    };

    $.extend(PxlViewer.SlideName.prototype, {
        /**
            * Generates and appends the SlideName's HTML into the <body>.
            **/
        _init: function () {
            PxlViewer.util.Debug.log("SlideName._init");
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

                $('#' + this.options.attachElementID).append(this.html);

                setTimeout("if (pxl.SlideName != undefined) { pxl.SlideName.resize(); }", 100);
            }
        },
        /***
        * This will check if the currently viewed slide can have the slide name visible,
        * if it can it make s it visible or updates it, otherwise it hides it
        ***/
        Refresh: function () {
            PxlViewer.util.Debug.log("SlideName.Refresh");
            if (this.canSeeSlideName()) {
                if ($("#" + this.options.holderID).length == 0) {

                    this._init();
                } else {

                    this.update();
                }
            } else {

                this.destroy();
            }
        },
        canSeeSlideName: function () {
            PxlViewer.util.Debug.log("SlideName.canSeeSlideName");
            if (this.base.viewer.navigator != null) {
                if (!PxlViewer.util.IsNullOrEmpty(this.base.images[this.base.currentImage].slideName)) {
                    return true;
                }
            }
            return false;
        },
        update: function () {
            this.destroy(); // destroy the old slidename object , we need a new one to display the latest slidename and have the correct height and width mesurements .
            this.base.slideName = new PxlViewer.SlideName(this.base.options.SlideName, this.base); // create the new object so we have an up to date slide name object .
            $("#" + this.options.holderID + '>.nameholder').text(this.base.images[this.base.currentImage].slideName);
            this.resize();
        },

        resize: function () {
            PxlViewer.util.Debug.log("SlideName.resize");
            if (this.canSeeSlideName() && this.internalProperties.resizeTimeout == null) {
                this.internalProperties.resizeTimeout = setTimeout("pxl.SlideName.resizeevent();", 50);
            }
        },
        resizeevent: function () {
            $("#" + this.options.holderID).css('width', this.internalProperties.boxwidth());
            this.positionNavigator();
            this.internalProperties.resizeTimeout = null;
        },
        positionNavigator: function() {
            PxlViewer.util.Debug.log("SlideName.positionNavigator");
            $(".navigator").css({'top': $('#' + this.options.attachElementID)[0].offsetHeight});
        },
        hide: function () {
            PxlViewer.util.Debug.log("SlideName.hide");
            $('#' + this.options.holderID).hide();
            this.positionNavigator();
        },
        show: function () {
            PxlViewer.util.Debug.log("SlideName.show");
            if (this.canSeeSlideName()) {
                $('#' + this.options.holderID).show();
                this.positionNavigator();
            }
        },

        /**
            * Destroys the Slide Name holder. This means that all of its associated elements are removed.
            * @function
            */
        destroy: function () {
            PxlViewer.util.Debug.log("SlideName.destroy");
            $('#' + this.options.holderID).remove();
        }
    });
}(PxlViewer));