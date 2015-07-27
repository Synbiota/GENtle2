var gulp = require('gulp');
var bundleLogger = require('./utils/bundle_logger');
var glob = require('glob');
var browserify = require('browserify');
var watchify = require('watchify');
var browserifyUtils = require('./utils/browserify_utils');
var source = require('vinyl-source-stream');
var _ = require('underscore');

