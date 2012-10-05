/*
 *    Author: Vishal Kadam
 */
(function($) {

    var GSDriveClass = function() {}

    GSDriveClass.prototype = {

        load: function() {
            gapi.client.load('drive', 'v2', this.onLoad);
        },

        onLoad: function() {
            GSLoader.auth.checkAuth();
        },

        createSpreadSheet: function(fileTitle, callback) {
            var request = gapi.client.request({
                'path': '/drive/v2/files',
                'method': 'POST',
                'body': {
                    "title": fileTitle,
                    "mimeType": "application/vnd.google-apps.spreadsheet"
                }
            });

            request.execute(function(resp) {
                callback.apply(callback, arguments);
            });
        },

        getFiles: function(callback) {
            var retrievePageOfFiles = function(request, result) {
                    request.execute(function(resp) {
                        result = result.concat(resp.items);
                        var nextPageToken = resp.nextPageToken;
                        if (nextPageToken) {
                            request = gapi.client.drive.files.list({
                                'pageToken': nextPageToken
                            });
                            retrievePageOfFiles(request, result);
                        } else {
                            if (callback) {
                                callback.apply(callback, result);
                            };
                            return result;
                        }
                    });
                }
            var initialRequest = gapi.client.drive.files.list();
            retrievePageOfFiles(initialRequest, []);
        }
    }

    $.extend(GSLoader, {
        drive: new GSDriveClass()
    });

})(jQuery);