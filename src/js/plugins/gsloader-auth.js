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
        },

        onLoad: function(callback) {
            this.checkAuth();
        },

        checkAuth: function() {
            gapi.auth.authorize({
                'client_id': this.CLIENT_ID,
                'scope': SCOPES,
                'immediate': true
            }, this.handleAuthResult);
        },

        handleAuthResult: function(authResult) {
            if (authResult && !authResult.error) {
                GSLoader.log("Google Api Authentication Succeed", authResult)
            } else {
                GSLoader.log("Authenticating Google Api")
                // No access token could be retrieved, force the authorization flow.
                gapi.auth.authorize({
                    'client_id': this.CLIENT_ID,
                    'scope': SCOPES,
                    'immediate': false
                }, this.handleAuthResult);
            }
        }
    }

    $.extend(GSLoader, {
        auth: new GSAuthClass()
    });

})(jQuery);