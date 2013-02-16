var express = require('express'),
    $ = require('jquery'),
    fs = require('fs'),
    request = require('superagent'),
    app = express()

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


app.get('/get/*', function (req, res, next) {
  var url = 'http://' + req.params[0]
  request.get(url, function (response) {
    var page = $(response.text)
    res.send(JSON.stringify($('body', page).toTree()))
  })

})


var port = 8080
app.listen(port)
console.log('Started on port ' + port)
