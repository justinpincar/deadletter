var utils = require('../utils');

module.exports = function(App) {
  return {
    create: function(req, res, next) {
      var alias = req.body.alias || '';
      var aliasLowercase = alias.toLowerCase();
      var encrypted = req.body.encrypted;
      var idStr = utils.randomString(Math.random, 64);

      App.Models.Letter.create({
        alias_lowercase: aliasLowercase,
        encrypted: encrypted,
        id_str: idStr
      }).success(function(letter) {
        return res.end();
      });
    },
    index: function(req, res, next) {
      var alias = req.query.alias || '';
      var password = req.query.password;
      var aliasLowercase = alias.toLowerCase();

      App.Models.DeadDrop.find({where: {alias_lowercase: aliasLowercase}}).success(function(deadDrop) {
        if (!deadDrop) {
          res.status(401);
          return res.end();
        }

        var salt = deadDrop.salt;
        var ourEncryptedPassword = utils.hexSha256(salt + password);

        if (ourEncryptedPassword != deadDrop.password) {
          res.status(401);
          return res.end();
        }

        App.Models.Letter.findAll({where: {alias_lowercase: aliasLowercase}}).success(function(letters) {
          return res.send(letters);
        });
      });
    },
    destroy: function(req, res, next) {
      var alias = req.body.alias || '';
      var password = req.body.password;
      var aliasLowercase = alias.toLowerCase();
      var letterId = req.params.letterId;

      App.Models.DeadDrop.find({where: {alias_lowercase: aliasLowercase}}).success(function(deadDrop) {
        if (!deadDrop) {
          res.status(401);
          return res.end();
        }

        var salt = deadDrop.salt;
        var ourEncryptedPassword = utils.hexSha256(salt + password);

        if (ourEncryptedPassword != deadDrop.password) {
          res.status(401);
          return res.end();
        }

        App.Models.Letter.find({where: {id: letterId}}).success(function(letter) {
          if (!letter) {
            res.status(401);
            return false;
          }

          letter.destroy().success(function() {
            res.status(204);
            return res.end();
          });
        });
      });
    }
  }
};

