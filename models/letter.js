var Sequelize = require('sequelize');
exports.Letter = function(sequelize) {
  var Letter = sequelize.define('Letter', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    alias_lowercase: Sequelize.STRING,
    encrypted: Sequelize.TEXT,
    id_str: Sequelize.STRING
  });
  Letter.sync();
  return Letter;
};

