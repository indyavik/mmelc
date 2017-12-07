// PxlViewer v0.1.0
// Copyright (C) PathXL


/**
    * Setup of Initial Properties
    * @function
    */
PxlViewer.SlideInfo = function(base, options) {
    this.options = {        
        showImageInfo: true
    };

    $.extend(this.options, options);
    this.base = base; 
};

$.extend(PxlViewer.SlideInfo.prototype, {
    init: function(base) {
        this.base = base;
    },
    /**
    * Toggles the viewers slide information panel . 
    * @function
    */
    toggleSlideInfoPanel: function (base) {
       
        var pThis = this;

        this.base = base;
        this.menu = new PxlViewer.Menu(this.base.options.menu, this.base);
        
        if ($("#leftMenuHolder").hasClass("menuexpanded") && $('#SlideInformationHolder').length) {
           
            this.menu.SetActiveOffAllPanelItems();
            pThis.menu._shrinkPanel();
        }
        else if (($("#leftMenuHolder").hasClass('menuexpanded') && $('#leftPanel').is(":visible")) && $("#slideInformationHeader").length == 0)
        { // otherwise the menu must be closed so lets open it . 
            this.menu.SetActiveOffAllPanelItems();
            // toggles the menu active state on and off .  
            this.menu.SetActiveOn(this.menu.options._menuIDs.info); 
           
           //pThis.base._expandPanel(); -- not needed as the panel should be already open 
            PxlViewer.SlideInfo.getSlideInfo(pThis.base);
        } else  {
           
            this.menu.SetActiveOffAllPanelItems();
            this.menu.SetActiveOn(this.menu.options._menuIDs.info);
            this.menu._expandPanel();
            PxlViewer.SlideInfo.getSlideInfo(pThis.base);
        }
        if (pThis.base.annotations != undefined && pThis.base.annotations.canvas != null) { pThis.base.annotations.canvas.clear(); }
    }
});
/**
* Gets the slide info for the Image 
* @function
*/
PxlViewer.SlideInfo.getSlideInfo = function (base) {
        var pThis = this;
        this.base = base;

        // Get the currrent file name of the slide that is being displayed by the viewer .
        var currentFileName = base.images[base.currentImage].url.toString();
        currentFileName = currentFileName.substr(currentFileName.lastIndexOf('/') + 1);
        var isOlympus = false;
        if (base.images[base.currentImage].url.toString().toLowerCase().indexOf("databaseid") != -1) {
            // is an olympus image
            isOlympus = true;
            currentFileName = base.images[base.currentImage].slideName;
        }
        var headerId = "slideinfoHeader";
        var headerText = "Slide Information ";
        var headerEvent = "";
        var headerCssClass = "panelHeader";

        var slideinfoHtml = pThis.base.menu.createPanelHeaderControl(headerId, headerText, headerEvent, headerCssClass); // setup header . 

        var template = "\<div id = 'SlideInformationHolder' class='infoControl'>"; // initial template 
        if (isAttributeNullOrEmpty(currentFileName)) 
        {
            template += "<div class='slideInfoItem'> " +
                            "<div class='slideInfoName'>{{currentFileName}}</div> " +
                        "</div> \ ";
        }
    // Get the file extension of the current slide that is being displayed by the viewer .
        var currentFileExtension = currentFileName.substr(currentFileName.lastIndexOf('.'));
        if (isOlympus) {currentFileExtension = ".vsi"; }
        if (isAttributeNullOrEmpty(currentFileExtension))
        {
            template += "<div class='slideInfoItem'> " +
                            "<div class='slideInfoKey'>File Type</div> " +
                            "<div class='slideInfoValue'>{{currentFileExtension}}</div> " +
                        "</div> \ ";
        }
        
        var currentScannedMag = base.images[base.currentImage].info.mag;
        if (isAttributeNullOrEmpty(currentScannedMag))
        {
            template += "<div class='slideInfoItem'> " +
                            "<div class='slideInfoKey'>Mag</div> " +
                            "<div class='slideInfoValue'>{{currentScannedMag}}</div> " +
                        "</div> \ ";
        }
    // this is Zstack in the get info jsonstring .
        var currentZStacks = base.images[base.currentImage].info.layers;  
        if (isAttributeNullOrEmpty(currentZStacks)) {
            template += "<div class='slideInfoItem'> " +
                            "<div class='slideInfoKey'>Z-Stacks</div> " +
                            "<div class='slideInfoValue'>{{currentZStacks}}</div> " +
                        "</div> \ ";
        }
        
        var currentMPP = base.images[base.currentImage].info.xres;
        currentMPP = parseFloat(currentMPP).toFixed(4); // takes the xres (MMP) value converts it to a float that has a percision of 4 ( 4 decimal places ) playback . 
        if (isAttributeNullOrEmpty(currentMPP) && currentMPP > 0) {
            template += "<div class='slideInfoItem'> " +
                "<div class='slideInfoKey'>MPP</div> " +
                "<div class='slideInfoValue'>{{currentMPP}}</div> " +
                "</div> \ ";
        }

    var currentWidth = base.images[base.currentImage].info.width; 
        if (isAttributeNullOrEmpty(currentWidth))
        {
            template += "<div class='slideInfoItem'> " +
                            "<div class='slideInfoKey'>Width</div> " +
                            "<div class='slideInfoValue'>{{currentWidth}}</div> " +
                        "</div> \ ";
        }
        
        var currentHeight = base.images[base.currentImage].info.height;  
        if (isAttributeNullOrEmpty(currentHeight))
        {
            template += "<div class='slideInfoItem'> " +
                            "<div class='slideInfoKey'>Height</div> " +
                            "<div class='slideInfoValue'>{{currentHeight}}</div> " +
                        "</div> \ ";
        }
    
        template += "</div>";

        //render all of the needed attributes . 
        slideinfoHtml +=(Mustache.render(template, { currentFileName: currentFileName, currentFileExtension: currentFileExtension, currentScannedMag: currentScannedMag, currentZStacks: currentZStacks, currentMPP: currentMPP,  currentWidth: currentWidth, currentHeight: currentHeight }));

        $("#leftPanel").html(slideinfoHtml);
        
        
    };



/**
    * Determines if an attribute of an Image is null or empty 
    * @function
    */
function isAttributeNullOrEmpty(attribute) { //This method checks if the passed in attribute us null , -1 or blank . 
    
    // if all of these conditions are met then we can presume that  the attribute is valid .
    if (attribute != null && attribute != -1 && attribute != "") 
    {
        return true;
    }
        
    // this will return false as we can say that the attribute is -1 
    return false; 

}