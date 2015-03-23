if [ "$NODE_ENV" = "production" ]; then
  npm run build
else
  echo "Not in production -- skipping build."
fi
