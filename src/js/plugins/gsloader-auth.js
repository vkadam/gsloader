/*
 *    Author: Vishal Kadam
 */
(function($) {

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
            if (authResult && !authResult.error) {
                GSLoader.log("Google Api Authentication Succeed");
            } else {
                GSLoader.log("Authenticating Google Api");
                gapi.auth.authorize({
                    'client_id': this.CLIENT_ID,
                    'scope': this.SCOPES,
                    'immediate': false
                }, this.handleAuthResult);
            }
            return this;
        }
    }

    $.extend(GSLoader, {
        auth: new GSAuthClass()
    });

})(jQuery);