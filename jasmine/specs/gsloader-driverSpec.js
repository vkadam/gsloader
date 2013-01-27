/*global GSLoader:false, gapi:false*/
describe("gsloader drive", function() {
    it("load method loads drive api using gapi client and does Google Auth Check", function() {
        spyOn(GSLoader.auth, "checkAuth");
        spyOn(gapi.client, "load").andCallThrough();

        GSLoader.drive.load();

        expect(gapi.client.load).toHaveBeenCalledWith("drive", "v2", jasmine.any(Function));
        expect(GSLoader.auth.checkAuth).toHaveBeenCalled();
    });

    it("createSpreadsheet return deferred request object", function() {
        var reqObj = GSLoader.drive.createSpreadsheet();
        expect(reqObj.done).toBeDefined();
        expect(reqObj.resolve).not.toBeDefined();
    });

    it("createSpreadsheet accepts options object with title and calls callback with request as context when context is not passed", function() {
        var actualCalledWithContext;
        var callback = jasmine.createSpy("Some Spy").andCallFake(function() {
            actualCalledWithContext = this;
        });
        var reqObj = GSLoader.drive.createSpreadsheet({
            title: "Spreadsheet title"
        }).done(callback);

        waitsFor(function() {
            return reqObj.state() === "resolved";
        }, "Request should be processed", 1000);

        runs(function() {
            expect(callback).toHaveBeenCalled();
            expect(callback.mostRecentCall.args[0].title).toBe("Spreadsheet title");
            expect(actualCalledWithContext).toBe(reqObj);
        });
    });

    it("createSpreadsheet calls callback with correct context when context is passed", function() {
        var actualCalledWithContext;
        var expectedCalledWithContext = {};
        var callback = jasmine.createSpy("Some Spy").andCallFake(function() {
            actualCalledWithContext = this;
        });
        var reqObj = GSLoader.drive.createSpreadsheet({
            context: expectedCalledWithContext
        }).done(callback);

        waitsFor(function() {
            return reqObj.state() === "resolved";
        }, "Request should be processed", 1000);

        runs(function() {
            expect(callback).toHaveBeenCalled();
            expect(actualCalledWithContext).toBe(expectedCalledWithContext);
        });
    });
});