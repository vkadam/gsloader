/*
 *    Author: Vishal Kadam
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

    function sanitizeOptions(options, attribName) {
        var opts;
        if (typeof(options) === "string") {
            opts = {};
            opts[attribName] = options;
        }
        return opts || options;
    }

    /*
     * GSLoader class
     */
    var GSLoaderClass = function() {
        Logger.useDefaults(Logger.DEBUG);
        this.logger = Logger.get("gsloader");
    };

    GSLoaderClass.prototype = {

        loadSpreadsheet: function(options) {
            var lsRequest = {},
            deferred = $.Deferred();
            options = $.extend({
                context: lsRequest
            }, sanitizeOptions(options, "id"));
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
            }, sanitizeOptions(options, "title")),
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

    /*
     * Spreadsheet class
     */
    var Spreadsheet = function(options) {
        options = sanitizeOptions(options, "id");
        if (options && /id=/.test(options.id)) {
            GSLoader.logger.info("You passed a id as a URL! Attempting to parse.");
            options.id = options.id.match("id=([^&]*)")[1];
        }
        $.extend(this, {
            id: "",
            title: ""
        }, options, {
            sheetsToLoad: [],
            worksheets: []
        });
    };

    Spreadsheet.PRIVATE_SHEET_URL = "https://spreadsheets.google.com/feeds/worksheets/{0}/private/full";
    Spreadsheet.WORKSHEET_ID_REGEX = /.{3}$/;
    Spreadsheet.WORKSHEET_CREATE_REQ = '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><title>{0}</title><gs:rowCount>{1}</gs:rowCount><gs:colCount>{2}</gs:colCount></entry>';

    Spreadsheet.prototype = {

        fetch: function() {
            var _this = this,
                deferred = $.Deferred(),
                fetchReq = {};

            deferred.promise(fetchReq);

            $.ajax({
                url: Spreadsheet.PRIVATE_SHEET_URL.format(this.id)
            }).done(function(data, textStatus, jqXHR) {
                _this.parse(data, textStatus, jqXHR);
                var worksheetReqs = _this.fetchSheets();
                if (worksheetReqs.length > 0) {
                    $.when.apply($, worksheetReqs).done(function() {
                        deferred.resolveWith(fetchReq, [_this]);
                    });
                } else {
                    deferred.resolveWith(fetchReq, [_this]);
                }
            });
            return fetchReq;
        },

        isWanted: function(sheetName) {
            return (this.wanted === "*" || (this.wanted instanceof Array && this.wanted.indexOf(sheetName) !== -1));
        },

        parse: function(data) {
            var _this = this;
            var $feed = $(data).children("feed");
            _this.title = $feed.children("title").text();
            var worksheet;
            _this.worksheets = [];
            $feed.children("entry").each(function() {
                worksheet = _this.parseWorksheet(this);
                _this.worksheets.push(worksheet);
                if (_this.isWanted(worksheet.title)) {
                    _this.sheetsToLoad.push(worksheet);
                }
            });
        },

        parseWorksheet: function(worksheetInfo) {
            var $worksheet = $(worksheetInfo);
            var title = $worksheet.children("title").text();
            var worksheet = new Worksheet({
                id: $worksheet.children("id").text().match(Spreadsheet.WORKSHEET_ID_REGEX)[0],
                title: title,
                listFeed: $worksheet.children("link[rel*='#listfeed']").attr("href"),
                cellsFeed: $worksheet.children("link[rel*='#cellsfeed']").attr("href"),
                editLink: $worksheet.children("link[rel='edit']").attr("href"),
                metadata: $worksheet,
                spreadsheet: this
            });
            return worksheet;
        },

        fetchSheets: function() {
            var fetchReqs = [];
            $.each(this.sheetsToLoad, function(idx, worksheet) {
                fetchReqs.push(worksheet.fetch());
            });
            return fetchReqs;
        },

        createWorksheet: function(options) {
            var _this = this,
                deferred = $.Deferred(),
                cwsReq = {};

            deferred.promise(cwsReq);

            options = $.extend({
                title: "",
                rows: 20,
                cols: 20,
                context: cwsReq,
                headers: [],
                rowData: []
            }, sanitizeOptions(options, "title"));

            GSLoader.logger.debug("Creating worksheet for spreadsheet", this, "with options =", options);

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
                    return this.nodeName === "ENTRY";
                });
                /* Right now creating worksheet don't return the list feed url, so cretating it using cells feed */
                worksheet = _this.parseWorksheet(entryNode);
                _this.worksheets.push(worksheet);
                worksheet.listFeed = worksheet.cellsFeed.replace("/cells/", "/list/");
                if (options.headers.length > 0 || options.rowData.length > 0) {
                    var rowData = options.rowData;
                    rowData.unshift(options.headers);
                    worksheet.addRows(rowData).done(function() {
                        GSLoader.logger.debug("Rows added to worksheet.", worksheet, "Fetching latest data for worksheet");
                        worksheet.fetch().done(function() {
                            deferred.resolveWith(options.context, [worksheet]);
                        });
                    });
                } else {
                    deferred.resolveWith(options.context, [worksheet]);
                }
            });
            return cwsReq;
        },

        /*
         * Return the first worksheet matching to title
         * @param {String} Wotksheet title.
         * @return {Object} The worksheet object
         */
        getWorksheet: function(title) {
            var matchingWorksheet;
            $.each(this.worksheets, function(idx, worksheet) {
                if (worksheet.title === title) {
                    matchingWorksheet = worksheet;
                    return false;
                }

            });
            return matchingWorksheet;
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
            cellsFeed: "",
            editLink: "",
            metadata: null,
            rows: [],
            spreadsheet: null
        }, options);
    };

    Worksheet.COLUMN_NAME_REGEX = /gsx:/;
    Worksheet.CELL_FEED_HEADER = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:batch="http://schemas.google.com/gdata/batch" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><id>{0}</id>{1}</feed>';
    Worksheet.CELL_FEED_ENTRY = '<entry><batch:id>R{1}C{2}</batch:id><batch:operation type="update"/><id>{0}/R{1}C{2}</id><gs:cell row="{1}" col="{2}" inputValue="{3}"/></entry>';

    Worksheet.prototype = {
        fetch: function() {
            var _this = this,
                deferred = $.Deferred(),
                fetchReq = {};
            deferred.promise(fetchReq);
            $.ajax({
                url: this.listFeed
            }).done(function() {
                _this.parse.apply(_this, arguments);
                deferred.resolveWith(fetchReq, [_this]);
            });
            return fetchReq;
        },

        parse: function(data) {
            var _this = this;
            var $entries = $(data).children("feed").children("entry");
            _this.rows = [];
            if ($entries.length === 0) {
                GSLoader.logger.error("Missing data for " + _this.title + ", make sure you didn't forget column headers");
                return;
            }
            var row;
            $entries.each(function(idx) {
                row = {
                    "rowNumber": (idx + 1)
                };
                $(this).children().each(function() {
                    if (Worksheet.COLUMN_NAME_REGEX.test(this.tagName)) {
                        row[this.tagName.replace(Worksheet.COLUMN_NAME_REGEX, "")] = this.textContent;
                    }
                });
                _this.rows.push(row);
            });
            GSLoader.logger.debug("Total rows in worksheet '" + this.title + "' = " + _this.rows.length);
        },

        addRows: function(rowData) {
            var _this = this,
                entries = [],
                rowNo, colNo, cellValue, deferred = $.Deferred(),
                arReq = {};

            deferred.promise(arReq);

            $.each(rowData, function(rowIdx, rowObj) {
                rowNo = rowIdx + 1;
                $.each(rowObj, function(colIdx, colObj) {
                    colNo = colIdx + 1;
                    if (colObj !== null && typeof colObj !== "undefined") {
                        cellValue = typeof colObj === "string" ? colObj.encodeXML() : colObj;
                        entries.push(Worksheet.CELL_FEED_ENTRY.format(_this.cellsFeed, rowNo, colNo, cellValue));
                    }
                });
            });
            var postData = Worksheet.CELL_FEED_HEADER.format(_this.cellsFeed, entries.join(""));
            $.ajax({
                url: this.cellsFeed + "/batch",
                type: "POST",
                contentType: "application/atom+xml",
                headers: {
                    "GData-Version": "3.0",
                    "If-Match": "*"
                },
                data: postData
            }).done(function(data, textStatus, jqXHR) {
                deferred.resolveWith(arReq, [data, textStatus, jqXHR]);
            });
            return arReq;
        },

        /**
         * Rename the worksheet with new title 
         * @param {string} title - New title of the worksheet.
         */
        rename: function(title) {
            var _this = this,
                deferred = $.Deferred(),
                metadataReq = {};

            deferred.promise(metadataReq);

            // Make ajax call to get latest metadata of worksheet
            GSLoader.logger.debug("Getting spreadsheet metadata before renaming worksheet");
            $.ajax({
                // Get all worksheet details using spreadsheet url
                url: Spreadsheet.PRIVATE_SHEET_URL.format(this.spreadsheet.id)
            }).done(function(data) {
                var $feed = $(data).children("feed");
                // Filter to get details of this worksheet only
                $feed.children("entry").filter(function() {
                    var worksheetId = $(this).children("id").text().match(Spreadsheet.WORKSHEET_ID_REGEX)[0];
                    return worksheetId === _this.id;
                }).each(function() {
                    // Temporary parse worksheet and then update current worksheet.metadata
                    var worksheet = _this.spreadsheet.parseWorksheet(this);
                    _this.metadata = worksheet.metadata;
                });

                GSLoader.logger.debug("Renaming worksheet with title =", title);

                var tmpMetadata = _this.metadata.clone();
                tmpMetadata.children("title").text(title);

                var reqData = (new XMLSerializer()).serializeToString(tmpMetadata[0]);

                $.ajax({
                    url: _this.editLink,
                    type: "PUT",
                    contentType: "application/atom+xml",
                    data: reqData
                }).done(function(data) {
                    // Temporary parse worksheet and then update current worksheet.metadata
                    var worksheet = _this.spreadsheet.parseWorksheet($(data).children("entry"));
                    _this.metadata = worksheet.metadata;
                    _this.title = worksheet.title;
                    _this.listFeed = worksheet.listFeed;
                    _this.cellsFeed = worksheet.cellsFeed;
                    _this.editLink = worksheet.editLink;
                    GSLoader.logger.debug("Worksheet renamed successfully with title =", _this.title);
                    deferred.resolveWith(metadataReq, [_this]);
                });
            });
            return metadataReq;
        }
    };

    var GSLoader = new GSLoaderClass();

    $.extend(_attachTo, {
        GSLoader: GSLoader
    });

}(window, jQuery));