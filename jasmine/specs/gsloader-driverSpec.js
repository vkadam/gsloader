/*global GSLoader:false, gapi:false*/
describe("gsloader drive", function() {
    it("load method loads drive api using gapi client and does Google Auth Check", function() {
        spyOn(GSLoader.auth, "checkAuth");
        spyOn(gapi.client, "load").andCallThrough();

        GSLoader.drive.load();

        expect(gapi.client.load).toHaveBeenCalledWith("drive", "v2", jasmine.any(Function));
        expect(GSLoader.auth.checkAuth).toHaveBeenCalled();
    });

    describe("createSpreadsheet", function() {
        var actualCalledWithContext,
            createCallback;

        beforeEach(function() {
            gapi._returnFailure = false;
            createCallback = jasmine.createSpy("Some Spy").andCallFake(function() {
                actualCalledWithContext = this;
            });
        });

        it("createSpreadsheet return deferred request object", function() {
            var reqObj = GSLoader.drive.createSpreadsheet();
            expect(reqObj.done).toBeDefined();
            expect(reqObj.resolve).not.toBeDefined();
        });

        it("createSpreadsheet accepts options object with title and calls successCallback with request as context when context is not passed", function() {
            var reqObj = GSLoader.drive.createSpreadsheet({
                title: "Spreadsheet title"
            }).done(createCallback);

            waitsFor(function() {
                return reqObj.state() === "resolved";
            }, "Request should be processed", 1000);

            runs(function() {
                expect(createCallback).toHaveBeenCalled();
                expect(createCallback.mostRecentCall.args[0].title).toBe("Spreadsheet title");
                expect(actualCalledWithContext).toBe(reqObj);
            });
        });

        it("createSpreadsheet calls successCallback with correct context when context is passed", function() {
            var expectedCalledWithContext = {},
                reqObj = GSLoader.drive.createSpreadsheet({
                    context: expectedCalledWithContext
                }).done(createCallback);

            waitsFor(function() {
                return reqObj.state() === "resolved";
            }, "Request should be processed", 1000);

            runs(function() {
                expect(createCallback).toHaveBeenCalled();
                expect(actualCalledWithContext).toBe(expectedCalledWithContext);
            });
        });

        it("createSpreadsheet calls failureCallback with correct context in case of failure", function() {
            gapi._returnFailure = true;
            var expectedCalledWithContext = {};
            var reqObj = GSLoader.drive.createSpreadsheet({
                context: expectedCalledWithContext
            }).fail(createCallback);

            waitsFor(function() {
                return reqObj.state() === "rejected";
            }, "Request should be processed", 1000);

            runs(function() {
                expect(createCallback).toHaveBeenCalled();
                expect(actualCalledWithContext).toBe(expectedCalledWithContext);
            });
        });
    });
});
