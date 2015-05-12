# svg-path-finder
Playing around with Snap SVG, canvas and web workers.

## What It Does
Find the shortest path between 2 points, and render it to SVG.  The path finding is done with [qiao's pathfinding.js](https://github.com/qiao/PathFinding.js)

## How It Does It
* Loads an image to a `<canvas>` element
* Process the `imageData` to determine transparency, which will map to walkable vs non-walkable
* Embeds the same image to an SVG
* SVG magic is handled with [Snap SVG](http://snapsvg.io/)

## How To Run It
* Install node
* run http-server
* navigate to localhost

That's it!
