# svg-path-finder
An attempt to get more comfortable with SVG, canvas and web worker things

## What
Find the shortest path between 2 points of a supplied image, and then render the path. The path finding is done with [qiao's pathfinding.js](https://github.com/qiao/PathFinding.js)

## How
* Loads an image to a `<canvas>` element
* Process the `imageData` to determine walkability of a given tile for the entire grid of tiles
* Render image and path to `svg` using [Snap SVG](http://snapsvg.io/)

## Run
* install [node](https://nodejs.org/)
* navigate to checkout directory
* run `npm install`
* run `node server.js`
* navigate to `localhost:1234`