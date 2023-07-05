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

  };

  //===========================================================================================================
  µ.DOM = new Dom2();

}).call(this);

//# sourceMappingURL=mudom2.js.map