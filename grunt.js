/*global module:false*/
module.exports = function(grunt) {

    "use strict";
    grunt.initConfig({
        pkg: "<json:gsloader.json>",
        meta: {
            banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today('yyyy-mm-dd') %>\n<%= pkg.homepage ? '* ' + pkg.homepage + '\n' : '' %>* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */"
        },
        concat: {
            dist: {
                separator: ";\n/**********************************/\n",
                src: ["<banner:meta.banner>", "<file_strip_banner:src/js/gsloader.js>", "<file_strip_banner:src/js/plugins/gsloader-drive.js>", "<file_strip_banner:src/js/plugins/gsloader-auth.js>"],
                dest: "dist/<%= pkg.name %>.js"
            }
        },
        min: {
            dist: {
                src: ["<banner:meta.banner>", "<config:concat.dist.dest>"],
                dest: "dist/<%= pkg.name %>.min.js"
            }
        },
        jsbeautifier: {
            files: "<config:lint.files>",
            options: {
                "preserve_newlines": true,
                "max_preserve_newlines": 1
            }
        },
        lint: {
            files: ["grunt.js", "src/js/**/*.js", "jasmine/specs/**/*.js"]
        },
        jasmine: {
            src: ["src/lib/**/*.js", "src/js/**/*.js"],
            specs: ["jasmine/lib/**/*.js", "jasmine/specs/**/*Spec.js"]
        },
        watch: {
            files: "<config:lint.files>",
            tasks: "lint"
        },
        jshint: {
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
                camelcase: true
            },
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
        },
        clean: ["_SpecRunner.html"],
        uglify: {}
    });

    grunt.loadNpmTasks("grunt-jasmine-runner");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-jsbeautifier");

    /* Register tasks. */
    grunt.registerTask("default", "jsbeautifier lint jasmine clean concat min");
    grunt.registerTask("test", "jasmine clean");
};