module.exports = function(App) {
  return {
    create: function(req, res, next) {
      var alias = req.body.alias || '';
      var aliasLowercase = alias.toLowerCase();
      var encrypted = req.body.encrypted;

      App.Models.Letter.create({
        alias_lowercase: aliasLowercase,
        encrypted: encrypted
      }).success(function(letter) {
        return res.end();
      });
    }
  }
};

