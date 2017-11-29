// PxlViewer v0.1.0
// Copyright (C) PathXL

/**
    * Default Carousel Properties on init
    * @function
    */
PxlViewer.Carousel = function (base, options) {
    PxlViewer.util.Debug.warn("Carousel.base");
    this.options = {
        showCarousel: true,
        showImageName: true,
        preloaded:false
    };

    // Overrides default options with the passed in user options.
    $.extend(this.options, options);
    this.base = base;
    setTimeout("pxl.carousel.preloadCarousel();", 50);
};

/**
    * Extends the Carousel object with additonal functions
    * @function
    */
$.extend(PxlViewer.Carousel.prototype, {
    init: function (base, creationPermissions) {
        PxlViewer.util.Debug.log("Carousel.init");
        this.creationPermissions = creationPermissions;
        this.base = base;
    },
    preloadCarousel: function () {
        PxlViewer.util.Debug.log("Carousel.preloadCarousel");
        if (!this.options.preloaded) {
            var images = [];
            for (var key in this.base.images) {
                if (this.base.images[key].url == undefined){continue;}
                images.push(this.base.images[key].url + "?getthumbnail?height=100&compression=100");
            }
            PxlViewer.util.preloadImages(images);
            this.options.preloaded = true;
        }
    },
    /**
        * Toggle Carousel Panel and populate contents
        * @function
        * @param {Object} PxlViewer
        */
    toggleCarouselPanel: function (base) {
        PxlViewer.util.Debug.log("Carousel.toggleCarouselPanel");
        var pThis = this;

        this.base = base;
        this.menu = new PxlViewer.Menu(this.base.options.menu, this.base);

        if (($("#leftMenuHolder").hasClass('menuexpanded') && $('#leftPanel').is(":visible")) && $("#carouselHeader").length) {
            this.menu.SetActiveOffAllPanelItems();
            pThis.base.menu._shrinkPanel();
        }
        else if (($("#leftMenuHolder").hasClass('menuexpanded') && $('#leftPanel').is(":visible")) && $("#carouselHeader").length == 0) {
            PxlViewer.Carousel.getCarousel(pThis.base);
            this.menu.SetActiveOffAllPanelItems();
            this.menu.SetActiveOn(this.menu.options._menuIDs.slides);
            this.menu._resizeControls();
        } else {
            this.menu.SetActiveOffAllPanelItems();
            this.menu.SetActiveOn(this.menu.options._menuIDs.slides);
            this.menu._expandPanel();
            PxlViewer.Carousel.getCarousel(this.base);
        }


        if (this.base.annotations.canvas != null) { this.base.annotations.canvas.clear(); }
    }

});

/**
        * Gets the Carousel markup on loads it on the page
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Carousel.getCarousel = function (base) {

    PxlViewer.util.Debug.log("Carousel.getCarousel");
    var images = [];
    for (var key in this.base.images) {
        if (this.base.images[key].url == undefined) { continue; }
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
    $(".carouselItem").off("click").on("click", null, function (event) {
  
        
        if ($(this).attr("imgKey") != undefined) {
            var imgKey = $(this).attr('imgKey');
            viewer.regions.options.activeStackId = -1;
            viewer.loadImage(imgKey);
            $(".carouselItem").removeClass("carouselItemActive");
            $(this).addClass("carouselItemActive");
            
        }
    });

    // loops through each image and finds which one should have active state
    $(".carouselItem").each(function () {
        var currentImageKey = $(this).attr('imgkey');
        var activeImageKey = base.currentImage;
        if (currentImageKey == activeImageKey) {
            $(".carouselItem").removeClass("carouselItemActive");
            $(this).addClass("carouselItemActive");
        }
    });

};

/**
        * Gets the HTML markup for the Carousel
        * @function
        * @param {Object} PxlViewer
        */
PxlViewer.Carousel.createCarousel = function (base, carouselImages, imagesCount) {

    PxlViewer.util.Debug.log("Carousel.createCarousel");
    var carouselHtml = "";
    var pThis = this;
    this.base = base;

    var headerId = "carouselHeader";
    var headerText = "Case Slides (" + imagesCount + ")";
    var headerEvent = "";
    var headerCssClass = "panelHeader";

    var carouselHeaderHtml = pThis.base.menu.createPanelHeaderControl(headerId, headerText, headerEvent, headerCssClass);
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
    PxlViewer.util.Debug.log("Carousel.isCarouselAvailable");
    this.base = base;
    if (this.base.images.length > 1) {
        return true;
    }

    return false;
};

