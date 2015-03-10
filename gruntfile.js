module.exports = function(grunt) {
  var yuidocjson  = grunt.file.readJSON('yuidoc.json');
  var appConfig   = grunt.file.readJSON('public/scripts/config.json');
  var _           = require('underscore');

  var browserifyTransforms = [
    ['babelify', { only: 'public/scripts' }],
    ['hbsfy', { compiler: 'require("handlebars.mixed");'}],
    'deamdify'
  ];

  var browserifyFiles = { 'public/scripts/app.min.js': ['public/scripts/app.js'] };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), 
    browserify: {
      dev: {
        files: browserifyFiles,
        options: {
          transform: browserifyTransforms,
          browserifyOptions: {
            debug: true
          }
        }
      },
      watch: {
        files: browserifyFiles,
        options: {
          transform: browserifyTransforms,
          watch: true,
          keepAlive: true,
          browserifyOptions: {
            debug: true
          }
        }
      },
      minify: {
        files: browserifyFiles,
        options: {
          transform: browserifyTransforms.concat([['uglifyify', { global: true }]]),
        }
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
  grunt.registerTask('js:min', ['browserify:minify'])

  grunt.registerTask('default', ['concurrent:build']);
  grunt.registerTask('watch:all', ['concurrent:watch']);
  grunt.registerTask('w', ['watch:all']);
};