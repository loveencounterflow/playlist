(function() {
  'use strict';
  var Dom2, walk_xpath;

  //===========================================================================================================
  globalThis.µ = require('mudom');

  //===========================================================================================================
  walk_xpath = function*(root, path) {
    var iterator, node;
    if (path == null) {
      // thx to https://denizaksimsek.com/2023/xpath/
      [root, path] = [document, root];
    }
    iterator = document.evaluate(path, root, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    while (true) {
      if ((node = iterator.iterateNext()) == null) {
        break;
      }
      yield node;
    }
    return null;
  };

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

    //---------------------------------------------------------------------------------------------------------
    select_first_xpath(...P) {
      var R, ref;
      ref = walk_xpath(...P);
      for (R of ref) {
        return R;
      }
    }

    select_all_xpath(...P) {
      var R, ref, results;
      ref = walk_xpath(...P);
      results = [];
      for (R of ref) {
        results.push(R);
      }
      return results;
    }

    //---------------------------------------------------------------------------------------------------------
    page_is_inside_iframe() {
      return window.location !== window.parent.location;
    }

    //---------------------------------------------------------------------------------------------------------
    new_stylesheet(text = '') {
      var R;
      R = document.createElement('style');
      R.appendChild(document.createTextNode(text));
      return R;
    }

  };

  //===========================================================================================================
  µ.DOM = new Dom2();

}).call(this);

//# sourceMappingURL=mudom2.js.map