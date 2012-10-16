/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    "use strict";
    grunt.initConfig({
        // pkg: '<json:gsloader.json>',
        // meta: {
        //     banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        //     '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        //     '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        //     '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        //     ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        // },
        // concat: {
        //     dist: {
        //         src: ['<banner:meta.banner>', '<file_strip_banner:src/<%= pkg.name %>.js>'],
        //         dest: 'dist/<%= pkg.name %>.js'
        //     }
        // },
        // min: {
        //     dist: {
        //         src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        //         dest: 'dist/<%= pkg.name %>.min.js'
        //     }
        // },
        lint: {
            files: ['grunt.js', 'src/js/**/*.js']
        },
        jasmine: {
            src: ['src/lib/**/*.js', 'src/lib/**/*.js', 'src/js/**/*.js'],
            specs: ['jasmine/lib/**/*.js', 'jasmine/specs/**/*Spec.js']
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'lint qunit'
        },
        jshint: {
            options: {
                asi: true,
                curly: false,
                regexdash: true,
                lastsemic: true,
                laxbreak: true,
                laxcomma: true,
                sub: true,
                boss: true,
                browser: true,
                smarttabs: true,
                expr: true,
                funcscope: true,
                globalstrict: true,
                iterator: true,
                loopfunc: true,
                multistr: true,
                onecase: true,
                scripturl: true,
                shadow: true,
                supernew: true,
                eqnull: true
            },
            globals: {
                jQuery: true,
                console: true,
                gapi: true
            }
        },
        uglify: {}
    });

    // Register tasks.
    grunt.loadNpmTasks("grunt-jasmine-runner");

    // Default task.
    grunt.registerTask("default", "jasmine lint");
};