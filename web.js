// TODO: Add database indices

var async = require('async');
var express = require('express');
var path = require('path');
var Sequelize = require('sequelize-postgres').sequelize;
var postgres  = require('sequelize-postgres').postgres;

if (!String.prototype.trim) {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

var sequelize = new Sequelize('whisper', 'whisper', 'l27yzeG2IqaVrGWxajVd6uZ9mXwkPp6iQg8RBE49UfzKhil8Bgs5VhjHedkaUz7w', {
  host: '127.0.0.1',
  port: '5432',
  dialect: 'postgres',
  omitNull: true,
  define: {
    underscored: false,
    syncOnAssociation: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    timestamps: true
  }
});

var App = {};
App.data = {};
App.sequelize = sequelize;
App.Models = {};
App.Models.DeadDrop = require('./models/dead-drop').DeadDrop(sequelize);
App.Models.Letter = require('./models/letter').Letter(sequelize);
App.Models.Note = require('./models/note').Note(sequelize);

var app = express();
App.app = app;

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  if (process.env.NODE_ENV !== "production") {
    app.use(express.logger({
      format: 'dev'
    }));
  }

  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  if (process.env.NODE_ENV !== "production") {
    app.use(require('stylus').middleware(__dirname + '/public'));
  }
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var routes = require('./routes')(App);

app.get('/', routes.root);
app.post('/letters', routes.letters.create);
app.get('/letters', routes.letters.index);
app.post('/letters/:letterId/destroy', routes.letters.destroy);
app.post('/notes', routes.notes.create);
app.get('/notes/:salt', routes.notes.show);
app.post('/users', routes.users.create);
app.post('/users/auth', routes.users.auth);
app.get('/users/:alias', routes.users.show);

app.get('*', function(req, res){
  var fullURL = req.protocol + "://" + req.get('host') + req.url;
  console.log("404 for page: " + fullURL);
  res.status(404);
  return res.end();
});

var destroyOldNotes = function() {
  var cutoff = new Date((new Date()) - (1000 * 60 * 60 * 24 * 15));
  App.Models.Note.findAll({where: ["\"createdAt\" < ?", cutoff]}).success(function(notes) {
    async.each(notes, function(note, callback) {
      note.destroy().success(function() {
        callback();
      });
    }, function() {});
  });
};
destroyOldNotes();
setInterval(destroyOldNotes, 1000 * 60 * 60);

app.listen(app.get('port'));
console.log("Server listening for HTTP on port " + app.get('port') + " in " + app.get('env') + " mode");

