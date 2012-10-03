(function(attachTo, $) {
    /*
    * String.format method
    */
    String.prototype.format = function() {
        var str = this.toString();
        for (var i = 0; i < arguments.length; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            str = str.replace(reg, arguments[i]);
        }
        return str;
    }

    /*
    * Logger class
    */
    var Logger = function(options){
		$.extend(this, {
	        debug: false
        }, options);
    }
    Logger.prototype = {
        log: function(msg) {
            if (this.debug && typeof console !== "undefined" && typeof console.log !== "undefined") {
                console.log.apply(console, arguments);
            }
        }
    };

    /*
    * GSLoader class
    */
    var GSLoader = function(options) {
    	Logger.call(this, options);
    }

    GSLoader.prototype = new Logger();

    GSLoader.loadSheet = function(options) {
        return new Spreadsheet(options).fetch();
    }

    /*
    * Spreadsheet class
    */
    var Spreadsheet = function(options) {
	    /*if (!this || this === attachTo) {
            return new Spreadsheet(options);
        }*/
        if (typeof(options) == "string") {
            options = {
                key: options
            };
        }
        $.extend(this, {
            key: "",
            title: "",
            sheets: [],
            debug: false
        }, options);

        /* Be friendly about what you accept */
        if (/key=/.test(this.key)) {
            this.log("You passed a key as a URL! Attempting to parse.");
            this.key = this.key.match("key=([^&]*)")[1];
        }
    }

    Spreadsheet.PRIVATE_SHEET_URL = "https://spreadsheets.google.com/feeds/worksheets/{0}/private/full";
    Spreadsheet.WORKSHEET_ID_REGEX = ".{3}$"

    Spreadsheet.prototype = new Logger();

    /*function extendPrototype(addTo, methodName, handler) {
        function add(method, handle) {
            addTo.prototype[method] = function() {
                handle.apply(this, arguments);
                return this;
            }
        }
        var methods = methodName;
        if (typeof(methods) === 'string') {
            methods = {};
            methods[methodName] = handler;
        }

        $.each(methods, function(key, value) {
            add(key, value);
        })
    }*/

    Spreadsheet.prototype.fetch = function() {
        var $this = this;
        $.ajax({
            url: Spreadsheet.PRIVATE_SHEET_URL.format(this.key)
        }).done(function(data, textStatus, jqXHR) {
            $this.parseSheet.apply($this, arguments);
        });
        return this;
    }

    Spreadsheet.prototype.parseSheet = function(data, textStatus, jqXHR) {
        var $this = this;
        var $feed = $(data).children("feed");
        this.title = $feed.children("title").text();
        var worksheet;
        var worksheetKey;
        this.sheets = [];
        $feed.children("entry").each(function(idx, obj){
            var $worksheet = $(this);
            worksheet = new Worksheet({
                id: $worksheet.children("id").text().match(".{3}$")[0],
                title: $worksheet.children("title").text()
            });
            $this.sheets.push(worksheet);
        });
    }


    /*
    * Worksheet class
    */

    var Worksheet = function(options){
        $.extend(this, {
            id: "",
            title: "",
            listFeed: ""
        }, options);
    }

    Worksheet.prototype = new Logger();

    $.extend(attachTo, {
        GSLoader: GSLoader
    });

})(window, jQuery);