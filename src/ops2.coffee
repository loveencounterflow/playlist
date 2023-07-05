
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
  #.........................................................................................................
  for rectangle, idx in element.getClientRects()
    marker                = document.createElement 'div'
    scroll_top            = 0 # -element.scrollTop
    scroll_left           = 0 # -element.scrollLeft
    # scroll_top            = µ.DOM.get_document_scroll_top()
    # scroll_left           = µ.DOM.get_document_scroll_left()
    marker_top            = rectangle.top     - ref_rectangle.top  + ref_element.scrollTop
    if idx is 0
      debug '^423^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop
    marker_left           = rectangle.left    - ref_rectangle.left
    marker_width          = rectangle.width
    marker_height         = rectangle.height
    marker_bottom         = marker_top        + marker_height
    marker.style.top      = "#{ marker_top    }px"
    marker.style.left     = "#{ marker_left   }px"
    marker.style.width    = "#{ marker_width  }px"
    marker.style.height   = "#{ marker_height }px"
    µ.DOM.add_class marker, 'µ-clientrec'
    µ.DOM.add_class marker, 'above' if marker_top     < 0
    µ.DOM.add_class marker, 'below' if marker_bottom  > ref_rectangle.bottom
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
  first_tracker = µ.DOM.select_first '.tracker'
  show_scroll_tops = ->
    doc_scroll_top      = µ.DOM.get_document_scroll_top().toFixed 0
    tracker_scroll_top  = first_tracker.scrollTop.toFixed 0
    log '^123-11^', 'scroll', doc_scroll_top, tracker_scroll_top
    return null
  µ.DOM.on document,      'scroll', show_scroll_tops
  µ.DOM.on first_tracker, 'scroll', show_scroll_tops
  # handler = ->
  #   log '^123-12^', 'scroll tracker'
  # ( µ.DOM.select_first '.tracker' ).addEventListener 'scroll', handler, true


log '^123-5^', "ops2 OK"