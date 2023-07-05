
'use strict'


#===========================================================================================================
globalThis.µ = require 'mudom'

#===========================================================================================================
class Dom2 extends µ.DOM.constructor
  get_document_scroll_top:  -> document.documentElement.scrollTop
  get_document_scroll_left: -> document.documentElement.scrollLeft

  #---------------------------------------------------------------------------------------------------------
  wrap_inner: ( element, wrapper ) ->
    element.appendChild(wrapper);
    while element.firstChild isnt wrapper
       wrapper.appendChild element.firstChild
    return null

#===========================================================================================================
µ.DOM = new Dom2()
