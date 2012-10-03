describe("String Prototype", function(){
	it("String.format returns formatted test", function(){
		expect("Some String".format()).toBeDefined();
		expect("Some String".format().length).toBe(11);
		expect("Some String {0} using {1} {2}".format("formatted", "String", "formatter" )).toBe("Some String formatted using String formatter");
		expect("HERE word is used {0} and {0}".format("HERE")).toBe("HERE word is used HERE and HERE");
	});

});

describe("GSLoader", function(){

	beforeEach(function(){
		$.ajaxSetup({ async: false });
	});

	afterEach(function(){
		$.ajaxSetup({ async: true });
	});

	describe("GSLoader logger", function(){
		var lastConsoleMessage = null;
		var oldConsole = console || null;
		beforeEach(function(){
			console = {
				log: function(message){
					lastConsoleMessage = message;
				}
			}
		});

		afterEach(function(){
			console = oldConsole;
		})

		it("GSLoader.log don't logs messages when debug is false (Default)", function(){
			var gsLoader = new GSLoader();
			gsLoader.log('some logger message');
			expect(lastConsoleMessage).toBeNull();
		});

		it("GSLoader.log logs messages when debug is true", function(){
			var gsLoader = new GSLoader({debug: true});
			gsLoader.log('some logger message');
			expect(lastConsoleMessage).toBe('some logger message');
		});
	});

	describe("GSLoader.loadSheet", function(){
		beforeEach(function(){
			$.fixture("worksheets/spreadsheet01/private/full","jasmine/fixtures/SpreadSheet-01.xml");
		});

		it("GSLoader.loadSheet loads list of all worksheets", function(){
			var spreadSheet = GSLoader.loadSheet('spreadsheet01');
			expect(spreadSheet).toBeDefined();
			expect(spreadSheet.title).toBe("Mindtap Environment Settings");
			expect(spreadSheet.sheets.length).toBe(4);
		});

		function checkWorksheet(worksheet, title, key, listFeed){
			expect(worksheet.title).toBe(title);
			expect(worksheet.id).toBe(key);
		}

		it("GSLoader.loadSheet loads list of all worksheets with correct data", function(){
			var spreadSheet = GSLoader.loadSheet('spreadsheet01');
			checkWorksheet(spreadSheet.sheets[0], "Environments", "od6");
			checkWorksheet(spreadSheet.sheets[3], "DEV", "oda");
		});

	});
});