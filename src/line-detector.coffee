
#-----------------------------------------------------------------------------------------------------------
# source_elements = ( document.querySelector '.sample' ).childNodes
{ log
  warn
  debug }       = console
# after           = ( dts, f  ) => new Promise ( resolve ) => setTimeout  ( -> resolve f() ), dts * 1000
# sleep           = ( dts     ) -> debug '^2-1^'; new Promise ( resolve ) => debug '^2-2^'; setTimeout  resolve,            dts * 1000
# defer           = ( f = ->  ) => await sleep 0; return await f()

#-----------------------------------------------------------------------------------------------------------
remove_boxes = ->
  element.remove() for element in document.querySelectorAll '.box'
  return null

#-----------------------------------------------------------------------------------------------------------
draw_boxes = ( rectangles ) ->
  return ( draw_box rectangle for rectangle in rectangles )

#-----------------------------------------------------------------------------------------------------------
draw_box = ( rectangle ) ->
  box               = document.createElement 'div'
  box.style.top     = document.documentElement.scrollTop  + rectangle.y       + 'px'
  box.style.left    = document.documentElement.scrollLeft + rectangle.x       + 'px'
  box.style.width   =                                       rectangle.width - 1   + 'px' # collapse borders
  box.style.height  =                                       rectangle.height  + 'px'
  box.classList.add 'box'
  document.body.appendChild box
  return box

#-----------------------------------------------------------------------------------------------------------
_get_next_chr_rectangles = ( node, c1, c2 ) ->
  TraverseUtil.getNextChar c1, c2, [], false
  selection   = TraverseUtil.setSelection c1, c2
  range       = selection.getRangeAt 0
  return null unless node.contains range.startContainer.parentNode
  return null unless node.contains range.endContainer.parentNode
  rectangles  = range.getClientRects()
  return rectangles

#-----------------------------------------------------------------------------------------------------------
walk_chr_rectangles_of_node = ( node ) ->
  text_node     = node.childNodes[ 0 ]
  c1            = new Cursor text_node, 0, text_node.data
  c2            = new Cursor text_node, 0, text_node.data
  TraverseUtil.setSelection c1, c2
  loop
    rectangles = _get_next_chr_rectangles node, c1, c2
    break unless rectangles?
    yield from rectangles
  return null

#===========================================================================================================
µ.DOM.ready ->
  log '^123-7^', "ready"
  nodes         = µ.DOM.select_all '#p5'
  node          = nodes[ 0 ]
  height_avg    = 0
  bottom_avg    = 0
  bottom_prv    = null
  count         = 0
  for rectangle from walk_chr_rectangles_of_node node
    count++
    box = draw_box rectangle
    height_avg  = ( height_avg * ( count - 1 ) / count ) + ( rectangle.height * 1 / count )
    bottom_avg  = ( bottom_avg * ( count - 1 ) / count ) + ( rectangle.bottom * 1 / count )
    # if bottom_prv?
    bottom_prv = rectangle.bottom
    # debug '^3224^', rectangle
  return null






