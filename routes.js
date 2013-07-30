module.exports = function(App) {
  return {
    root: function(req, res) {
      return res.render('index');
    },
    notes: require('./routes/notes')(App)
  }
}

