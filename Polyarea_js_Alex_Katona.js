//Code written by Alex Katona
//MIT License
//Check out alexkatona.blogspot.com for more info

'use strict';

var margin = {top:30, right:10, bottom:30, left:50};
var area_width = 175
var height = 500 - margin.top - margin.bottom;
var xScale = d3.scaleTime()
               .range([margin.left, area_width - margin.right]);
var yScale = d3.scaleLinear()
               .range([height ,0]);
var tooltip = d3.select("div#viz")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);
var formatTooltipDate = d3.timeFormat("%m/%d/%Y");
var parseDate = d3.timeParse("%m/%d/%Y");
var yAxisFormat = d3.format(".0%");

d3.csv("Polyarea_random_data_Alex_Katona.csv", function(d){
  return {
    date: parseDate(d.date),
    category: d.category,
    sales: Number(d.sales)};
  }).then(function(data){

      var xAxis = d3.axisBottom(xScale);
      var yAxis = d3.axisLeft(yScale)
                    .tickFormat(yAxisFormat);
      var area = d3.area()
                   .x(function(d){ return xScale(d.date); })
                   .y0(height)
                   .y1(function(d){ return yScale(d.CatDailyPct); });
      var line = d3.line()
                   .x(function (d){ return xScale(d.date); })
                   .y(function (d){ return yScale(d.CatDailyPct); });
      var categories = d3.nest()
                         .key(function(d) {return d.category;})
                         .sortKeys(function(d){ return d3.ascending(d.TotalSales);})
                         .entries(data);
      var daily = d3.nest()
                    .key(function(d){return d.date;})
                    .entries(data);

      daily.forEach(function(day) {
        day.DailyTotal = day.values.map(function(d) { return d.sales; }).reduce(function(sum, d) {
          return sum + d;}, 0);});

      var daily_total = 0
      var DailyRunningTotal = daily.map(function(d){return daily_total += d.DailyTotal;});

      categories.forEach(function(cat) {
        cat.MaxSales = d3.max(cat.values,function(d){return d.sales;});
        cat.TotalSales = d3.sum(cat.values,function(d){return d.sales;});
        cat.SalesArray = cat.values.map(function(d) { return d.sales; });
        var category_total = 0;
        cat.CatRunningTotal = cat.SalesArray.map(function(d){return category_total += d;});
        cat.CatDailyPct = cat.CatRunningTotal.map(function(d, i) { return d / DailyRunningTotal[i]; });
        cat.values.forEach(function(obj, i){
           obj.CatDailyPct = cat.CatDailyPct[i]; });
      });

      categories.sort(function(a, b){
        return b.TotalSales - a.TotalSales;});

      console.log(categories);

      xScale.domain([
        d3.min(categories,function(d) { return d.values[0].date}),
        d3.max(categories, function(d) { return d.values[d.values.length - 1].date})
      ]);

      var svg = d3.select("div#viz")
                  .selectAll("svg")
                  .data(categories)
                  .enter()
                  .append("svg")
                  .attr("width",area_width)
                  .attr("height",height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + 0 + "," +
                    margin.top + ")");

      var svg_axis = d3.select("div#viz")
                  .selectAll("svg")
                  .data(categories)
                  .enter()
                  .append("svg")
                  .attr("width",area_width)
                  .attr("height",height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + 0 + "," + margin.top + ")");

      var yScaleMax = d3.max(categories,function(d) { return d.values[0].CatDailyPct})

      svg.append("path")
         .attr("class", "area")
         .attr("d", function(d) { yScale.domain([0, yScaleMax + 0.05]); return area(d.values); });

      svg.filter(function(d, i) { return i == 0 ; }).append("g")
         .attr("id","yAxis")
         .attr("transform", "translate(" + 46 + ",0)")
         .call(yAxis);

      svg.append("path")
         .attr("class", "line")
         .attr("d", function(d) { yScale.domain([0, yScaleMax + 0.05]); return line(d.values); });

      svg.append("text")
         .attr("id","xLabel")
         .attr("x", 70)
         .attr("y", height + 25)
         .text(function(d){return d.key;});

      svg.filter(function(d, i) { return i == 0 ; }).append("text")
        .attr("id","yLabel")
        .attr("x", -250)
        .attr("y", 11)
        .attr("transform", function(d) {return "rotate(-90)"})
        .text("% of Running Total Sales");

      svg.selectAll("circle")
         .data(function(d){return d.values;})
         .enter()
         .append("circle")
         .attr("r",1)
         .attr("cx", function(d) { return xScale(d.date); })
         .attr("cy", function(d) { return yScale(d.CatDailyPct); });

      svg.selectAll("svg")
         .attr("transform", "translate(" + -45 + "," + margin.top + ")");

      d3.select("div#viz")
        .selectAll("svg")
        .selectAll("g")
        .selectAll("circle")
        .on("mouseover", function(d){
            var that = this;
            d3.select(this)
              .transition()
              .duration(200)
              .attr("r", 9)
              .style("fill","rgb(244, 137, 101)");

            tooltip.transition("show_tooltip")
                   .duration(200)
                   .style("opacity", 1);

            tooltip.html(that.__data__.category + "<br/>" +
                  "Date: " + formatTooltipDate(that.__data__.date) + "<br/>" +
                  "% of Running Total Sales: " + (that.__data__.CatDailyPct*100).toFixed(2) + "%")
                 .style("left", (d3.event.pageX) + "px")
                 .style("top", (d3.event.pageY - 60) + "px")})
        .on("mouseout", function(d) {
            svg.selectAll("circle")
               .transition()
               .duration(1200)
               .attr("r", 1)
               .style("fill","rgb(0,0,0)")
            tooltip.transition("hide_tooltip")
                   .duration(200)
                   .style("opacity", 0);});

      d3.select("div#viz")
        .selectAll("svg")
        .filter(function(d, i) { return i != 0 ; })
        .attr("width",area_width - 45)
        .select("g")
        .attr("transform", "translate(" + -45 + "," + margin.top + ")");

    });

//References:
//https://bl.ocks.org/d3noob/257c360b3650b9f0a52dd8257d7a2d73
//https://bl.ocks.org/mbostock/1157787
