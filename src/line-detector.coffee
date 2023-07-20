
#-----------------------------------------------------------------------------------------------------------
# source_elements = ( document.querySelector '.sample' ).childNodes
{ log
  warn
  debug }       = console
after           = ( dts, f  ) => new Promise ( resolve ) => setTimeout  ( -> resolve f() ), dts * 1000
# sleep           = ( dts     ) -> debug '^2-1^'; new Promise ( resolve ) => debug '^2-2^'; setTimeout  resolve,            dts * 1000
# defer           = ( f = ->  ) => await sleep 0; return await f()

#-----------------------------------------------------------------------------------------------------------
remove_boxes = ->
  element.remove() for element in document.querySelectorAll '.box'
  return null


#===========================================================================================================
class Linefinder

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    return undefined

  #---------------------------------------------------------------------------------------------------------
  draw_box: ( rectangle ) ->
    box               = document.createElement 'div'
    box.style.top     = document.documentElement.scrollTop  + rectangle.top       + 'px'
    box.style.left    = document.documentElement.scrollLeft + rectangle.left      + 'px'
    box.style.width   =                                       rectangle.width - 1 + 'px' # collapse borders
    box.style.height  =                                       rectangle.height    + 'px'
    box.classList.add 'box'
    document.body.appendChild box
    return box

  #---------------------------------------------------------------------------------------------------------
  _get_next_chr_rectangles: ( node, c1, c2 ) ->
    TraverseUtil.getNextChar c1, c2, [], false
    selection   = TraverseUtil.setSelection c1, c2
    range       = selection.getRangeAt 0
    return null unless node.contains range.startContainer.parentNode
    return null unless node.contains range.endContainer.parentNode
    return range.getClientRects()

  #---------------------------------------------------------------------------------------------------------
  walk_chr_rectangles_of_node: ( node ) ->
    text_node     = node.childNodes[ 0 ]
    c1            = new Cursor text_node, 0, text_node.data
    c2            = new Cursor text_node, 0, text_node.data
    TraverseUtil.setSelection c1, c2
    loop
      rectangles = @_get_next_chr_rectangles node, c1, c2
      break unless rectangles?
      yield from rectangles
    return null

  #---------------------------------------------------------------------------------------------------------
  _reset_line_walker: ( s ) ->
    s.min_top       = +Infinity
    s.max_bottom    = -Infinity
    s.min_left      = +Infinity
    s.max_right     = -Infinity
    s.avg_height    = 0
    s.avg_bottom    = 0
    s.count         = 0
    return null

  #---------------------------------------------------------------------------------------------------------
  walk_line_rectangles_of_node: ( node ) ->
    @_reset_line_walker s  = {}
    xxx_height_factor     = 1 / 2 ### relative minimum height to recognize line step ###
    for rectangle from @walk_chr_rectangles_of_node node
      if s.count > 0 and rectangle.bottom - s.avg_bottom > s.avg_height * xxx_height_factor
        yield new DOMRect             \
          s.min_left,                 \   # left
          s.min_top,                  \   # top
          s.max_right   - s.min_left, \   # width
          s.max_bottom  - s.min_top       # height
        @_reset_line_walker s
      #.......................................................................................................
      # draw_box rectangle
      s.count++
      s.min_top     = Math.min s.min_top,     rectangle.top
      s.max_bottom  = Math.max s.max_bottom,  rectangle.bottom
      s.min_left    = Math.min s.min_left,    rectangle.left
      s.max_right   = Math.max s.max_right,   rectangle.right
      s.avg_height  = ( s.avg_height * ( s.count - 1 ) / s.count ) + ( rectangle.height * 1 / s.count )
      s.avg_bottom  = ( s.avg_bottom * ( s.count - 1 ) / s.count ) + ( rectangle.bottom * 1 / s.count )
    #.........................................................................................................
    if s.count > 0
      yield new DOMRect             \
        s.min_left,                 \   # left
        s.min_top,                  \   # top
        s.max_right   - s.min_left, \   # width
        s.max_bottom  - s.min_top       # height
    return null

#===========================================================================================================
µ.DOM.ready ->
  log '^123-7^', "ready"
  nodes         = µ.DOM.select_all 'p'
  rectangles    = []
  linefinder    = new Linefinder()
  for node in nodes
    for rectangle from linefinder.walk_line_rectangles_of_node node
      rectangles.push rectangle
      linefinder.draw_box rectangle
  ref_top = document.documentElement.scrollTop
  dt      = 0.5
  idx     = -1
  scroll = ->
    idx++
    return null unless ( rectangle = rectangles[ idx ] )?
    top = ref_top + rectangle.top
    # debug "scrolling to #{top.toFixed 0}px"
    await window.scrollTo { top, behavior: 'smooth', }
    after dt, scroll
  window.scrollTo { top: 0, behavior: 'smooth', }
  after 1, scroll
  return null






