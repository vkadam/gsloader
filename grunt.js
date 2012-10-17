/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    "use strict";
    grunt.initConfig({
        pkg: '<json:gsloader.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        concat: {
            dist: {
                separator: ';\n/**********************************/\n',
                src: ['<banner:meta.banner>', '<file_strip_banner:src/js/gsloader.js>', '<file_strip_banner:src/js/plugins/gsloader-drive.js>', '<file_strip_banner:src/js/plugins/gsloader-auth.js>'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        min: {
            dist: {
                src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        lint: {
            files: ['grunt.js', 'src/js/**/*.js']
        },
        jasmine: {
            src: ['src/lib/**/*.js', 'src/js/**/*.js'],
            specs: ['jasmine/lib/**/*.js', 'jasmine/specs/**/*Spec.js']
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint'
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
                console: true
            }
        },
        clean: ['_SpecRunner.html'],
        uglify: {}
    });

    grunt.loadNpmTasks("grunt-jasmine-runner");
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Register tasks.
    grunt.registerTask("default", "jasmine clean lint concat min");
    grunt.registerTask("test", "jasmine clean");
};