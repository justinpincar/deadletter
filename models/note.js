var Sequelize = require('sequelize');
exports.Note = function(sequelize) {
  var Note = sequelize.define('Note', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    encrypted: Sequelize.TEXT,
    salt: { type: Sequelize.STRING, unique: true }
  });
  Note.sync();
  return Note;
};

