var gapi = {
    _requestCallBackData: {},
    client: {
        load: function(api, version, callBack) {
            callBack();
        },

        request: function(opts) {
            var RequestClass = function(options) {
                    return {
                        execute: function(callBack) {
                            setTimeout(function() {
                                var data = $.extend(gapi._requestCallBackData, {
                                    title: options.body.title
                                });
                                callBack.apply(this, [data]);
                            }, 100);
                        }
                    }
                }
            return new RequestClass(opts);
        }
    }
}