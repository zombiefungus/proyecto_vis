import React, {Component} from 'react';
import * as d3 from 'd3';
import '../css/App.css';

class ScatterPlotMatrix extends Component {
  constructor(props){
    super(props);
    this.createChart = this.createChart.bind(this);
  }

  componentDidMount() {
    this.createChart()
  }

  componentDidUpdate() {
    this.createChart()
  }

  createChart() {
    const node = this.node;
    const data = this.props.data;
    const traitsX = this.props.xTraits;
    const traitsY = this.props.yTraits;

    function cross(a, b) {
      var c = [], n = a.length, m = b.length, i, j;
      for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
      return c;
    }

    var padding = this.props.padding,
        size = this.props.size;

    var x = d3.scaleLinear()
              .range([padding / 2, size - padding / 2])
              .domain([0, 1]);

    var y = d3.scaleLinear()
              .range([size - padding / 2, padding / 2])
              .domain([0, 1]);

    var xAxis = d3.axisBottom()
                  .scale(x)
                  .ticks(3);

    var yAxis = d3.axisLeft()
                  .scale(y)
                  .ticks(4);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var domainByTrait = {};

    var n = traitsX.length,
        m = traitsY.length;

    traitsX.forEach(function(trait) {
      domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
    });
    traitsY.forEach(function(trait) {
      domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
    });


    xAxis.tickSize(size * m);
    yAxis.tickSize(-size * n);

    var brush = d3.brush()
                  .on("start", brushstart)
                  .on("brush", brushmove)
                  .on("end", brushend)
                  .extent([[0,0],[size,size]]);

    d3.select(node).selectAll("*").remove();
    var svg = d3.select(node)
                .attr("width", size * n + padding + 70)
                .attr("height", size * m + padding + 40)
                .append("g")
                .attr("transform", "translate(" + 2*padding + "," + padding + ")");

    svg.selectAll(".x.axis")
       .data(traitsX)
       .enter().append("g")
       .attr("class", "x axis")
       .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
       .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
       .data(traitsY)
       .enter().append("g")
       .attr("class", "y axis")
       .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
       .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

    var cell = svg.selectAll(".cell")
                  .data(cross(traitsX, traitsY))
                  .enter().append("g")
                  .attr("class", "cell")
                  .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
                  .each(plot);

    // Titles for the diagonal.
    cell.filter(function(d) { return (d.i === n-1); }).append("text")
        .attr("x", padding/2 -size)
        .attr("y",  -padding)//esto esta moviendo x
    /* .attr("dy", ".71em")*/
        .attr("transform", "rotate(-90)")
        .text(function(d) { return d.y.replace('_', '\n').replace("comparacion", ""); });

    cell.filter(function(d) { return (d.j === 0); }).append("text")
        .attr("x", padding/2)
        .attr("y", padding/2)
        .attr("dy", "-2em")
        .attr("align", "center")
        .attr("width", size)
        .text(function(d) { return d.x.replace('_', '\n').replace("comparacion", ""); });
    cell.call(brush);

    function plot(p) {
      var cell = d3.select(this);

      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);

      cell.append("rect")
          .attr("class", "frame")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding);

      cell.selectAll("circle")
          .data(data)
          .enter().append("circle")
          .attr("cx", function(d) { return x(d[p.x]); })
          .attr("cy", function(d) { return y(d[p.y]); })
          .attr("r", 4)
          .style("fill", function(d) { return color(d.species); });
    }

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
      if (brushCell !== this) {
        d3.select(brushCell).call(brush.move, null);
        brushCell = this;
        x.domain(domainByTrait[p.x]);
        y.domain(domainByTrait[p.y]);
      }
    }

    // Highlight the selected circles.
    function brushmove(p) {
      var e = d3.brushSelection(this);
      svg.selectAll("circle").classed("hidden", function(d) {
        return !e
             ? false
             : (
               e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
               || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
             );
      });
    }

    // If the brush is empty, select all circles.
    function brushend() {
      var e = d3.brushSelection(this);
      if (e === null) svg.selectAll(".hidden").classed("hidden", false);
    }
  }

  componentWillReceiveProps(nextProps) {
    // we have to handle the DOM ourselves now
    if (nextProps.data !== this.props.data) {
      this.createChart()
    }
  }

  render() {
    return <svg ref={node => this.node = node}></svg>
  }

}

export default ScatterPlotMatrix;
