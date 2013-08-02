module.exports = function(App) {
  return {
    root: function(req, res) {
      return res.render('index');
    },
    letters: require('./routes/letters')(App),
    notes: require('./routes/notes')(App),
    users: require('./routes/users')(App)
  }
}

