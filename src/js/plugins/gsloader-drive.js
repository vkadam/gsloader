define(['jquery',
    'google-api-client',
    'js/plugins/gsloader-auth'
], function($, gapi, GoogleAuth) {
    'use strict';
    var GoogleDrive = function(clientId) {
        var scopes = 'https://www.googleapis.com/auth/drive https://spreadsheets.google.com/feeds',
            googleAuth = new GoogleAuth(clientId, scopes);
        gapi.client.load('drive', 'v2', googleAuth.checkAuth);
    };

    GoogleDrive.prototype = {
        createSpreadsheet: function(options) {
            var csRequest = {},
                _options = $.extend({
                    title: '',
                    context: csRequest
                }, options),
                deferred = $.Deferred();

            var request = gapi.client.request({
                'path': '/drive/v2/files',
                'method': 'POST',
                'body': {
                    'title': _options.title,
                    'mimeType': 'application/vnd.google-apps.spreadsheet'
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
                                'pageToken': nextPageToken
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
    return GoogleDrive;
});
