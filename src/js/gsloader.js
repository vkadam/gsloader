/**
    Author: Vishal Kadam, Baraa
*/
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
    var Logger = function(options) {
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

    GSLoader.loadSpreadsheet = function(options) {
        return new Spreadsheet(options).fetch();
    }

    /*
     * Spreadsheet class
     */
    var Spreadsheet = function(options) {
            if (typeof(options) == "string") {
                options = {
                    key: options
                };
            }
            Logger.call(this, options);
            if (/key=/.test(options.key)) {
                this.log("You passed a key as a URL! Attempting to parse.");
                options.key = options.key.match("key=([^&]*)")[1];
            }
            $.extend(this, {
                key: "",
                title: "",
                sheets: [],
                wanted: [],
                successCallBacks: [],
                sheetsToLoad: 0
            }, options);

            if (this.success) {
                this.done(this.success);
            }

        }

    Spreadsheet.PRIVATE_SHEET_URL = "https://spreadsheets.google.com/feeds/worksheets/{0}/private/full";
    Spreadsheet.WORKSHEET_ID_REGEX = /.{3}$/;

    Spreadsheet.prototype = new Logger();

    Spreadsheet.prototype.fetch = function() {
        var _this = this;
        $.ajax({
            url: Spreadsheet.PRIVATE_SHEET_URL.format(this.key)
        }).done(function(data, textStatus, jqXHR) {
            _this.parse.apply(_this, arguments);
        });
        return this;
    }

    Spreadsheet.prototype.done = function(callBack) {
        this.successCallBacks.push(callBack);
        return this;
    }

    Spreadsheet.prototype.processSuccess = function() {
        var _this = this;
        _this.sheetsToLoad--;
        if (_this.sheetsToLoad === 0) {
            $.each(_this.successCallBacks, function(idx, fun) {
                fun.apply(_this);
            })
        }
    }

    Spreadsheet.prototype.isWanted = function(sheetName) {
        return (this.wanted.length === 0 || this.wanted.indexOf(sheetName) != -1);
    }

    Spreadsheet.prototype.parse = function(data, textStatus, jqXHR) {
        var _this = this;
        var $feed = $(data).children("feed");
        _this.title = $feed.children("title").text();
        var worksheet;
        var title;
        _this.sheets = [];
        $feed.children("entry").each(function(idx, obj) {
            var $worksheet = $(this);
            title = $worksheet.children("title").text();
            if (_this.isWanted(title)) {
                worksheet = new Worksheet({
                    id: $worksheet.children("id").text().match(Spreadsheet.WORKSHEET_ID_REGEX)[0],
                    title: title,
                    listFeed: $worksheet.children("link[rel*='#listfeed']").attr("href"),
                    spreadsheet: _this
                });
                _this.sheets.push(worksheet);
            }
        });
        _this.sheetsToLoad = _this.sheets.length;
        _this.fetchSheets();
    }

    Spreadsheet.prototype.fetchSheets = function() {
        var _this = this;
        $.each(this.sheets, function(idx, sheet) {
            sheet.done(_this.processSuccess).fetch();
        })
    }


    /*
     * Worksheet class
     */

    var Worksheet = function(options) {
            Logger.call(this, options);
            $.extend(this, {
                id: "",
                title: "",
                listFeed: "",
                rows: [],
                spreadsheet: null,
                successCallBacks: []
            }, options);
        }

    Worksheet.COLUMN_NAME_REGEX = /gsx:/;
    Worksheet.prototype = new Logger();

    Worksheet.prototype.fetch = function(callBack) {
        var _this = this;
        $.ajax({
            url: this.listFeed
        }).done(function(data, textStatus, jqXHR) {
            _this.parse.apply(_this, arguments);
            _this.processSuccess.apply(_this);
        });
        return this;
    };

    Worksheet.prototype.done = function(callBack) {
        this.successCallBacks.push(callBack);
        return this;
    }

    Worksheet.prototype.processSuccess = function() {
        var _this = this;
        $.each(_this.successCallBacks, function(idx, fun) {
            fun.apply(_this.spreadsheet, _this);
        })
    }

    Worksheet.prototype.parse = function(data, textStatus, jqXHR) {
        var _this = this;
        var $entries = $(data).children("feed").children("entry");
        if ($entries.length === 0) {
            _this.log("Missing data for " + _this.title + ", make sure you didn't forget column headers");
            _this.rows = [];
            return;
        }
        _this.rows = [];
        var row;
        $entries.each(function(idx, obj) {
            row = {
                "rowNumber": (idx + 1)
            }
            $(this).children().each(function(idx, cell) {
                if (Worksheet.COLUMN_NAME_REGEX.test(this.tagName)) {
                    row[this.tagName.replace(Worksheet.COLUMN_NAME_REGEX, "")] = this.textContent;
                }
            });
            _this.rows.push(row);
        });
        _this.spreadsheet.log("Total rows in worksheet '" + this.title + "' = " + _this.rows.length);
    }


    $.extend(attachTo, {
        GSLoader: GSLoader
    });
})(window, jQuery);