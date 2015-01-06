module.exports = function(grunt) {
  var yuidocjson  = grunt.file.readJSON('yuidoc.json');
  var appConfig   = grunt.file.readJSON('public/scripts/config.json');
  var _           = require('underscore');

  var browserifyConfig =  {
    transform: [
      ['6to5ify', { only: 'public/scripts' }],
      ['hbsfy', { compiler: 'require("handlebars.mixed");'}],
      'deamdify'
    ]
  };

  var browserifyFiles = { 'public/scripts/app.min.js': ['public/scripts/app.js'] };



  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), 
    browserify: {
      dev: {
        files: browserifyFiles,
        options: _.extend({
          browserifyOptions: {
            debug: true
          }
        }, browserifyConfig)
      },
      watch: {
        files: browserifyFiles,
        options: _.extend({
          watch: true,
          keepAlive: true,
          browserifyOptions: {
            debug: true
          }
        }, browserifyConfig)
      }
    },

    compass: {
      dist: {
        options: {
          sassDir: 'public/stylesheets',
          cssDir: 'public/stylesheets',
          specify: 'public/stylesheets/app.scss',
          require: ['bourbon', 'SassyJSON', 'sass-globbing'],
          bundleExec: true
        }
      }
    },

    watch: {
      css: {
        files: ['public/stylesheets/**/*.{scss,sass}'],
        tasks: ['compass'],
        options: {
          atBegin: true
        }
      }
    },

    concurrent: {
      options: { logConcurrentOutput: true },
      watch: ['browserify:watch', 'watch:css'],
      build: ['browserify:dev', 'compass']
    }


  });

  // grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-concurrent');

  // Task aliases
  grunt.registerTask('css', ['compass']);
  grunt.registerTask('js', ['browserify:dev']);

  grunt.registerTask('default', ['concurrent:build']);
  grunt.registerTask('watch:all', ['concurrent:watch']);
  grunt.registerTask('w', ['watch:all']);
};