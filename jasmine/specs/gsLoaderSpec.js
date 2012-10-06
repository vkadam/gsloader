describe("String Prototype", function() {
    it("String.format returns formatted test", function() {
        expect("Some String".format()).toBeDefined();
        expect("Some String".format().length).toBe(11);
        expect("Some String {0} using {1} {2}".format("formatted", "String", "formatter")).toBe("Some String formatted using String formatter");
        expect("HERE word is used {0} and {0}".format("HERE")).toBe("HERE word is used HERE and HERE");
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

        $.fixture("worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02.xml");
        $.ajaxSetup({
            async: false
        });
        spyOnAjax = spyOn($, "ajax").andCallThrough();
    });

    afterEach(function() {
        GSLoader.disableLog();
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
            $.fixture("worksheets/spreadsheet01/private/full", "jasmine/fixtures/Spreadsheet-01.xml");
            $.fixture("feeds/list/spreadsheet01/od6/private/full", "jasmine/fixtures/Spreadsheet-01-od6.xml");
            $.fixture("feeds/list/spreadsheet01/od4/private/full", "jasmine/fixtures/Spreadsheet-01-od4.xml");
            $.fixture("feeds/list/spreadsheet01/od5/private/full", "jasmine/fixtures/Spreadsheet-01-od5.xml");
            $.fixture("feeds/list/spreadsheet01/oda/private/full", "jasmine/fixtures/Spreadsheet-01-oda.xml");
        });

        it("GSLoader.loadSpreadsheet loads list of all worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet('spreadsheet01');
            expect(spreadSheet).toBeDefined();
            expect(spreadSheet.title).toBe("Mindtap Environment Settings");
            expect(spreadSheet.sheets.length).toBe(4);
        });

        function checkWorksheet(worksheet, title, id, listFeed) {
            if (title) {
                expect(worksheet.title).toBe(title)
            };
            if (id) {
                expect(worksheet.id).toBe(id)
            };
            if (listFeed) {
                expect(worksheet.listFeed).toBe(listFeed)
            };
        }

        it("GSLoader.loadSpreadsheet loads list of all worksheets with correct data", function() {
            var spreadSheet = GSLoader.loadSpreadsheet('spreadsheet01');
            expect(spreadSheet.sheets.length).toBe(4);
            checkWorksheet(spreadSheet.sheets[0], "Environments", "od6", "https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full");
            checkWorksheet(spreadSheet.sheets[3], "DEV", "oda", "https://spreadsheets.google.com/feeds/list/spreadsheet01/oda/private/full");
        });

        it("GSLoader.loadSpreadsheet only loads list of specified worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                wanted: ["Environments", "DEV"]
            });
            expect(spreadSheet.sheets.length).toBe(2);
            checkWorksheet(spreadSheet.sheets[0], "Environments", "od6", "https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full");
            checkWorksheet(spreadSheet.sheets[1], "DEV", "oda", "https://spreadsheets.google.com/feeds/list/spreadsheet01/oda/private/full");
        });

        it("GSLoader.loadSpreadsheet loads data for all worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                id: "spreadsheet01"
            });
            expect(spreadSheet.sheets.length).toBe(4);
            expect(spreadSheet.sheets[0].rows).toBeDefined();
            expect(spreadSheet.sheets[0].rows.length).toBe(8);
            expect(spreadSheet.sheets[1].rows.length).toBe(7);
            expect(spreadSheet.sheets[2].rows.length).toBe(6);
            expect(spreadSheet.sheets[3].rows.length).toBe(5);
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
            expect(spreadSheet.sheets.length).toBe(1);
            var rows = spreadSheet.sheets[0].rows;
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
        var spreadSheet;
        beforeEach(function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(sSheet) {
                spreadSheet = sSheet;
            });
            $.fixture("worksheets/spreadsheet02/private/full", "jasmine/fixtures/Spreadsheet-02-od7.xml");
        });

        it("GSLoader.Spreadsheet.createWorksheet post correct title", function() {
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

        it("GSLoader.Spreadsheet.createWorksheet post correct row and column number", function() {
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

        it("GSLoader.Spreadsheet.createWorksheet calls callback on ajax success with newly created worksheet", function() {
            GSLoader.createSpreadsheet("Spreadsheet Title", function(spreadSheet) {
                expect(spreadSheet.sheets.length).toBe(0);
                var worksheet;
                var worksheetCallback = jasmine.createSpy("worksheetSuccess").andCallFake(function(wSheet) {
                    worksheet = wSheet;
                });
                spreadSheet.createWorksheet("Worksheet Title", worksheetCallback);
                expect(worksheetCallback).toHaveBeenCalled();
                expect(worksheet).toBeDefined();
                expect(worksheet.title).toBe("Worksheet Title");
                expect(spreadSheet.sheets.length).toBe(1);
                expect(spreadSheet.sheets[0]).toBe(worksheet);
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
                expect(spreadSheet.sheets.length).toBe(0);
                var wSheet = spreadSheet.createWorksheet("Worksheet Title");
                expect(wSheet).toBeDefined();
                expect(wSheet.title).toBe("Worksheet Title");
                expect(spreadSheet.sheets.length).toBe(1);
                expect(spreadSheet.sheets[0]).toBe(wSheet);
            });
        });
    });

});