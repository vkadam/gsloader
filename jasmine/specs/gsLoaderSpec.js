describe("String Prototype", function() {
    it("String.format returns formatted test", function() {
        expect("Some String".format).toBeDefined();
        expect("Some String".format().length).toBe(11);
        expect("Some String {0} using {1} {2}".format("formatted", "String", "formatter")).toBe("Some String formatted using String formatter");
        expect("HERE word is used {0} and {0}".format("HERE")).toBe("HERE word is used HERE and HERE");
    });

    it("String.encodeXML encodes ampersand, less than, greater than double quotes and single quotes charaters", function() {
        expect("Some String".encodeXML).toBeDefined();
        expect("Some String".encodeXML()).toBe("Some String");
        expect("Some String &".encodeXML()).toBe("Some String &amp;");
        expect("Some String >".encodeXML()).toBe("Some String &gt;");
        expect("Some String <".encodeXML()).toBe("Some String &lt;");
        expect("Some String '".encodeXML()).toBe("Some String &apos;");
        expect('Some String "'.encodeXML()).toBe("Some String &quot;");
    });

    it("String.encodeXML encodes ampersand before any another charaters", function() {
        expect("Some String ' & > <".encodeXML()).toBe("Some String &apos; &amp; &gt; &lt;");
    });

});

describe("GSLoader", function() {

    var spyOnGSLoaderDrive;
    var spyOnAjax;

    beforeEach(function() {
        spyOnGSLoaderDrive = spyOn(GSLoader.drive, 'createSpreadsheet');
        spyOnGSLoaderDrive.andCallFake(function(title, callback, context) {
            callback.apply(context, [{
                id: "spreadsheet02"
            }]);
        });

        $.fixture("GET worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02.xml");
        $.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn($, "ajax").andCallThrough();
    });

    afterEach(function() {
        $.ajaxSetup({
            async: true
        });
    });

    describe("GSLoader logger", function() {
        var lastConsoleMessage = null;
        var oldConsole = null;
        if (typeof(console) !== 'undefined') {
            oldConsole = console;
        };
        beforeEach(function() {
            console = {
                log: function(message) {
                    lastConsoleMessage = message;
                }
            }
        });

        afterEach(function() {
            console = oldConsole;
        })

        it("GSLoader.log api is available", function() {
            expect(GSLoader.log).toBeDefined();
        });

        it("GSLoader.log don't logs messages when debug is false (Default)", function() {
            GSLoader.log('some logger message');
            expect(lastConsoleMessage).toBeNull();
        });

        it("GSLoader.log logs messages when debug is enabled", function() {
            GSLoader.enableLog().log('some logger message');
            expect(lastConsoleMessage).toBe('some logger message');
        });
    });

    describe("GSLoader.loadSpreadsheet", function() {
        beforeEach(function() {
            $.fixture("GET worksheets/spreadsheet01/private/full", "jasmine/fixtures/Spreadsheet-01.xml");
            $.fixture("GET feeds/list/spreadsheet01/od6/private/full", "jasmine/fixtures/Spreadsheet-01-od6.xml");
            $.fixture("GET feeds/list/spreadsheet01/od4/private/full", "jasmine/fixtures/Spreadsheet-01-od4.xml");
            $.fixture("GET feeds/list/spreadsheet01/od5/private/full", "jasmine/fixtures/Spreadsheet-01-od5.xml");
            $.fixture("GET feeds/list/spreadsheet01/oda/private/full", "jasmine/fixtures/Spreadsheet-01-oda.xml");
        });

        it("GSLoader.loadSpreadsheet loads list of all worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet('spreadsheet01');
            expect(spreadSheet).toBeDefined();
            expect(spreadSheet.title).toBe("Mindtap Environment Settings");
            expect(spreadSheet.worksheets.length).toBe(4);
        });

        function checkWorksheet(worksheet, title, id, listFeed, cellsFeed) {
            if (title) {
                expect(worksheet.title).toBe(title)
            };
            if (id) {
                expect(worksheet.id).toBe(id)
            };
            if (listFeed) {
                expect(worksheet.listFeed).toBe(listFeed)
            };
            if (cellsFeed) {
                expect(worksheet.cellsFeed).toBe(cellsFeed)
            };
        }

        it("GSLoader.loadSpreadsheet loads list of all worksheets with correct data", function() {
            var spreadSheet = GSLoader.loadSpreadsheet('spreadsheet01');
            expect(spreadSheet.worksheets.length).toBe(4);
            checkWorksheet(spreadSheet.worksheets[0], "Environments", "od6", "https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full", "https://spreadsheets.google.com/feeds/cells/spreadsheet01/od6/private/full");
            checkWorksheet(spreadSheet.worksheets[3], "DEV", "oda", "https://spreadsheets.google.com/feeds/list/spreadsheet01/oda/private/full", "https://spreadsheets.google.com/feeds/cells/spreadsheet01/oda/private/full");
        });

        it("GSLoader.loadSpreadsheet only loads list of specified worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                wanted: ["Environments", "DEV"]
            });
            expect(spreadSheet.worksheets.length).toBe(2);
            checkWorksheet(spreadSheet.worksheets[0], "Environments", "od6", "https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full");
            checkWorksheet(spreadSheet.worksheets[1], "DEV", "oda", "https://spreadsheets.google.com/feeds/list/spreadsheet01/oda/private/full");
        });

        it("GSLoader.loadSpreadsheet loads data for all worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                id: "spreadsheet01"
            });
            expect(spreadSheet.worksheets.length).toBe(4);
            expect(spreadSheet.worksheets[0].rows).toBeDefined();
            expect(spreadSheet.worksheets[0].rows.length).toBe(8);
            expect(spreadSheet.worksheets[1].rows.length).toBe(7);
            expect(spreadSheet.worksheets[2].rows.length).toBe(6);
            expect(spreadSheet.worksheets[3].rows.length).toBe(5);
        });

        function checkRow(row, rowNumber, environmentid, environmentname, ssourl, applicationurl, olrwdslurl) {
            expect(row["rowNumber"]).toBe(rowNumber);
            expect(row["environmentid"]).toBe(environmentid);
            expect(row["environmentname"]).toBe(environmentname);
            expect(row["ssourl"]).toBe(ssourl);
            expect(row["applicationurl"]).toBe(applicationurl);
            expect(row["olrwdslurl"]).toBe(olrwdslurl);
        }

        it("GSLoader.loadSpreadsheet loads row array with all column data for specified worksheet", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                wanted: ["Environments"]
            });
            expect(spreadSheet.worksheets.length).toBe(1);
            var rows = spreadSheet.worksheets[0].rows;
            checkRow(rows[0], 1, "LOCAL", "Local", "http://d-ws.cengage.com/ssows/SSOws?WSDL", "http://localhost", "http://d-ws.cengage.com/olrws/OLRws?WSDL");
            checkRow(rows[1], 2, "DEV", "Development", "http://d-ws.cengage.com/ssows/SSOws?WSDL", "http://qae-ng.cengage.com", "http://d-ws.cengage.com/olrws/OLRws?WSDL")
        });

        it("GSLoader.loadSpreadsheet calls success function after spreadsheet is loaded", function() {
            var spySuccess = jasmine.createSpy("spreadsheetSuccess");
            var spreadSheet = GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                wanted: ["Environments", "DEV"],
                success: spySuccess
            })
            expect(spySuccess).toHaveBeenCalled();
            expect(spySuccess.callCount).toBe(1);
        });
    });

    describe("GSLoader.createSpreadsheet", function() {

        it("GSLoader.createSpreadsheet call GSLoader.drive.createSpreadsheet and execute callback with correct context", function() {
            var context = {
                someapi: function() {}
            }
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                expect(spyOnGSLoaderDrive).toHaveBeenCalled();
                expect(spreadSheet.title).toBe("Spreadsheet Title");
                expect(this).toBe(context);
            }, context);
        });

        it("GSLoader.createSpreadsheet execute callback with GSLoader as context when context is not specified", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                expect(this).toBe(GSLoader);
            });
        });

    });

    describe("GSLoader.Spreadsheet.createWorksheet", function() {
        beforeEach(function() {
            GSLoader.enableLog();
            $.fixture("POST worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02-od7-post.xml");
            $.fixture("POST cells/spreadsheet02/od7/private/full/batch", function(orig, settings, headers) {
                return [200, "success", "", {}]
            });
        });

        afterEach(function() {
            GSLoader.disableLog();
        });

        it("GSLoader.Spreadsheet.createWorksheet post correct title", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                var wSheet = spreadSheet.createWorksheet("Worksheet Title");
                expect(spyOnAjax.callCount).toBe(2);
                expect(spyOnAjax.mostRecentCall.args[0].type).toBe("POST");
                expect(spyOnAjax.mostRecentCall.args[0].contentType).toBe("application/atom+xml");
                expect(spyOnAjax.mostRecentCall.args[0].url).toBe("https://spreadsheets.google.com/feeds/worksheets/spreadsheet02/private/full");
                expect(spyOnAjax.mostRecentCall.args[0].headers["GData-Version"]).toBe("3.0");
                var $postData = $(spyOnAjax.mostRecentCall.args[0].data);
                expect($postData.length).toBe(1);
                expect($postData[0].nodeName).toBe("ENTRY");
                expect($postData.find("title").text()).toBe("Worksheet Title");
            });

        });

        it("GSLoader.Spreadsheet.createWorksheet post correct row and column number", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                var wSheet = spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    rows: 10,
                    cols: 5
                });
                var $postData = $(spyOnAjax.mostRecentCall.args[0].data);
                expect($postData[0].nodeName).toBe("ENTRY");
                expect($postData.find("title").text()).toBe("Worksheet Title");
                expect($postData.children().filter(function() {
                    return (this.nodeName === "GS:ROWCOUNT")
                }).text()).toBe("10");
                expect($postData.children().filter(function() {
                    return (this.nodeName === "GS:COLCOUNT")
                }).text()).toBe("5");
            });
        });

        it("GSLoader.Spreadsheet.createWorksheet calls callback on ajax success with newly created worksheet", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                expect(spreadSheet.worksheets.length).toBe(0);
                var worksheet;
                var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                    worksheet = wSheet;
                });
                spreadSheet.createWorksheet("Worksheet Title", worksheetCallback);
                expect(worksheetCallback).toHaveBeenCalled();
                expect(worksheet).toBeDefined();
                expect(worksheet.title).toBe("Worksheet Title");
                expect(spreadSheet.worksheets.length).toBe(1);
                expect(spreadSheet.worksheets[0]).toBe(worksheet);
            });
        });

        it("GSLoader.Spreadsheet.createWorksheet calls callback when passed as attribute of options", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {});
                spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    callback: worksheetCallback
                });
                expect(worksheetCallback).toHaveBeenCalled();
            });
        });

        it("GSLoader.Spreadsheet.createWorksheet calls callback with specified context", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                var context = {};
                var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                    expect(this).toBe(context);
                });
                spreadSheet.createWorksheet("Worksheet Title", worksheetCallback, context);
                expect(worksheetCallback).toHaveBeenCalled();
            });
        });

        it("GSLoader.Spreadsheet.createWorksheet calls callback with specified context when passed as attribute of options", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                var context = {};
                var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                    expect(this).toBe(context);
                });
                spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    callback: worksheetCallback,
                    callbackContext: context
                });
                expect(worksheetCallback).toHaveBeenCalled();
            });
        });

        it("GSLoader.Spreadsheet.createWorksheet calls callback with spreasheet as context when context is not passed", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                    expect(this).toBe(spreadSheet);
                });
                spreadSheet.createWorksheet("Worksheet Title", worksheetCallback);
                expect(worksheetCallback).toHaveBeenCalled();
            });
        });

        it("GSLoader.Spreadsheet.createWorksheet adds newly created worksheet to spreadsheetOjbect", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                expect(spreadSheet.worksheets.length).toBe(0);
                var wSheet = spreadSheet.createWorksheet("Worksheet Title");
                expect(wSheet).toBeDefined();
                expect(wSheet.title).toBe("Worksheet Title");
                expect(spreadSheet.worksheets.length).toBe(1);
                expect(spreadSheet.worksheets[0]).toBe(wSheet);
            });
        });

        describe("createSpreadsheet with headerTitles and rowData", function() {
            var cellFeed;
            var spreasheet;
            var worksheet;
            var headerTitles = ["Id", "Summary", "Points", "Issue Type", "Status"];
            var rowData = [
                ["JT:001", "Allow adding rows from object", "3", "Story", "Backlog"],
                ["JT:002", "Cache user setting", "2", "Story", "Open"],
                ["JT:003", "Add javascript minify", "1", "Story", "Open"],
                ["JT:004", "Display spreadsheet list", "2", "Story", "Open"],
                ["JT:005", "Display & render list", "2", "Story's points", '"Open"']
            ];

            beforeEach(function(){
                $.fixture("GET feeds/list/spreadsheet02/od7/private/full", "jasmine/fixtures/Spreadsheet-02-od7.xml");
                cellFeed = "https://spreadsheets.google.com/feeds/cells/spreadsheet02/od7/private/full";

                GSLoader.createSpreadsheet("Spreadsheet Title", function(sSheet) {
                    spreadSheet = sSheet
                });
                worksheet = null;
            });


            function checkCellEntry(entryObj, cellFeed, rowNo, colNo, value) {
                var childs = {};
                $(entryObj).children().each(function(idx, obj) {
                    childs[this.nodeName] = $(this);
                });
                var cellNo = "R{0}C{1}".format(rowNo, colNo);

                expect(childs["BATCH:ID"].text()).toBe(cellNo);
                expect(childs["BATCH:OPERATION"].attr("type")).toBe("update");
                expect(childs["BATCH:OPERATION"].attr("type")).toBe("update");
                expect(childs["ID"].text()).toBe(cellFeed + "/" + cellNo);
                expect(childs["GS:CELL"].attr("row")).toBe(rowNo.toString());
                expect(childs["GS:CELL"].attr("col")).toBe(colNo.toString());
                expect(childs["GS:CELL"].attr("inputValue")).toBe(value);
            }

            it("GSLoader.Spreadsheet.createWorksheet creates header from headers and rowData by making ajax call", function() {
                expect(spreadSheet.worksheets.length).toBe(0);
                spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    rows: 1,
                    cols: 5,
                    headers: headerTitles,
                    rowData: rowData
                }, function(wSheet) {
                    worksheet = wSheet;
                });

                waitsFor(function() {
                    return worksheet;
                }, "Worksheet is created", 2000)
                runs(function() {
                    expect(worksheet).toBeDefined();
                    expect(spyOnAjax.callCount).toBe(4);
                    var postCallArgs = spyOnAjax.calls[2].args[0];
                    expect(postCallArgs.type).toBe("POST");
                    expect(postCallArgs.contentType).toBe("application/atom+xml");
                    expect(postCallArgs.url).toBe("https://spreadsheets.google.com/feeds/cells/spreadsheet02/od7/private/full/batch");
                    expect(postCallArgs.headers["GData-Version"]).toBe("3.0");
                    expect(postCallArgs.headers["If-Match"]).toBe("*");
                    var $postData = $(postCallArgs.data);
                    expect($postData.length).toBe(1);
                    expect($postData[0].nodeName).toBe("FEED");
                    expect($postData.children("id").text()).toBe(cellFeed);
                    var entries = $postData.children("entry");
                    var entryIdx = 0; /* At this time, rowData object is changed. Now it have header added to it;  */
                    $.each(rowData, function(rNo, rData) {
                        for (var c = 0; c < rData.length; c++) {
                            checkCellEntry(entries.eq(entryIdx), cellFeed, rNo + 1, c + 1, rData[c]);
                            entryIdx++;
                        }
                    })
                })

            });

            it("GSLoader.Spreadsheet.createWorksheet don't post batch entry for null or undefined cell value", function() {
                rowData = [["", null, undefined, "Valid", false]]
                spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    rows: 1,
                    cols: 5,
                    headers: headerTitles,
                    rowData: rowData
                }, function(wSheet) {
                    worksheet = wSheet;
                });

                waitsFor(function() {
                    return worksheet;
                }, "Worksheet is created", 2000)
                runs(function() {
                    var postCallArgs = spyOnAjax.calls[2].args[0];
                    var $postData = $(postCallArgs.data);
                    expect($postData.length).toBe(1);
                    expect($postData[0].nodeName).toBe("FEED");
                    expect($postData.children("id").text()).toBe(cellFeed);
                    var entries = $postData.children("entry");
                    expect(entries.length).toBe(8);
                    var entryIdx = 0;
                    /* At this time, rowData object is changed. Now it have header added to it;  */
                    $.each(rowData, function(rNo, rData) {
                        for (var c = 0; c < rData.length; c++) {
                            if (rData[c] !== null && typeof rData[c] !== "undefined"){
                                checkCellEntry(entries.eq(entryIdx), cellFeed, rNo + 1, c + 1, rData[c].toString());
                                entryIdx++;
                            }
                        }
                    })
                })

            });

            it("GSLoader.Spreadsheet.createWorksheet creates rows from passed data and fetch latest data", function() {
                spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    rows: 4,
                    cols: 5,
                    headers: headerTitles
                }, function(wSheet) {
                    worksheet = wSheet;
                });
                waitsFor(function() {
                    return worksheet;
                }, "Worksheet is created", 2000)
                runs(function() {
                    expect(worksheet).toBeDefined();
                    expect(worksheet.rows.length).toBe(4);
                    expect(spyOnAjax.callCount).toBe(4);
                    expect(spreadSheet.worksheets.length).toBe(1);
                    expect(spreadSheet.worksheets[0].rows.length).toBe(4);
                    expect(spyOnAjax.mostRecentCall.args[0].url).toBe("https://spreadsheets.google.com/feeds/list/spreadsheet02/od7/private/full");
                })
            });
        });

    });

});