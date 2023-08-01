
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug




#===========================================================================================================
µ.DOM.ready ->
  log '^123-1^', "ready"
  distributor = new µ.LINE.Distributor
    paragraph_selector:   'galley > p'
    iframe_selector:      'iframe'
  log '^123-2^', "distributing lines..."
  await distributor.distribute_lines()
  log '^123-3^', "distributing lines done"
  return null



###
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-4^', "redraw"
    draw_client_rectangles()
  return null
###



