
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug




#===========================================================================================================
µ.DOM.ready ->
  log '^123-8^', "ready"
  distributor = new µ.LINE.Distributor
    paragraph_selector:   'galley > p'
    iframe_selector:      'iframe'
  distributor.distribute_lines()
  return null



###
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-14^', "redraw"
    draw_client_rectangles()
  return null
###



