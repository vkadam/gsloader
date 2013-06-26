/*
 *    Author: Vishal Kadam
 */
requirejs.config({
    "baseUrl": "src",
    "paths": {
        "jquery": "lib/jquery-2.0.0",
        "js-logger": "lib/js-logger/src/logger.min",
        "google-api-client": "https://apis.google.com/js/client.js?onload=googleDriveClientLoaded"
    }
});
requirejs(["js/gsloader"]);