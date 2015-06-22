var gulp = require('gulp');
var AWS = require('aws-sdk');
var opsworks = new AWS.OpsWorks();


//"aws --region='us-east-1' opsworks create-deployment --stack-id $AWS_NIGHTLY_STACK_ID --app-id $AWS_NIGHTLY_APP_ID --command '{\"Name\": \"deploy\", \"Args\": {\"migrate\": [\"false\"]}}'"

gulp.task('deploy', function() {

  var STACK_ID = process.env.STACK_ID;
  if(!STACK_ID) throw 'STACK_ID environment variable missing';

  var APP_ID = process.env.APP_ID;
  if(!APP_ID) throw 'APP environment variable missing';

  var params = {
    StackId: STACK_ID,
    AppId: APP_ID,
    Region: 'us-east-1',
    Command: {
      Name: 'deploy',
      Args: {
        migrate: ['false']
      }
    }
  };

  opsworks.createDeployment(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });
});
