
'use strict'


globalThis.log = console.log
globalThis.debug = console.debug




#===========================================================================================================
µ.DOM.ready ->
  log '^123-1^', "ready"
  #.........................................................................................................
  if ( not µ.DOM.page_is_inside_iframe() ) and ( µ.DOM.select_first 'galley', null )?
    log '^123-1^', "galley page, not inside an iframe"
    cfg =
      paragraph_selector:         'galley > p'
      insert_stylesheet_after:    'link[href$="reset.css"]'
      insert_debug_button:        true
    log '^123-1^', new µ.LINE.Finder cfg
    return null
  #.........................................................................................................
  return null unless  µ.LINE.Distributor.is_main_document()
  #.........................................................................................................
  cfg =
    paragraph_selector:         'galley > p'
    iframe_selector:            'iframe'
    insert_stylesheet_after:    'link[href$="reset.css"]'
    insert_debug_button:        true
  distributor = new µ.LINE.Distributor cfg
  log '^123-2^', "distributing lines..."
  await distributor.distribute_lines()
  log '^123-3^', "distributing lines done"
  return null






