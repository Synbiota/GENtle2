module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  , yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: ['./app/scripts'],
          exclude: 'app.min.js',
          outdir: 'docs/'
        }
      }
    }
  , requirejs: {
      compile: {
        options: {
          name: "app",
          baseUrl: "app/scripts/",
          mainConfigFile: 'app/scripts/require.config.js',
          out: "app/scripts/app.min.js",
          optimize: 'uglify2',
          uglify: {
            mangle: 'true'
          }
        }
      }
    }
  , sass: {
      dist: {
        files: {
          'app/stylesheets/app.css': 'app/stylesheets/app.scss'
        }
      }
    }
  , watch: {
      docs: {
        files: ['app/scripts/**/*.js', '!app/scripts/app.min.js'],
        tasks: 'yuidoc',
        options: {
          atBegin: true
        }
      },
      sass: {
        files: ['app/stylesheets/**/*.{scss,sass}'],
        tasks: ['sass'],
        options: {
          atBegin: true
        }
      }

      //,
      // compile: {
      //   files: ['app/scripts/**/*.js', '!app/scripts/app.min.js'],
      //   tasks: 'requirejs',
      //   options: {
      //     atBegin: true,
      //     debounceDelay: 10000
      //   }
      // }
    }
  });

  // grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-sass');
}