var gulp = require('gulp');
var _ = require('underscore');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var bundleLogger = require('./utils/bundle_logger');
var glob = require('glob');
var mime = require('mime');
var jade = require('jade');

var AWS = require('aws-sdk');
var s3 = new AWS.S3({region: 'us-west-2'});

var putObject = function(params, file, def) {
  bundleLogger.upload(file);
  s3.putObject(params, function(err_) {
    if(err_) {
      console.log('Unable to upload:', file, err_, err_.stack);
      def.reject();
    } else {
      bundleLogger.uploadDone(file);
      def.resolve();
    }
  });
};

gulp.task('publish', ['index'], function() {
  // Todo publish to s3
  var manifest = require('../rev-manifest.json');

  var ASSET_DIR = process.env.ASSET_DIR;
  if(!ASSET_DIR) throw 'ASSET_DIR missing';

  var files = ['index.html'];

  _.values(manifest).forEach(function(file) {
    if(/\.js$/.test(file)) files.push(file + '.map');
    files.push(file);
  });

  glob.sync('./public/vendor/bootstrap/fonts/*.*').forEach(function(file) {
    files.push(file.replace('./public/', ''));
  });

  var promises = _.map(files, function(file) {
    var def = Q.defer();
    var localFile = 'public/' + file;
    var gzip = fs.existsSync(localFile + '.gz');
    var isIndex = /index.html$/.test(file);

    var stream = fs.createReadStream(localFile + (gzip ? '.gz' : ''));
    var bucket = 'gentle';
    var key = ASSET_DIR + '/assets/' + file;

    var expires = new Date();
    expires.setTime(expires.getTime() + 365 * 24 * 3600 * 1000);

    var objParams = {
      Bucket: bucket,
      Key: key,
      Body: stream,
      ACL: 'public-read',
      ContentDisposition: 'inline',
      ContentType: mime.lookup(localFile)
    };

    if(gzip) objParams.ContentEncoding = 'gzip';

    if(isIndex) {
      _.extend(objParams, {
        CacheControl: 'max-age=0'
      });

      putObject(objParams, file, def);
    } else {
      _.extend(objParams, {
        CacheControl: 'public, max-age=31536000',
        Expires: expires
      });

      s3.headObject({
        Bucket: bucket,
        Key: key
      }, function(err) {
        if(err) {
          if(err.code === 'NotFound') {
            putObject(objParams, file, def);
          } else {
            console.log('Unable to upload:', file, err, err.stack);
            def.reject();
          }
        } else {
          def.resolve();
          bundleLogger.skip(file);
        }
      });
    } 

    return def.promise;
  });

  return Q.allSettled(promises);
});


gulp.task('index', ['build'], function() {
  var template = jade.compileFile(path.join(__dirname, '../views/index.jade'));
  var manifest = require('../rev-manifest.json');

  var html = template({
    appPath: manifest['scripts/app.min.js'], 
    vendorPath: manifest['scripts/vendor.js'],
    stylePath: manifest['stylesheets/app.css'],
    packageVersion: require('../package.json').version
  });

  fs.writeFileSync('public/index.html', html);
});