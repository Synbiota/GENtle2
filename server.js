var spawn = require('child_process').spawn
  , server = spawn('http-server', ['./app', '-c-1']);

server.stdout.on('data', function (data) {
  console.log(data.toString().trim());
});

server.on('exit', function (code) {
  console.log('Server exited with code ' + code);
});
