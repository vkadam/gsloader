/*
 * https://developers.google.com/api-client-library/javascript/start/start-js
 */
define(['jquery', 'logger', 'google-api-client'], function($, Logger, gapi) {
    'use strict';

    var GSAuth = function() {
        this.logger = Logger.get('gsAuth');
        this.CLIENT_ID = null;
        this.SCOPES = ['https://www.googleapis.com/auth/drive', 'https://spreadsheets.google.com/feeds'].join(' ');
    };

    GSAuth.prototype = {

        setClientId: function(clientId) {
            this.CLIENT_ID = clientId;
            return this;
        },

        onLoad: function(callback, context) {
            // this.checkAuth();
            if (callback) {
                callback.apply(context, this);
            }
            return this;
        },

        checkAuth: function() {
            gapi.auth.authorize({
                'client_id': this.CLIENT_ID,
                'scope': this.SCOPES,
                'immediate': true
            }, $.proxy(this, 'handleAuthResult'));
            return this;
        },

        handleAuthResult: function(authResult) {
            /* TODO: Remove GSLoader dependency */
            /* No idea but somewhere context is changed to window object so setting it back to auth object */
            // if (!(this instanceof GSAuth)) {
            //     this = GSLoader.auth;
            //     return;
            // }
            if (authResult && !authResult.error) {
                this.logger.debug('Google Api Authentication Succeed');
            } else {
                this.logger.debug('Retrying to authenticating Google Api');
                this.checkAuth();
                /*gapi.auth.authorize({
                    'client_id': this.CLIENT_ID,
                    'scope': this.SCOPES,
                    'immediate': false
                }, this.handleAuthResult);*/
            }
            return this;
        }
    };
    return new GSAuth();
});
