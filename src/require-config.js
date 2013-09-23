requirejs.config({
    'baseUrl': 'src',
    'paths': {
        'jquery': 'lib/jquery/jquery.min',
        'logger': 'lib/logger/logger.min',
        'google-api-client': 'https://apis.google.com/js/client.js?onload=googleDriveClientLoaded'
    }
});
requirejs(['js/gsloader']);
