exports.index = function *(next) {
  yield this.render('index', {
    env: this.app.env
  });
};