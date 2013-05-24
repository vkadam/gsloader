/*
 *    Author: Vishal Kadam
 */
/*global GSLoader:false, gapi:false*/

(function(_attachTo, $) {

    "use strict";
    var GSDriveClass = function() {};

    GSDriveClass.prototype = {

        load: function() {
            gapi.client.load("drive", "v2", this.onLoad);
            return this;
        },

        onLoad: function() {
            _attachTo.auth.checkAuth();
            return this;
        },

        createSpreadsheet: function(options) {
            var csRequest = {},
                _options = $.extend({
                    title: "",
                    context: csRequest
                }, options),
                deferred = $.Deferred();

            var request = gapi.client.request({
                "path": "/drive/v2/files",
                "method": "POST",
                "body": {
                    "title": _options.title,
                    "mimeType": "application/vnd.google-apps.spreadsheet"
                }
            });

            deferred.promise(csRequest);

            request.execute(function(jsonResp, rawResp) {
                if (jsonResp === false) {
                    deferred.rejectWith(_options.context, [rawResp]);
                } else {
                    deferred.resolveWith(_options.context, [jsonResp]);
                }
            });
            return csRequest;
        }

        /*,
        getFiles: function(callback) {
            var retrievePageOfFiles = function(request, result) {
                    request.execute(function(jsonResp) {
                        result = result.concat(jsonResp.items);
                        var nextPageToken = jsonResp.nextPageToken;
                        if (nextPageToken) {
                            request = gapi.client.drive.files.list({
                                "pageToken": nextPageToken
                            });
                            retrievePageOfFiles(request, result);
                        } else {
                            if (callback) {
                                callback.apply(callback, result);
                            }
                            return result;
                        }
                    });
                };
            var initialRequest = gapi.client.drive.files.list();
            retrievePageOfFiles(initialRequest, []);
            return this;
        }*/
    };

    $.extend(_attachTo, {
        drive: new GSDriveClass()
    });

}(GSLoader, jQuery));
