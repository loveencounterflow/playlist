
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
select_next_chr = ( c1, c2, nodes_crossed, node ) ->
  TraverseUtil.getNextChar c1, c2, nodes_crossed, false
  selection   = TraverseUtil.setSelection c1, c2
  range       = selection.getRangeAt 0
  return false unless node.contains range.startContainer.parentNode
  return false unless node.contains range.endContainer.parentNode
  rectangles  = range.getClientRects()
  boxes       = draw_boxes rectangles
  return true

#===========================================================================================================
µ.DOM.ready ->
  log '^123-7^', "ready"
  nodes         = µ.DOM.select_all '#p5'
  p             = nodes[ 0 ].childNodes[ 0 ]
  c1            = new Cursor( p, 0, p.data )
  c2            = new Cursor( p, 0, p.data )
  TraverseUtil.setSelection( c1, c2 )
  loop
    break unless select_next_chr c1, c2, [], nodes[ 0 ]
  return null






