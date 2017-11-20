/*** 
* Global javascript utility methods
***/
window.PxlUtil = window.PxlUtil ||
function (options) {
    return new PxlUtil.Base(options);
};

(function (PxlUtil)
{
    PxlUtil.console = window.console || {
        log: nullfunction,
        debug: nullfunction,
        info: nullfunction,
        warn: nullfunction,
        error: nullfunction
    };
    if (typeof jQuery === 'undefined') {
        throw new Error("PxlUtil requires jQuery.");
    }
    PxlUtil.Base = function (options) {
        // no options yet but this could be extended
        this.options = {
            
        };
        $.extend(this.options, options);
    };
    

    $.extend(PxlUtil.Base.prototype, {
        
        IsNullOrEmpty:function (string){
            if (string == null || string == 'undefined' || string.length == 0) {
                return true;
            }
            else {
                return false;
            }
        },
        GetWindowSize: function () {
            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            
            return [w, h];
        },
        destroy: function () {}
    });
}(PxlUtil));