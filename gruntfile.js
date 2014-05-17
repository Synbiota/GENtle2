module.exports = function(grunt) {
  var yuidocjson = grunt.file.readJSON('yuidoc.json');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), 
    yuidoc: {
      compile: {
        name: yuidocjson.name,
        description: yuidocjson.description,
        version: yuidocjson.version,
        url: yuidocjson.url,
        options: yuidocjson.options
      }
    }, 
    requirejs: {
      compile: {
        options: {
          name: "app",
          baseUrl: "public/scripts/",
          mainConfigFile: 'public/scripts/require.config.js',
          out: "public/scripts/app.min.js",
          optimize: 'uglify2',
          findNestedDependencies: true,
          uglify: {
            mangle: 'true'
          }
        }
      }
    }, 
    sass: {
      dist: {
        options: {
          sourcemap: true,
          includePaths: require('node-bourbon').includePaths
        },
        files: {
          'public/stylesheets/app.css': 'public/stylesheets/app.scss'
        }
      }
    }, 

    watch: {
      // docs: {
      //   files: ['public/scripts/**/*.js', '!public/scripts/app.min.js'],
      //   tasks: 'yuidoc',
      //   options: {
      //     atBegin: true
      //   }
      // },
      sass: {
        files: ['public/stylesheets/**/*.{scss,sass}'],
        tasks: ['sass'],
        options: {
          atBegin: true
        }
      },
      compile: {
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
  grunt.loadNpmTasks('grunt-sass');
};