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

