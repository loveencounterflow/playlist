
'use strict'


#===========================================================================================================
µ = require 'mudom'


#===========================================================================================================
walk_xpath = ( root, path ) ->
  # thx to https://denizaksimsek.com/2023/xpath/
  [ root, path ] = [ document, root, ] unless path?
  iterator = document.evaluate path, root, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null
  loop
    break unless ( node = iterator.iterateNext() )?
    yield node
  return null


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

  #---------------------------------------------------------------------------------------------------------
  _XXX_set_iframe_scroll_top: ( iframe, y ) ->
    ### thx to https://stackoverflow.com/a/1229832/7568091 ###
    ### Set vertical scroll amount of content shown in an `<iframe>`. ###
    # ### TAINT API TBD
    iframe.contentWindow.document.documentElement.scrollTop = y
    return null

  #---------------------------------------------------------------------------------------------------------
  select_first_xpath: ( P... ) -> return R for R from walk_xpath P...
  select_all_xpath:   ( P... ) -> ( R for R from walk_xpath P... )

  #---------------------------------------------------------------------------------------------------------
  page_is_inside_iframe: -> window.location isnt window.parent.location

#===========================================================================================================
µ.DOM = new Dom2()
