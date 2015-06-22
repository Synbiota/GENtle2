var gulp = require('gulp');
var AWS = require('aws-sdk');
var opsworks = new AWS.OpsWorks({region: 'us-east-1'});


//"aws --region='us-east-1' opsworks create-deployment --stack-id $AWS_NIGHTLY_STACK_ID --app-id $AWS_NIGHTLY_APP_ID --command '{\"Name\": \"deploy\", \"Args\": {\"migrate\": [\"false\"]}}'"

gulp.task('deploy', ['publish'], function() {

  var STACK_ID = process.env.STACK_ID;
  if(!STACK_ID) throw 'STACK_ID environment variable missing';

  var APP_ID = process.env.APP_ID;
  if(!APP_ID) throw 'APP environment variable missing';

  var manifest = require('../rev-manifest.json');
  var customJson = {
    revManifest: manifest
  };

  var updateParams = {
    AppId: APP_ID,
    Environment: [{
      Key: 'REV_MANIFEST', 
      Value: JSON.stringify(customJson), 
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
    },
    CustomJson: JSON.stringify(customJson)
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
});