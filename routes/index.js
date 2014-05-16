exports.index = function* () {
  yield this.render('index', {
    env: this.app.env
  });
};