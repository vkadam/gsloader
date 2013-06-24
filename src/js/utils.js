define(function() {
    return {
        sanitizeOptions: function(options, attribName) {
            var opts;
            if (typeof(options) === "string") {
                opts = {};
                opts[attribName] = options;
            }
            return opts || options;
        },
        PRIVATE_SHEET_URL: "https://spreadsheets.google.com/feeds/worksheets/{0}/private/full",
        WORKSHEET_ID_REGEX: /.{3}$/
    };
});
