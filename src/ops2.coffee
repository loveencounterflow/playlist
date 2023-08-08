
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug




#===========================================================================================================
µ.DOM.ready ->
  log '^123-1^', "ready"
  cfg =
    paragraph_selector:         'mu-galley > p'
    iframe_selector:            'iframe'
    insert_stylesheet_after:    'link[href$="reset.css"]'
    insert_debug_button:        true
  #.........................................................................................................
  if ( not µ.DOM.page_is_inside_iframe() ) and ( µ.DOM.select_first 'mu-galley', null )?
    log '^123-1^', "galley page, not inside an iframe"
    distributor = new µ.LINE.Distributor cfg
    await distributor.mark_lines()
    return null
  #.........................................................................................................
  return null unless  µ.LINE.Distributor.is_main_document()
  #.........................................................................................................
  distributor = new µ.LINE.Distributor cfg
  await distributor.distribute_lines()
  return null






