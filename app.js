var express = require('express'),
    $ = require('jquery'),
    fs = require('fs'),
    request = require('request'),
    app = express()

var args = process.argv.slice(2)
var port = (args.length ? args[0] : 8080)

app.use('/', express.static(__dirname + '/', { maxAge: 31557600000 }))
var indexPage = fs.readFileSync('./index.html', 'utf8')

$.fn.toTree = function (result) {
  var tree = { "name" : $(this).get(0).tagName + ($(this).attr('id') ? '#' + $(this).attr('id') : '')  }

  if (!$(this).children().length) {
    tree.size = $(this).text().length
    result.contentBytes = result.contentBytes + tree.size
  } else
    tree.children = $.map($(this).children(), function (element) {
      return $(element).toTree(result)
    })
  return tree
}

var analyzePage = function (html) {
  var result = {}
  result.bytes = html.length
  result.contentBytes = 0
  var page = $(html)
  result.json = $('body', page).toTree(result)
  return result
}

var pages = {}

app.get('/get/*', function (req, res, next) {
  var url = req.params[0]
  if (pages[url])
    return res.send(JSON.stringify(pages[url]))
  request.get(url, function (error, response) {
    if (error)
      return res.send(error, 400)
    pages[url] = analyzePage(response.body)
    res.send(JSON.stringify(pages[url]))
  })

})

app.get('/view/*', function (req, res, next) {
  res.send(indexPage)
})

app.listen(port)
