/*global module:false*/
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        meta: {
            banner: "/* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
        },
        concat: {
            options: {
                separator: ";\n/**********************************/\n",
                banner: "<%= meta.banner %>"
            },
            dist: {
                src: ["src/js/gsloader.js", "src/js/spreadsheet.js", "src/js/worksheet.js", "src/js/plugins/gsloader-drive.js", "src/js/plugins/gsloader-auth.js"],
                dest: "dist/<%= pkg.name %>.js"
            }
        },
        uglify: {
            options: {
                banner: "<%= meta.banner %>"
            },
            dist: {
                files: {
                    "dist/<%= pkg.name %>.min.js": ["<%= concat.dist.dest %>"]
                }
            }
        },
        jsbeautifier: {
            files: "<%= jshint.files %>",
            options: {
                "preserve_newlines": true,
                "max_preserve_newlines": 2
            }
        },
        connect: {
            jasmine: {
                options: {
                    port: 8889
                }
            }
        },
        open: {
            jasmine: {
                url: "<%= jasmine.all.options.host %>_SpecRunner.html"
            }
        },
        jasmine: {
            all: {
                options: {
                    specs: ["jasmine/specs/**/*Spec.js"],
                    host: "http://127.0.0.1:<%= connect.jasmine.options.port %>/",
                    template: require("grunt-template-jasmine-requirejs"),
                    templateOptions: {
                        requireConfigFile: "src/js/require-config.js",
                        requireConfig: {
                            baseUrl: "/src",
                            paths: {
                                "jquery-fixture": "../jasmine/lib/jquery-fixture/jquerymx-3.2.custom",
                                "google-api-client": "../jasmine/lib/google-api-client"
                            },
                            shim: {
                                "jquery-fixture": {
                                    deps: ["jquery"]
                                }
                            },
                            deps: ["jquery", "jquery-fixture"]
                        }
                    }
                }
            }
        },
        watch: {
            options: {
                files: ["src/js/**/*.js", "src/views/**/*.hbs"],
                tasks: ["dist", "uglify"],
                interrupt: true,
                debounceDelay: 5,
                interval: 5
            }
        },
        jshint: {
            files: ["package.json", "Gruntfile.js", "src/js/**/*.js", "jasmine/specs/**/*.js"],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                unused: true,
                debug: true,
                camelcase: true,
                globals: {
                    requirejs: false,
                    require: false,
                    define: false,
                    jasmine: false,
                    describe: false,
                    it: false,
                    spyOn: false,
                    expect: false,
                    waitsFor: false,
                    runs: false,
                    beforeEach: false,
                    afterEach: false
                }
            }
        }
    });

    /* These plugins provide necessary tasks. */
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-open");
    grunt.loadNpmTasks("grunt-jsbeautifier");

    /* Register tasks. */
    grunt.registerTask("dist", ["concat", /*"handlebars", */ "uglify"]);
    grunt.registerTask("default", ["jsbeautifier", "jshint", "dist", "connect", "jasmine"]);
    grunt.registerTask("test", ["dist", "connect", "jasmine"]);
    grunt.registerTask("jasmine-server", ["dist", "jasmine:all:build", "open:jasmine", "connect::keepalive"]);
};
