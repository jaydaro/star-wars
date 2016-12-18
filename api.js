const _        = require('lodash');
const request  = require('request');
const rp       = require('request-promise');
const bPromise = require('bluebird');

const URL = 'https://swapi.co/api';

const Api = {

  /**
   * This method will let you get one characters info from the api by searching
   * character/:name
   */

  getCharacter(req, res) {
    let options = {
      uri: `${URL}/people/`,
      qs: {
        search: req.params.name
      }
    };
    rp(options)
    .then(response => {
      let character = JSON.parse(response).results[0];
      res.render('character', character ? {character: character, error: false} : {error: 'No Characters by that name'});
    })
    .catch(err => {
      console.log('error getting /character/:name', err)
    });
  },

  /**
   * This method will get 50 characters info from the api
   * will sort by ?sort=height, ?sort=weight, ?sort=name
   */

  getCharacters(req, res) {
    let options          = {
      uri: `${URL}/people/`,
    };
    let sortField        = req.query.sort;
    let allData          = [];
    let pageIndex        = 0;
    let getCharacterData = (options, allData) => {
      return rp(options)
      .then(response => {
        let data = JSON.parse(response);
        allData.push(data.results);
        if (data.next && pageIndex < 4) {
          pageIndex++;
          return getCharacterData({uri: data.next}, allData);
        }
        return _.flatten(allData);
      })
      .catch(err => console.log(err))
    };
    getCharacterData(options, allData)
    .then(response => {
      let sortedData = _.sortBy(response, [character => {
        character.height = numberCleaner(character.height);
        character.mass   = numberCleaner(character.mass);
        return character[sortField]
      }]);
      res.send(sortedData);
    })
    .catch(err => console.log('err: ', err));
  },

  /**
   * This method will get all of the planets by name along with the characters names from the api
   */

  getPlanetResidents(req, res) {
    let options = {
      uri: `${URL}/planets/`
    };
    let allData = [];

    getSwapiData(options, allData)
    .then(planets => {
      return _.reduce(planets, (acc, planet) => {
        acc[planet.name] = bPromise.all(_.map(planet.residents, url => {
            if (url) {
              return rp({uri: url})
              .then(response => {
                return JSON.parse(response).name;
              })
            }
          })
        );
        return acc;
      }, {});
    })
    .props()
    .then(allPlanets => {
      res.send(allPlanets);
    })
  },

  /**
   * This method will get the top 10 most used vehicles and sort them high to low
   */

  getBestVehicles(req, res) {
    let options = {
      uri: `${URL}/people/`,
    };
    let allData = [];

    getSwapiData(options, allData)
    .then(response => {
      return _.flatten(_.map(response, character => {
        return character.vehicles;
      }))
    })
    .then(vehicleUrls => {
      return bPromise.map(vehicleUrls, vehicleUrl => {
        return rp({uri: vehicleUrl})
        .then(vehicle => JSON.parse(vehicle))
      }, {concurrency: 10});
    })
    .then(vehicles => {
      let sortedVehicles = _.chain(vehicles)
      .uniqBy('name')
      .sortBy('pilots'.length)
      .slice(0, 10)
      .value();

      res.send(sortedVehicles)
    })
    .catch(err => console.log('err: ', err));
  },

  /**
   * This method will get all of the episodes, figure out the mass of all characters and then return them sorted by total mass
   */

  getHeaviestFilms(req, res) {
    let options  = {
      uri: `${URL}/films/`,
    };
    let allFilms = {};
    let allData  = [];

    getSwapiData(options, allData)
    .then(films => {
      allFilms = films;
      return _.reduce(films, (acc, film) => {
        acc[film.episode_id] = bPromise.all(_.map(film.characters, url => {
            if (url) {
              return rp({uri: url})
              .then(response => {
                return numberCleaner(JSON.parse(response).mass);
              })
            }
          })
        );
        return acc;
      }, {});
    })
    .props()
    .then((data) => {
      let totals    = _.mapValues(data, episode => {
        return _.sum(_.compact(episode))
      });
      let finalData = _.map(allFilms, film => {
        film.totalMass = totals[film.episode_id];
        return film;
      });
      res.send(_.sortBy(finalData, ['totalMass']).reverse());
    })
  }

};

module.exports = Api;


getSwapiData = (options, allData) => {
  return rp(options)
  .then(response => {
    let data = JSON.parse(response);
    allData.push(data.results);
    if (data.next) {
      return getSwapiData({uri: data.next}, allData);
    }
    return _.flatten(allData);
  })
  .catch(err => console.log(err))
};

numberCleaner = value => {
  return parseFloat(value.replace(/,/g, ''));
};


