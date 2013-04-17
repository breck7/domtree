var domtree = {}

domtree.onkeypress = function () {
  domtree.updateVisitLink()
  if (event.keyCode == 13)
    domtree.fetch()
}

domtree.updateVisitLink = function () {
  var url =  $('#source').val()
  if (!url.match(/^https?\:/))
    url = 'http://' + url
  $('#go').attr('href', url)
    .text(url)
}

domtree.fetch = function () {
  $('#processing').html('Fetching...')
  var url = $('#source').val()
  if (!url.match(/^https?\:/))
    url = 'http://' + url
  
  $.ajax({
    url: '/get/' + url,
    dataType: 'json',
    method : 'GET',
  }).success(function (page) {
    console.log(page)
    // Update element count
    var elementCount = JSON.stringify(page.json).match(/\"size\"/g).length
    $('#count').text(elementCount)
    
    $('#bytes').text(Math.round(page.bytes/1000))
    
    $('#contentBytes').text((100 * page.contentBytes / page.bytes).toFixed(0))
  
    root = page.json
    root.x0 = h / 2
    root.y0 = 0
    $('#processing').html('')
    $('#error').html('')
    update(root)
  }).error(function (error) {
    $('#error').html(error.statusText)
    $('#processing').html('')
    console.log(error)
  })

}

domtree.wayback = function (year) {
  var url = $('#source').val()
  // http://web.archive.org/web/19981212023331/
  if (!url.match(/^http\:\/\/web\.archive\.org\/web\/[0-9]+\//))
    $('#source').val( 'http://web.archive.org/web/' + year + '/' + 'http://' + url)
  else
    $('#source').val(url.replace(/web\/[0-9]+\//, 'web/' + year + '/'))
  domtree.fetch()
  domtree.updateVisitLink()
}

/**
 * http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
 *
 * @return {object}
 */
var parseQueryString = function () {
  var query = {};
  (function () {
      var match,
          pl     = /\+/g,  // Regex for replacing addition symbol with a space
          search = /([^&=]+)=?([^&]*)/g,
          decode = function (s) { return decodeURIComponent(s.replace(pl, " ")) },
          query_string  = window.location.search.substring(1)
  
      while (match = search.exec(query_string))
         query[decode(match[1])] = decode(match[2])
  })()
  return query
}


var m = [20, 120, 20, 120],
    w = 2460 - m[1] - m[3],
    h = 1600 - m[0] - m[2],
    i = 0,
    root,
    tree,
    diagonal,
    vis

$(document).on('ready', function () {
  
  var queryString = parseQueryString()
  var url = document.location.pathname
  if (url.substr(0,6) === '/view/')
    $('#source').val(url.substr(6))

  tree = d3.layout.tree()
        .size([h, w]);

  diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });


  vis = d3.select("#body").append("svg:svg")
        .attr("viewBox", "0 0 " + w + " " + h )
        .call(d3.behavior.zoom().on("zoom", redraw))
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");
  

  domtree.fetch()
  $('#source')
    .on("change", domtree.fetch)
    .on("keyup", domtree.onkeypress)
    .focus()
})

function update(source) {

  var duration = d3.event && d3.event.altKey ? 5000 : 500;
  
  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse();
  
  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });
  
  // Update the nodes…
  var node = vis.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });
  
  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("svg:g")
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
    .on("click", function(d) { toggle(d); update(d); });
  
  nodeEnter.append("svg:circle")
    .attr("r", 1e-6)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
  nodeEnter.append("svg:text")
    .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
    .attr("dy", ".35em")
    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    .text(function(d) { return d.name; })
    .style("fill-opacity", 1e-6);
  
  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  
  nodeUpdate.select("circle")
    .attr("r", 4.5)
    .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
  nodeUpdate.select("text")
    .style("fill-opacity", 1);
  
  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
    .remove();
  
  nodeExit.select("circle")
    .attr("r", 1e-6);
  
  nodeExit.select("text")
    .style("fill-opacity", 1e-6);
  
  // Update the links…
  var link = vis.selectAll("path.link")
    .data(tree.links(nodes), function(d) { return d.target.id; });
  
  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
      var o = {x: source.x0, y: source.y0};
      return diagonal({source: o, target: o});
    })
  .transition()
    .duration(duration)
    .attr("d", diagonal);
  
  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr("d", diagonal);
  
  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return diagonal({source: o, target: o});
    })
    .remove();
  
  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

var redraw = function () {
  console.log('todo')
  
  //var tx = t[0] * d3.event.scale + ;
//        var ty = t[1] * d3.event.scale + ;
  vis.attr("transform", "scale(" + d3.event.scale + "," + d3.event.scale + ") translate(" + d3.event.translate[0] + "," + d3.event.translate[1] + ")");
}

// Toggle children.
function toggle(d) {
  
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}
