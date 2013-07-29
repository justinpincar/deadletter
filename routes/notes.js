module.exports = function(App) {
  return {
    create: function(req, res, next) {
      var salt = req.body.salt;
      var encrypted = req.body.encrypted;

      App.Models.Note.create({
        salt: salt,
        encrypted: encrypted
      }).success(function(note) {
        return res.end();
      });
    },
    show: function(req, res, next) {
      var salt = req.params.salt;

      App.Models.Note.find({where: {salt: salt}}).success(function(note) {
        if (!note) {
          res.status(404);
          return res.end();
        }

        // TODO: Destroy note
        return res.send(note);
      });
    }
  }
};

