
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
    # if idx is 0
    #   debug '^123-1^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop
    marker_left               = rectangle.left    - ref_rectangle.left
    marker_width              = rectangle.width
    marker_height             = rectangle.height
    marker_bottom             = marker_top        + marker_height
    # marker                    = µ.DOM.parse_one "<div>#{marker_top.toFixed 0}px</div>"
    marker                    = µ.DOM.parse_one "<div></div>"
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
    @_xxx()
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
      # debug '^123-3^', element
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
      # debug '^123-4^', element
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

      * galley:
        * has maximum width of all target frames
        * has margins above, below of at least the maximum target height
        * extensions:
          * when one flow should go into targets with differing widths, need to add
            floating divs left and right to constrain and position lines using CSS
            `shape-outside` (and analogous `clip-path` for visualization)
            `d.style.setProperty( '--path', getComputedStyle(d).getPropertyValue('--path') + ', 20mm 50mm' )`

    ###
    first_iframe  = µ.DOM.select_first 'iframe'
    sub_document  = first_iframe.contentDocument
    ### NB µDOM rejects sub_document b/c not considered an 'element', may change that ###
    first_tracker = sub_document.querySelector '.tracker'
    ref_element   = first_tracker
    ref_rectangle = ref_element.getBoundingClientRect()
    elements      = first_tracker.querySelectorAll ':scope > div > span'
    for element in elements
      debug '^123-5^', element
      for rectangle, idx in element.getClientRects()
        scroll_top                = 0 # -element.scrollTop
        scroll_left               = 0 # -element.scrollLeft
        # scroll_top                = µ.DOM.get_document_scroll_top()
        # scroll_left               = µ.DOM.get_document_scroll_left()
        marker_top                = rectangle.top     - ref_rectangle.top  + ref_element.scrollTop
        if idx is 0
          debug '^123-6^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop
        marker_left               = rectangle.left    - ref_rectangle.left
        marker_width              = rectangle.width
        marker_height             = rectangle.height
        marker_bottom             = marker_top        + marker_height
    return null


#===========================================================================================================
next_slug = ( walker ) -> d = walker.next(); { slug: d.value, slugs_done: d.done, }
next_node = ( walker ) -> d = walker.next(); { node: d.value, nodes_done: d.done, }


#===========================================================================================================
µ.DOM.ready ->
  log '^123-8^', "ready"
  #.........................................................................................................
  if µ.DOM.page_is_inside_iframe()
    log '^123-9^', "leaving b/c document is loaded in iframe"
    return null
  #.........................................................................................................
  unless ( galley_iframe = µ.DOM.select_first 'iframe', null )?
    log '^123-10^', "leaving b/c document does not have iframes"
    return null
  #.........................................................................................................
  ### Allow user-scrolling for demo ###
  for iframe in µ.DOM.select_all 'iframe'
    µ.DOM.set iframe, 'scrolling', 'true'
  #.........................................................................................................
  galley_height     = µ.DOM.get_height galley_iframe
  galley_document   = galley_iframe.contentDocument
  galley_window     = galley_iframe.contentWindow
  #.........................................................................................................
  galley_window.scrollTo { left:0, top: 0, }
  #.........................................................................................................
  node_walker       = ( galley_document.querySelectorAll 'galley > div' ).values()
  ### Demo ###
  slug_iterator = galley_window.draw_line_boxes()
  xxx_count     = 0
  linefinder        = new µ.LINEFINDER.Linefinder { document: galley_document, }
  #.........................................................................................................
  xxx_count         = 0
  state             =
    first_slug:   null
    top:          null
  #.........................................................................................................
  loop
    break if xxx_count++ > 500 ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
    { node
      nodes_done    } = next_node node_walker
    log '^123-1^', node, nodes_done
    #.......................................................................................................
    if nodes_done
      # might want to mark galleys without content at this point
      break
    #.......................................................................................................
    slug_walker       = linefinder.walk_slugs_of_node node
    loop
      break if xxx_count++ > 500 ### !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ###
      { slug
        slugs_done  } = next_slug slug_walker
      #.......................................................................................................
      unless state.first_slug?
        state.first_slug    = slug
        state.top           = state.first_slug.rectangle.top + galley_document.documentElement.scrollTop
        galley_window.scrollTo { top: state.top, }
      linefinder.draw_box slug.rectangle
      break if slugs_done
      # bottom    = slug.rectangle.bottom + galley_document.documentElement.scrollTop
      # distance  = bottom - top
      # log '^123-13^', { bottom, distance, galley_height, }
  return null



###
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-14^', "redraw"
    draw_client_rectangles()
  return null
###



