/*global $:false, GSLoader:false*/
describe("worksheet.js", function() {
    var spyOnAjax;

    beforeEach(function() {
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

    describe("rename", function() {
        beforeEach(function() {
            $.fixture("GET worksheets/spreadsheet01/private/full", "jasmine/fixtures/Spreadsheet-01.xml");
            $.fixture("PUT worksheets/spreadsheet01/private/full/od6/d9ziupyy0w", "jasmine/fixtures/Spreadsheet-01-od6-put-rename.xml");
        });

        afterEach(function() {
            $.fixture("GET worksheets/spreadsheet01/private/full", null);
            $.fixture("PUT worksheets/spreadsheet01/private/full/od6/d9ziupyy0w", null);
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
});
