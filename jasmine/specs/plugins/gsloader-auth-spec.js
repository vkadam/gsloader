define(['js/plugins/gsloader-auth',
    'google-api-client'
], function(GoogleDriveAuth, gapi) {
    describe('gsloader-auth.js', function() {
        describe('checkauth', function() {
            var googleDriveAuth,
                clientId = 'some client id',
                scopes = ['foo', 'bar'];

            beforeEach(function() {
                googleDriveAuth = new GoogleDriveAuth(clientId, scopes);
                spyOn(gapi.auth, 'authorize');
            });

            it('calls gapi.auth.authorize with correct parameter', function() {
                googleDriveAuth.checkAuth();
                expect(gapi.auth.authorize).toHaveBeenCalledWith({
                    'client_id': clientId,
                    scope: scopes,
                    immediate: true
                }, jasmine.any(Function));
            });

            it('return promise object for chaining', function() {
                var returnObj = googleDriveAuth.checkAuth();
                expect(returnObj.done).toBeDefined();
                expect(returnObj.resolve).toBeUndefined();
            });

            it('calls success callback when gapi.auth.authorize is success', function() {
                gapi.auth.authorize.andCallThrough();
                var callback = jasmine.createSpy('gapi.auth.authorize callback'),
                    returnObj = googleDriveAuth.checkAuth().done(callback);

                waitsFor(function() {
                    return returnObj.state() === 'resolved';
                }, 1000);

                runs(function() {
                    expect(callback).toHaveBeenCalled();
                });
            });

            function spyAuthorize(failAll) {
                var callCount = 0;
                gapi.auth.authorize.andCallFake(function(opts, callback) {
                    callCount++;
                    var data = {};
                    if (callCount === 1 || failAll) {
                        data.error = 'some error';
                    }
                    callback(data);
                });
            }

            it('calls gapi.auth.authorize with immediate=false if first call with immediate=true fails', function() {
                spyAuthorize();
                var returnObj = googleDriveAuth.checkAuth();

                waitsFor(function() {
                    return returnObj.state() === 'resolved';
                });

                runs(function() {
                    expect(gapi.auth.authorize.callCount).toBe(2);
                    expect(gapi.auth.authorize.argsForCall[0][0].immediate).toBeTruthy();
                    expect(gapi.auth.authorize.argsForCall[1][0].immediate).toBeFalsy();
                });
            });

            it('calls error callback when gapi.auth.authorize is failed second time', function() {
                spyAuthorize(true);
                var callback = jasmine.createSpy('gapi.auth.authorize error callback'),
                    returnObj = googleDriveAuth.checkAuth().fail(callback);

                waitsFor(function() {
                    return returnObj.state() === 'rejected';
                }, 1000);

                runs(function() {
                    expect(gapi.auth.authorize.callCount).toBe(2);
                    expect(callback).toHaveBeenCalled();
                });
            });

            it('calls error callback for second call to checkAuth, even after first call is failed', function() {
                spyAuthorize(true);
                var errorCallback = jasmine.createSpy('gapi.auth.authorize error callback'),
                    errorPromiseObj = googleDriveAuth.checkAuth().fail(errorCallback);

                waitsFor(function() {
                    return errorPromiseObj.state() === 'rejected';
                }, 500);

                runs(function() {
                    // Initial request is failed
                    expect(gapi.auth.authorize.callCount).toBe(2);
                    expect(errorCallback).toHaveBeenCalled();

                    gapi.auth.authorize.reset();
                    errorCallback.reset();
                    // Make second request
                    errorPromiseObj = googleDriveAuth.checkAuth().fail(errorCallback);

                    waitsFor(function() {
                        return errorPromiseObj.state() === 'rejected';
                    }, 500);

                    runs(function() {
                        // Second request should fail also and call error callback
                        expect(gapi.auth.authorize.callCount).toBe(2);
                        expect(errorCallback).toHaveBeenCalled();
                    });
                });
            });
        });
    });
});
