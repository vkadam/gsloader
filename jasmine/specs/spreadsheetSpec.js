/*global Spreadsheet:true, GSLoader:true*/
var spyOnAjax;
describe("GSLoader.Spreadsheet.worksheet", function() {

    var spreadSheet,
        spyOnGSLoaderDrive;
    beforeEach(function() {
        spreadSheet = new Spreadsheet({
            id: "spreadsheet02"
        });
        // gapi._requestCallBackData.id = "spreadsheet02";
        jQuery.fixture("POST worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02-od7-post.xml");
        // jQuery.fixture("POST cells/spreadsheet02/od7/private/full/batch", function() {
        //     return [200, "success", "", {}];
        // });
        jQuery.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn(jQuery, "ajax").andCallThrough();
        spyOnGSLoaderDrive = spyOn(GSLoader.drive, 'createSpreadsheet').andCallThrough();
    });

    afterEach(function() {
        // delete gapi._requestCallBackData.id;
        spreadSheet = null;
        jQuery.ajaxSetup({
            async: true
        });
    });

    describe("createWorksheet", function() {
        it("returns jQuery Deferred object", function() {
            // createSpreadsheetAndThen(function() {
            var reqObj = spreadSheet.createWorksheet();
            expect(reqObj.done).toBeDefined();
            expect(reqObj.resolve).not.toBeDefined();
            // });
        });

        it("post correct title", function() {
            // createSpreadsheetAndThen(function() {
            spreadSheet.createWorksheet("Worksheet Title");
            expect(spyOnAjax.callCount).toBe(1);
            expect(spyOnAjax.mostRecentCall.args[0].type).toBe("POST");
            expect(spyOnAjax.mostRecentCall.args[0].contentType).toBe("application/atom+xml");
            expect(spyOnAjax.mostRecentCall.args[0].url).toBe("https://spreadsheets.google.com/feeds/worksheets/spreadsheet02/private/full");
            expect(spyOnAjax.mostRecentCall.args[0].headers["GData-Version"]).toBe("3.0");
            var jQuerypostData = jQuery(spyOnAjax.mostRecentCall.args[0].data);
            expect(jQuerypostData.length).toBe(1);
            expect(jQuerypostData[0].nodeName).toBe("ENTRY");
            expect(jQuerypostData.find("title").text()).toBe("Worksheet Title");
            // });
        });

        it("post correct row and column number", function() {
            // createSpreadsheetAndThen(function() {
            spreadSheet.createWorksheet({
                title: "Worksheet Title",
                rows: 10,
                cols: 5
            });
            var jQuerypostData = jQuery(spyOnAjax.mostRecentCall.args[0].data);
            expect(jQuerypostData[0].nodeName).toBe("ENTRY");
            expect(jQuerypostData.find("title").text()).toBe("Worksheet Title");
            expect(jQuerypostData.children().filter(function() {
                return (this.nodeName === "GS:ROWCOUNT");
            }).text()).toBe("10");
            expect(jQuerypostData.children().filter(function() {
                return (this.nodeName === "GS:COLCOUNT");
            }).text()).toBe("5");
            // });
        });

        it("on success notifies done callbacks with newly created worksheet", function() {
            // createSpreadsheetAndThen(function() {
            expect(spreadSheet.worksheets.length).toBe(0);
            var worksheet;
            var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                worksheet = wSheet;
            });
            spreadSheet.createWorksheet("Worksheet Title").done(worksheetCallback);

            waitsFor(function() {
                return worksheet;
            }, "Worksheet should be created", 200);

            runs(function() {
                expect(worksheetCallback).toHaveBeenCalled();
                expect(worksheet).toBeDefined();
                expect(worksheet.title).toBe("Worksheet Title");
                expect(spreadSheet.worksheets.length).toBe(1);
                expect(spreadSheet.worksheets[0]).toBe(worksheet);
            });
            // });
        });

        it("on success notifies done callbacks with specified context", function() {
            // createSpreadsheetAndThen(function() {
            var expectedCalledWithContext = {};
            var actualCalledWithContext;
            var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function() {
                actualCalledWithContext = this;
            });
            spreadSheet.createWorksheet({
                title: "Worksheet Title",
                context: expectedCalledWithContext
            }).done(worksheetCallback);

            waitsFor(function() {
                return actualCalledWithContext;
            }, "Worksheet should be created", 200);

            runs(function() {
                expect(worksheetCallback).toHaveBeenCalled();
                expect(actualCalledWithContext).toBe(expectedCalledWithContext);
            });
        });
    });

    it("calls callback with createWorksheet request as context when context is not passed", function() {
        // createSpreadsheetAndThen(function() {
        var actualCalledWithContext;
        var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function() {
            actualCalledWithContext = this;
        });
        var csReq = spreadSheet.createWorksheet("Worksheet Title").done(worksheetCallback);

        waitsFor(function() {
            return actualCalledWithContext;
        }, "Worksheet should be created", 200);

        runs(function() {
            expect(worksheetCallback).toHaveBeenCalled();
            expect(actualCalledWithContext).toBe(csReq);
        });

        // });
    });
});

describe("createSpreadsheet with headerTitles and rowData", function() {
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
        jQuery.fixture("GET feeds/list/spreadsheet02/od7/private/full", "jasmine/fixtures/Spreadsheet-02-od7.xml");
        // jQuery.fixture("POST worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02-od7-post.xml");
        jQuery.fixture("POST cells/spreadsheet02/od7/private/full/batch", function() {
            return [200, "success", "", {}];
        });
        jQuery.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn(jQuery, "ajax").andCallThrough();
        cellFeed = "https://spreadsheets.google.com/feeds/cells/spreadsheet02/od7/private/full";
    });

    function checkCellEntry(entryObj, cellFeed, rowNo, colNo, value) {
        var childs = {};
        jQuery(entryObj).children().each(function() {
            childs[this.nodeName] = jQuery(this);
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
        // createSpreadsheetAndThen(function() {
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
            var jQuerypostData = jQuery(postCallArgs.data);
            expect(jQuerypostData.length).toBe(1);
            expect(jQuerypostData[0].nodeName).toBe("FEED");
            expect(jQuerypostData.children("id").text()).toBe(cellFeed);
            var entries = jQuerypostData.children("entry");
            // At this time, rowData object is changed. Now it have header added to it;
            var entryIdx = 0;
            jQuery.each(rowData, function(rNo, rData) {
                for (var c = 0; c < rData.length; c++) {
                    checkCellEntry(entries.eq(entryIdx), cellFeed, rNo + 1, c + 1, rData[c]);
                    entryIdx++;
                }
            });
        });
        // });
    });

    it("don't post batch entry for null or undefined cell value", function() {
        // createSpreadsheetAndThen(function() {
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
            var jQuerypostData = jQuery(postCallArgs.data);
            expect(jQuerypostData.length).toBe(1);
            expect(jQuerypostData[0].nodeName).toBe("FEED");
            expect(jQuerypostData.children("id").text()).toBe(cellFeed);
            var entries = jQuerypostData.children("entry");
            expect(entries.length).toBe(8);
            // At this time, rowData object is changed. Now it have header added to it;
            var entryIdx = 0;
            jQuery.each(rowData, function(rNo, rData) {
                for (var c = 0; c < rData.length; c++) {
                    if (rData[c] !== null && typeof rData[c] !== "undefined") {
                        checkCellEntry(entries.eq(entryIdx), cellFeed, rNo + 1, c + 1, rData[c].toString());
                        entryIdx++;
                    }
                }
            });
        });
        // });
    });

    it("creates rows from passed data and fetch latest data", function() {
        // createSpreadsheetAndThen(function() {
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
        // });
        // });
    });
});

describe("GSLoader.Spreadsheet.worksheet.rename", function() {

    beforeEach(function() {
        jQuery.fixture("GET worksheets/spreadsheet01/private/full", "jasmine/fixtures/Spreadsheet-01.xml");
        jQuery.fixture("PUT worksheets/spreadsheet01/private/full/od6/d9ziupyy0w", "jasmine/fixtures/Spreadsheet-01-od6-put-rename.xml");
        spyOnAjax = spyOn(jQuery, "ajax").andCallThrough();
    });

    it("makes call to get latest metadata of worksheet", function() {
        GSLoader.loadSpreadsheet("spreadsheet01").done(function(spreadsheet) {
            var worksheet = spreadsheet.worksheets[0];
            expect(worksheet.title).toBe("Environments");
            expect(worksheet.metadata).not.toBeNull();

            worksheet.metadata = null;

            worksheet.rename("Worksheet Title New");

            /* Ajax calls by index 0=Load Spreadsheet, 1=Get Worksheet Metadata, 2=Rename worksheet */
            expect(spyOnAjax.callCount).toBe(3);
            expect(worksheet.metadata).not.toBeNull();
            var metadataAjaxCall = spyOnAjax.argsForCall[1][0];
            expect(metadataAjaxCall.url).toBe("https://spreadsheets.google.com/feeds/worksheets/spreadsheet01/private/full");
        });
    });

    it("makes ajax call with corrent data to update title of worksheet and update worksheet metadata", function() {
        GSLoader.loadSpreadsheet("spreadsheet01").done(function(spreadsheet) {
            var worksheet = spreadsheet.worksheets[0];
            var oldEditLink = worksheet.editLink;
            worksheet.rename("Worksheet Title New");

            /* Ajax calls by index 0=Load Spreadsheet, 1=Get Worksheet Metadata, 2=Rename worksheet */
            var renameAjaxCall = spyOnAjax.argsForCall[2][0];
            expect(renameAjaxCall.url.indexOf(oldEditLink)).toBe(0);
            expect(renameAjaxCall.type).toBe("PUT");
            expect(renameAjaxCall.contentType).toBe("application/atom+xml");
            expect(worksheet.title).toBe("Worksheet Title New");
            expect(worksheet.listFeed).toBe("https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full-UPDATED");
            expect(worksheet.cellsFeed).toBe("https://spreadsheets.google.com/feeds/cells/spreadsheet01/od6/private/full-UPDATED");
            expect(worksheet.editLink).toBe("https://spreadsheets.google.com/feeds/worksheets/spreadsheet01/private/full/od6/d9ziupyy0w-UPDATED");
        });
    });
});
