(function() {
  'use strict';
  var add_line_markers, draw_client_rectangles;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //-----------------------------------------------------------------------------------------------------------
  add_line_markers = function(ref_element, element) {
    var i, j, len, len1, marker, rectangle, ref, ref1, ref_rectangle, scroll_left, scroll_top;
    debug('add_line_markers', element);
    ref = µ.DOM.select_all_from(element, '.µ-clientrec');
    for (i = 0, len = ref.length; i < len; i++) {
      marker = ref[i];
      // debug '^32342^', µ.DOM.select_all_from element, '.µ-clientrec'
      µ.DOM.remove(marker);
    }
    //.........................................................................................................
    ref_rectangle = ref_element.getBoundingClientRect();
    ref1 = element.getClientRects();
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      rectangle = ref1[j];
      marker = document.createElement('div');
      µ.DOM.add_class(marker, 'µ-clientrec');
      scroll_top = 0; // -element.scrollTop
      scroll_left = 0; // -element.scrollLeft
      scroll_top = -ref_rectangle.y;
      scroll_left = -ref_rectangle.x;
      // scroll_top            = µ.DOM.get_document_scroll_top()
      // scroll_left           = µ.DOM.get_document_scroll_left()
      marker.style.top = `${rectangle.top + scroll_top}px`;
      marker.style.left = `${rectangle.left + scroll_left}px`;
      marker.style.width = `${rectangle.width}px`;
      marker.style.height = `${rectangle.height}px`;
      element.appendChild(marker);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  draw_client_rectangles = () => {
    var element, elements, i, j, len, len1, ref_element, ref_elements;
    ref_elements = µ.DOM.select_all('.tracker');
    for (i = 0, len = ref_elements.length; i < len; i++) {
      ref_element = ref_elements[i];
      debug("draw_client_rectangles for ref_element", ref_element);
      elements = µ.DOM.select_all_from(ref_element, '& > div > span');
      for (j = 0, len1 = elements.length; j < len1; j++) {
        element = elements[j];
        // debug '^123-3^', element
        add_line_markers(ref_element, element);
      }
    }
    return null;
  };

  (function() {    //-----------------------------------------------------------------------------------------------------------
    var element, i, len, ref;
    ref = µ.DOM.select_all('.tracker > div');
    for (i = 0, len = ref.length; i < len; i++) {
      element = ref[i];
      µ.DOM.wrap_inner(element, µ.DOM.parse_one('<span></span>'));
    }
    return null;
  })();

  //-----------------------------------------------------------------------------------------------------------
  µ.DOM.ready(function() {
    var button, handler;
    log('^123-4^', "ready");
    draw_client_rectangles();
    button = µ.DOM.select_first('#redraw');
    µ.DOM.on(button, 'click', function() {
      debug('^123-1^', "redraw");
      return draw_client_rectangles();
    });
    //.........................................................................................................
    log('^123-10^', "set up scroll events");
    µ.DOM.on(document, 'scroll', function() {
      // log '^123-11^', 'scroll', µ.DOM.get_document_scroll_top()
      return null;
    });
    handler = function() {
      return log('^123-12^', 'scroll tracker');
    };
    return (µ.DOM.select_first('.tracker')).addEventListener('scroll', handler, true);
  });

  log('^123-5^', "ops2 OK");

}).call(this);

//# sourceMappingURL=ops2.js.map