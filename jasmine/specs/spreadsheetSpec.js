/*global $:false, GSLoader:false, Spreadsheet:false*/
describe("spreadsheet.js", function() {
    var spyOnAjax,
        spreadSheet,
        spyOnGSLoaderDrive;
    beforeEach(function() {
        spreadSheet = new Spreadsheet({
            id: "spreadsheet02"
        });
        $.fixture("POST worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02-od7-post.xml");
        $.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn($, "ajax").andCallThrough();
        spyOnGSLoaderDrive = spyOn(GSLoader.drive, 'createSpreadsheet').andCallThrough();
    });

    afterEach(function() {
        $.fixture("POST worksheets/spreadsheet02/private/full", null);
        $.ajaxSetup({
            async: true
        });
    });

    describe("createWorksheet", function() {
        it("returns jQuery Deferred object", function() {
            var reqObj = spreadSheet.createWorksheet();
            expect(reqObj.done).toBeDefined();
            expect(reqObj.resolve).not.toBeDefined();
        });

        it("post correct title", function() {
            spreadSheet.createWorksheet("Worksheet Title");
            expect(spyOnAjax.callCount).toBe(1);
            expect(spyOnAjax.mostRecentCall.args[0].type).toBe("POST");
            expect(spyOnAjax.mostRecentCall.args[0].contentType).toBe("application/atom+xml");
            expect(spyOnAjax.mostRecentCall.args[0].url).toBe("https://spreadsheets.google.com/feeds/worksheets/spreadsheet02/private/full");
            expect(spyOnAjax.mostRecentCall.args[0].headers["GData-Version"]).toBe("3.0");
            var jQuerypostData = $(spyOnAjax.mostRecentCall.args[0].data);
            expect(jQuerypostData.length).toBe(1);
            expect(jQuerypostData[0].nodeName).toBe("ENTRY");
            expect(jQuerypostData.find("title").text()).toBe("Worksheet Title");
        });

        it("post correct row and column number", function() {
            spreadSheet.createWorksheet({
                title: "Worksheet Title",
                rows: 10,
                cols: 5
            });
            var jQuerypostData = $(spyOnAjax.mostRecentCall.args[0].data);
            expect(jQuerypostData[0].nodeName).toBe("ENTRY");
            expect(jQuerypostData.find("title").text()).toBe("Worksheet Title");
            expect(jQuerypostData.children().filter(function() {
                return (this.nodeName === "GS:ROWCOUNT");
            }).text()).toBe("10");
            expect(jQuerypostData.children().filter(function() {
                return (this.nodeName === "GS:COLCOUNT");
            }).text()).toBe("5");
        });

        it("on success notifies done callbacks with newly created worksheet with request as context", function() {
            expect(spreadSheet.worksheets.length).toBe(0);
            var worksheet,
                actualCalledWithContext,
                worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                    worksheet = wSheet;
                    actualCalledWithContext = this;
                }),
                csReq = spreadSheet.createWorksheet("Worksheet Title").done(worksheetCallback);

            waitsFor(function() {
                return (csReq.state() === "resolved");
            }, "Worksheet should be created", 200);

            runs(function() {
                expect(worksheetCallback).toHaveBeenCalled();
                expect(worksheet).toBeDefined();
                expect(worksheet.title).toBe("Worksheet Title");
                expect(spreadSheet.worksheets.length).toBe(1);
                expect(spreadSheet.worksheets[0]).toBe(worksheet);
                expect(actualCalledWithContext).toBe(csReq);
            });
        });

        it("on success notifies done callbacks with specified context", function() {
            var expectedCalledWithContext = {},
                actualCalledWithContext,
                worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function() {
                    actualCalledWithContext = this;
                }),
                csReq = spreadSheet.createWorksheet({
                    title: "Worksheet Title",
                    context: expectedCalledWithContext
                }).done(worksheetCallback);

            waitsFor(function() {
                return (csReq.state() === "resolved");
            }, "Worksheet should be created", 200);

            runs(function() {
                expect(worksheetCallback).toHaveBeenCalled();
                expect(actualCalledWithContext).toBe(expectedCalledWithContext);
            });
        });
    });

    describe("createWorksheet with headerTitles and rowData", function() {
        var cellFeed,
            headerTitles = ["Id", "Summary", "Points", "Issue Type", "Status"],
            rowData = [
                ["JT:001", "Allow adding rows from object", "3", "Story", "Backlog"],
                ["JT:002", "Cache user setting", "2", "Story", "Open"],
                ["JT:003", "Add javascript minify", "1", "Story", "Open"],
                ["JT:004", "Display spreadsheet list", "2", "Story", "Open"],
                ["JT:005", "Display & render list", "2", "Story's points", '"Open"']
            ],
            spreadSheet;

        beforeEach(function() {
            spreadSheet = new Spreadsheet({
                id: "spreadsheet02"
            });
            $.fixture("GET feeds/list/spreadsheet02/od7/private/full", "jasmine/fixtures/Spreadsheet-02-od7.xml");
            $.fixture("POST cells/spreadsheet02/od7/private/full/batch", function() {
                return [200, "success", "", {}];
            });
            cellFeed = "https://spreadsheets.google.com/feeds/cells/spreadsheet02/od7/private/full";
        });

        afterEach(function() {
            $.fixture("GET feeds/list/spreadsheet02/od7/private/full", null);
            $.fixture("POST cells/spreadsheet02/od7/private/full/batch", null);
        });

        function checkCellEntry(entryObj, cellFeed, rowNo, colNo, value) {
            var childs = {};
            $(entryObj).children().each(function() {
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

        it("creates header from headers and rowData by making ajax call", function() {
            var worksheet;
            expect(spreadSheet.worksheets.length).toBe(0);
            spreadSheet.createWorksheet({
                title: "Worksheet Title",
                rows: 1,
                cols: 5,
                headers: headerTitles,
                rowData: rowData
            }).done(function(wSheet) {
                worksheet = wSheet;
            });

            waitsFor(function() {
                return worksheet;
            }, "Worksheet is created", 500);
            runs(function() {
                expect(worksheet).toBeDefined();
                expect(spyOnAjax.callCount).toBe(3);
                var postCallArgs = spyOnAjax.calls[1].args[0];
                expect(postCallArgs.type).toBe("POST");
                expect(postCallArgs.contentType).toBe("application/atom+xml");
                expect(postCallArgs.url).toBe("https://spreadsheets.google.com/feeds/cells/spreadsheet02/od7/private/full/batch");
                expect(postCallArgs.headers["GData-Version"]).toBe("3.0");
                expect(postCallArgs.headers["If-Match"]).toBe("*");
                var jQuerypostData = $(postCallArgs.data);
                expect(jQuerypostData.length).toBe(1);
                expect(jQuerypostData[0].nodeName).toBe("FEED");
                expect(jQuerypostData.children("id").text()).toBe(cellFeed);
                var entries = jQuerypostData.children("entry");
                expect(entries.length).toBe(30);
                // At this time, rowData object is changed. Now it have header added to it;
                var entryIdx = 0;
                $.each(rowData, function(rNo, rData) {
                    for (var c = 0; c < rData.length; c++) {
                        checkCellEntry(entries.eq(entryIdx), cellFeed, rNo + 1, c + 1, rData[c]);
                        entryIdx++;
                    }
                });
            });
        });

        it("don't post batch entry for null or undefined cell value", function() {
            var worksheet;
            rowData = [
                ["", null, undefined, "Valid", false]
            ];
            spreadSheet.createWorksheet({
                title: "Worksheet Title",
                rows: 1,
                cols: 5,
                headers: headerTitles,
                rowData: rowData
            }).done(function(wSheet) {
                worksheet = wSheet;
            });

            waitsFor(function() {
                return worksheet;
            }, "Worksheet is created", 200);
            runs(function() {
                var postCallArgs = spyOnAjax.calls[1].args[0];
                var jQuerypostData = $(postCallArgs.data);
                expect(jQuerypostData.length).toBe(1);
                expect(jQuerypostData[0].nodeName).toBe("FEED");
                expect(jQuerypostData.children("id").text()).toBe(cellFeed);
                var entries = jQuerypostData.children("entry");
                expect(entries.length).toBe(8);
                // At this time, rowData object is changed. Now it have header added to it;
                var entryIdx = 0;
                $.each(rowData, function(rNo, rData) {
                    for (var c = 0; c < rData.length; c++) {
                        if (rData[c] !== null && typeof rData[c] !== "undefined") {
                            checkCellEntry(entries.eq(entryIdx), cellFeed, rNo + 1, c + 1, rData[c].toString());
                            entryIdx++;
                        }
                    }
                });
            });
        });

        it("creates rows from passed data and fetch latest data", function() {
            var worksheet;
            spreadSheet.createWorksheet({
                title: "Worksheet Title",
                rows: 4,
                cols: 5,
                headers: headerTitles
            }).done(function(wSheet) {
                worksheet = wSheet;
            });
            waitsFor(function() {
                return worksheet;
            }, "Worksheet is created", 200);
            runs(function() {
                expect(worksheet).toBeDefined();
                expect(worksheet.rows.length).toBe(4);
                expect(spyOnAjax.callCount).toBe(3);
                expect(spreadSheet.worksheets.length).toBe(1);
                expect(spreadSheet.worksheets[0].rows.length).toBe(4);
                expect(spyOnAjax.mostRecentCall.args[0].url).toBe("https://spreadsheets.google.com/feeds/list/spreadsheet02/od7/private/full");
            });
        });
    });

    describe("getWorksheet", function() {
        beforeEach(function() {
            $.fixture("GET worksheets/spreadsheet01/private/full", "jasmine/fixtures/Spreadsheet-01.xml");
        });

        afterEach(function() {
            $.fixture("GET worksheets/spreadsheet01/private/full", null);
        });

        it("getWorksheet returns worksheet by title", function() {
            var spreadSheet;
            GSLoader.loadSpreadsheet('spreadsheet01').done(function(sSheet) {
                spreadSheet = sSheet;
            });
            waitsFor(function() {
                return spreadSheet;
            }, "Spreadsheet should be loaded", 200);

            runs(function() {
                var worksheet = spreadSheet.getWorksheet("Url Parameters");
                expect(worksheet).toBeDefined();
            });
        });
    });
});
