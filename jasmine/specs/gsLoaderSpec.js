/*global $:false, GSLoader:false, gapi:false*/
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
        expect("Some String with \n newline".encodeXML()).toBe("Some String with &#10; newline");
    });

    it("String.encodeXML encodes ampersand before any another charaters", function() {
        expect("Some String ' & > <".encodeXML()).toBe("Some String &apos; &amp; &gt; &lt;");
    });

});

describe("GSLoader", function() {

    var spyOnAjax;

    beforeEach(function() {
        $.fixture("GET worksheets/spreadsheet01/private/full", "jasmine/fixtures/Spreadsheet-01.xml");
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

    describe("GSLoader.logger", function() {

        it("is default with WARN level", function() {
            expect(GSLoader.logger).toBeDefined();
            expect(GSLoader.logger.enabledFor(Logger.DEBUG)).toBeTruthy();
        });

    });

    describe("GSLoader.Spreadsheet", function() {

        it("getWorksheet returns worksheet by title", function() {
            var spreadSheet;
            GSLoader.loadSpreadsheet('spreadsheet01').done(function(sSheet) {
                spreadSheet = sSheet;
            });
            waitsFor(function() {
                return spreadSheet;
            }, "Spreadsheet should be loaded", 1000);

            runs(function() {
                var worksheet = spreadSheet.getWorksheet("Url Parameters");
                expect(worksheet).toBeDefined();
            });
        });
    });

    describe("GSLoader.loadSpreadsheet", function() {
        beforeEach(function() {
            $.fixture("GET feeds/list/spreadsheet01/od6/private/full", "jasmine/fixtures/Spreadsheet-01-od6.xml");
            $.fixture("GET feeds/list/spreadsheet01/od4/private/full", "jasmine/fixtures/Spreadsheet-01-od4.xml");
            $.fixture("GET feeds/list/spreadsheet01/od5/private/full", "jasmine/fixtures/Spreadsheet-01-od5.xml");
            $.fixture("GET feeds/list/spreadsheet01/oda/private/full", "jasmine/fixtures/Spreadsheet-01-oda.xml");
        });

        it("GSLoader.loadSpreadsheet returns jQuery Deferred object", function() {
            var reqObj = GSLoader.loadSpreadsheet({
                id: "spreadsheet01"
            });
            expect(reqObj.done).toBeDefined();
            expect(reqObj.fail).toBeDefined();
            expect(reqObj.then).toBeDefined();
            expect(reqObj.resolve).not.toBeDefined();
        });

        it("GSLoader.loadSpreadsheet loads list of all worksheets", function() {
            var spreadSheet;
            GSLoader.loadSpreadsheet('spreadsheet01').done(function(sSheet) {
                spreadSheet = sSheet;
            });
            waitsFor(function() {
                return spreadSheet;
            }, "Spreadsheet should be loaded", 1000);

            runs(function() {
                expect(spreadSheet).toBeDefined();
                expect(spreadSheet.title).toBe("Mindtap Environment Settings");
                expect(spreadSheet.id).toBe("spreadsheet01");
                expect(spreadSheet.worksheets.length).toBe(4);
            });
        });

        function loadSpreadsheet(expectedContext) {
            var returnObject = {};
            var req = GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                context: expectedContext
            }).done(function() {
                returnObject.callWithContext = this;
            });

            waitsFor(function() {
                return returnObject.callWithContext;
            }, "Spreadsheet should be loaded", 1000);

            returnObject["request"] = req;
            return returnObject;
        }

        it("GSLoader.loadSpreadsheet calls callback with specified context", function() {
            var expectedCalledWithContext = {};
            var req = loadSpreadsheet(expectedCalledWithContext);
            runs(function() {
                expect(req.callWithContext).toBe(expectedCalledWithContext);
            });
        });

        it("GSLoader.loadSpreadsheet calls callback with deferred object when context is not specified", function() {
            var req = loadSpreadsheet();
            runs(function() {
                expect(req.callWithContext).toBe(req.request);
            });
        });

        function checkWorksheet(worksheet, title, id, listFeed, cellsFeed) {
            if (title) {
                expect(worksheet.title).toBe(title);
            }
            if (id) {
                expect(worksheet.id).toBe(id);
            }
            if (listFeed) {
                expect(worksheet.listFeed).toBe(listFeed);
            }
            if (cellsFeed) {
                expect(worksheet.cellsFeed).toBe(cellsFeed);
            }
        }

        it("GSLoader.loadSpreadsheet loads list of all worksheets with correct data", function() {
            var spreadSheet;
            GSLoader.loadSpreadsheet('spreadsheet01').done(function(sSheet) {
                spreadSheet = sSheet;
            });
            waitsFor(function() {
                return spreadSheet;
            }, "Spreadsheet should be loaded", 1000);

            runs(function() {
                expect(spreadSheet.worksheets.length).toBe(4);
                checkWorksheet(spreadSheet.worksheets[0], "Environments", "od6", "https://spreadsheets.google.com/feeds/list/spreadsheet01/od6/private/full", "https://spreadsheets.google.com/feeds/cells/spreadsheet01/od6/private/full");
                checkWorksheet(spreadSheet.worksheets[3], "DEV", "oda", "https://spreadsheets.google.com/feeds/list/spreadsheet01/oda/private/full", "https://spreadsheets.google.com/feeds/cells/spreadsheet01/oda/private/full");
            });
        });

        it("GSLoader.loadSpreadsheet loads data for all worksheets", function() {
            var spreadSheet;
            GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                wanted: "*"
            }).done(function(sSheet) {
                spreadSheet = sSheet;
            });
            waitsFor(function() {
                return spreadSheet;
            }, "Spreadsheet should be loaded", 1000);

            runs(function() {
                expect(spreadSheet.id).toBe("spreadsheet01");
                expect(spreadSheet.worksheets.length).toBe(4);
                expect(spreadSheet.worksheets[0].rows).toBeDefined();
                expect(spreadSheet.worksheets[0].rows.length).toBe(8);
                expect(spreadSheet.worksheets[1].rows.length).toBe(7);
                expect(spreadSheet.worksheets[2].rows.length).toBe(6);
                expect(spreadSheet.worksheets[3].rows.length).toBe(5);
            });
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
            var spreadSheet;
            var callbackCallCount = 0;
            GSLoader.loadSpreadsheet({
                id: "spreadsheet01",
                wanted: ["Environments"]
            }).done(function(sSheet) {
                callbackCallCount++;
                spreadSheet = sSheet;
            });

            waitsFor(function() {
                return spreadSheet;
            }, "Spreadsheet should be loaded", 1000);

            runs(function() {
                expect(spreadSheet.worksheets.length).toBe(4);
                var rows = spreadSheet.worksheets[0].rows;
                checkRow(rows[0], 1, "LOCAL", "Local", "http://d-ws.cengage.com/ssows/SSOws?WSDL", "http://localhost", "http://d-ws.cengage.com/olrws/OLRws?WSDL");
                checkRow(rows[1], 2, "DEV", "Development", "http://d-ws.cengage.com/ssows/SSOws?WSDL", "http://qae-ng.cengage.com", "http://d-ws.cengage.com/olrws/OLRws?WSDL");
                expect(callbackCallCount).toBe(1);
            });
        });
    });

    describe("GSLoader.createSpreadsheet", function() {

        var spyOnGSLoaderDrive;
        beforeEach(function() {
            spyOnGSLoaderDrive = spyOn(GSLoader.drive, 'createSpreadsheet').andCallThrough();
        });

        afterEach(function() {
            delete gapi._requestCallBackData.id;
        });

        it("GSLoader.createSpreadsheet returns jQuery Deferred object", function() {
            var reqObj = GSLoader.createSpreadsheet();
            expect(reqObj.done).toBeDefined();
            expect(reqObj.resolve).not.toBeDefined();
        });

        function assertCreateSpreadsheet(expectedContext) {
            var returnObject = {};
            var callback = jasmine.createSpy("Some Spy").andCallFake(function() {
                returnObject.callWithContext = this;
            });
            var reqObj = GSLoader.createSpreadsheet({
                title: "Mindtap Environment Settings",
                context: expectedContext
            }).done(callback);

            waitsFor(function() {
                return reqObj.state() === "resolved";
            }, "Request should be processed", 1000);

            returnObject = {
                callback: callback,
                request: reqObj
            };
            return returnObject;
        }

        it("GSLoader.createSpreadsheet call GSLoader.drive.createSpreadsheet and execute callback with correct context", function() {
            gapi._requestCallBackData.id = "spreadsheet01";
            var req = assertCreateSpreadsheet();
            runs(function() {
                expect(req.callback).toHaveBeenCalled();
                var spreadSheet = req.callback.mostRecentCall.args[0];
                expect(spreadSheet.id).toBe("spreadsheet01");
                expect(spreadSheet.title).toBe("Mindtap Environment Settings");
                expect(req.callWithContext).toBe(req.request);
            });
        });

        it("GSLoader.createSpreadsheet execute callback with GSLoader as context when context is not specified", function() {
            gapi._requestCallBackData.id = "spreadsheet01";
            var expectedCalledWithContext = {};
            var req = assertCreateSpreadsheet(expectedCalledWithContext);
            runs(function() {
                expect(req.callback).toHaveBeenCalled();
                expect(req.callWithContext).toBe(expectedCalledWithContext);
            });
        });

        it("GSLoader.createSpreadsheet loads only list of worksheets and not sheet data", function() {
            gapi._requestCallBackData.id = "spreadsheet01";
            var req = assertCreateSpreadsheet();
            runs(function() {
                var spreadSheet = req.callback.mostRecentCall.args[0];
                expect(spreadSheet.id).toBe("spreadsheet01");
                expect(spreadSheet.worksheets.length).toBe(4);
            });
        });

        it("GSLoader.createSpreadsheet creates spreadsheet with title only", function() {
            gapi._requestCallBackData.id = "spreadsheet01";
            var spreadSheet;
            GSLoader.createSpreadsheet("Mindtap Environment Settings").done(function(sSheet) {
                spreadSheet = sSheet;
            });

            waitsFor(function() {
                return spreadSheet;
            }, "Request should be processed", 1000);

            runs(function() {
                expect(spreadSheet.id).toBe("spreadsheet01");
                expect(spreadSheet.title).toBe("Mindtap Environment Settings");
            });
        });
    });

});
