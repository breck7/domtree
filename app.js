var express = require('express'),
    $ = require('jquery'),
    fs = require('fs'),
    request = require('superagent'),
    app = express()

var args = process.argv.slice(2)
var port = (args.length ? args[0] : 8080)

app.use('/', express.static(__dirname + '/', { maxAge: 31557600000 }))

$.fn.toTree = function () {
  var tree = { "name" : $(this).get(0).tagName }

  if (!$(this).children().length)
    tree.size = $(this).text().length
  else
    tree.children = $.map($(this).children(), function (element) {
      return $(element).toTree()
    })
  return tree
}

var cache = {}

app.get('/get/*', function (req, res, next) {
  var url = 'http://' + req.params[0]
  if (cache[url])
    return res.send(cache[url])
  request.get(url, function (response) {
    var page = $(response.text)
    cache[url] = JSON.stringify($('body', page).toTree())
    res.send(cache[url])
  })

})

app.listen(port)
