
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
    scroll_top                = 0 # -element.scrollTop
    scroll_left               = 0 # -element.scrollLeft
    # scroll_top                = µ.DOM.get_document_scroll_top()
    # scroll_left               = µ.DOM.get_document_scroll_left()
    marker_top                = rectangle.top     - ref_rectangle.top  + ref_element.scrollTop
    if idx is 0
      debug '^123-1^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop
    marker_left               = rectangle.left    - ref_rectangle.left
    marker_width              = rectangle.width
    marker_height             = rectangle.height
    marker_bottom             = marker_top        + marker_height
    marker                    = µ.DOM.parse_one "<div>#{marker_top.toFixed 0}px</div>"
    marker.style.top          = "#{ marker_top    }px"
    marker.style.left         = "#{ marker_left   }px"
    marker.style.width        = "#{ marker_width  }px"
    marker.style.height       = "#{ marker_height }px"
    marker.style.paddingLeft  = "#{ marker_width  }px"
    µ.DOM.add_class marker, 'µ-clientrec'
    µ.DOM.add_class marker, 'above' if marker_top     < 0
    µ.DOM.add_class marker, 'below' if marker_bottom  > ref_rectangle.height
    ref_element.appendChild marker
  # µ.DOM.remove m2 for m2 in µ.DOM.select_all_from ref_element, '.µ-clientrec.ref-rectangle'
  # m2 = document.createElement 'div'
  # µ.DOM.add_class m2, 'µ-clientrec'
  # µ.DOM.add_class m2, 'ref-rectangle'
  # m2.style.top    = "#{0}px"
  # m2.style.left   = "#{0}px"
  # m2.style.width  = "#{ref_rectangle.width}px"
  # m2.style.height = "#{ref_rectangle.height}px"
  # ref_element.appendChild m2
  return null

# #-----------------------------------------------------------------------------------------------------------
# draw_client_rectangles = =>
#   ref_elements = µ.DOM.select_all '.tracker'
#   for ref_element in ref_elements
#     debug "draw_client_rectangles for ref_element", ref_element
#     elements = µ.DOM.select_all_from ref_element, '& > div > span'
#     for element in elements
#       # debug '^123-2^', element
#       add_line_markers ref_element, element
#   return null

# #-----------------------------------------------------------------------------------------------------------
# do ->
#   for element in µ.DOM.select_all '.tracker > div'
#     µ.DOM.wrap_inner element, µ.DOM.parse_one '<span></span>'
#   return null


#===========================================================================================================
class Aligner

  #---------------------------------------------------------------------------------------------------------
  constructor: ->
    @_insert_spans()
    @_mark_line_rectangles()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  _insert_spans: ->
    ### all relevant iframes show the same underlying document so we only add spans for the document in the
    first iframe ###
    first_iframe  = µ.DOM.select_first 'iframe'
    sub_document  = first_iframe.contentDocument
    ### NB µDOM rejects sub_document b/c not considered an 'element', may change that ###
    first_tracker = sub_document.querySelector '.tracker'
    ### `:scope` is akin to `this`, refers to present element;
    thx to https://stackoverflow.com/a/17206138/7568091 ###
    for element in first_tracker.querySelectorAll ':scope > div'
      debug '^123-3^', element
      µ.DOM.wrap_inner element, µ.DOM.parse_one "<span class='µ-aligner'></span>"
    return null

  #---------------------------------------------------------------------------------------------------------
  _mark_line_rectangles: ->
    first_iframe  = µ.DOM.select_first 'iframe'
    sub_document  = first_iframe.contentDocument
    ### NB µDOM rejects sub_document b/c not considered an 'element', may change that ###
    first_tracker = sub_document.querySelector '.tracker'
    ### `:scope` is akin to `this`, refers to present element;
    thx to https://stackoverflow.com/a/17206138/7568091 ###
    debug "draw_client_rectangles for first_tracker", first_tracker
    elements = first_tracker.querySelectorAll ':scope > div > span'
    for element in elements
      debug '^123-4^', element
      add_line_markers first_tracker, element
    return null

  #---------------------------------------------------------------------------------------------------------
  _xxx: ->
    ###

    entities:

      * iframes / target boxes
        * linearly ordered so text flows from one to the next
          * each with width, height, position on page
        * for now:
          * no automatic creation
          * width held constant across iframes
          * position on page irrelevant

      * tracker / galley:
        * has same width as targetted iframe
        * has margins above, below of at least the maximum target height
        * extensions:
          * when one flow should go into targets with differing widths, need to add
            `float`ing `div`s that restrict line lengths intermittently in the galley
          * may consider to do that line-by-line so that ['Form' / 'Kontur'satz](https://de.wikipedia.org/wiki/Kontursatz)
            is already being thought of


    ###
    first_iframe  = µ.DOM.select_first 'iframe'
    sub_document  = first_iframe.contentDocument
    ### NB µDOM rejects sub_document b/c not considered an 'element', may change that ###
    first_tracker = sub_document.querySelector '.tracker'
    ### `:scope` is akin to `this`, refers to present element;
    thx to https://stackoverflow.com/a/17206138/7568091 ###
    debug "draw_client_rectangles for first_tracker", first_tracker
    elements = first_tracker.querySelectorAll ':scope > div > span'
    for element in elements
      debug '^123-4^', element
      add_line_markers first_tracker, element
    return null


#===========================================================================================================
µ.DOM.ready ->
  log '^123-5^', "ready"
  aligner = new Aligner()
  iframes = µ.DOM.select_all 'iframe'
  for iframe in iframes
    sub_document  = iframe.contentDocument
    # first_tracker = µ.DOM.select_first_from sub_document, '.tracker'
    first_tracker = sub_document.querySelector '.tracker'
    debug '^35345^', first_tracker
    iframe.contentWindow.scrollTo 0, 200
  #   # sub_document.scrollTo 0, 100
  #   # first_tracker.scrollTop = 100
  #   draw_client_rectangles()
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-6^', "redraw"
    draw_client_rectangles()
  # #.........................................................................................................
  # log '^123-7^', "set up scroll events"
  # show_scroll_tops = ->
  #   doc_scroll_top      = µ.DOM.get_document_scroll_top().toFixed 0
  #   tracker_scroll_top  = first_tracker.scrollTop.toFixed 0
  #   log '^123-8^', 'scroll', doc_scroll_top, tracker_scroll_top
  #   return null
  # µ.DOM.on document,      'scroll', show_scroll_tops
  # µ.DOM.on first_tracker, 'scroll', show_scroll_tops
  # handler = ->
  #   log '^123-9^', 'scroll tracker'
  # ( µ.DOM.select_first '.tracker' ).addEventListener 'scroll', handler, true
  return null


log '^123-10^', "ops2 OK"