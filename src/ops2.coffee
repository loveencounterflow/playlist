
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug


#-----------------------------------------------------------------------------------------------------------
setup_debug_button = ( distributor ) ->
  return unless ( button = µ.DOM.select_first 'button#debug', null )?
  µ.DOM.on button, 'click', ->
    µ.DOM.toggle_class ( µ.DOM.select_first 'body' ), 'debug'
    for ø_iframe from distributor.new_iframe_walker()
      galley_µ = ø_iframe.window.µ
      galley_µ.DOM.toggle_class ( galley_µ.DOM.select_first 'body' ), 'debug'
  return null


#===========================================================================================================
µ.DOM.ready ->
  log '^123-1^', "ready"
  # return null if      µ.LINE.Distributor.is_galley_document()
  return null unless  µ.LINE.Distributor.is_main_document()
  cfg =
    paragraph_selector:       'galley > p'
    iframe_selector:          'iframe'
    inject_stylesheet_after:  'link[href$="reset.css"]'
  distributor = new µ.LINE.Distributor cfg
  setup_debug_button distributor
  log '^123-2^', "distributing lines..."
  await distributor.distribute_lines()
  log '^123-3^', "distributing lines done"
  return null






