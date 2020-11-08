import * as d3 from "d3";
var width = 960,
  height = 450,
  radius = Math.min(width, height) / 2;

var svg = d3
  .select("body")
  .append("svg")
  .append("g"); //.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

window.change = change;
window.randomData = randomData;
var dataSet;

var pie = d3
  .pie()
  .sort(null)
  .value(function(d) {
    return d.value;
  });

var arc = d3
  .arc()
  .innerRadius(radius * 0.6)
  .outerRadius(radius);

var xScale,
  yScale,
  keys = [];

var key = function(d) {
  if (d.data != null) {
    return d.data.label;
  } else {
    return d.label;
  }
};

var color = d3.scaleOrdinal(d3.schemeCategory10);

change(randomData());

d3.select(".randomize").on("click", function() {
  change(randomData());
});

function change(data) {
  var chartType = document.querySelector('input[name="chartType"]:checked')
    .value;

  if (chartType === "pie") {
    xScale = d3
      .scaleOrdinal()
      .domain(
        data.pieBarData.map(function(d) {
          return d.label;
        })
      )
      .range([0, width]); //.rangeRoundBands([0, width], 0.05);
    yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data.pieBarData, function(d) {
          return d.value;
        })
      ])
      .rangeRound([0, height]);

    //svg.transition().duration(1000).attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    /* ------- PIE SLICES -------*/

    svg
      .selectAll(".line")
      .data(pie(data.pieBarData))
      .join(
        enter =>
          enter
            .append("path")
            .attr("class", "line")
            .attr(
              "transform",
              "translate(" + width / 2 + "," + height / 2 + ")"
            )
            .style("fill", function(d, i) {
              return color(i);
            })
            .style("stroke", function(d, i) {
              return color(i);
            })
            .call(enter =>
              enter
                .transition()
                .duration(1000)
                .attrTween("d", function(d, i) {
                  var precision = 5;
                  var d1 = arc(d);

                  return animate(d1, precision, this);
                })
            ),
        update =>
          update
            .transition()
            .duration(1000)
            .attr(
              "transform",
              "translate(" + width / 2 + "," + height / 2 + ")"
            )
            .style("fill", function(d, i) {
              return color(i);
            })
            .style("stroke", function(d, i) {
              return color(i);
            })
            .attr("fill-opacity", "1")
            .attrTween("d", function(d, i) {
              var precision = 5;
              var d1 = arc(d);

              return animate(d1, precision, this);
            }),
        exit => exit.remove()
      );
  } else if (chartType === "bar") {
    xScale = d3
      .scaleBand()
      .domain(
        data.pieBarData.map(function(d) {
          return d.label;
        })
      )
      .range([0, width]); //.rangeRoundBands([0, width], 0.05);
    yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data.pieBarData, function(d) {
          return d.value;
        })
      ])
      .rangeRound([0, height]);

    svg
      .selectAll(".line")
      .data(data.pieBarData)
      .join(
        enter =>
          enter
            .append("path")
            .attr("class", "line")
            .style("fill", function(d, i) {
              return color(i);
            })
            .style("stroke", function(d, i) {
              return color(i);
            })
            .attr("d", function(d, i) {
              var x = xScale(d.label);

              return (
                " M" +
                (x + xScale.bandwidth()).toString() +
                " " +
                height +
                " L " +
                x.toString() +
                " " +
                height
              );
            })
            .call(enter =>
              enter
                .transition()
                .duration(1000)
                .attrTween("d", function(d, i) {
                  var x = xScale(d.label);
                  var y = yScale(d.value);
                  var precision = 4;
                  var barWidth = xScale.bandwidth();
                  var d1 =
                    " M" +
                    x.toString() +
                    " " +
                    (height - y) +
                    " L " +
                    (x + barWidth).toString() +
                    " " +
                    (height - y) +
                    " L " +
                    (x + barWidth).toString() +
                    " " +
                    height +
                    " L " +
                    x.toString() +
                    " " +
                    height;
                  return animate(d1, precision, this);
                })
            ),
        update =>
          update
            .transition()
            .duration(1000)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("fill-opacity", "1")
            .style("fill", function(d, i) {
              return color(d.i);
            })
            .style("stroke", function(d, i) {
              return color(d.i);
            })
            .attrTween("d", function(d, i) {
              var x = xScale(d.label);
              var y = yScale(d.value);
              var precision = 4;
              var barWidth = xScale.bandwidth();
              var d1 =
                " M" +
                x.toString() +
                " " +
                (height - y) +
                " L " +
                (x + barWidth).toString() +
                " " +
                (height - y) +
                " L " +
                (x + barWidth).toString() +
                " " +
                height +
                " L " +
                x.toString() +
                " " +
                height;

              return animate(d1, precision, this);
            })
            .style("fill", function(d, i) {
              return color(i);
            })
            .style("stroke", function(d, i) {
              return color(i);
            }),
        exit => exit.remove()
      );
  } else if (chartType === "line") {
    //This is making the assumption that all the lines will have same number of points and that I can get the min and max date this way, probably not a real world solutions
    xScale = d3
      .scaleTime()
      .range([0, width])
      .domain([
        data.lineData[0][0].date,
        data.lineData[0][data.lineData[0].length - 1].date
      ]);

    var yMax = d3.max(
      data.lineData.map(function(array) {
        return d3.max(
          array.map(function(lineVal) {
            return lineVal.value;
          })
        );
      })
    );

    var yScale = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, yMax]);

    var line = d3
      .line() //.interpolate("monotone")
      .x(function(d) {
        return xScale(d.date);
      })
      .y(function(d) {
        return yScale(d.value);
      });

    svg
      .selectAll(".line")
      .data(data.lineData)
      .join(
        enter =>
          enter
            .append("path")
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke-width", "2")
            .attr("stroke", function(d, i) {
              return color(i);
            })
            .attr("fill-opacity", "0"),
        update =>
          update
            .transition()
            .duration(1000)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("fill-opacity", "0")
            .attr("fill", "none")
            .attr("stroke", function(d, i) {
              return color(i);
            })
            .attrTween("d", function(d, i) {
              var precision = 25;
              var d1 = line(d);

              return animate(d1, precision, this);
            }),
        exit => exit.remove()
      );
  } else if (chartType === "area") {
    xScale = d3
      .scaleLinear()
      .domain([
        data.areaData[0].date,
        data.areaData[data.areaData.length - 1].date
      ])
      .range([0, width]);

    yMax = d3.max(data.areaData, d => {
      const vals = d3
        .keys(d)
        .map(key => (!key.startsWith("date") ? d[key] : 0));
      return d3.sum(vals);
    });

    // Add Y axis
    yScale = d3
      .scaleLinear()
      .domain([yMax, 0])
      .rangeRound([0, height]);

    var stack = d3.stack().keys(keys);
    var series = stack(data.areaData);
    /* .value(function(d, key, i) {
        return d[i][key];
      })*/

    svg
      .selectAll(".line")
      // .data(series)
      .data(series, function(d, i) {
        return keys[i];
      })
      .join(
        enter =>
          enter
            .append("path")
            .attr("class", "line")
            .attr("d", function(d) {
              //draw new ones along the x axis so that it then transitions up
              return " M0 " + height + " L " + width + " " + height;
            })
            .attr("stroke-width", "2")
            .style("stroke", function(d, i) {
              return color(i);
            })
            .attr("fill-opacity", "0"),
        update =>
          update
            .transition()
            .duration(1000)
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
            .attr("fill-opacity", "1")
            .attr("fill", function(d, i) {
              return color(i);
            })
            .style("stroke", function(d, i) {
              return color(i);
            })
            .attrTween("d", function(d, i) {
              var precision = 25;
              var d1 = d3
                .area()
                .x(function(d, i) {
                  return xScale(d.data.date);
                })
                .y0(function(d) {
                  return yScale(d[0]);
                })
                .y1(function(d) {
                  return yScale(d[1]);
                });

              return animate(d1(d), precision, this);
            }),
        exit => exit.remove()
      );
  }
}

function randomData() {
  var numberOfValues = Math.floor(Math.random() * 5) + 3;
  var arr = {};
  keys = [];
  arr.lineData = [];
  arr.pieBarData = [];

  var areaData = [];
  var numberOfDates = Math.floor(Math.random() * 6) + 2;
  for (var i = 0; i < numberOfValues; i++) {
    var label = "Group" + i;
    keys.push(label);
    var total = 0;
    var startDate = new Date();
    var lineData = [];

    for (var n = 0; n < numberOfDates; n++) {
      var lineValue = Math.floor(Math.random() * 100);
      lineData.push({
        date: startDate,
        value: lineValue,
        label: label
      });

      if (arr.lineData.length === 0) {
        var d = { date: startDate };
        d[label] = lineValue;
        areaData.push(d);
      } else {
        areaData[n][label] = lineValue;
      }

      startDate = new Date(startDate.setDate(startDate.getDate() + 1));
      total = total + lineValue;
    }
    arr.lineData.push(lineData);
    if (!arr.areaData) arr.areaData = areaData;
    //var value =  Math.floor(Math.random() * 100);

    arr.pieBarData.push({
      label: label,
      value: total
    });
  }

  dataSet = arr;
  window.dataSet = dataSet;
  return arr;
}

//taken from https://bl.ocks.org/mbostock/3916621
function animate(d1, precision, path0) {
  var path1 = path0.cloneNode();
  var n0 = path0.getTotalLength(),
    n1 = (path1.setAttribute("d", d1), path1).getTotalLength();
  // Uniform sampling of distance based on specified precision.
  var distances = [0],
    i = 0,
    dt = precision / Math.max(n0, n1);
  while ((i += dt) < 1) distances.push(i);
  distances.push(1);
  // Compute point-interpolators at each distance.
  var points = distances.map(function(t) {
    var p0 = path0.getPointAtLength(t * n0),
      p1 = path1.getPointAtLength(t * n1);
    return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
  });
  return function(t) {
    return t < 1
      ? "M" +
          points
            .map(function(p) {
              return p(t);
            })
            .join("L")
      : d1;
  };
}
