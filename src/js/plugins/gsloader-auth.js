/*
 * https://developers.google.com/api-client-library/javascript/start/start-js
 */
define(['jquery', 'logger', 'google-api-client'], function($, Logger, gapi) {
    'use strict';

    function GoogleAuth(clientId, scopes) {
        this.authTryCount = 0;
        this.logger = Logger.get('GDAuth');
        this.clientId = clientId;
        this.scopes = scopes;
    }

    GoogleAuth.prototype = {
        checkAuth: function(immediate, defObj) {
            this.authTryCount++;
            var deferred = defObj || new $.Deferred();
            gapi.auth.authorize({
                'client_id': this.clientId,
                'scope': this.scopes,
                'immediate': false !== immediate
            }, $.proxy(this, 'handleAuthResult', deferred));
            return deferred.promise();
        },

        handleAuthResult: function(deferred, authResult) {
            if (authResult && !authResult.error) {
                this.logger.debug('Google Api Authentication Succeed');
                this.authTryCount = 0;
                deferred.resolve();
            } else if (this.authTryCount < 2) {
                this.logger.debug('Retrying to authenticating Google Api');
                this.checkAuth(false, deferred);
            } else {
                this.authTryCount = 0;
                deferred.reject();
            }
        }
    };
    return GoogleAuth;
});
