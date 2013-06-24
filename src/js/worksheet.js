/*
 *    Author: Vishal Kadam
 */
define(["jquery", "js-logger", "js/utils"], function($, Logger, Utils) {
    "use strict";
    /*
     * Worksheet class
     */
    var WorksheetClass = function(options) {
        this.logger = Logger.get("Worksheet");
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
    },
        COLUMN_NAME_REGEX = /gsx:/,
        CELL_FEED_HEADER = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:batch="http://schemas.google.com/gdata/batch" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><id>{0}</id>{1}</feed>',
        CELL_FEED_ENTRY = '<entry><batch:id>R{1}C{2}</batch:id><batch:operation type="update"/><id>{0}/R{1}C{2}</id><gs:cell row="{1}" col="{2}" inputValue="{3}"/></entry>';

    WorksheetClass.prototype = {
        fetch: function() {
            var _this = this,
                deferred = $.Deferred(),
                fetchReq = {};
            deferred.promise(fetchReq);

            $.ajax({
                url: this.listFeed
            }).done(function(data, textStatus, jqXHR) {
                _this.parse.apply(_this, [data, textStatus, jqXHR]);
                deferred.resolveWith(fetchReq, [_this]);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                deferred.rejectWith(fetchReq, [errorThrown, _this]);
            });

            return fetchReq;
        },

        parse: function(data) {
            var _this = this;
            var $entries = $(data).children("feed").children("entry");
            _this.rows = [];
            if ($entries.length === 0) {
                _this.logger.warn("Missing data for " + _this.title + ", make sure you didn't forget column headers");
                return;
            }
            var row;
            $entries.each(function(idx) {
                row = {
                    "rowNumber": (idx + 1)
                };
                $(this).children().each(function() {
                    if (COLUMN_NAME_REGEX.test(this.tagName)) {
                        row[this.tagName.replace(COLUMN_NAME_REGEX, "")] = this.textContent;
                    }
                });
                _this.rows.push(row);
            });
            _this.logger.debug("Total rows in worksheet '" + this.title + "' = " + _this.rows.length);
        },

        addRows: function(rowData) {
            var _this = this,
                entries = [],
                rowNo,
                colNo,
                cellValue,
                postData,
                deferred = $.Deferred(),
                arReq = {};

            deferred.promise(arReq);

            $.each(rowData, function(rowIdx, rowObj) {
                rowNo = rowIdx + 1;
                $.each(rowObj, function(colIdx, colObj) {
                    colNo = colIdx + 1;
                    if (colObj !== null && typeof colObj !== "undefined") {
                        cellValue = typeof colObj === "string" ? colObj.encodeXML() : colObj;
                        entries.push(CELL_FEED_ENTRY.format(_this.cellsFeed, rowNo, colNo, cellValue));
                    }
                });
            });

            postData = CELL_FEED_HEADER.format(_this.cellsFeed, entries.join(""));

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
            }).fail(function(jqXHR, textStatus, errorThrown) {
                deferred.rejectWith(arReq, [errorThrown, _this]);
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

            /* Make ajax call to get latest metadata of worksheet */
            _this.logger.debug("Getting spreadsheet metadata before renaming worksheet");

            function errorCallback(jqXHR, textStatus, errorThrown) {
                deferred.rejectWith(metadataReq, [errorThrown, _this]);
            }

            $.ajax({
                /* Get all worksheet details using spreadsheet url */
                url: Utils.PRIVATE_SHEET_URL.format(this.spreadsheet.id)
            }).then(function(data) {
                _this.logger.debug("Merging spreadsheet metadata before renaming worksheet");
                var $feed = $(data).children("feed");
                /* Filter to get details of this worksheet only */
                $feed.children("entry").filter(function() {
                    var worksheetId = $(this).children("id").text().match(Utils.WORKSHEET_ID_REGEX)[0];
                    return worksheetId === _this.id;
                }).each(function() {
                    /* Parse worksheet and then update current worksheet.metadata */
                    var worksheet = _this.spreadsheet.parseWorksheet(this);
                    _this.metadata = worksheet.metadata;
                });
            }, errorCallback).then(function() {
                _this.logger.debug("Renaming worksheet with title =", title);

                var tmpMetadata = _this.metadata.clone();
                tmpMetadata.children("title").text(title);

                var reqData = (new XMLSerializer()).serializeToString(tmpMetadata[0]);

                return $.ajax({
                    url: _this.editLink,
                    type: "PUT",
                    contentType: "application/atom+xml",
                    data: reqData
                });
            }).then(function(data) {
                /* Parse worksheet and then update current worksheet.metadata */
                var worksheet = _this.spreadsheet.parseWorksheet($(data).children("entry"));
                _this.metadata = worksheet.metadata;
                _this.title = worksheet.title;
                _this.listFeed = worksheet.listFeed;
                _this.cellsFeed = worksheet.cellsFeed;
                _this.editLink = worksheet.editLink;
                _this.logger.debug("Worksheet renamed successfully with title =", _this.title);
                deferred.resolveWith(metadataReq, [_this]);
            }, errorCallback);
            return metadataReq;
        }
    };
    /*$.extend(_attachTo, {
        Worksheet: WorksheetClass
    });*/
    return WorksheetClass;
});
