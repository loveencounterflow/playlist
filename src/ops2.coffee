
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug





#===========================================================================================================
class Column

  #---------------------------------------------------------------------------------------------------------
  constructor: ( ø_iframe, ø_slug ) ->
    @_ø_iframe  = ø_iframe
    @first_slug = ø_slug.value
    @top        = ø_slug.value.rectangle.top
    @height     = 0
    return undefined

  #---------------------------------------------------------------------------------------------------------
  scroll_to_first_line: ->
    @_ø_iframe.window.scrollTo { top: @top, }
    return null

  #---------------------------------------------------------------------------------------------------------
  set_height_from_slug: ( ø_slug ) ->
    @height = ø_slug.value.rectangle.bottom - @top
    return @height


#===========================================================================================================
class Walker

  #---------------------------------------------------------------------------------------------------------
  constructor: ( iterator, stop = null ) ->
    @_iterator  = iterator
    @_stop      = stop
    @done       = false
    @value      = stop
    return undefined

  #---------------------------------------------------------------------------------------------------------
  step: ->
    { value, done, } = @_iterator.next()
    if done
      @done   = true
      @value  = @_stop
      return @_stop
    @value = value
    return value


#===========================================================================================================
class Node_walker extends Walker
class Slug_walker extends Walker


#===========================================================================================================
class Iframe_walker extends Walker

  #---------------------------------------------------------------------------------------------------------
  constructor: ( iterator, stop = null ) ->
    super iterator, stop
    @height                 = null
    @galley_document        = null
    @galley_window          = null
    @galley_draw_box        = null
    @galley_draw_line_cover = null
    return undefined

  #---------------------------------------------------------------------------------------------------------
  step: ->
    super()
    return @_stop if @done
    @height                 = µ.DOM.get_height @value
    @galley_document        = @value.contentDocument
    @galley_window          = @value.contentWindow
    ### TAINT may want to return `linefinder` itself ###
    local_linefinder        = new @value.contentWindow.µ.LINEFINDER.Linefinder()
    @galley_draw_box        = local_linefinder.draw_box.bind            local_linefinder
    @galley_draw_line_cover = local_linefinder.xxx_draw_line_cover.bind local_linefinder
    return @value


#===========================================================================================================
µ.DOM.ready ->
  log '^123-8^', "ready"
  #.........................................................................................................
  if µ.DOM.page_is_inside_iframe()
    log '^123-9^', "leaving b/c document is loaded in iframe"
    return null
  #.........................................................................................................
  _iframes = µ.DOM.select_all 'iframe'
  unless _iframes.length > 0
    log '^123-10^', "leaving b/c document does not have iframes"
    return null
  #.........................................................................................................
  ### Allow user-scrolling for demo ###
  # µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
  #.........................................................................................................
  ø_iframe          = new Iframe_walker _iframes.values()
  ø_iframe.step()
  _nodes            = ø_iframe.galley_document.querySelectorAll 'galley > p'
  ø_node            = new Node_walker _nodes.values()
  linefinder        = new ø_iframe.galley_window.µ.LINEFINDER.Linefinder()
  column            = null
  #.........................................................................................................
  loop
    break if ø_iframe.done
    #.......................................................................................................
    unless ø_node.step()? # might want to mark galleys without content at this point
      log '^123-1^', "nodes done"; break
    #.......................................................................................................
    ø_slug = new Slug_walker linefinder.walk_slugs_of_node ø_node.value
    loop
      unless ø_slug.step()?
        log '^123-1^', "slugs done"; break
      #.......................................................................................................
      unless column?.first_slug?
        column = new Column ø_iframe, ø_slug
        column.scroll_to_first_line()
      #.......................................................................................................
      column.set_height_from_slug ø_slug
      if ø_iframe.height > column.height
        ø_iframe.galley_draw_box ø_slug.value.rectangle
        continue
      #.......................................................................................................
      ø_iframe.galley_draw_line_cover ø_slug.value.rectangle
      column    = null
      unless ø_iframe.step()?
        log '^123-1^', "iframes done"; break
      ø_iframe.galley_draw_box ø_slug.value.rectangle
      column = new Column ø_iframe, ø_slug
      column.scroll_to_first_line()
  return null



###
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-14^', "redraw"
    draw_client_rectangles()
  return null
###



