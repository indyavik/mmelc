/// <reference path="PxlViewer.js" />
// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
* Default Heatmap Properties on init
* @function
*/
(function (PxlViewer) {
    PxlViewer.Heatmap = function (options, base) {
        var pThis = this;
        this.options = {
            isVisible: false
        };
        
        // Overrides default options with the passed in user options.
        $.extend(this.options, options);
        this.base = base;
    };

    $.extend(PxlViewer.Heatmap.prototype, {
        /**
        * Generates and appends the Heatmap's HTML into the <body>.
        **/
        _init: function () {
            var pThis = this;
           
        },
        
        /**
        * Destroys the Heatmap holder. This means that all of its associated elements are removed.
        * @function
        */
        destroy: function () {
            
        }
    });
}(PxlViewer));