define(function() {
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
                                    // in case of failure jsonRes is false.
                                    // Second paramter is rawRes
                                    callBack.apply(this, [false, {}]);
                                } else {
                                    callBack.apply(this, [data, {}]);
                                }
                            }, 100);
                        }
                    }
                }
                return new RequestClass(opts);
            }
        },
        auth: {
            authorize: function(options, callBack) {
                setTimeout(function() {
                    if (gapi._returnFailure) {
                        callBack({
                            error: 'someError'
                        });
                    } else {
                        callBack({});
                    }
                }, 100);
            }
        }
    }
    return gapi;
});