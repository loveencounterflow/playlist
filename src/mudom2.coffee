
'use strict'


#===========================================================================================================
globalThis.µ = require 'mudom'

#===========================================================================================================
class Dom2 extends µ.DOM.constructor
  get_document_scroll_top:  -> document.documentElement.scrollTop
  get_document_scroll_left: -> document.documentElement.scrollLeft

#===========================================================================================================
µ.DOM = new Dom2()
