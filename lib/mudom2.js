(function() {
  'use strict';
  var Dom2;

  //===========================================================================================================
  globalThis.µ = require('mudom');

  //===========================================================================================================
  Dom2 = class Dom2 extends µ.DOM.constructor {
    get_document_scroll_top() {
      return document.documentElement.scrollTop;
    }

    get_document_scroll_left() {
      return document.documentElement.scrollLeft;
    }

    //---------------------------------------------------------------------------------------------------------
    wrap_inner(element, wrapper) {
      element.appendChild(wrapper);
      while (element.firstChild !== wrapper) {
        wrapper.appendChild(element.firstChild);
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _XXX_set_iframe_scroll_top(iframe, y) {
      /* thx to https://stackoverflow.com/a/1229832/7568091 */
      /* Set vertical scroll amount of content shown in an `<iframe>`. */
      // ### TAINT API TBD
      iframe.contentWindow.document.documentElement.scrollTop = y;
      return null;
    }

  };

  //===========================================================================================================
  µ.DOM = new Dom2();

}).call(this);

//# sourceMappingURL=mudom2.js.map