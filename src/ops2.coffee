
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug



#===========================================================================================================
next_node   = ( walker ) -> walker.next()
next_slug   = ( walker ) -> walker.next()
next_iframe = ( walker ) ->
  d = walker.next()
  return d if d.done
  d.height                  = µ.DOM.get_height d.value
  d.galley_document         = d.value.contentDocument
  d.galley_window           = d.value.contentWindow
  ### TAINT may want to return `linefinder` itself ###
  local_linefinder          = new d.value.contentWindow.µ.LINEFINDER.Linefinder()
  d.galley_draw_box         = local_linefinder.draw_box.bind            local_linefinder
  d.galley_draw_line_cover  = local_linefinder.xxx_draw_line_cover.bind local_linefinder
  return d

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
  # µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
  #.........................................................................................................
  iframe_walker     = iframes.values()
  ø_iframe          = next_iframe iframe_walker
  log '^35345456^', ø_iframe
  #.........................................................................................................
  node_walker       = ( ø_iframe.galley_document.querySelectorAll 'galley > p' ).values()
  linefinder        = new ø_iframe.galley_window.µ.LINEFINDER.Linefinder()
  #.........................................................................................................
  state             = {}
  ### TAINT prefer to use `new State()`? ###
  reset_state state
  #.........................................................................................................
  loop
    break if ø_iframe.done
    ø_node = next_node node_walker
    #.......................................................................................................
    if ø_node.done
      # might want to mark galleys without content at this point
      log '^123-1^', "nodes done"
      break
    #.......................................................................................................
    slug_walker       = linefinder.walk_slugs_of_node ø_node.value
    loop
      ø_slug = next_slug slug_walker
      if ø_slug.done
        log '^123-1^', "slugs done"
        break
      #.......................................................................................................
      unless state.first_slug?
        ### TAINT code duplication; use method ###
        state.first_slug    = ø_slug.value
        state.top           = state.first_slug.rectangle.top
        state.height        = 0
        ø_iframe.galley_window.scrollTo { top: state.top, }
      #.......................................................................................................
      state.height = ø_slug.value.rectangle.bottom - state.top
      if ø_iframe.height > state.height
        ø_iframe.galley_draw_box ø_slug.value.rectangle
        continue
      ø_iframe.galley_draw_line_cover ø_slug.value.rectangle
      #.......................................................................................................
      ø_iframe = next_iframe iframe_walker
      reset_state state
      unless ø_iframe.done
        ø_iframe.galley_draw_box ø_slug.value.rectangle
      else
        log '^123-1^', "iframes done"
        break
      ### TAINT code duplication; use method ###
      state.first_slug    = ø_slug.value
      state.top           = state.first_slug.rectangle.top
      state.height        = 0
      ø_iframe.galley_window.scrollTo { top: state.top, }
  return null



###
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-14^', "redraw"
    draw_client_rectangles()
  return null
###



