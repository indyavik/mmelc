/// <reference path="PxlViewer.js" />
/// <reference path="./Core/PRES/js/util.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
* Default SlideLabel Properties on init
* @function
*/
(function (PxlViewer) {
    PxlViewer.SlideLabel = function (options, base) {
        this.defaultattachElementID = "viewerBelowNavigatorPanel";
        this.defaultholderID = "ViewerSlideLabelHolder";
        var pThis = this;
        this.options = {
            elementVisible: false,
            attachElementID: pThis.defaultattachElementID,
            holderID: pThis.defaultholderID,
            className: null,
            labelwidth: 180,
            active: false
    };
        this.internalProperties = {
            boxwidth: function () {
                return (parseInt(base.viewer.navigator.container.clientWidth) - 8) + "px";
            }
        };
        
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
    };

    $.extend(PxlViewer.SlideLabel.prototype, {
        /**
        * Generates and appends the SlideLabel's HTML into the <body>.
        **/
        _init: function () {
            var pThis = this;
            var addLabelClass = " ";
            if (!this.canSeeSlideLabel()) {
                addLabelClass += "hidden";
            }
            if (PxlViewer.util.IsNullOrEmpty(this.options.attachElementID)) {
                this.options.attachElementID = this.defaultattachElementID;
            }
            if (PxlViewer.util.IsNullOrEmpty(this.options.holderID)) {
                this.options.holderID = this.defaultholderID;
            }
            if ($('#' + this.options.attachElementID).length == 0) {
                $('#viewerHolder').append("<div id='" + this.options.attachElementID + "'></div>");
            }
            $('#' + this.options.attachElementID).show();

            if (typeof this.html == 'undefined') {
                this.html = "<div id='" + this.options.holderID + "'" + (this.options.className != null ? " class='" + this.options.className + addLabelClass + "'" : "") + ">";
                this.html += "<div class='ViewerSlideLabelNameHolder'>Label</div>";
                this.html += "<img src='" + this.base.images[this.base.currentImage].url + "?GetLabel?width=" + this.options.labelwidth + "' alt='SlideLabel' />";
                this.html += "</div>";
            }
            $('#' + this.options.attachElementID).html(this.html);
            this.base.viewer.navigator.addHandler("resize", function (args) {
                pThis.resize();
            });
            setTimeout("pxl.SlideLabel.resize();", 100);
            
        },
        /**
        * to be called on update to load a different label
        **/
        update: function() {
            $('#' + this.options.holderID + " > img").attr("src", this.base.images[this.base.currentImage].url + "?GetLabel?width=" + this.options.labelwidth);
            this.resize();
        },
        toggleVisibility: function () {
            this.options.elementVisible = !this.options.elementVisible;
            this.resize();
        },
        resize: function () {
            if (this.base.menu.options.showLabelLink) {
                if (!this.options.active) {
                    var topPosition = parseFloat($(".navigator").offset().top) + parseFloat($(".navigator")[0].offsetHeight);
                    var imageWidth = this.options.labelwidth;
                    $('#' + this.options.attachElementID).css("top", topPosition + "px");
                    $('#' + this.options.attachElementID + " > img").css("width", imageWidth + "px");
                    if (this.options.elementVisible && this.canSeeSlideLabel()) {
                        $('#' + this.options.holderID).show();
                        pxl.menu.SetActiveOn(pxl.menu.options._menuIDs.label);
                    } else {
                        $('#' + this.options.holderID).hide();
                        pxl.menu.SetActiveOff(pxl.menu.options._menuIDs.label);
                        this.options.active = false;
                    }
                }
            }
        },
        canSeeSlideLabel: function () {
            if (this.base.menu.options.showLabelLink &&
                this.base.images[this.base.currentImage].info.label == 1) {
                return true;
            }
            return false;
        },
        hide: function () {
            if ($("#" + pxl.menu.options._menuIDs.label).hasClass('menubadgeActive')) {
                this.options.active = true;
            }
            $('#' + this.options.holderID).hide();
        },
        show: function() {
            if (this.base.menu.options.showLabelLink &&
                this.base.images[this.base.currentImage].info.label == 1 && this.options.active) {
                $('#' + this.options.holderID).show();
                this.options.active = false;
            }
        },
        /**
        * Destroys the SlideLabel holder. This means that all of its associated elements are removed.
        * @function
        */
        destroy: function () {
            $('#' + this.options.holderID).remove();
        }
    });
}(PxlViewer));