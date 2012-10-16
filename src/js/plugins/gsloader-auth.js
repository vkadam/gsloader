/*
 *    Author: Vishal Kadam
 */
(function(_attachTo, $) {
    "use strict";
    var GSAuthClass = function() {
            this.CLIENT_ID = null;
            this.SCOPES = ["https://www.googleapis.com/auth/drive", "https://spreadsheets.google.com/feeds"].join(" ");
        }

    GSAuthClass.prototype = {

        setClientId: function(clientId) {
            this.CLIENT_ID = clientId;
            return this;
        },

        onLoad: function(callback, context) {
            this.checkAuth();
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
            }, this.handleAuthResult);
            return this;
        },

        handleAuthResult: function(authResult) {
            var _this = this;
            /* No idea but somewhere context is changed to window object so setting it back to auth object */
            if (!(_this instanceof GSAuthClass)) {
                _this = _attachTo.auth;
            }
            if (authResult && !authResult.error) {
                _attachTo.log("Google Api Authentication Succeed");
            } else {
                _attachTo.log("Authenticating Google Api");
                gapi.auth.authorize({
                    'client_id': _this.CLIENT_ID,
                    'scope': _this.SCOPES,
                    'immediate': false
                }, _this.handleAuthResult);
            }
            return _this;
        }
    }

    $.extend(_attachTo, {
        auth: new GSAuthClass()
    });

})(GSLoader, jQuery);