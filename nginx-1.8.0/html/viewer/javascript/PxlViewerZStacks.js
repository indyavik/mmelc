// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
    * Default ZStacks Properties on init
    * @function
    */
PxlViewer.ZStacks = function (base, options) {
    this.options = {
        showZStacks: true,
        activeFocusValue : -1
};

    // Overrides default options with the passed in user options.
    $.extend(this.options, options);
    this.base = base;
};

/**
    * Extends the ZStacks object with additonal functions
    * @function
    */
$.extend(PxlViewer.ZStacks.prototype, {
    init: function (base, creationPermissions) {
        this.creationPermissions = creationPermissions;
        this.base = base;
    },
    /**
        * Toggle ZStacks Panel and populate conten
        * @function
        * @param {Object} PxlViewer
        */
    toggleZStacksPanel: function (base, firstload) {
        var pThis = base;
        pThis.menu = new PxlViewer.Menu(pThis.options.menu, pThis);
        if (firstload) // firstload is used to ensure that when we move from slides that both have z-stacks that the slider is recycled and the menu is turned on . 
        {          
            $("#zStackRangeHolder").remove();
            pThis.menu.SetActiveOn(pThis.menu.options._menuIDs.zstacks);
            PxlViewer.ZStacks.createSlider(pThis);
            PxlViewer.ZStacks.bindHookupEvents(pThis);
			
			// If we have a stashed value, set it after loading so that we can reload the slider in the correct position
            if (this.options.stashedFocusValue != null)
            {
                $("#range").val(this.options.stashedFocusValue);
                this.options.stashedFocusValue = null;
            }
            return;
        }

        if ($("#menuZStacks").hasClass("menubadgeActive")) { //if the menu is active ( has the menubadgeActive class ), then turn the menu badge off and hide the slider . 
            pThis.menu.SetActiveOff(pThis.menu.options._menuIDs.zstacks);
            $("#zStackRangeHolder").remove();
            return;
        }

        if (($("#menuZStacks").hasClass("menubadge"))) { // if we arent loading the slide , we attempting to open the menu so open it .  
            pThis.menu.SetActiveOn(pThis.menu.options._menuIDs.zstacks);
            PxlViewer.ZStacks.createSlider(pThis);
            PxlViewer.ZStacks.bindHookupEvents(pThis);
			// If we have a stashed value, set it after loading so that we can reload the slider in the correct position
            if (this.options.stashedFocusValue != null)
            {
                $("#range").val(this.options.stashedFocusValue);
                this.options.stashedFocusValue = null;
            }
            return;
        }
    }
});
  
/**
        * Checks if there are ZStacks to show
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.ZStacks.isZStacksAvailable = function (base) {
    this.base = base;
    
    var layersCount = this.base.images[this.base.currentImage].info.layers;

    if (layersCount != null && layersCount > 2) {
        return true;
    } else {
        return false;
    }
};

PxlViewer.ZStacks.destroySlider = function () {

    $("#zStackRangeHolder").destroy();
};
/**
        * Gets a Count of the Z-stacks
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.ZStacks.getZStacksCount = function (base) {
    this.base = base;

    if (PxlViewer.ZStacks.isZStacksAvailable(base)) {
        return this.base.images[this.base.currentImage].info.layers;
    } else {
        return 0;
    }
};

/**
        * Gets the active Z-Stack 
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.ZStacks.getActiveFocusValue = function (base) { // get the active Focus ID . This may not be needed as the 
    var x = $("#range").val();
    if (this.base.zstacks != null && x != null) { // if z Stacks is not equal to null return the value of the slider which when set is equal to the active focus 
        return x;
    } else {
        return 0;
    }
};

/**
        * Creates a new Slider (noUiSlider) and appends it to the viewer . 
        * @function
        * @param {Object} PxlViewer
        */

PxlViewer.ZStacks.createSlider = function (base) {

    this.base = base;

    var bounds = {
        // set up of the bounds for the slider 
        max: Math.floor(Math.abs(PxlViewer.ZStacks.getZStacksCount(base) / 2)),
        min: Math.floor(Math.abs(PxlViewer.ZStacks.getZStacksCount(base) / 2)) * -1
    };
    var tmpl = '<div id = "zStackRangeHolder" class= "rangeHolder"> <div id ="up"></div>' + '<div id = "range">' + '</div><div id ="down"></div></div>';
    $("#viewerHolder").append(tmpl);
    
    $('#range').noUiSlider({
        orientation: "vertical",
        direction:"rtl", // right to left e.g -4-3-2-1 0 1 2 3 4
        start: [0],
        range: {
            'min': [bounds.min], // min val 
            'max': [bounds.max] // max val 
        },
        step: 1 // amount we want the value to change when we move the slider each time 
    });
	
	    pxl.viewer.drawer.maxImageCacheCount = (bounds.max - bounds.min) * 100;
    pxl.viewer.drawer.ZStackCanvasCache = [];
    pxl.viewer.drawer.isZCacheAutoPreCaching = false;
    pxl.viewer.drawer.tilesMatrixBackup = null;

    //console.log("isZCacheAutoPreCaching = " + pxl.viewer.drawer.isZCacheAutoPreCaching);

    pxl.viewer.drawer.sliderValue = parseInt($("#range").val());
};
PxlViewer.ZStacks.HookupEvents = {
    updateZstacks: function () {
        var region = pxl.regions.options.activeStackId;
        var sliderValue = parseFloat($("#range").val());
        if (pxl.regions.options.CDTimer != undefined) {
            window.clearTimeout(pxl.regions.options.CDTimer);
        }

        pxl.viewer.drawer.sliderValue = sliderValue;
        pxl.viewer.drawer.isZCacheAutoPreCaching = false;
        //console.log("isZCacheAutoPreCaching = " + pxl.viewer.drawer.isZCacheAutoPreCaching);
        pxl.loadZStacks(pxlViewerBase.Images[pxl.currentImage], sliderValue, region);
    },

    // Focus in when the up key is pressed
    up: function () {
        if ($('#' + pxl.menu.options._menuIDs.zstacks).hasClass('menubadgeActive'))
        {
            var sliderValue = parseInt($("#range").val());
            var sliderMax = $('#range').noUiSlider('options').range.max[0];

            if (sliderValue < sliderMax) {
                pxl.regions.options.activeStackId = sliderValue;

                sliderValue = sliderValue + 1.00;
                $("#range").val(sliderValue);
                this.updateZstacks();
            }
        }
    },

    // Focus out when the down key is pressed
    down: function ()
    {
        if ($('#' + pxl.menu.options._menuIDs.zstacks).hasClass('menubadgeActive'))
        {
            var sliderValue = parseInt($("#range").val());
            var sliderMin = $('#range').noUiSlider('options').range.min[0];

            if (sliderValue > sliderMin) {
                pxl.regions.options.activeStackId = sliderValue;

                sliderValue = sliderValue - 1.00;
                $("#range").val(sliderValue);
                this.updateZstacks();
            }
        }
    }
};
/**
        * Binds Hookup events to the slider . 
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.ZStacks.bindHookupEvents = function (base) {
        var viewer = base;
        var image = viewer.images[viewer.currentImage];
       $("#range").on({
        slide: function () {
            //console.log("range slide handler");
            PxlViewer.ZStacks.HookupEvents.updateZstacks();
        }
    });
   
        $("#up").mouseup (function () {
                PxlViewer.ZStacks.HookupEvents.up();
            }
        );

        $("#down").mouseup(function () {
            PxlViewer.ZStacks.HookupEvents.down();
        }
    );
	
	 if (!pxl.viewer.getHandler('drawing-completed')) {
        pxl.viewer.addHandler('drawing-completed', function (event) {
            //console.log("drawing-complete event - isAnimating = " + pxl.viewer.drawer.viewport.isAnimating);
            //        console.log("isAnimating = " + pxl.viewer.drawer.viewport.isAnimating);
            if (pxl.viewer.drawer.viewport.isAnimating)
            {
                pxl.options.drawToBackgroundCanvasWhenAnimationIsFinished = true;
            }
            else
            {
                pxl.copyCurrentImageToBackgroundCanvas();
            }
        });
    }

    if (!pxl.viewer.getHandler('animation-finish')) {
        pxl.viewer.addHandler("animation-finish", function (event) {
            //console.log("animation-finish event");
            if (pxl.options.drawToBackgroundCanvasWhenAnimationIsFinished === true) {
                pxl.copyCurrentImageToBackgroundCanvas();
                pxl.options.drawToBackgroundCanvasWhenAnimationIsFinished = false;
            }
        });
    }
	
};

/**
        * Destroys the Z-Stack slider . 
        * @function
        * @param {Object} PxlViewer
        */

PxlViewer.ZStacks.destroySlider = function () {
    $("#zStackRangeHolder").remove();
};