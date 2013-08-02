var utils = require('../utils');

module.exports = function(App) {
  return {
    auth: function(req, res, next) {
      var alias = req.body.alias || '';
      var password = req.body.password;
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

        return res.end();
      });
    },
    create: function(req, res, next) {
      var alias = (req.body.alias || '').trim();
      var password = (req.body.password || '').trim();
      var publicKey = (req.body.publicKey || '').trim();

      if (!alias || !password || !publicKey) {
        res.status(422);
        return res.send("Please fill out all fields.");
      }

      if (!alias.match(/^[0-9a-zA-Z_-]+$/)) {
        res.status(422);
        return res.send("Alias must be alphanumeric.");
      }

      var aliasLowercase = alias.toLowerCase();

      App.Models.DeadDrop.find({where: {alias_lowercase: aliasLowercase}}).success(function(deadDrop) {
        if (deadDrop) {
          res.status(422);
          return res.send("The alias you have entered is already in use.");
        }

        var salt = utils.randomString(Math.random, 64);
        var encryptedPassword = utils.hexSha256(salt + password);

        App.Models.DeadDrop.create({
          alias: alias,
          alias_lowercase: aliasLowercase,
          salt: salt,
          password: encryptedPassword,
          publicKey: publicKey
        }).success(function(note) {
          return res.end();
        });
      });
    },
    show: function(req, res, next) {
      var alias = req.params.alias || '';
      var aliasLowercase = alias.toLowerCase();
      App.Models.DeadDrop.find({where: {alias_lowercase: aliasLowercase}}).success(function(deadDrop) {
        if (!deadDrop) {
          res.status(404);
          return res.end();
        }

        return res.send({
          alias: deadDrop.alias,
          publicKey: deadDrop.publicKey
        });
      });
    }
  }
};

