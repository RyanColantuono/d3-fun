import "./styles.css";
import * as d3 from "d3";
import * as topojson from "topojson";
import { sliderBottom } from "d3-simple-slider";

const width = 800,
  height = 600;

let projection, path, svg, g;
let zoom = d3.zoom().scaleExtent([1, 50]).on("zoom", zoomEvent);
let active = d3.select(null);
let root = d3.select("#app");
let unemployment = new Map();
let yearIndex = 0;
const years = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];
const color = d3.scaleQuantize().domain([1.0, 30.0]).range(d3.schemeOrRd[9]);

//set up year slider
const slider = sliderBottom()
  .min(2007)
  .max(2016)
  .width(300)
  .tickFormat(d3.format("d"))
  .ticks(7)
  .step(1)
  .on("onchange", (val) => {
    yearIndex = years.indexOf(val);
    yearChangedTransition();
  });

const gSlider = d3
  .select("div#year-slider")
  .append("svg")
  .attr("width", 500)
  .attr("height", 100)
  .append("g")
  .attr("transform", "translate(30,30)");

gSlider.call(slider);

//load our data
const promises = [
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json"),

  d3.csv("unemployment.csv", function (d) {
    unemployment.set(d.county, [
      +d.rate2007,
      +d.rate2008,
      +d.rate2009,
      +d.rate2010,
      +d.rate2011,
      +d.rate2012,
      +d.rate2013,
      +d.rate2014,
      +d.rate2015,
      +d.rate2016,
      d.area
    ]);
  })
];

Promise.all(promises).then(ready);

function ready([data]) {
  projection = d3
    .geoAlbersUsa()
    .scale(1000)
    .translate([width / 2, height / 2 - 50]);

  path = d3.geoPath().projection(projection);

  svg = root
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "choropleth")
    .on("click", stopped, true)
    .call(zoom);

  //set up rectangle that causes zoom to reset when
  //they click outside of the map
  svg
    .append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

  g = svg.append("g");

  //draw our county lines
  var countyPaths = g
    .selectAll("path.counties")
    .data(topojson.feature(data, data.objects.counties).features);

  countyPaths
    .enter()
    .append("path")
    .on("click", clicked)
    .attr("class", "counties")
    .attr("fill", function (d) {
      return unemployment.get(d.id)
        ? color(unemployment.get(d.id)[yearIndex])
        : "white";
    })
    .attr("d", path);

  //draw state lines
  g.append("path")
    .datum(
      topojson.mesh(data, data.objects.states, function (a, b) {
        return a !== b;
      })
    )
    .attr("class", "state-borders")
    .attr("d", path);

  createLegend();
}

function zoomEvent() {
  if (g) {
    g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    g.attr("transform", d3.event.transform);
  }
}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

//click outside the map, zoomout
function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
}

//transition fill color based on values from the year selected
function yearChangedTransition() {
  g.selectAll("path.counties")
    .transition()
    .duration(500)
    .attr("fill", function (d) {
      return unemployment.get(d.id)
        ? color(unemployment.get(d.id)[yearIndex])
        : "white";
    });
}

// auto zoom into clicked county event
function clicked(d) {
  if (active.node() === this) {
    active.classed("active", false);
    return reset();
  }

  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
    translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg
    .transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

function createLegend() {
  const x = d3
    .scaleLinear()
    .domain(d3.extent(color.domain()))
    .rangeRound([0, 250]);

  const legend = d3.select("#legend").append("svg");
  legend.attr("width", 250).attr("height", 100);
  legend
    .selectAll("rect")
    .data(
      color.range().map(function (d) {
        return color.invertExtent(d);
      })
    )
    .join("rect")
    .attr("height", 8)
    .attr("x", function (d) {
      return x(d[0]);
    })
    .attr("width", 250)
    .attr("fill", (d) => color(d[0]));

  legend
    .call(
      d3
        .axisBottom(x)
        .tickSize(13)
        .tickFormat(function (d) {
          const f = d3.format(".0f");
          return f(d) + "%";
        })
        .tickValues(
          color
            .range()
            .slice(1)
            .map((d) => color.invertExtent(d)[0])
        )
    )
    .select(".domain")
    .remove();
}
