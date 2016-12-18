const express = require('express');
const app     = express();
const api     = require('./api');

const port = 3000;

app.set('view engine', 'ejs');

app.get('/character/:name', function (req, res) {
  console.log('api/character/:name');
  api.getCharacter(req, res)
});

app.get('/characters', function (req, res) {
  console.log('api/characters');
  api.getCharacters(req, res)
});

app.get('/planetresidents', function (req, res) {
  console.log('api/planetresidents');
  api.getPlanetResidents(req, res)
});

app.get('/bestvehicles', function (req, res) {
  console.log('api/bestvehicles');
  api.getBestVehicles(req, res)
});

app.get('/heaviestfilms', function (req, res) {
  console.log('api/heaviestfilms');
  api.getHeaviestFilms(req, res)
});

app.get('/', function (req, res) {
  res.send('Star Wars Node App');
});

app.listen(port, function () {
  console.log(`Star Wars App listening on port ${port}`)
});