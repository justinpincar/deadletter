module.exports = function(App) {
  return {
    root: function(req, res) {
      if ((req.headers.host == "deadletter.io") && (!req.connection.encrypted)) {
        return res.redirect('https://deadletter.io');
      }

      return res.render('index');
    },
    notes: require('./routes/notes')(App)
  }
}

