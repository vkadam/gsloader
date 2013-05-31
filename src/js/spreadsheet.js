(function(_attachTo, $) {
    "use strict";
    /*
     * Spreadsheet class
     */
    /*global GSLoader:false, Worksheet:false*/
    var SpreadsheetClass = function(options) {
        options = GSLoader.sanitizeOptions(options, "id");
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

    SpreadsheetClass.PRIVATE_SHEET_URL = "https://spreadsheets.google.com/feeds/worksheets/{0}/private/full";
    SpreadsheetClass.WORKSHEET_ID_REGEX = /.{3}$/;
    SpreadsheetClass.WORKSHEET_CREATE_REQ = '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><title>{0}</title><gs:rowCount>{1}</gs:rowCount><gs:colCount>{2}</gs:colCount></entry>';

    SpreadsheetClass.prototype = {

        fetch: function(options) {
            var _this = this,
                deferred = $.Deferred(),
                fetchReq = {};
            options = $.extend({
                context: fetchReq
            }, options);

            deferred.promise(fetchReq);

            function errorCallback(jqXHR, textStatus, errorThrown) {
                /* Incase of worksheet.fetch only 2 params will be passed,
                 * error message and worksheet object */
                deferred.rejectWith(options.context, [errorThrown || jqXHR, _this]);
            }

            $.ajax({
                url: SpreadsheetClass.PRIVATE_SHEET_URL.format(this.id)
            }).then(function(data, textStatus, jqXHR) {
                _this.parse(data, textStatus, jqXHR);
                var worksheetReqs = _this.fetchSheets();
                if (worksheetReqs.length > 0) {
                    $.when.apply($, worksheetReqs).then(function() {
                        deferred.resolveWith(options.context, [_this]);
                    }, errorCallback);
                } else {
                    deferred.resolveWith(options.context, [_this]);
                }
            }, errorCallback);
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
                id: $worksheet.children("id").text().match(SpreadsheetClass.WORKSHEET_ID_REGEX)[0],
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
            }, GSLoader.sanitizeOptions(options, "title"));

            GSLoader.logger.debug("Creating worksheet for spreadsheet", this, "with options =", options);

            function errorCallback(jqXHR, textStatus, errorThrown) {
                /* Incase of worksheet.addRows, worksheet.fetch only 2 params will be passed,
                 * error message and worksheet object */
                deferred.rejectWith(options.context, [errorThrown || jqXHR, _this]);
            }

            $.ajax({
                url: SpreadsheetClass.PRIVATE_SHEET_URL.format(this.id),
                type: "POST",
                contentType: "application/atom+xml",
                headers: {
                    "GData-Version": "3.0"
                },
                data: SpreadsheetClass.WORKSHEET_CREATE_REQ.format(options.title, options.rows, options.cols)
            }).then(function(data, textStatus, jqXHR) {
                var entryNode = $(jqXHR.responseText).filter(function() {
                    return this.nodeName === "ENTRY";
                });
                /* Right now creating worksheet don't return the list feed url, so cretating it using cells feed */
                var wSheet = _this.parseWorksheet(entryNode);
                _this.worksheets.push(wSheet);
                wSheet.listFeed = wSheet.cellsFeed.replace("/cells/", "/list/");
                return wSheet;
            }).then(function(worksheet) {
                if (options.headers.length > 0 || options.rowData.length > 0) {
                    var rowData = options.rowData;
                    rowData.unshift(options.headers);
                    worksheet.addRows(rowData).then(function() {
                        GSLoader.logger.debug("Rows added to worksheet.", worksheet, "Fetching latest data for worksheet");
                        return worksheet.fetch();
                    }).then(function() {
                        deferred.resolveWith(options.context, [worksheet]);
                    }, errorCallback);
                } else {
                    deferred.resolveWith(options.context, [worksheet]);
                }
            }, errorCallback);
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
    $.extend(_attachTo, {
        Spreadsheet: SpreadsheetClass
    });
}(window, jQuery));
