var gulp = require('gulp');
var _ = require('underscore');
var Q = require('q');
var fs = require('fs');
var bundleLogger = require('./utils/bundle_logger');

var AWS = require('aws-sdk');
var opsworks = new AWS.OpsWorks({region: 'us-east-1'});
// var s3 = new AWS.S3({region: 'us-west-2', logger: process.stdout});
var s3 = new AWS.S3({region: 'us-west-2'});

gulp.task('deploy', ['publish'], function() {

  var STACK_ID = process.env.STACK_ID;
  if(!STACK_ID) throw 'STACK_ID environment variable missing';

  var APP_ID = process.env.APP_ID;
  if(!APP_ID) throw 'APP_ID environment variable missing';

  var S3_HOST = process.env.S3_HOST;
  if(!S3_HOST) throw 'S3_HOST environment variable missing';  
  if(!/\/$/.test(S3_HOST)) S3_HOST = S3_HOST + '/';

  var ASSET_DIR = process.env.ASSET_DIR;
  if(!ASSET_DIR) throw 'ASSET_DIR missing';

  var manifest = _.mapObject(require('../rev-manifest.json'), function(file) {
    return S3_HOST + ASSET_DIR + '/assets/' + file;
  });

  var updateParams = {
    AppId: APP_ID,
    Environment: [{
      Key: 'REV_MANIFEST', 
      Value: JSON.stringify(manifest), 
      Secure: false
    }]
  };

  var deployParams = {
    StackId: STACK_ID,
    AppId: APP_ID,
    Command: {
      Name: 'deploy',
      Args: {
        migrate: ['false']
      }
    }
  };

  opsworks.updateApp(updateParams, function(err) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      opsworks.createDeployment(deployParams, function(err_) {
        if (err_) console.log(err_, err_.stack); // an error occurred
      });
    }
  });
  
});


gulp.task('publish', ['build'], function() {
  // Todo publish to s3
  var manifest = require('../rev-manifest.json');

  var ASSET_DIR = process.env.ASSET_DIR;
  if(!ASSET_DIR) throw 'ASSET_DIR missing';

  var files = _.flatten(_.map(_.values(manifest), function(file) {
    var output = [file, file + '.gz'];
    if(/\.js$/.test(file)) output.push(file + '.map');
    return output;
  }));

  var promises = _.map(files, function(file) {
    var def = Q.defer();
    var stream = fs.createReadStream('public/' + file);
    var bucket = 'gentle';
    var key =  ASSET_DIR + '/' + file;

    var expires = new Date();
    expires.setTime(expires.getTime() + 365 * 24 * 3600 * 1000);

    s3.headObject({
      Bucket: bucket,
      Key: key
    }, function(err) {
      if(err) {
        if(err.code === 'NotFound') {
          bundleLogger.upload(file);

          s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: stream,
            ACL: 'public-read',
            CacheControl: 'max-age=31536000',
            ContentDisposition: 'inline',
            Expires: expires
          }, function(err_) {
            if(err_) {
              console.log('Unable to upload:', file, err_, err_.stack);
              def.reject();
            } else {
              bundleLogger.uploadDone(file);
              def.resolve();
            }
          });
        } else {
          console.log('Unable to upload:', file, err, err.stack);
          def.reject();
        }
      } else {
        def.resolve();
        bundleLogger.skip(file);
      }
    });

    return def.promise;
  });

  return Q.allSettled(promises);
});