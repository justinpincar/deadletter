var utils = require('../utils');

module.exports = function(App) {
  return {
    create: function(req, res, next) {
      var alias = (req.body.alias || '').trim();
      var password = (req.body.password || '').trim();
      var publicKey = (req.body.publicKey || '').trim();

      if (!alias || !password || !publicKey) {
        res.status(422);
        return res.send("Please fill out all fields.");
      }

      App.Models.DeadDrop.find({where: {alias: alias}}).success(function(deadDrop) {
        if (deadDrop) {
          res.status(422);
          return res.send("The alias you have entered is already in use.");
        }

        var salt = utils.randomString(Math.random, 64);
        var encryptedPassword = utils.hexSha256(salt + password);

        App.Models.DeadDrop.create({
          alias: alias,
          salt: salt,
          password: encryptedPassword,
          publicKey: publicKey
        }).success(function(note) {
          return res.end();
        });
      });
    }
  }
};

