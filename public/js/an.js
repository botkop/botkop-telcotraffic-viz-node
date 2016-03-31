!function() {

var Socket = io.connect();

initCanvas();
initSideBar();

function initSideBar() {
}

function initCanvas(){
}

var w = 800, h = 600, r = 5;
var margins = { left: 50, top: 50, right: 50, bottom: 50 };
var axisPadding = 10;
var totalHeight = h + margins.top + margins.bottom;
var totalWidth = w + margins.left + margins.right;

var svg = d3.select('#canvas')
    .append('svg')
    .attr('width', totalWidth)
    .attr('height', totalHeight)
    ;

var graphGroup = svg.append('g')
    .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')');

var xScale = d3.scale.linear()
    .domain([0,1])
    .range([0, w])
    ;

var yScale = d3.scale.linear()
    .domain([0,1])
    .range([h, 0])
    ;

var yGridlinesAxis = d3.svg.axis().scale(yScale).orient("left");
var yGridlineNodes = svg.append('g')
    .attr('transform', 'translate(' + (margins.left + w) + ',' + margins.top + ')')
    .call(yGridlinesAxis.tickSize(w + axisPadding, 0, 0).tickFormat(""));
    ;
styleGridlineNodes(yGridlineNodes);

var xGridlinesAxis = d3.svg.axis().scale(xScale).orient("bottom");
var xGridlineNodes = svg.append('g')
    .attr('transform', 'translate(' + margins.left + ',' + (totalHeight - margins.bottom + axisPadding) + ')')
    .call(xGridlinesAxis.tickSize(-h - axisPadding, 0, 0).tickFormat(""));
styleGridlineNodes(xGridlineNodes);

var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
var yAxis = d3.svg.axis().scale(yScale).orient("left");

var yAxisNodes = svg.append('g')
    .attr("class", "yaxis")
    .attr('transform', 'translate(' + (margins.left - axisPadding) + ',' + margins.top + ')')
    .call(yAxis)
    ;
styleAxisNodes(yAxisNodes);

var xAxisNodes = svg.append('g')
    .attr("class", "xaxis")
    .attr('transform', 'translate(' + margins.left + ',' + (totalHeight - margins.bottom + axisPadding) + ')')
    .call(xAxis)
    ;
styleAxisNodes(xAxisNodes);

var gradients = [
    ['#66c2a4','#2ca25f','#006d2c'],
    ['#fecc5c','#fd8d3c','#e31a1c'],
    ['#bdc9e1','#74a9cf','#0570b0'],
    ['#fbb4b9','#f768a1','#ae017e']
];

var colorMaps = [
    d3.scale.linear().domain([0.0, 20.0]).range(gradients[0]),
    d3.scale.linear().domain([0.0, 20.0]).range(gradients[1]),
    d3.scale.linear().domain([0.0, 20.0]).range(gradients[2])
];

// Add an x-axis label.
graphGroup.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", w)
    .attr("y", h - 6)
    .text("Round Trip Time")
    ;

// Add a y-axis label.
graphGroup.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Byte Loss")
    ;

function findDistanceExtentsForPrediction(points, prediction) {
    var pa = points.filter(function(p) { return p.prediction == prediction; });
    var ext = d3.extent(pa, function(d) { return d.distance; });
    return ext;
}

function setColorMapDomain(prediction, extents) {
    colorMaps[prediction].domain(extents);
}

function addColorDomains(points) {
    for (i=0; i < 3; i++){
        var ext = findDistanceExtentsForPrediction(points, i);
        setColorMapDomain(i, ext);
    }
}

function drawCanvas(points){
    var xExtents = d3.extent(points, function(d) { return d.point[0]});
    var yExtents = d3.extent(points, function(d) { return d.point[1]});

    xScale.domain(xExtents).nice();
    yScale.domain(yExtents).nice();
    addColorDomains(points);

    yGridlinesAxis.scale(yScale);
    yGridlineNodes
        .transition().duration(1500).ease("sin-in-out")
        .call(yGridlinesAxis.tickSize(w + axisPadding, 100, 0).tickFormat(""));
    styleGridlineNodes(yGridlineNodes);

    xGridlinesAxis.scale(xScale);
    xGridlineNodes
        .transition().duration(1500).ease("sin-in-out")
        .call(xGridlinesAxis.tickSize(-h - axisPadding, 0, 0).tickFormat(""));
    styleGridlineNodes(xGridlineNodes);

    xAxis.scale(xScale);
    yAxis.scale(yScale);

    svg.select('.xaxis')
        .transition().duration(1500).ease("sin-in-out")
        .call(xAxis);

    svg.select('.yaxis')
        .transition().duration(1500).ease("sin-in-out")
        .call(yAxis);

    styleAxisNodes(xAxisNodes);
    styleAxisNodes(yAxisNodes);

    var chart = graphGroup.selectAll('circle')
        .data(points)
        ;

    // update
    chart
        .attr({
            cx: function(d) { return xScale(d.point[0]) },
            cy: function(d) { return yScale(d.point[1]) },
            fill: function(d) { return colorMaps[d.prediction](d.distance) },
            "stroke-width": 2,
            stroke: function (d) { if (d.outlier) return "red"; else return "none"; }
        })
        ;
    // create
    chart.enter()
        .append('circle')
        .attr({
            cx: function(d) { return xScale(d.point[0]) },
            cy: function(d) { return yScale(d.point[1]) },
            r: r,
            fill: function(d) { return colorMaps[d.prediction](d.distance) },
            'fill-opacity': 0.5,
            "stroke-width": 2,
            stroke: function (d) { if (d.outlier) return "red"; else return "none"; }
        })
        .append("title")
           .text(function(d) { return "imsi: " + d.subscriber.imsi + ", cell: " + d.celltower.cell; });
        ;
    // delete
    chart.exit().remove() ;

    /******************** centroids ********************/

    /* get last centroid for each prediction */
    var centroidData = [];
    points.forEach(function(p){
        centroidData[p.prediction] = p.centroid;
    });

    var centroids = graphGroup.selectAll('rect')
        .data(centroidData)
        ;
    // update
    centroids
        .transition().duration(1500).ease("sin-in-out")
        .attr({
            x: function(d) { return xScale(d[0]) },
            y: function(d) { return yScale(d[1]) }
        })
        ;
    // create
    centroids.enter()
        .append('rect')
        .attr({
            width: r,
            height: r,
            x: function(d) { return xScale(d[0]); },
            y: function(d) { return yScale(d[1]); },
            fill: function(d, i) { return gradients[i][0]; },
            stroke: "black"
        })
        .append("title")
           .text(function(d, i) { return "cluster: " + i; });
        ;
    // delete
    centroids.exit().remove();
}

function populateOutlierTable(points) {
    var outliers = points.filter(function(p) { return p.outlier });
    var table = "<tbody>";
    outliers.forEach(function(p, i){
        table += "<tr><td>" + p.subscriber.imsi + "</td><td>" + p.celltower.cell + "</td><td>" + p.prediction + "</td><td>" + JSON.stringify(p.point) + "</td></tr>"
    });
    table += "</tbody>";

    $('#an_table tbody').remove();
    $('#an_table thead').after(table);
}

Socket.on('kmeans-outlier-topic', function(event){
    var points = event.points;
    drawCanvas(points);
    populateOutlierTable(points);
});

function styleAxisNodes(axisNodes) {
    axisNodes.selectAll('.domain')
        .attr({
            fill: 'none',
            'stroke-width': 1,
            stroke: 'black'
        });

    axisNodes.selectAll('.tick line')
        .attr({
            fill: 'none',
            'stroke-width': 1,
            stroke: 'black'
        });
}

function styleGridlineNodes(axisNodes) {
    axisNodes.selectAll('.domain')
        .attr({
            fill: 'none',
            stroke: 'none'
        });
    axisNodes.selectAll('.tick line')
        .attr({
            fill: 'none',
            'stroke-width': 1,
            // stroke: '#eee',
            stroke: 'lightgray',
            opacity: 0.3
        });
}

function invertColor(hexTripletColor) {
    var color = hexTripletColor;
    color = color.substring(1);           // remove #
    color = parseInt(color, 16);          // convert to integer
    color = 0xFFFFFF ^ color;             // invert three bytes
    color = color.toString(16);           // convert to hex
    color = ("000000" + color).slice(-6); // pad with leading zeros
    color = "#" + color;                  // prepend #
    return color;
}


}();

