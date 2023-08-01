
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug


#-----------------------------------------------------------------------------------------------------------
setup_debug_button = ->
  return null unless  µ.LINE.Distributor.is_main_document()
  return null unless ( button = µ.DOM.select_first '#debug', null )?
  µ.DOM.on button, 'click', ->
    µ.DOM.toggle_class ( µ.DOM.select_first 'body' ), 'debug'
  return null


#===========================================================================================================
µ.DOM.ready ->
  log '^123-1^', "ready"
  setup_debug_button()
  return null if      µ.LINE.Distributor.is_galley_document()
  return null unless  µ.LINE.Distributor.is_main_document()
  distributor = new µ.LINE.Distributor
    paragraph_selector:   'galley > p'
    iframe_selector:      'iframe'
  log '^123-2^', "distributing lines..."
  await distributor.distribute_lines()
  log '^123-3^', "distributing lines done"
  return null






