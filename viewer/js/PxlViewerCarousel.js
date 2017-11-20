// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
    * Default Carousel Properties on init
    * @function
    */
PxlViewer.Carousel = function (options, base) {
    this.options = {
        showCarousel: true,
        showImageName: true,
    };

    // Overrides default options with the passed in user options.
    $.extend(this.options, options);
    this.base = base;
};

/**
    * Extends the Carousel object with additonal functions
    * @function
    */
$.extend(PxlViewer.Carousel.prototype, {
    init: function (base, creationPermissions) {
        this.creationPermissions = creationPermissions;
        this.base = base;
    },
    /**
        * Toggle Carousel Panel and populate contents
        * @function
        * @param {Object} PxlViewer
        */
    toggleCarouselPanel: function (base) {
        PxlUtil.console.log("toggleCarouselPanel");
        var pThis = this;
        this.base = base;
        this.menu = new PxlViewer.Menu(this.base.options.menu, this.base);
        //pThis.base._togglePanel();
        if ($("#leftMenuHolder").hasClass('menuexpanded')) {
            PxlUtil.console.log("$(#leftMenuHolder).hasClass('menuexpanded')");
            pThis.base._shrinkPanel();
        } else {
            PxlUtil.console.log("toggleCarouselPanel else");
            this.menu.SetActiveOn(this.menu.options._menuIDs.slides);
            pThis.base._expandPanel();
            PxlViewer.Carousel.getCarousel(this.base);
        }
    }

});

/**
        * Gets the Carousel markup on loads it on the page
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Carousel.getCarousel = function (base) {
    var images = [];
    for (var key in this.base.images) {
        var img = new Object();
        img.imgSrc = this.base.images[key].url + "?getthumbnail?height=100&compression=100";
        img.imgName = this.base.images[key].slideName;
        var viewer = this.base;
        img.imgKey = key;
        images.push(img);
    }

    var carouselImages = { 'carouselImages': images };
    var carouselImagesCount = this.base.images.length;

    // Get and Set HTML
    $("#leftPanel").html(PxlViewer.Carousel.createCarousel(base, carouselImages, carouselImagesCount));

    //Click event for each item in the carousel to reload the viewer with the new slide
    $(".carouselItem").on("click", null, function (event) {
        if ($(this).attr("imgKey") != undefined) {
            var imgKey = $(this).attr('imgKey');
            viewer.loadImage(imgKey);
        } 
    });
};

/**
        * Gets the HTML markup for the Carousel
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Carousel.createCarousel = function (base, carouselImages, imagesCount) {

    var carouselHtml = "";
    var pThis = this;
    this.base = base;

    var headerId = "carouselHeader";
    var headerText = "Case Slides (" + imagesCount + ")";
    var headerEvent = "";
    var headerCssClass = "panelHeader";

    var carouselHeaderHtml = pThis.base.createPanelHeaderControl(headerId, headerText, headerEvent, headerCssClass);
    carouselHtml += carouselHeaderHtml;

    var tmpl = "\
                <div class='carouselControl' id='carouselControl' > \
                    {{#carouselImages}} \
                      <div id='{{name}}' class='carouselItem' imgKey='{{imgKey}}'>  " +
                        "<div class='carouselImageHolder' >  " +
                            "<span class='carouselImageHelper' >  " +
                             "</span>" +
                                "<img class='carouselImage' src='{{imgSrc}}' >" +
                            
                         "</div>" +
                        "<div class='carouselImageName' > {{imgName}} </div>" +
                      "</div>   \
                    {{/carouselImages}} \
                </div>";

    var carouselItemsHtml = Mustache.render(tmpl, carouselImages);
    carouselHtml += carouselItemsHtml;
    return carouselHtml;
};

/**
        * Checks if we have multiple images to show the carousel
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Carousel.isCarouselAvailable = function (base) {
    this.base = base;
    if (this.base.images.length > 1) {
        return true;
    }

    return false;
};

