import "./styles.css";
import * as d3 from "d3";
d3.forceBounce = require("d3-force-bounce");
d3.forceSurface = require("d3-force-surface");

window.onParticleChange = onParticleChange;
window.onShelterChange = onShelterChange;
window.onQuarantineChange = onQuarantineChange;

const canvasWidth = 960,
  canvasHeight = 480;

let particle = null;
var svg = d3
  .select("body")
  .append("svg")
  .attr("width", canvasWidth)
  .attr("height", canvasHeight);

svg = svg.append("g");

let bottomQuarantine = svg
  .append("rect")
  .attr("id", "bottom-quarantine")
  .attr("x", 720)
  .attr("y", canvasHeight)
  .attr("width", 10)
  .attr("height", 0);

let topQuarantine = svg
  .append("rect")
  .attr("id", "top-quarantine")
  .attr("x", 720)
  .attr("y", 0)
  .attr("width", 10)
  .attr("height", 0);

let numGasParticles = 120,
  shelterInPlace = 0,
  quarantine = 0;

function randomVelocity() {
  return d3.randomNormal(0, 0.5)();
}

function onParticleChange(count) {
  numGasParticles = count;
  d3.select("#numparticles-val").text(count);
  const newNodes = generateParticles(count);

  forceSim.nodes(newNodes);
}

function onShelterChange(value) {
  shelterInPlace = value;
  d3.select("#shelter-val").text(value);
  const newNodes = generateParticles(numGasParticles);

  forceSim.nodes(newNodes);
}

function onQuarantineChange(value) {
  quarantine = value;

  topQuarantine.attr("height", (canvasHeight / 2) * (value / 100));

  bottomQuarantine.attr("y", canvasHeight - (canvasHeight / 2) * (value / 100));
  bottomQuarantine.attr("height", (canvasHeight / 2) * (value / 100));

  forceSim.force("container").surfaces(generateContainerSurfaces());
  const newNodes = generateParticles(numGasParticles);
  forceSim.nodes(newNodes);
}

function generateParticles() {
  const gas = d3.range(numGasParticles).map(i => {
    var x = 0;

    do {
      x = i === 0 ? 5 : Math.random() * canvasWidth;
    } while (x > 700 && x < 740);
    return {
      x: x,
      y: i === 0 ? canvasHeight - 5 : Math.random() * canvasHeight,
      vx: i !== 0 && i < shelterInPlace ? 0 : randomVelocity(),
      vy: i !== 0 && i < shelterInPlace ? 0 : randomVelocity(),
      r: 4,
      infected: i === 0 ? true : false
    };
  });

  return gas;
}

let forceSim = d3
  .forceSimulation()
  .alphaDecay(0)
  .velocityDecay(0)
  .on("tick", particleDigest)
  .force(
    "bounce",
    d3
      .forceBounce()
      .radius(d => d.r)
      .mass(mass)
      .onImpact(impact)
  )
  .force(
    "container",
    d3
      .forceSurface()
      .surfaces(generateContainerSurfaces())
      // .oneWay(true)
      .radius(d => d.r)
  )
  .nodes(generateParticles());

function mass(node) {
  //so I need shelter in place articles to not move when they are bounced into.
  //easiest way to do this is just to give them a super high mass
  return node.index !== 0 && node.index < shelterInPlace ? 9999 : 1;
}
function impact(node1, node2) {
  //if a infected node impacts a node, flag both as infected
  if (node1.infected || node2.infected) {
    node1.infected = true;
    node2.infected = true;
  }
}
//

function generateContainerSurfaces() {
  var containerSurfaces = [];

  containerSurfaces.push({
    from: { x: 0, y: 0 },
    to: { x: 0, y: canvasHeight }
  });
  containerSurfaces.push({
    from: { x: 0, y: canvasHeight },
    to: { x: 720, y: canvasHeight }
  });

  if (quarantine > 0) {
    containerSurfaces.push({
      from: { x: parseFloat(topQuarantine.attr("x")), y: canvasHeight },
      to: {
        x: parseFloat(topQuarantine.attr("x")),
        y: canvasHeight - parseFloat(topQuarantine.attr("height"))
      }
    });

    containerSurfaces.push({
      from: {
        x: parseFloat(topQuarantine.attr("x")),
        y: canvasHeight - parseFloat(topQuarantine.attr("height"))
      },
      to: {
        x:
          parseFloat(topQuarantine.attr("x")) +
          parseFloat(topQuarantine.attr("width")),
        y: canvasHeight - parseFloat(topQuarantine.attr("height"))
      }
    });

    containerSurfaces.push({
      from: {
        x:
          parseFloat(topQuarantine.attr("x")) +
          parseFloat(topQuarantine.attr("width")),
        y: canvasHeight - parseFloat(topQuarantine.attr("height"))
      },
      to: {
        x:
          parseFloat(topQuarantine.attr("x")) +
          parseFloat(topQuarantine.attr("width")),
        y: canvasHeight
      }
    });

    containerSurfaces.push({
      from: {
        x:
          parseFloat(topQuarantine.attr("x")) +
          parseFloat(topQuarantine.attr("width")),
        y: canvasHeight
      },
      to: {
        x: canvasWidth,
        y: canvasHeight
      }
    });
  } else {
    containerSurfaces.push({
      from: { x: 720, y: canvasHeight },
      to: { x: canvasWidth, y: canvasHeight }
    });
  }

  containerSurfaces.push({
    from: { x: canvasWidth, y: canvasHeight },
    to: { x: canvasWidth, y: 0 }
  });

  if (quarantine > 0) {
    containerSurfaces.push({
      from: { x: canvasWidth, y: 0 },
      to: { x: 730, y: 0 }
    });

    containerSurfaces.push({
      from: { x: 730, y: 0 },
      to: { x: 730, y: parseFloat(bottomQuarantine.attr("height")) }
    });

    containerSurfaces.push({
      from: { x: 730, y: parseFloat(bottomQuarantine.attr("height")) },
      to: { x: 720, y: parseFloat(bottomQuarantine.attr("height")) }
    });

    containerSurfaces.push({
      from: { x: 720, y: parseFloat(bottomQuarantine.attr("height")) },
      to: { x: 720, y: 0 }
    });

    containerSurfaces.push({
      from: { x: 720, y: 0 },
      to: { x: 0, y: 0 }
    });
  } else {
    containerSurfaces.push({
      from: { x: canvasWidth, y: 0 },
      to: { x: 0, y: 0 }
    });
  }

  return containerSurfaces;
}

function particleDigest() {
  particle = svg.selectAll("circle.particle").data(forceSim.nodes());

  particle.exit().remove();

  particle
    .merge(
      particle
        .enter()
        .append("circle")
        .classed("particle", true)
        .attr("r", d => d.r)
    )
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("fill", function(d, i) {
      if (d.infected === true) {
        return "red";
      } else {
        return "darkslategrey";
      }
    });
}
