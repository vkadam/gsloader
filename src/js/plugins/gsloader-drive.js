/*
 *    Author: Vishal Kadam
 */
(function(_attachTo, $) {

    "use strict";
    var GSDriveClass = function() {}

    GSDriveClass.prototype = {

        load: function() {
            gapi.client.load("drive", "v2", this.onLoad);
            return this;
        },

        onLoad: function() {
            _attachTo.auth.checkAuth();
            return this;
        },

        createSpreadsheet: function(fileTitle, callback, callbackContext) {
            var request = gapi.client.request({
                "path": "/drive/v2/files",
                "method": "POST",
                "body": {
                    "title": fileTitle,
                    "mimeType": "application/vnd.google-apps.spreadsheet"
                }
            });

            request.execute(function(resp) {
                callback.apply(callbackContext, [resp]);
            });
            return this;
        },

        getFiles: function(callback) {
            var retrievePageOfFiles = function(request, result) {
                    request.execute(function(resp) {
                        result = result.concat(resp.items);
                        var nextPageToken = resp.nextPageToken;
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
                }
            var initialRequest = gapi.client.drive.files.list();
            retrievePageOfFiles(initialRequest, []);
            return this;
        }
    }

    $.extend(_attachTo, {
        drive: new GSDriveClass()
    });

})(GSLoader, jQuery);