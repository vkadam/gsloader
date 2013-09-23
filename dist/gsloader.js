/* Gsloader - vv0.0.1-rc.1
* https://github.com/vkadam/gsloader
* Copyright (c) Vishal Kadam; Licensed MIT */

define('js/utils',[],function() {
    return {
        sanitizeOptions: function(options, attribName) {
            var opts;
            if (typeof(options) === 'string') {
                opts = {};
                opts[attribName] = options;
            }
            return opts || options;
        },
        PRIVATE_SHEET_URL: 'https://spreadsheets.google.com/feeds/worksheets/{0}/private/full',
        WORKSHEET_ID_REGEX: /.{3}$/
    };
});

define('js/worksheet',['jquery', 'logger', 'js/utils'], function($, Logger, Utils) {
    
    /*
     * Worksheet class
     */
    var Worksheet = function(options) {
        this.logger = Logger.get('Worksheet');
        $.extend(this, {
            id: '',
            title: '',
            listFeed: '',
            cellsFeed: '',
            editLink: '',
            metadata: null,
            rows: [],
            spreadsheet: null
        }, options);
    },
        COLUMN_NAME_REGEX = /gsx:/,
        CELL_FEED_HEADER = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:batch="http://schemas.google.com/gdata/batch" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><id>{0}</id>{1}</feed>',
        CELL_FEED_ENTRY = '<entry><batch:id>R{1}C{2}</batch:id><batch:operation type="update"/><id>{0}/R{1}C{2}</id><gs:cell row="{1}" col="{2}" inputValue="{3}"/></entry>';

    Worksheet.prototype = {
        fetch: function() {
            var _this = this,
                deferred = $.Deferred();

            if (_this._fetchReq) {
                return _this._fetchReq;
            }
            var promisObj = deferred.promise();
            _this._fetchReq = promisObj;

            $.ajax({
                url: this.listFeed
            }).done(function(data, textStatus, jqXHR) {
                _this.parse.apply(_this, [data, textStatus, jqXHR]);
                deferred.resolveWith(promisObj, [_this]);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                deferred.rejectWith(promisObj, [errorThrown, _this]);
            }).always(function() {
                delete _this._fetchReq;
            });

            return promisObj;
        },

        parse: function(data) {
            var _this = this;
            var $entries = $(data).children('feed').children('entry');
            _this.rows = [];
            if ($entries.length === 0) {
                _this.logger.warn('Missing data for ' + _this.title + ', make sure you didn\'t forget column headers');
                return;
            }
            var row;
            $entries.each(function(idx) {
                row = {
                    'rowNumber': (idx + 1)
                };
                $(this).children().each(function() {
                    if (COLUMN_NAME_REGEX.test(this.tagName)) {
                        row[this.tagName.replace(COLUMN_NAME_REGEX, '')] = this.textContent;
                    }
                });
                _this.rows.push(row);
            });
            _this.logger.debug('Total rows in worksheet "' + this.title + '" = ' + _this.rows.length);
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
                    if (colObj !== null && typeof colObj !== 'undefined') {
                        cellValue = typeof colObj === 'string' ? colObj.encodeXML() : colObj;
                        entries.push(CELL_FEED_ENTRY.format(_this.cellsFeed, rowNo, colNo, cellValue));
                    }
                });
            });

            postData = CELL_FEED_HEADER.format(_this.cellsFeed, entries.join(''));

            $.ajax({
                url: this.cellsFeed + '/batch',
                type: 'POST',
                contentType: 'application/atom+xml',
                headers: {
                    'GData-Version': '3.0',
                    'If-Match': '*'
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
            _this.logger.debug('Getting spreadsheet metadata before renaming worksheet');

            function errorCallback(jqXHR, textStatus, errorThrown) {
                deferred.rejectWith(metadataReq, [errorThrown, _this]);
            }

            $.ajax({
                /* Get all worksheet details using spreadsheet url */
                url: Utils.PRIVATE_SHEET_URL.format(this.spreadsheet.id)
            }).then(function(data) {
                _this.logger.debug('Merging spreadsheet metadata before renaming worksheet');
                var $feed = $(data).children('feed');
                /* Filter to get details of this worksheet only */
                $feed.children('entry').filter(function() {
                    var worksheetId = $(this).children('id').text().match(Utils.WORKSHEET_ID_REGEX)[0];
                    return worksheetId === _this.id;
                }).each(function() {
                    /* Parse worksheet and then update current worksheet.metadata */
                    var worksheet = _this.spreadsheet.parseWorksheet(this);
                    _this.metadata = worksheet.metadata;
                });
            }, errorCallback).then(function() {
                _this.logger.debug('Renaming worksheet with title =', title);

                var tmpMetadata = _this.metadata.clone();
                tmpMetadata.children('title').text(title);

                var reqData = (new XMLSerializer()).serializeToString(tmpMetadata[0]);

                return $.ajax({
                    url: _this.editLink,
                    type: 'PUT',
                    contentType: 'application/atom+xml',
                    data: reqData
                });
            }).then(function(data) {
                /* Parse worksheet and then update current worksheet.metadata */
                var worksheet = _this.spreadsheet.parseWorksheet($(data).children('entry'));
                _this.metadata = worksheet.metadata;
                _this.title = worksheet.title;
                _this.listFeed = worksheet.listFeed;
                _this.cellsFeed = worksheet.cellsFeed;
                _this.editLink = worksheet.editLink;
                _this.logger.debug('Worksheet renamed successfully with title =', _this.title);
                deferred.resolveWith(metadataReq, [_this]);
            }, errorCallback);
            return metadataReq;
        }
    };
    return Worksheet;
});

define('js/spreadsheet',['jquery', 'logger', 'js/utils', 'js/worksheet'], function($, Logger, Utils, Worksheet) {
    
    /*
     * Spreadsheet class
     */
    var WORKSHEET_CREATE_REQ = '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:gs="http://schemas.google.com/spreadsheets/2006"><title>{0}</title><gs:rowCount>{1}</gs:rowCount><gs:colCount>{2}</gs:colCount></entry>';

    var Spreadsheet = function(options) {
        this.logger = Logger.get('Spreadsheet');
        options = Utils.sanitizeOptions(options, 'id');
        if (options && /id=/.test(options.id)) {
            this.logger.info('You passed a id as a URL! Attempting to parse.');
            options.id = options.id.match('id=([^&]*)')[1];
        }
        $.extend(this, {
            id: '',
            title: ''
        }, options, {
            sheetsToLoad: [],
            worksheets: []
        });
    };

    Spreadsheet.prototype = {
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
                url: Utils.PRIVATE_SHEET_URL.format(this.id)
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
            return (this.wanted === '*' || (this.wanted instanceof Array && this.wanted.indexOf(sheetName) !== -1));
        },

        parse: function(data) {
            var _this = this;
            var $feed = $(data).children('feed');
            _this.title = $feed.children('title').text();
            var worksheet;
            _this.worksheets = [];
            $feed.children('entry').each(function() {
                worksheet = _this.parseWorksheet(this);
                _this.worksheets.push(worksheet);
                if (_this.isWanted(worksheet.title)) {
                    _this.sheetsToLoad.push(worksheet);
                }
            });
        },

        parseWorksheet: function(worksheetInfo) {
            var $worksheet = $(worksheetInfo),
                title = $worksheet.children('title').text(),
                updatedOnStr = $worksheet.children('updated').text();

            updatedOnStr = (updatedOnStr).replace(/-/g, '/').replace(/[TZ]/g, ' ').trim();
            updatedOnStr = updatedOnStr.substr(0, updatedOnStr.length - 4);

            var worksheet = new Worksheet({
                id: $worksheet.children('id').text().match(Utils.WORKSHEET_ID_REGEX)[0],
                title: title,
                listFeed: $worksheet.children('link[rel*="#listfeed"]').attr('href'),
                cellsFeed: $worksheet.children('link[rel*="#cellsfeed"]').attr('href'),
                editLink: $worksheet.children('link[rel="edit"]').attr('href'),
                updatedOn: new Date(updatedOnStr).valueOf(),
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
                title: '',
                rows: 20,
                cols: 20,
                context: cwsReq,
                headers: [],
                rowData: []
            }, Utils.sanitizeOptions(options, 'title'));

            _this.logger.debug('Creating worksheet for spreadsheet', this, 'with options =', options);

            function errorCallback(jqXHR, textStatus, errorThrown) {
                /* Incase of worksheet.addRows, worksheet.fetch only 2 params will be passed,
                 * error message and worksheet object */
                deferred.rejectWith(options.context, [errorThrown || jqXHR, _this]);
            }

            $.ajax({
                url: Utils.PRIVATE_SHEET_URL.format(this.id),
                type: 'POST',
                contentType: 'application/atom+xml',
                headers: {
                    'GData-Version': '3.0'
                },
                data: WORKSHEET_CREATE_REQ.format(options.title, options.rows, options.cols)
            }).then(function(data, textStatus, jqXHR) {
                var entryNode = $(jqXHR.responseText).filter(function() {
                    return this.nodeName === 'ENTRY';
                });
                /* Right now creating worksheet don't return the list feed url, so cretating it using cells feed */
                var wSheet = _this.parseWorksheet(entryNode);
                _this.worksheets.push(wSheet);
                wSheet.listFeed = wSheet.cellsFeed.replace('/cells/', '/list/');
                return wSheet;
            }).then(function(worksheet) {
                if (options.headers.length > 0 || options.rowData.length > 0) {
                    var rowData = options.rowData;
                    rowData.unshift(options.headers);
                    worksheet.addRows(rowData).then(function() {
                        _this.logger.debug('Rows added to worksheet.', worksheet, 'Fetching latest data for worksheet');
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
    return Spreadsheet;
});

/*
 * https://developers.google.com/api-client-library/javascript/start/start-js
 */
define('js/plugins/gsloader-auth',['jquery', 'logger', 'google-api-client'], function($, Logger, gapi) {
    

    var GSAuth = function() {
        this.logger = Logger.get('gsAuth');
        this.CLIENT_ID = null;
        this.SCOPES = ['https://www.googleapis.com/auth/drive', 'https://spreadsheets.google.com/feeds'].join(' ');
    };

    GSAuth.prototype = {

        setClientId: function(clientId) {
            this.CLIENT_ID = clientId;
            return this;
        },

        onLoad: function(callback, context) {
            // this.checkAuth();
            if (callback) {
                callback.apply(context, this);
            }
            return this;
        },

        checkAuth: function() {
            gapi.auth.authorize({
                'client_id': this.CLIENT_ID,
                'scope': this.SCOPES,
                'immediate': true
            }, $.proxy(this, 'handleAuthResult'));
            return this;
        },

        handleAuthResult: function(authResult) {
            /* TODO: Remove GSLoader dependency */
            /* No idea but somewhere context is changed to window object so setting it back to auth object */
            // if (!(this instanceof GSAuth)) {
            //     this = GSLoader.auth;
            //     return;
            // }
            if (authResult && !authResult.error) {
                this.logger.debug('Google Api Authentication Succeed');
            } else {
                this.logger.debug('Retrying to authenticating Google Api');
                this.checkAuth();
                /*gapi.auth.authorize({
                    'client_id': this.CLIENT_ID,
                    'scope': this.SCOPES,
                    'immediate': false
                }, this.handleAuthResult);*/
            }
            return this;
        }
    };
    return new GSAuth();
});

define('js/plugins/gsloader-drive',['jquery', 'google-api-client', 'js/plugins/gsloader-auth'], function($, gapi, Auth) {
    
    var GSDrive = function() {};

    GSDrive.prototype = {

        load: function() {
            gapi.client.load('drive', 'v2', this.onLoad);
            return this;
        },

        onLoad: function() {
            Auth.checkAuth();
            return this;
        },

        createSpreadsheet: function(options) {
            var csRequest = {},
                _options = $.extend({
                    title: '',
                    context: csRequest
                }, options),
                deferred = $.Deferred();

            var request = gapi.client.request({
                'path': '/drive/v2/files',
                'method': 'POST',
                'body': {
                    'title': _options.title,
                    'mimeType': 'application/vnd.google-apps.spreadsheet'
                }
            });

            deferred.promise(csRequest);

            request.execute(function(jsonResp, rawResp) {
                if (jsonResp === false) {
                    deferred.rejectWith(_options.context, [rawResp]);
                } else {
                    deferred.resolveWith(_options.context, [jsonResp]);
                }
            });
            return csRequest;
        }

        /*,
        getFiles: function(callback) {
            var retrievePageOfFiles = function(request, result) {
                    request.execute(function(jsonResp) {
                        result = result.concat(jsonResp.items);
                        var nextPageToken = jsonResp.nextPageToken;
                        if (nextPageToken) {
                            request = gapi.client.drive.files.list({
                                'pageToken': nextPageToken
                            });
                            retrievePageOfFiles(request, result);
                        } else {
                            if (callback) {
                                callback.apply(callback, result);
                            }
                            return result;
                        }
                    });
                };
            var initialRequest = gapi.client.drive.files.list();
            retrievePageOfFiles(initialRequest, []);
            return this;
        }*/
    };
    return new GSDrive();
});

define('gsloader',['jquery', 'logger', 'js/utils', 'js/spreadsheet', 'js/plugins/gsloader-drive'], function($, Logger, Utils, Spreadsheet, GSLoaderDrive) {
    
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
    };

    GSLoader.prototype = {

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

            var returnReq = GSLoaderDrive.createSpreadsheet({
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
