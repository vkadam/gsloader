/*global module:false*/
module.exports = function(grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: "/* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
        },
        concat: {
            options: {
                separator: ";\n/**********************************/\n",
                banner: "<%= meta.banner %>"
            },
            dist: {
                src: ["src/js/gsloader.js", "src/js/plugins/gsloader-drive.js", "src/js/plugins/gsloader-auth.js"],
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
                "max_preserve_newlines": 1
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
                src: ["src/lib/**/*.js", "src/js/**/*.js"],
                options: {
                    specs: ["jasmine/lib/**/*.js", "jasmine/specs/**/*Spec.js"],
                    host: "http://127.0.0.1:<%= connect.jasmine.options.port %>/"
                }
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
                    jQuery: false,
                    console: true,
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
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks("grunt-jsbeautifier");

    /* Register tasks. */
    grunt.registerTask("default", ["jsbeautifier", "jshint", "connect", "jasmine", "concat", "uglify"]);
    grunt.registerTask("test", ["connect", "jasmine"]);
    grunt.registerTask("jasmine-server", ["jasmine:all:build", "open:jasmine", "connect::keepalive"]);
};