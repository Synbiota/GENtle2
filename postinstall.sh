if [ "$NODE_ENV" = "production" ]; then
   ./node_modules/gulp/bin/gulp.js manifest
else
  echo "Not in production -- skipping manifest creation."
fi
