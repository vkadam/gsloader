describe("String Prototype", function() {
    it("String.format returns formatted test", function() {
        expect("Some String".format()).toBeDefined();
        expect("Some String".format().length).toBe(11);
        expect("Some String {0} using {1} {2}".format("formatted", "String", "formatter")).toBe("Some String formatted using String formatter");
        expect("HERE word is used {0} and {0}".format("HERE")).toBe("HERE word is used HERE and HERE");
    });

});

describe("GSLoader", function() {

    beforeEach(function() {
        $.ajaxSetup({
            async: false
        });
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
                key: "spreadsheet01",
                wanted: ["Environments", "DEV"]
            });
            expect(spreadSheet.sheets.length).toBe(2);
            checkWorksheet(spreadSheet.sheets[0], "Environments", "od6", "https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full");
            checkWorksheet(spreadSheet.sheets[1], "DEV", "oda", "https://spreadsheets.google.com/feeds/list/spreadsheet01/oda/private/full");
        });

        it("GSLoader.loadSpreadsheet loads data for all worksheets", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                key: "spreadsheet01"
            });
            expect(spreadSheet.sheets.length).toBe(4);
            expect(spreadSheet.sheets[0].rows).toBeDefined();
            expect(spreadSheet.sheets[0].rows.length).toBe(8);
            expect(spreadSheet.sheets[1].rows.length).toBe(7);
            expect(spreadSheet.sheets[2].rows.length).toBe(6);
            expect(spreadSheet.sheets[3].rows.length).toBe(5);
        });

        function checkRow(row, rowNumber, environmentid, environmentname, ssourl, applicationurl, olrwdslurl){
            expect(row["rowNumber"]).toBe(rowNumber);
        	expect(row["environmentid"]).toBe(environmentid);
        	expect(row["environmentname"]).toBe(environmentname);
        	expect(row["ssourl"]).toBe(ssourl);
        	expect(row["applicationurl"]).toBe(applicationurl);
        	expect(row["olrwdslurl"]).toBe(olrwdslurl);
        }

        it("GSLoader.loadSpreadsheet loads row array with all column data for specified worksheet", function() {
            var spreadSheet = GSLoader.loadSpreadsheet({
                key: "spreadsheet01",
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
                key: "spreadsheet01",
                wanted: ["Environments", "DEV"],
                success: spySuccess
            })
            expect(spySuccess).toHaveBeenCalled();
            expect(spySuccess.callCount).toBe(1);
        });
    });
});