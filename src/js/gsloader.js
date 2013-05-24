/*
 * Author: Vishal Kadam
 */

(function(_attachTo, $) {
    "use strict";
    /*
     * String.format method
     * Example:
     *      "{0} is {1}".format("jQuery", "awesome")
     * Output "jQuery is awesome"
     */
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var str = this.toString();
            for (var i = 0; i < arguments.length; i++) {
                var reg = new RegExp("\\{" + i + "\\}", "gm");
                str = str.replace(reg, arguments[i]);
            }
            return str;
        };
    }

    /*
     * String.emcodeXML method
     * Example:
     * "String.encodeXML replace & \"\ '
     *  < >".encodeXML()
     * Output "String.encodeXML replace &amp; &quot; &apos; &#10; &lt; &gt;"
     */
    if (!String.prototype.encodeXML) {
        String.prototype.encodeXML = function() {
            return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\n/g, '&#10;');
        };
    }

    /*
     * GSLoader class
     */
    var GSLoaderClass = function() {
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("gsloader");
    };

    /*global Spreadsheet:true*/
    GSLoaderClass.prototype = {

        sanitizeOptions: function(options, attribName) {
            var opts;
            if (typeof(options) === "string") {
                opts = {};
                opts[attribName] = options;
            }
            return opts || options;
        },

        loadSpreadsheet: function(options) {
            var lsRequest = {},
                deferred = $.Deferred();
            options = $.extend({
                context: lsRequest
            }, this.sanitizeOptions(options, "id"));
            var spreadSheet = new Spreadsheet({
                id: options.id,
                wanted: options.wanted
            });

            deferred.promise(lsRequest);

            spreadSheet.fetch().done(function() {
                deferred.resolveWith(options.context, [spreadSheet]);
            });

            return lsRequest;
        },

        /*
         * Needs GSLoader.drive api
         */
        createSpreadsheet: function(options) {
            var csRequest = {},
                _options = $.extend({
                    title: "",
                    context: csRequest
                }, this.sanitizeOptions(options, "title")),
                deferred = $.Deferred();

            function spreadSheetCreated(spreadSheetObj) {
                var spreadSheet = new Spreadsheet({
                    id: spreadSheetObj.id,
                    title: spreadSheetObj.title
                });
                spreadSheet.fetch().done(function() {
                    deferred.resolveWith(_options.context, [spreadSheet]);
                });
            }

            this.drive.createSpreadsheet({
                title: _options.title
            }).done(spreadSheetCreated);

            deferred.promise(csRequest);
            return csRequest;
        }
    };

    var GSLoader = new GSLoaderClass();

    $.extend(_attachTo, {
        GSLoader: GSLoader
    });

}(window, jQuery));
