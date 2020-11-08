Some expirmenting in transitioning animation between chart types. It uses the [a path tween](https://bl.ocks.org/mbostock/3916621) to make this happen instead of the normal transition(). 

There are still some issues with it. I've found it error on the pie chart randomly and I also need to rework how things work on the area chart, as new items in the area chart are not rendering properly until they go from enter to update.

[Code hosted here](https://codesandbox.io/s/d3-demo-forked-xjbi9?file=/src/index.js)<br/>
[See it running here](https://xjbi9.csb.app/)
