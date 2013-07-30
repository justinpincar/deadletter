var Sequelize = require('sequelize');
exports.DeadDrop = function(sequelize) {
  var DeadDrop = sequelize.define('DeadDrop', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    alias: { type: Sequelize.STRING, unique: true },
    alias_lowercase: { type: Sequelize.STRING, unique: true },
    salt: Sequelize.STRING,
    password: Sequelize.STRING,
    publicKey: Sequelize.TEXT
  });
  DeadDrop.sync();
  return DeadDrop;
};

