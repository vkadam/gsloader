/*
 *    Author: Vishal Kadam
 */
requirejs.config({
    "baseUrl": "",
    "paths": {
        "jquery": "lib/jquery-1.8.2.min",
        "js-logger": "lib/js-logger/src/logger.min",
        "google-api-client": "https://apis.google.com/js/client.js?onload=googleDriveClientLoaded"
    }
});
requirejs(["js/gsloader"]);
