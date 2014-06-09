module.exports = function(grunt) {
  var yuidocjson  = grunt.file.readJSON('yuidoc.json'),
      appConfig   = grunt.file.readJSON('public/scripts/config.json'),
      _           = require('underscore');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), 
    requirejs: {
      compile: {
        options: {
          name: "app",
          baseUrl: "public/scripts/",
          mainConfigFile: 'public/scripts/require.config.js',
          out: "public/scripts/app.min.js",
          optimize: 'uglify2',
          findNestedDependencies: true,
          include: (appConfig.plugins || []).map(function(plugin) {
            return 'plugins/' + plugin + '/plugin';
          }),
          uglify: {
            mangle: 'true'
          }
        }
      }
    }, 
    compass: {
      dist: {
        options: {
          sassDir: 'public/stylesheets',
          cssDir: 'public/stylesheets',
          specify: 'public/stylesheets/app.scss',
          require: ['bourbon', 'SassyJSON', 'sass-globbing']
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
      },
      js: {
        files: ['public/scripts/**/*.js', '!public/scripts/app.min.js'],
        tasks: 'requirejs',
        options: {
          atBegin: true,
          debounceDelay: 10000
        }
      }
    }
  });

  // grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-compass');

  // Task aliases
  grunt.registerTask('css', ['compass']);
  grunt.registerTask('js', ['requirejs']);
};