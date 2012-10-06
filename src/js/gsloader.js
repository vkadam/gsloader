/*
 *    Author: Vishal Kadam
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
    var GSLoaderClass = function(options) {
            Logger.call(this, options);
        }

    GSLoaderClass.prototype = new Logger();

    GSLoaderClass.prototype.loadSpreadsheet = function(options) {
        return new Spreadsheet(options).fetch();
    }

    GSLoaderClass.prototype.enableLog = function() {
        this.debug = true
        return this;
    }

    GSLoaderClass.prototype.disableLog = function() {
        this.debug = false
        return this;
    }

    /*
     * Needs GSLoader.drive api
     */
    GSLoaderClass.prototype.createSpreadsheet = function(options, callBack, context) {
        var _this = this;
        var spreadSheetObj = this.drive.createSpreadsheet(options, function(spreadSheetObj) {
            callBack.apply(context || _this, [new Spreadsheet(spreadSheetObj.id).fetch()]);
        }, this);
        return this;
    }

    /*
     * Spreadsheet class
     */
    var Spreadsheet = function(options) {
            if (typeof(options) == "string") {
                options = {
                    id: options
                };
            }
            if (/id=/.test(options.id)) {
                GSLoader.log("You passed a id as a URL! Attempting to parse.");
                options.id = options.id.match("id=([^&]*)")[1];
            }
            $.extend(this, {
                id: "",
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
    Spreadsheet.WORKSHEET_CREATE_REQ = '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><title>{0}</title><gs:rowCount>{1}</gs:rowCount><gs:colCount>{2}</gs:colCount></entry>';

    Spreadsheet.prototype = {

        fetch: function() {
            var _this = this;
            $.ajax({
                url: Spreadsheet.PRIVATE_SHEET_URL.format(this.id)
            }).done(function(data, textStatus, jqXHR) {
                _this.parse.apply(_this, arguments);
            });
            return this;
        },

        done: function(callBack) {
            this.successCallBacks.push(callBack);
            return this;
        },

        processSuccess: function() {
            var _this = this;
            _this.sheetsToLoad--;
            if (_this.sheetsToLoad === 0) {
                $.each(_this.successCallBacks, function(idx, fun) {
                    fun.apply(_this);
                })
            }
        },

        isWanted: function(sheetName) {
            return (this.wanted.length === 0 || this.wanted.indexOf(sheetName) != -1);
        },

        parse: function(data, textStatus, jqXHR) {
            var _this = this;
            var $feed = $(data).children("feed");
            _this.title = $feed.children("title").text();
            var worksheet;
            var title;
            _this.sheets = [];
            $feed.children("entry").each(function(idx, obj) {
                worksheet = _this.parseWorksheet(this)
                if (_this.isWanted(worksheet.title)) {
                    _this.sheets.push(worksheet);
                }
            });
            _this.sheetsToLoad = _this.sheets.length;
            _this.fetchSheets();
        },

        parseWorksheet: function(worksheetInfo) {
            var $worksheet = $(worksheetInfo);
            var title = $worksheet.children("title").text();
            var worksheet = new Worksheet({
                id: $worksheet.children("id").text().match(Spreadsheet.WORKSHEET_ID_REGEX)[0],
                title: title,
                listFeed: $worksheet.children("link[rel*='#listfeed']").attr("href"),
                spreadsheet: this
            });
            return worksheet;
        },

        fetchSheets: function() {
            var _this = this;
            $.each(this.sheets, function(idx, sheet) {
                sheet.done(_this.processSuccess).fetch();
            })
        },

        createWorksheet: function(options) {
            if (typeof(options) === "string") {
                options = {
                    title: options
                };
            }
            options = $.extend({
                title: "",
                rows: 20,
                cols: 20
            }, options);

            var _this = this;
            var worksheet;
            $.ajax({
                url: Spreadsheet.PRIVATE_SHEET_URL.format(this.id),
                type: "POST",
                contentType: "application/atom+xml",
                headers: {
                    "GData-Version": "3.0"
                },
                data: Spreadsheet.WORKSHEET_CREATE_REQ.format(options.title, options.rows, options.cols)
            }).done(function(data, textStatus, jqXHR) {
                var entryNode = $(jqXHR.responseText).filter(function() {
                    return this.nodeName === "ENTRY"
                });
                worksheet = _this.parseWorksheet(entryNode);
                _this.sheets.push(worksheet);
            });
            return worksheet;
        }
    };

    /*
     * Worksheet class
     */

    var Worksheet = function(options) {
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
    Worksheet.prototype = {
        fetch: function(callBack) {
            var _this = this;
            $.ajax({
                url: this.listFeed
            }).done(function(data, textStatus, jqXHR) {
                _this.parse.apply(_this, arguments);
                _this.processSuccess.apply(_this);
            });
            return this;
        },

        done: function(callBack) {
            this.successCallBacks.push(callBack);
            return this;
        },

        processSuccess: function() {
            var _this = this;
            $.each(_this.successCallBacks, function(idx, fun) {
                fun.apply(_this.spreadsheet, _this);
            })
        },

        parse: function(data, textStatus, jqXHR) {
            var _this = this;
            var $entries = $(data).children("feed").children("entry");
            if ($entries.length === 0) {
                GSLoader.log("Missing data for " + _this.title + ", make sure you didn't forget column headers");
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
            GSLoader.log("Total rows in worksheet '" + this.title + "' = " + _this.rows.length);
        }

    };

    $.extend(attachTo, {
        GSLoader: new GSLoaderClass()
    });

})(window, jQuery)