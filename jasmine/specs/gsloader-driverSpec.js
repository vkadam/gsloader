describe("gsloader drive", function() {
    it("load method loads drive api using gapi client and does Google Auth Check", function() {
        spyOn(GSLoader.auth, "checkAuth");
        spyOn(gapi.client, "load").andCallThrough();

        var driveObj = GSLoader.drive.load();

        expect(gapi.client.load).toHaveBeenCalledWith("drive", "v2", jasmine.any(Function));
        expect(GSLoader.auth.checkAuth).toHaveBeenCalled();
    });

    xit("createSpreadsheet return deferred request object", function() {
    	var reqObj = GSLoader.drive.createSpreadsheet();
    	expect(reqObj).toBe(jasmine.any($.Deferred));

    })
});