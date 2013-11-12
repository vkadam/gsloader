require(['requirejs-injector',
    'google-api-client',
    'js/plugins/gsloader-auth',
    'js/plugins/gsloader-drive'
], function(RequirejsInjector, gapi, GSLoaderAuth, GSLoaderDrive) {
    describe('gsloader-drive.js', function() {
        describe('constructor', function() {
            var GSLoaderAuthSpy, GSLoaderDriveSpy;
            beforeEach(function() {
                GSLoaderAuthSpy = RequirejsInjector.mock(GSLoaderAuth);
                GSLoaderDriveSpy = RequirejsInjector.inject('js/plugins/gsloader-drive', {
                    'js/plugins/gsloader-auth': GSLoaderAuthSpy
                });
            });

            it('loads drive api using gapi client and does Google Auth Check', function() {
                var clientId = 'my app client id';
                spyOn(gapi.client, 'load').andCallThrough();

                new GSLoaderDriveSpy(clientId);

                expect(gapi.client.load).toHaveBeenCalledWith('drive', 'v2', jasmine.any(Function));
                expect(GSLoaderAuthSpy).toHaveBeenCalledWith(clientId, 'https://www.googleapis.com/auth/drive https://spreadsheets.google.com/feeds');
            });

            it('call google authcheck method with correct context', function() {
                var clientId = 'my app client id',
                    resultContext;
                GSLoaderAuthSpy.prototype.checkAuth.andCallFake(function() {
                    resultContext = this;
                });
                spyOn(gapi.client, 'load').andCallThrough();

                new GSLoaderDriveSpy(clientId);

                waitsFor(function() {
                    return resultContext;
                });

                runs(function() {
                    expect(resultContext).toEqual(jasmine.any(GSLoaderAuthSpy));
                });
            });
        });

        describe('createSpreadsheet', function() {
            var actualCalledWithContext,
                createCallback,
                gsLoaderDriveInst;

            beforeEach(function() {
                spyOn(gapi.client, 'load');
                gsLoaderDriveInst = new GSLoaderDrive();
                gapi._returnFailure = false;
                createCallback = jasmine.createSpy('Some Spy').andCallFake(function() {
                    actualCalledWithContext = this;
                });
            });

            it('createSpreadsheet return deferred request object', function() {
                var reqObj = gsLoaderDriveInst.createSpreadsheet();
                expect(reqObj.done).toBeDefined();
                expect(reqObj.resolve).not.toBeDefined();
            });

            it('createSpreadsheet accepts options object with title and calls successCallback with request as context when context is not passed', function() {
                var reqObj = gsLoaderDriveInst.createSpreadsheet({
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
                    reqObj = gsLoaderDriveInst.createSpreadsheet({
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
                var reqObj = gsLoaderDriveInst.createSpreadsheet({
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
