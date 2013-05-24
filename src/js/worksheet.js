(function(_attachTo, $) {
    "use strict";

    /*
     * Worksheet class
     */
    /*global GSLoader:true, Spreadsheet:true*/

    var WorksheetClass = function(options) {
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

    WorksheetClass.COLUMN_NAME_REGEX = /gsx:/;
    WorksheetClass.CELL_FEED_HEADER = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:batch="http://schemas.google.com/gdata/batch" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><id>{0}</id>{1}</feed>';
    WorksheetClass.CELL_FEED_ENTRY = '<entry><batch:id>R{1}C{2}</batch:id><batch:operation type="update"/><id>{0}/R{1}C{2}</id><gs:cell row="{1}" col="{2}" inputValue="{3}"/></entry>';

    WorksheetClass.prototype = {
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
                    if (WorksheetClass.COLUMN_NAME_REGEX.test(this.tagName)) {
                        row[this.tagName.replace(WorksheetClass.COLUMN_NAME_REGEX, "")] = this.textContent;
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
                        entries.push(WorksheetClass.CELL_FEED_ENTRY.format(_this.cellsFeed, rowNo, colNo, cellValue));
                    }
                });
            });
            var postData = WorksheetClass.CELL_FEED_HEADER.format(_this.cellsFeed, entries.join(""));
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
    $.extend(_attachTo, {
        Worksheet: WorksheetClass
    });

}(window, jQuery));
