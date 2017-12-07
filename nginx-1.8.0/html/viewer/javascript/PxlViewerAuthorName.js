/// <reference path="PxlSlideLabel.js" />
/// <reference path="PxlViewer.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL
(function (PxlViewer) {
    PxlViewer.AuthorName = function (options, base) {
        this.options = {
            showControl: true,
            attachElementID: "viewertoppanel",
            holderID: "ViewerAuthorNameHolder",
            cssclassName: null
        };
        this.internalProperties = {
            boxwidth: function () {
                return (base.viewer != null && base.viewer.navigator != null ? (parseInt(base.viewer.navigator.container.clientWidth) + 4) : 0) + "px";
            },
            resizeTimeout: null
        };

        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
        this._init();
    };

    $.extend(PxlViewer.AuthorName.prototype, {
        /**
            * Generates and appends the AuthorsName's HTML into the <body>.
            **/
        _init: function () {
            PxlViewer.util.Debug.log("AuthorName._init");
            if (this.canSeeAuthorName()) {
                if (PxlViewer.util.IsNullOrEmpty(this.options.attachElementID)) {
                    if ($('#viewertoppanel').length == 0) {
                        $('#viewerHolder').append("<div id='viewertoppanel'></div>");
                    }
                    this.options.attachElementID = "viewertoppanel";
                }
                if (PxlViewer.util.IsNullOrEmpty(this.options.holderID)) {
                    this.options.holderID = "ViewerAuthorNameHolder";
                }
                if (typeof this.html == 'undefined') {
                    this.html = "<div id='" + this.options.holderID + "'" + (this.options.cssclassName != null ? " class='" + this.options.cssclassName + "'" : "") + " style='width:" + this.internalProperties.boxwidth + ";'>";
                    this.html += "<span class='nameholder' title='" + this.base.images[this.base.currentImage].authorName + "'>" + this.base.images[this.base.currentImage].authorName + "</span>";
                    this.html += "</div>";
                }

                var pThis = this;

                $('#' + this.options.attachElementID).append(this.html);

                setTimeout("if (pxl.AuthorName != undefined) { pxl.AuthorName.resize(); }", 50);
            }
        },
        /***
        * This will check if the currently viewed slide can have the author name visible,
        * if it can it makes it visible or updates it, otherwise it hides it
        ***/
        Refresh: function () {
            PxlViewer.util.Debug.log("AuthorName.Refresh");
            if (this.canSeeAuthorName()) {
                if ($("#" + this.options.holderID).length == 0) {
                    this._init();
                } else {
                    this.update();
                }
            } else {
                this.destroy();
            }
        },
        canSeeAuthorName: function () {
            PxlViewer.util.Debug.log("AuthorName.canSeeAuthorName");
            if (this.base.viewer.navigator != null) {
                if (!PxlViewer.util.IsNullOrEmpty(this.base.images[this.base.currentImage].authorName)) {
                    return true;
                }
            }
            ;
            return false;
        },

        update: function () {
            PxlViewer.util.Debug.log("AuthorName.update");
            $("#" + this.options.holderID + '>.nameholder').text(this.base.images[this.base.currentImage].authorName).attr("title", this.base.images[this.base.currentImage].authorName);
        },

        resize: function () {
            PxlViewer.util.Debug.log("AuthorName.resize");
            if (this.canSeeAuthorName() && this.internalProperties.resizeTimeout == null) {
                this.internalProperties.resizeTimeout = setTimeout("pxl.AuthorName.resizeevent();", 100);
            }
        },
        resizeevent: function () {
            PxlViewer.util.Debug.log("AuthorName.resizeevent");
            $("#" + this.options.holderID).css('width', this.internalProperties.boxwidth());
            this.positionNavigator();
            this.internalProperties.resizeTimeout = null;
        },
        positionNavigator: function () {
            PxlViewer.util.Debug.log("AuthorName.positionNavigator");
            $(".navigator").css('top', $('#' + this.options.attachElementID)[0].offsetHeight);
        },
        hide: function () {
            PxlViewer.util.Debug.log("AuthorName.hide");
            $('#' + this.options.holderID).hide();
            this.positionNavigator();
        },
        show: function () {
            PxlViewer.util.Debug.log("AuthorName.show");
            if (this.canSeeAuthorName()) {
                $('#' + this.options.holderID).show();
                this.positionNavigator();
            }
        },
        /**
            * Destroys the Slide Name holder. This means that all of its associated elements are removed.
            * @function
            */
        destroy: function () {
            PxlViewer.util.Debug.log("AuthorName.destroy");
            $('#' + this.options.holderID).remove();
        }
    });
}(PxlViewer));