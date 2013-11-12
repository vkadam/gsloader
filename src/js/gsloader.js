define(['jquery',
    'logger',
    'js/utils',
    'js/spreadsheet',
    'js/plugins/gsloader-drive'
], function($, Logger, Utils, Spreadsheet, GSLoaderDrive) {
    'use strict';
    /*
     * String.format method
     * Example:
     * '{0} is {1}'.format('jQuery', 'awesome')
     * Output 'jQuery is awesome'
     */
    if (!String.prototype.format) {
        String.prototype.format = function() {
            var str = this.toString();
            for (var i = 0; i < arguments.length; i++) {
                var reg = new RegExp('\\{' + i + '\\}', 'gm');
                str = str.replace(reg, arguments[i]);
            }
            return str;
        };
    }

    /*
     * String.emcodeXML method
     * Example:
     * 'String.encodeXML replace & \'\ '
     *  < >'.encodeXML()
     * Output 'String.encodeXML replace &amp; &quot; &apos; &#10; &lt; &gt;'
     */
    if (!String.prototype.encodeXML) {
        String.prototype.encodeXML = function() {
            return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\n/g, '&#10;');
        };
    }

    /*
     * GSLoader class
     */
    var GSLoader = function() {
        this.logger = Logger.get('gsloader');
        this.googleDrive = null;
    };

    GSLoader.prototype = {

        setClientId: function(clientId) {
            this.googleDrive = new GSLoaderDrive(clientId);
            return this;
        },

        loadSpreadsheet: function(options) {
            options = Utils.sanitizeOptions(options, 'id');

            var spreadSheet = new Spreadsheet(options);

            return spreadSheet.fetch({
                context: options.context
            });
        },

        /*
         * Needs GSLoader.drive api
         */
        createSpreadsheet: function(options) {
            options = $.extend({
                title: ''
            }, Utils.sanitizeOptions(options, 'title'));

            var returnReq = this.googleDrive.createSpreadsheet({
                title: options.title,
                context: options.context
            }).then(function(spreadSheetObj) {
                var spreadSheet = new Spreadsheet({
                    id: spreadSheetObj.id,
                    title: spreadSheetObj.title
                });
                return spreadSheet.fetch({
                    context: options.context || returnReq
                });
            });
            return returnReq;
        }
    };

    return new GSLoader();
});
