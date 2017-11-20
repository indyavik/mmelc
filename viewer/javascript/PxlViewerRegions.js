// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
    * Default Regions Properties on init
    * @function
    */
PxlViewer.Regions = function (base, options) {
    PxlViewer.util.Debug.warn("Regions.base");
    this.options = {
        showRegions: true,
        showImageName: true,
        activeStackId: -1
    };

    // Overrides default options with the passed in user options.
    $.extend(this.options, options);
    this.base = base;
};

/**
    * Creates a Region object and populates attributes using the Stack ID
    * @function
    */
Region = function (stackIdVal, base) {

    if (stackIdVal != null && base != null) {
        this.base = base;
        var stacksStr = this.base.images[this.base.currentImage].info.stackArr;
        var stackPwStr = this.base.images[this.base.currentImage].info.stackPW;
        var stackPhStr = this.base.images[this.base.currentImage].info.stackPH;
        var stackArray = stacksStr.split("|");
        var currentStack = stackArray[stackIdVal];
        var currentStackAttributes = currentStack.split("$");

        var stackX = currentStackAttributes[1];
        var stackY = currentStackAttributes[2];
        var stackWidth = currentStackAttributes[3];
        var stackHeight = currentStackAttributes[4];
        var stackMag = currentStackAttributes[5];

        this.attributes = {
            stackID: stackIdVal,
            mag: stackMag,
            x: stackX,
            y: stackY,
            width: stackWidth,
            height: stackHeight,
            stackPW: stackPwStr,
            stackPH: stackPhStr
        };

        this.base = base;
    }
};

/**
    * Extends the Regions object with additonal functions
    * @function
    */
$.extend(PxlViewer.Regions.prototype, {
    init: function (base, creationPermissions) {
        PxlViewer.util.Debug.log("Regions.init");
        this.creationPermissions = creationPermissions;
        this.base = base;
    },
    /**
        * Toggle Regions Panel and populate contents
        * @function
        * @param {Object} PxlViewer
        */
    toggleRegionsPanel: function (base) {
        PxlViewer.util.Debug.log("Regions.toggleRegionsPanel");
        var pThis = base;
        pThis.menu = new PxlViewer.Menu(pThis.options.menu, pThis);
        
        if (($("#leftMenuHolder").hasClass('menuexpanded') && $('#leftPanel').is(":visible")) && $("#regionsHeader").length) {
            pThis.menu.SetActiveOffAllPanelItems();
            pThis.menu._shrinkPanel();
        }
        else if (($("#leftMenuHolder").hasClass('menuexpanded') && $('#leftPanel').is(":visible")) && $("#regionsHeader").length == 0) {
            pThis.menu.SetActiveOffAllPanelItems();
            pThis.menu.SetActiveOn(pThis.menu.options._menuIDs.regions);
            PxlViewer.Regions.getRegions(pThis);
        } else {
            pThis.menu.SetActiveOffAllPanelItems();
            pThis.menu.SetActiveOn(pThis.menu.options._menuIDs.regions);
            pThis.menu._expandPanel();
            PxlViewer.Regions.getRegions(pThis);
        }
        if(pThis.annotations.canvas != null){pThis.annotations.canvas.clear();}
    },

    /**
        * Checks if there are regions to show
        * @function
        * @param {Object} PxlViewer
        */
    isRegionsAvailable: function (base) {
        PxlViewer.util.Debug.log("Regions.isRegionsAvailable");
        this.base = base;
        var stackCount = this.base.images[this.base.currentImage].info.stacks;

        if (stackCount != null && stackCount > 1) {
            return true;
        } else {
            return false;
        }
    }
});
PxlViewer.Regions.CreateRegionsThumbnailMasterArray = function (base) {
    PxlViewer.util.Debug.log("Regions.CreateRegionsThumbnailMasterArray");
    var regions = [];
    var regionCount = PxlViewer.Regions.getRegionsCount(base);
    var currentImageKey = this.base.currentImage;
    for (i = 0; i < regionCount; i++) {
        var region = new Region(i, this.base);
        region.regKey = i;
        region.imgKey = currentImageKey;
        region.imgSrc = this.base.images[currentImageKey].url + "?getthumbnail?height=100&compression=100&stackid=-1";

        // Check if the mag is a number - if so append 'x'
        if (isNaN(region.attributes.mag)) {
            region.attributes.magDisplay = region.attributes.mag;
        } else {
            region.attributes.magDisplay = region.attributes.mag + "x";
        }

        regions.push(region);
    }
    return regions;
}
PxlViewer.Regions.CreateRegionsThumbnailArray = function (base) {
    PxlViewer.util.Debug.log("Regions.CreateRegionsThumbnailArray");
    var masterArray = this.CreateRegionsThumbnailMasterArray(base);
    var regionCount = masterArray.length;
    var thumbarray = [];
    for (i = 0; i < regionCount; i++) {
        thumbarray.push(masterArray[i].imgSrc);
    }
    return thumbarray;
}
/**
        * Gets the Regions markup on loads it on the page
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Regions.getRegions = function (base) {
    PxlViewer.util.Debug.log("Regions.getRegions");
    var regionCount = PxlViewer.Regions.getRegionsCount(this.base);
    var viewer = this.base;
    var currentImageKey = viewer.currentImage;

    var img = new Object();
    img.imgSrc = this.base.images[currentImageKey].url + "?getthumbnail?height=100&compression=100&stackid=-1";
    var regions = this.CreateRegionsThumbnailMasterArray(this.base);

    var regionsDetails = { 'regionsDetails': regions };
    var regionsCount = PxlViewer.Regions.getRegionsCount(this.base);

    // Get and Set HTML
    $("#leftPanel").html(PxlViewer.Regions.createRegions(base, regionsDetails, regionsCount));

    // loops through each image and sizes/positions the overlay boxes
    $(".regionImage").each(function () {

        // Get width of parent 'regionItem' - thumbnail cannot be wider than this
        var maxWidthAvail = $(this).parent().parent().width();

        var stackPW = $(this).attr('stackpw');
        var stackPH = $(this).attr('stackph');
        var stackX = $(this).attr('stackx');
        var stackY = $(this).attr('stacky');
        var stackWidth = $(this).attr('stackwidth');
        var stackHeight = $(this).attr('stackheight');
        var stackID = $(this).attr('regKey');

        var ratio = stackPW / stackPH;
        var thumbWidth = 0;
        
        // if width is bigger than the height
        if (ratio > 1) {
            if ((100 * ratio > maxWidthAvail)) {
                var newRatio = maxWidthAvail / ratio;
                thumbWidth = ratio * newRatio;
            } else {
                thumbWidth = 100 * ratio;
            }
        } else {
            thumbWidth = 100 * ratio;
        }

        $(this).width(thumbWidth);
        $(this).parent().width(thumbWidth);

        var width = thumbWidth / stackPW * stackWidth - 2; //(2px being the border width)
        $(this).next().width(width);

        var height = thumbWidth / stackPW * stackHeight - 2;
        $(this).next().height(height);

        var left = thumbWidth / stackPW * stackX - 2;
        $(this).next().css("left", left);

        var top = thumbWidth / stackPW * stackY - 2;
        $(this).next().css("top", top);

        // Active State
        var activeStackID = viewer.regions.options.activeStackId;
        if (stackID == activeStackID || (stackID == 0 && activeStackID == -1)) {
            $(".regionItem").removeClass("carouselItemActive");
            $(this).parent().parent().addClass("carouselItemActive");
        }
    });


    //Click event for each item in the regions panel to reload the viewer with the new region
    $(".regionItem").off("click").on("click", null, function (event) {
        PxlViewer.util.Debug.debug("Regions.regionItem.click");
        if ($(this).attr("regKey") != undefined && $(this).attr("imgKey") != undefined)
        {
            $(".regionItem").removeClass("carouselItemActive");
            $(this).addClass("carouselItemActive");
            viewer.regions.options.activeStackId = $(this).attr("regKey");
            viewer.loadRegion($(this).attr("imgKey"), $(this).attr("regKey"));
        }
    });
};

PxlViewer.Regions.LoadRegion = function (regionNumber, annotationID)
{
    PxlViewer.util.Debug.log("Regions.LoadRegion");
    this.base.regions.options.activeStackId = regionNumber;
    var imageKey = -1;

    $('.regionItem').each(function ()
    {
        if ($(this).attr("regKey") == regionNumber)
        {
            imageKey = $(this).attr("imgKey");
        }
    });

    if (imageKey == -1)
    {
        imageKey = this.base.currentImage;
    }
    this.base.loadRegion(imageKey, regionNumber, annotationID);
}

/**
        * Gets the HTML markup for the Regions
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Regions.createRegions = function (base, regionsDetails, regionsCount) {

    PxlViewer.util.Debug.log("Regions.createRegions");
    var regionHtml = "";
    var pThis = this;
    this.base = base;

    var headerId = "regionsHeader";
    var headerText = "Regions (" + regionsCount + ")";
    var headerEvent = "";
    var headerCssClass = "panelHeader";

    var regionHeaderHtml = pThis.base.menu.createPanelHeaderControl(headerId, headerText, headerEvent, headerCssClass);
    regionHtml += regionHeaderHtml;

    var tmpl = "\
                <div class='carouselControl' id='regionControl' > \
                    {{#regionsDetails}} \
                      <div id='{{name}}' class='regionItem ' imgKey='{{imgKey}}' regKey='{{attributes.stackID}}'>  " +
                        "<div class='regionImageHolder' >  " +
                            "<img class='regionImage' regKey='{{attributes.stackID}}' src='{{imgSrc}}'" +
                                        "stackHeight='{{attributes.height}}'" +
                                        "stackWidth='{{attributes.width}}'" +
                                        "stackX='{{attributes.x}}'" +
                                        "stackY='{{attributes.y}}'" +
                                        "stackPH='{{attributes.stackPH}}'" +
                                        "stackPW='{{attributes.stackPW}}'" +
                            " >" +
                            "<div class='regionThumbnailOverlay' >" +
                            "</div>" +
                        "</div>" +
                        "<div class='regionMag' > {{attributes.magDisplay}} </div>" +
                      "</div>   \
                    {{/regionsDetails}} \
                </div>";

    var regionItemsHtml = Mustache.render(tmpl, regionsDetails);
    regionHtml += regionItemsHtml;
    return regionHtml;
};



/**
        * Gets a Count of the regions
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Regions.getRegionsCount = function (base) {
    PxlViewer.util.Debug.log("Regions.getRegionsCount");
    this.base = base;
    if (this.base.regions.isRegionsAvailable(base)) {
        return this.base.images[this.base.currentImage].info.stacks;
    } else {
        return 0;
    }
};

/**
        * Gets a Count of the regions
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Regions.getActiveRegionID = function (base) {
    PxlViewer.util.Debug.log("Regions.getActiveRegionID");
    this.base = base;
    if (this.base.regions != null) {
        return this.base.regions.options.activeStackId;
    } else {
        return -1;
    }
};

