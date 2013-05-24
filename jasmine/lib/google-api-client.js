var gapi = {
    _requestCallBackData: {},
    _returnFailure: false,
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
                            if (gapi._returnFailure) {
                                // in case of failuer jsonRes is false.
                                // Second paramter is rawRes
                                callBack.apply(this, [false, {}]);
                            } else {
                                // in case of failuer jsonRes is object
                                // Second paramter is rawRes
                                callBack.apply(this, [data, {}]);
                            }
                        }, 100);
                    }
                }
            }
            return new RequestClass(opts);
        }
    }
}