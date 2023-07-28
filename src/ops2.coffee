
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug



#===========================================================================================================
next_slug   = ( walker ) -> d = walker.next(); { slug:    d.value, slugs_done:    d.done, }
next_node   = ( walker ) -> d = walker.next(); { node:    d.value, nodes_done:    d.done, }
next_iframe = ( walker ) ->
  { value: iframe, done: iframes_done, } = walker.next()
  return { iframes_done, } if iframes_done
  local_linefinder = new iframe.contentWindow.µ.LINEFINDER.Linefinder()
  return {
    iframe:           iframe,
    iframe_height:    ( µ.DOM.get_height iframe ),
    galley_document:  iframe.contentDocument,
    galley_window:    iframe.contentWindow,
    iframes_done:     iframes_done,
    ### TAINT may want to return `linefinder` itself ###
    galley_draw_box:        ( local_linefinder.draw_box.bind            local_linefinder ),
    galley_draw_line_cover: ( local_linefinder.xxx_draw_line_cover.bind local_linefinder ), }

#===========================================================================================================
reset_state = ( state ) ->
  state.first_slug  = null
  state.top         = null
  state.height      = null
  return state

#===========================================================================================================
µ.DOM.ready ->
  log '^123-8^', "ready"
  #.........................................................................................................
  if µ.DOM.page_is_inside_iframe()
    log '^123-9^', "leaving b/c document is loaded in iframe"
    return null
  #.........................................................................................................
  iframes = µ.DOM.select_all 'iframe'
  unless iframes.length > 0
    log '^123-10^', "leaving b/c document does not have iframes"
    return null
  #.........................................................................................................
  ### Allow user-scrolling for demo ###
  # µ.DOM.set iframe, 'scrolling', 'true' for iframe in µ.DOM.select_all 'iframe'
  #.........................................................................................................
  iframe_walker       = iframes.values()
  { iframe
    iframes_done
    iframe_height
    galley_document
    galley_window
    galley_draw_box
    galley_draw_line_cover } = next_iframe iframe_walker
  #.........................................................................................................
  node_walker       = ( galley_document.querySelectorAll 'galley > p' ).values()
  linefinder        = new galley_window.µ.LINEFINDER.Linefinder()
  #.........................................................................................................
  state             = {}
  ### TAINT prefer to use `new State()`? ###
  reset_state state
  #.........................................................................................................
  loop
    { node
      nodes_done    } = next_node node_walker
    #.......................................................................................................
    if nodes_done
      # might want to mark galleys without content at this point
      log '^123-1^', "nodes done"
      break
    #.......................................................................................................
    slug_walker       = linefinder.walk_slugs_of_node node
    loop
      { slug
        slugs_done  } = next_slug slug_walker
      if slugs_done
        log '^123-1^', "slugs done"
        break
      #.......................................................................................................
      unless state.first_slug?
        ### TAINT code duplication; use method ###
        state.first_slug    = slug
        state.top           = state.first_slug.rectangle.top
        state.height        = 0
        galley_window.scrollTo { top: state.top, }
      #.......................................................................................................
      state.height = slug.rectangle.bottom - state.top
      if iframe_height > state.height
        galley_draw_box slug.rectangle
        continue
      galley_draw_line_cover slug.rectangle
      #.......................................................................................................
      { iframe
        iframes_done
        iframe_height
        galley_document
        galley_window
        galley_draw_box
        galley_draw_line_cover } = next_iframe iframe_walker
      reset_state state
      galley_draw_box slug.rectangle
      if iframes_done
        log '^123-1^', "iframes done"
        break
      ### TAINT code duplication; use method ###
      state.first_slug    = slug
      state.top           = state.first_slug.rectangle.top
      state.height        = 0
      galley_window.scrollTo { top: state.top, }
  return null



###
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-14^', "redraw"
    draw_client_rectangles()
  return null
###



