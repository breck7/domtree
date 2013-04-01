var express = require('express'),
    $ = require('jquery'),
    fs = require('fs'),
    request = require('request'),
    app = express()

var args = process.argv.slice(2)
var port = (args.length ? args[0] : 8080)

app.use('/', express.static(__dirname + '/', { maxAge: 31557600000 }))
var indexPage = fs.readFileSync('./index.html', 'utf8')

$.fn.toTree = function () {
  var tree = { "name" : $(this).get(0).tagName + ($(this).attr('id') ? '#' + $(this).attr('id') : '')  }

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
  var url = req.params[0]
  if (cache[url])
    return res.send(cache[url])
  request.get(url, function (error, response) {
    if (error)
      return res.send(error, 400)
    var page = $(response.body)
    cache[url] = JSON.stringify($('body', page).toTree())
    res.send(cache[url])
  })

})

app.get('/view/*', function (req, res, next) {
  res.send(indexPage)
})

app.listen(port)
