require(['jquery',
    'js/gsloader',
    'js/worksheet'
], function($, GSLoader, Worksheet) {
    describe('worksheet.js', function() {
        var spyOnAjax;

        beforeEach(function() {
            $.ajaxSetup({
                async: false
            });
            spyOnAjax = spyOn($, 'ajax').andCallThrough();
        });

        afterEach(function() {
            $.ajaxSetup({
                async: true
            });
        });

        describe('fetch', function() {
            beforeEach(function() {
                $.fixture('GET /worksheet/listFeed', function() {
                    return [400, 'Worksheet fetch error', '', {}];
                });
            });

            afterEach(function() {
                $.fixture('GET /worksheet/listFeed', null);
            });

            it('returns old fetch request if it\'s not completed yet', function() {
                var worksheet = new Worksheet({
                    listFeed: '/worksheet/listFeed'
                }),
                    fetchReq1 = worksheet.fetch(),
                    fetchReq2 = worksheet.fetch();
                expect(fetchReq1).toBe(fetchReq2);
            });

            it('returns new fetch request if previous is completed', function() {
                var worksheet = new Worksheet({
                    listFeed: '/worksheet/listFeed'
                }),
                    fetchReq1 = worksheet.fetch();

                waitsFor(function() {
                    return (fetchReq1.state() !== 'pending');
                }, 'Worksheet fetch ajax call should fail', 200);
                runs(function() {
                    expect(fetchReq1).not.toBe(worksheet.fetch());
                });
            });

            it('call fail callback in case of ajax failure', function() {
                var worksheet = new Worksheet({
                    listFeed: '/worksheet/listFeed'
                }),
                    errorCallback = jasmine.createSpy('Worksheet.errorCallback'),
                    fetchReq = worksheet.fetch().fail(errorCallback);

                waitsFor(function() {
                    return (fetchReq.state() === 'rejected');
                }, 'Worksheet fetch ajax call should fail', 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                    expect(errorCallback.mostRecentCall.args[0]).toBe('Worksheet fetch error');
                });
            });
        });

        describe('addRows', function() {
            beforeEach(function() {
                $.fixture('POST /worksheet/cellsFeed/batch', function() {
                    return [400, 'Worksheet addRows post error', '', {}];
                });
            });
            afterEach(function() {
                $.fixture('POST /worksheet/cellsFeed/batch', null);
            });

            it('call fail callback in case of ajax failure', function() {
                var worksheet = new Worksheet({
                    cellsFeed: '/worksheet/cellsFeed'
                }),
                    errorCallback = jasmine.createSpy('Worksheet.errorCallback'),
                    fetchReq = worksheet.addRows([]).fail(errorCallback);

                waitsFor(function() {
                    return (fetchReq.state() === 'rejected');
                }, 'Worksheet add rows ajax call should fail', 200);

                runs(function() {
                    expect(errorCallback).toHaveBeenCalled();
                    expect(errorCallback.mostRecentCall.args[0]).toBe('Worksheet addRows post error');
                });
            });
        });

        describe('rename', function() {
            beforeEach(function() {
                $.fixture('GET worksheets/spreadsheet01/private/full', 'jasmine/fixtures/Spreadsheet-01.xml');
                $.fixture('PUT worksheets/spreadsheet01/private/full/od6/d9ziupyy0w', 'jasmine/fixtures/Spreadsheet-01-od6-put-rename.xml');
            });

            afterEach(function() {
                $.fixture('GET worksheets/spreadsheet01/private/full', null);
                $.fixture('PUT worksheets/spreadsheet01/private/full/od6/d9ziupyy0w', null);
            });

            it('makes call to get latest metadata of worksheet', function() {
                GSLoader.loadSpreadsheet('spreadsheet01').done(function(spreadsheet) {
                    var worksheet = spreadsheet.worksheets[0];
                    expect(worksheet.title).toBe('Environments');
                    expect(worksheet.metadata).not.toBeNull();

                    worksheet.metadata = null;

                    worksheet.rename('Worksheet Title New');

                    /* Ajax calls by index 0=Load Spreadsheet, 1=Get Worksheet Metadata, 2=Rename worksheet */
                    expect(spyOnAjax.callCount).toBe(3);
                    expect(worksheet.metadata).not.toBeNull();
                    var metadataAjaxCall = spyOnAjax.argsForCall[1][0];
                    expect(metadataAjaxCall.url).toBe('https://spreadsheets.google.com/feeds/worksheets/spreadsheet01/private/full');
                });
            });

            it('makes ajax call with correct data to update title of worksheet and update worksheet metadata', function() {
                GSLoader.loadSpreadsheet('spreadsheet01').done(function(spreadsheet) {
                    var worksheet = spreadsheet.worksheets[0];
                    var oldEditLink = worksheet.editLink;
                    worksheet.rename('Worksheet Title New');

                    /* Ajax calls by index 0=Load Spreadsheet, 1=Get Worksheet Metadata, 2=Rename worksheet */
                    var renameAjaxCall = spyOnAjax.argsForCall[2][0];
                    expect(renameAjaxCall.url.indexOf(oldEditLink)).toBe(0);
                    expect(renameAjaxCall.type).toBe('PUT');
                    expect(renameAjaxCall.contentType).toBe('application/atom+xml');
                    expect(worksheet.title).toBe('Worksheet Title New');
                    expect(worksheet.listFeed).toBe('https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full-UPDATED');
                    expect(worksheet.cellsFeed).toBe('https://spreadsheets.google.com/feeds/cells/spreadsheet01/od6/private/full-UPDATED');
                    expect(worksheet.editLink).toBe('https://spreadsheets.google.com/feeds/worksheets/spreadsheet01/private/full/od6/d9ziupyy0w-UPDATED');
                });
            });

            describe('errorCallback', function() {
                afterEach(function() {
                    $.fixture('GET worksheets/someSpredsheetId/private/full', null);
                    $.fixture('PUT worksheets/spreadsheet01/private/full/od4/da0f4lhfl4', null);
                });

                function renameWorksheetAndAssert(errorMessage) {
                    var parseWorksheetCallback = jasmine.createSpy('Spreadsheet.parseWorksheet').andReturn({
                        metadata: $([])
                    }),
                        worksheet = new Worksheet({
                            id: 'worksheetId',
                            metadata: $([]),
                            editLink: 'worksheets/someSpredsheetId/private/full/worksheetId/da0f4lhfl4',
                            spreadsheet: {
                                id: 'someSpredsheetId',
                                parseWorksheet: parseWorksheetCallback
                            }
                        }),
                        errorCallback = jasmine.createSpy('Worksheet.rename.errorCallback'),
                        renameReq = worksheet.rename('New worksheet title').fail(errorCallback);

                    waitsFor(function() {
                        return (renameReq.state() === 'rejected');
                    }, 'Worksheet rename ajax call should fail', 200);

                    runs(function() {
                        expect(errorCallback).toHaveBeenCalled();
                        expect(errorCallback.mostRecentCall.args[0]).toBe(errorMessage);
                    });
                }

                it('call errorCallback in case spreadsheet feed metadata ajax calls fails', function() {
                    $.fixture('GET worksheets/someSpredsheetId/private/full', function() {
                        return [400, 'Worksheet metadata error', '', {}];
                    });
                    renameWorksheetAndAssert('Worksheet metadata error');
                });

                it('call errorCallback in case worksheet rename ajax calls fails', function() {
                    $.fixture('PUT worksheets/someSpredsheetId/private/full/worksheetId/da0f4lhfl4', function() {
                        return [400, 'Worksheet rename error', '', {}];
                    });
                    renameWorksheetAndAssert('Worksheet rename error');
                });

            });
        });
    });
});
