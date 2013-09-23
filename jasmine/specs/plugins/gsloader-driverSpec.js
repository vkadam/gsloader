define(['google-api-client', 'js/plugins/gsloader-auth', 'js/plugins/gsloader-drive'], function(gapi, GSLoaderAuth, GSLoaderDrive) {
    describe('gsloader-drive.js', function() {
        it('load method loads drive api using gapi client and does Google Auth Check', function() {
            spyOn(GSLoaderAuth, 'checkAuth');
            spyOn(gapi.client, 'load').andCallThrough();

            GSLoaderDrive.load();

            expect(gapi.client.load).toHaveBeenCalledWith('drive', 'v2', jasmine.any(Function));
            expect(GSLoaderAuth.checkAuth).toHaveBeenCalled();
        });

        describe('createSpreadsheet', function() {
            var actualCalledWithContext,
                createCallback;

            beforeEach(function() {
                gapi._returnFailure = false;
                createCallback = jasmine.createSpy('Some Spy').andCallFake(function() {
                    actualCalledWithContext = this;
                });
            });

            it('createSpreadsheet return deferred request object', function() {
                var reqObj = GSLoaderDrive.createSpreadsheet();
                expect(reqObj.done).toBeDefined();
                expect(reqObj.resolve).not.toBeDefined();
            });

            it('createSpreadsheet accepts options object with title and calls successCallback with request as context when context is not passed', function() {
                var reqObj = GSLoaderDrive.createSpreadsheet({
                    title: 'Spreadsheet title'
                }).done(createCallback);

                waitsFor(function() {
                    return reqObj.state() === 'resolved';
                }, 'Request should be processed', 1000);

                runs(function() {
                    expect(createCallback).toHaveBeenCalled();
                    expect(createCallback.mostRecentCall.args[0].title).toBe('Spreadsheet title');
                    expect(actualCalledWithContext).toBe(reqObj);
                });
            });

            it('createSpreadsheet calls successCallback with correct context when context is passed', function() {
                var expectedCalledWithContext = {},
                    reqObj = GSLoaderDrive.createSpreadsheet({
                        context: expectedCalledWithContext
                    }).done(createCallback);

                waitsFor(function() {
                    return reqObj.state() === 'resolved';
                }, 'Request should be processed', 1000);

                runs(function() {
                    expect(createCallback).toHaveBeenCalled();
                    expect(actualCalledWithContext).toBe(expectedCalledWithContext);
                });
            });

            it('createSpreadsheet calls failureCallback with correct context in case of failure', function() {
                gapi._returnFailure = true;
                var expectedCalledWithContext = {};
                var reqObj = GSLoaderDrive.createSpreadsheet({
                    context: expectedCalledWithContext
                }).fail(createCallback);

                waitsFor(function() {
                    return reqObj.state() === 'rejected';
                }, 'Request should be processed', 1000);

                runs(function() {
                    expect(createCallback).toHaveBeenCalled();
                    expect(actualCalledWithContext).toBe(expectedCalledWithContext);
                });
            });
        });
    });
});
