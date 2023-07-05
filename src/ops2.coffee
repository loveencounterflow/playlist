
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug


#-----------------------------------------------------------------------------------------------------------
add_line_markers = ( ref_element, element ) ->
  debug 'add_line_markers', element
  # debug '^32342^', µ.DOM.select_all_from element, '.µ-clientrec'
  µ.DOM.remove marker for marker in µ.DOM.select_all_from element, '.µ-clientrec'
  #.........................................................................................................
  ref_rectangle = ref_element.getBoundingClientRect()
  for rectangle in element.getClientRects()
    marker                = document.createElement 'div'
    µ.DOM.add_class marker, 'µ-clientrec'
    scroll_top            = 0 # -element.scrollTop
    scroll_left           = 0 # -element.scrollLeft
    scroll_top            = -ref_rectangle.y
    scroll_left           = -ref_rectangle.x
    # scroll_top            = µ.DOM.get_document_scroll_top()
    # scroll_left           = µ.DOM.get_document_scroll_left()
    marker.style.top      = "#{ rectangle.top  + scroll_top   }px"
    marker.style.left     = "#{ rectangle.left + scroll_left  }px"
    marker.style.width    = "#{ rectangle.width               }px"
    marker.style.height   = "#{ rectangle.height              }px"
    element.appendChild marker
  return null

#-----------------------------------------------------------------------------------------------------------
draw_client_rectangles = =>
  ref_elements = µ.DOM.select_all '.tracker'
  for ref_element in ref_elements
    debug "draw_client_rectangles for ref_element", ref_element
    elements = µ.DOM.select_all_from ref_element, '& > div > span'
    for element in elements
      # debug '^123-3^', element
      add_line_markers ref_element, element
  return null

#-----------------------------------------------------------------------------------------------------------
do ->
  for element in µ.DOM.select_all '.tracker > div'
    µ.DOM.wrap_inner element, µ.DOM.parse_one '<span></span>'
  return null

#-----------------------------------------------------------------------------------------------------------
µ.DOM.ready ->
  log '^123-4^', "ready"
  draw_client_rectangles()
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-1^', "redraw"
    draw_client_rectangles()
  #.........................................................................................................
  log '^123-10^', "set up scroll events"
  µ.DOM.on document, 'scroll', ->
    # log '^123-11^', 'scroll', µ.DOM.get_document_scroll_top()
    return null
  handler = ->
    log '^123-12^', 'scroll tracker'
  ( µ.DOM.select_first '.tracker' ).addEventListener 'scroll', handler, true


log '^123-5^', "ops2 OK"