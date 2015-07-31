var jQuery = window.$ = window.jQuery = require('jquery');

require('jquery-ui/ui/core');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/mouse');
require('jquery-ui/ui/draggable');
require('jquery-ui/ui/droppable');
require('jquery-ui/ui/sortable');
require('jquery-ui-touch-punch');
require('bootstrap');
require('../../../vendor/scripts/bootstrap-confirmation-fork');
require('filedrop');
require('./jquery.gentleTooltip');
window.fd.jQuery();
window.fd.logging = false;

module.exports = jQuery;