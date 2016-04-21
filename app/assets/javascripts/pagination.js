/**
 * This manager can handle the pagination on any page
 * @param url This parameter is used as the URL for the AJAX call
 *             it will be concatenated with the type of pagination found
 * @param viewSelector Selector used to find the div that will be replaced by the answer from AJAX
 * @param paginationType This is the name of the data field in the div selected that contains
 *                       the rest of the URL
 * @param successCallback After changing the div with the latest information calls this function
 *                        that can be or not present.
 *                        Only use this functions if you need to execute more operations
 *                        after the div is changed
 * @param errorCallback If an error occur during the AJAX call this function is called after a error notification
 *                      is launched
 *                      Only use this function if you need to execute more operations
 * example:
 * I need to paginate my potato collection.
 * The list can be retrieve using AJAX from the url: /potatos/list/all-my-potatoes
 *
 * The implementation:
 * Add the following HTML code to your page
 * <div id='potato-1' class='potato-view' data-potato-pagination-type='all-my-potatoes'>
 * </div>
 *
 * Add one of the following options to your JS file
 *   Select by id
 *     PaginationManager('/potatos/list/', '#potato-1', 'potato-pagination-type')
 *
 *   Select by class if we have more then 1
 *     PaginationManager('/potatos/list/', '.potato-view', 'potato-pagination-type'
 */
var PaginationHandler = function (url, viewSelector, paginationType, successCallback, errorCallback) {

    var self = this;

    this.spinnerOpts = {
        lines: 13 // The number of lines to draw
        , length: 28 // The length of each line
        , width: 17 // The line thickness
        , radius: 13 // The radius of the inner circle
        , scale: 0.25 // Scales overall size of the spinner
        , corners: 1 // Corner roundness (0..1)
        , color: '#6495ed' // #rgb or #rrggbb or array of colors
        , opacity: 0.3 // Opacity of the lines
        , rotate: 30 // The rotation offset
        , direction: 1 // 1: clockwise, -1: counterclockwise
        , speed: 1 // Rounds per second
        , trail: 100 // Afterglow percentage
        , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
        , zIndex: 2e9 // The z-index (defaults to 2000000000)
        , className: 'spinner' // The CSS class to assign to the spinner
        , top: '50%' // Top position relative to parent
        , left: '50%' // Left position relative to parent
        , shadow: false // Whether to render a shadow
        , hwaccel: false // Whether to use hardware acceleration
    };
    this.url = url;
    this.viewSelector = viewSelector;
    this.paginationType = paginationType;

    this.load_div_from_url = function(target_idx, url) {
        var target = $($(self.viewSelector)[target_idx]);
        target.addClass('opaque');
        var spinner = new Spinner(self.spinnerOpts).spin(target[0]);
        $.ajax({type: 'GET',
            url: url,
            data: {},
            timeout: 5000,
            success: function (data){
                target.removeClass('opaque');
                spinner.stop();
                target.replaceWith(data);
                target = $($(self.viewSelector)[target_idx]);
                self.init(target, target_idx);
                if( typeof successCallback == "function" )
                    successCallback();
            },
            error: function (xhrObj) {
                target.removeClass('opaque');
                spinner.stop();
                Notification.error_notification(xhrObj.responseJSON['message']);
                if( typeof errorCallback == "function" )
                    errorCallback();
            }
        });
    };
    this.refresh_div = function (target_idx, url) {
        self.load_div_from_url(target_idx, url);
    };
    this.paginate_div = function(ev) {
        ev.preventDefault();
        self.load_div_from_url($(this).data('position'), this.href);
        return false;
    };

    this.init = function(obj, target_idx) {
        obj.find(".pagination a").each(function(i, obj) {
            $(obj).click(self.paginate_div);
            $(obj).data('position', target_idx);
        });
    };

    this.setup = function() {
        $(self.viewSelector).each(function(i, obj) {
            var div_type = $(obj).data(self.paginationType);
            self.refresh_div(i, self.url + div_type)
        });
    };
    this.setup();
    return this;
};

var PaginationFunctions = function() {
    var self = this;
    this.successFunctions = {};
    this.errorFunctions = {};
    this.addFunction = function(divId, successCallback, errorCallback) {
        self.successFunctions[divId] = successCallback;
        self.errorFunctions[divId] = errorCallback;
    };
    this.getSuccessFunction = function(divId) {
        if(divId in self.successFunctions) {
            return self.successFunctions[divId];
        }
        return undefined;
    };
    this.getErrorFunction = function(divId) {
        if(divId in self.errorFunctions) {
            return self.errorFunctions[divId];
        }
        return undefined;
    };
    return this;
};

var PaginationManager = {
    setupAll: function(classSelector, paginationFunctions) {
        var funs = (typeof paginationFunctions === 'undefined') ? PaginationFunctions() : paginationFunctions;

        $('.'+classSelector).each(function(i, obj) {
            var id = $(obj).attr('id');
            PaginationManager.setupOne(obj,
                funs.getSuccessFunction(id),
                funs.getErrorFunction(id));
        });
    },
    setupOne: function(obj, successCallback, errorCallback) {
        var id = $(obj).attr('id');
        var url = $(obj).data('url');
        PaginationHandler(url, '#' + id, 'paginationType', successCallback, errorCallback);
    }
};

$(document).ready(function () {
    PaginationManager.setupAll('pagination-div');
});