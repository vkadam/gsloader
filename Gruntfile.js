/*global module:false*/
module.exports = function(grunt) {
    'use strict';
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        meta: {
            banner: '/* <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>* Copyright (c) <%= pkg.author.name %>; Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
        },
        concat: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: ['dist/<%= pkg.name %>.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        requirejs: {
            'gsloader.js': {
                options: {
                    baseUrl: 'src',
                    out: 'dist/gsloader.js',
                    include: ['gsloader'],
                    paths: {
                        'jquery': 'empty:',
                        'logger': 'empty:',
                        'google-api-client': 'empty:',
                        'gsloader': 'js/gsloader'
                    },
                    optimize: 'none'
                }
            }
        },
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
                }
            }
        },
        jsbeautifier: {
            files: '<%= jshint.files %>',
            options: {
                'js': {
                    'preserve_newlines': true,
                    'max_preserve_newlines': 2
                }
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
                url: '<%= jasmine.all.options.host %>_SpecRunner.html'
            }
        },
        jasmine: {
            all: {
                options: {
                    specs: ['jasmine/specs/**/*Spec.js'],
                    host: 'http://127.0.0.1:<%= connect.jasmine.options.port %>/',
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        requireConfigFile: 'src/require-config.js',
                        requireConfig: {
                            baseUrl: '/src',
                            paths: {
                                'jquery-fixture': '../jasmine/lib/jquery-fixture/jquerymx-3.2.custom',
                                'google-api-client': '../jasmine/lib/google-api-client'
                            },
                            shim: {
                                'jquery-fixture': {
                                    deps: ['jquery']
                                }
                            },
                            deps: ['jquery', 'jquery-fixture']
                        }
                    }
                }
            }
        },
        jshint: {
            files: ['package.json', 'Gruntfile.js', 'src/**/*.js', '!src/lib/**/*', 'jasmine/specs/**/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        shell: {
            npm: {
                command: 'npm install',
                options: {
                    failOnError: true,
                    stdout: true,
                    stderr: true
                }
            }
        },
        bower: {
            install: {
                options: {
                    targetDir: 'src/lib',
                    cleanTargetDir: true,
                    layout: 'byComponent'
                }
            }
        }
    });

    /* These plugins provide necessary tasks. */
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-bower-task');

    /* Register tasks. */
    grunt.registerTask('default', ['shell:npm', 'bower:install', 'jsbeautifier', 'jshint', 'dist', 'connect', 'jasmine']);
    grunt.registerTask('dist', ['bower:install', 'requirejs', 'concat', 'uglify']);
    grunt.registerTask('test', ['dist', 'connect', 'jasmine']);
    grunt.registerTask('jasmine-server', ['dist', 'jasmine:all:build', 'open:jasmine', 'connect::keepalive']);
};
