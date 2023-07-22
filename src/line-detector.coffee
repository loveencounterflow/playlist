
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
µ.DOM.ready ->
  log '^123-7^', "ready"
  # log '^123-7^', Object.keys µ
  # log '^123-7^', µ.Linefinder
  nodes         = µ.DOM.select_all 'p'
  rectangles    = []
  linefinder    = new µ.LINEFINDER.Linefinder()
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






