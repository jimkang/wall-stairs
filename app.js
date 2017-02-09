var qs = require('qs');
var renderStairs = require('./representers/render-stairs');
var randomId = require('idmaker').randomId;
var seedRandom = require('seedrandom');
var createProbable = require('probable').createProbable;

var probable;

const stairMarginLeft = 0;
const boardWidth = 800;

((function go() {
  window.onhashchange = route;
  route();
})());

function route() {
  // Skip the # part of the hash.
  var routeDict = qs.parse(window.location.hash.slice(1));
  var seed;
  if ('set' in routeDict) {
    seed = routeDict.set;
  }
  else {
    seed = randomId(8);
    routeDict.set = seed;
    var updatedURL = location.protocol + '//' + location.host + location.pathname + '#' + qs.stringify(routeDict);
    // Sync URL without triggering onhashchange.
    window.history.pushState(null, null, updatedURL);
  }

  probable = createProbable({
    random: seedRandom(seed)
  });

  // Routing logic.
  // Render no matter what.
  // renderStairs([
  //   {
  //     id: 'one',
  //     vector: [400, 400],
  //     stepWidth: 40,
  //     stepHeight: 40,
  //     startHorizontally: false,
  //     floorAtTop: true
  //   },
  //   {
  //     id: 'two',
  //     vector: [-300, 200],
  //     stepWidth: 60,
  //     stepHeight: 50
  //   }
  // ]);
  var flightSpecs = generateFlightSpecs(10, boardWidth);
  // console.log(JSON.stringify(flightSpecs, null, '  '));
  renderStairs({
    flightSpecs: flightSpecs, leftLimit: stairMarginLeft, rightLimit: boardWidth
  });
}

function generateFlightSpecs(numberOfFlights, boardWidth) {
  var lastSpec;
  var lastX = 0;
  // var lastY = 0;
  var specs = [];

  for (var i = 0; i < numberOfFlights; ++i) {
    let vectorX = probable.rollDie(boardWidth);
    let vectorY = ~~(vectorX/2) + probable.roll(vectorX);

    let spec = {
      id: randomId(4),
      vector: [vectorX, vectorY],
      floorAtTop: probable.roll(3) === 0,
      startHorizontally: true
    };

    if (i === 0) {
      spec.overrideStartY = 2;
    }
    else if (probable.roll(3) === 0) {
      // Move the x position of the flight to somewhere random.
      var direction = probable.roll(2) === 0 ? 1 : -1;
      spec.overrideStartX = lastX + direction * probable.roll(boardWidth/4);
      // Put a floor at the top of every flight that jumps over.
      spec.floorAtTop = true;
    }

    spec.stepWidth = spec.vector[0] / (5 + probable.roll(10));
    spec.stepHeight = spec.vector[1] / (5 + probable.roll(10));

    if (lastSpec) {
      // TODO: Consider going back up.
      if (lastSpec.vector[0] > 0) {
        spec.vector[0] *= -1;
      }

      // Keep all the flights inside the board bounds.
      if (lastX + spec.vector[0] > boardWidth) {
        spec.vector[0] = boardWidth - lastX;
      }
      else if (lastX + spec.vector[0] < stairMarginLeft) {
        spec.vector[0] = stairMarginLeft - lastX;
      }
      spec.startHorizontally = probable.roll(2) === 0;
    }

    specs.push(spec);
    lastSpec = spec;
    lastX += lastSpec.vector[0];
    // lastY += lastSpec.vector[1];
  }

  return specs;
}
