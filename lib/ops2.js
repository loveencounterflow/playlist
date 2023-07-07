(function() {
  'use strict';
  var add_line_markers, draw_client_rectangles;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //-----------------------------------------------------------------------------------------------------------
  add_line_markers = function(ref_element, element) {
    var i, idx, j, len, len1, marker, marker_bottom, marker_height, marker_left, marker_top, marker_width, rectangle, ref, ref1, ref_rectangle, scroll_left, scroll_top;
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
    //.........................................................................................................
    for (idx = j = 0, len1 = ref1.length; j < len1; idx = ++j) {
      rectangle = ref1[idx];
      scroll_top = 0; // -element.scrollTop
      scroll_left = 0; // -element.scrollLeft
      // scroll_top                = µ.DOM.get_document_scroll_top()
      // scroll_left               = µ.DOM.get_document_scroll_left()
      marker_top = rectangle.top - ref_rectangle.top + ref_element.scrollTop;
      if (idx === 0) {
        debug('^423^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop);
      }
      marker_left = rectangle.left - ref_rectangle.left;
      marker_width = rectangle.width;
      marker_height = rectangle.height;
      marker_bottom = marker_top + marker_height;
      marker = µ.DOM.parse_one(`<div>${marker_top.toFixed(0)}px</div>`);
      marker.style.top = `${marker_top}px`;
      marker.style.left = `${marker_left}px`;
      marker.style.width = `${marker_width}px`;
      marker.style.height = `${marker_height}px`;
      marker.style.paddingLeft = `${marker_width}px`;
      µ.DOM.add_class(marker, 'µ-clientrec');
      if (marker_top < 0) {
        µ.DOM.add_class(marker, 'above');
      }
      if (marker_bottom > ref_rectangle.height) {
        µ.DOM.add_class(marker, 'below');
      }
      ref_element.appendChild(marker);
    }
    // µ.DOM.remove m2 for m2 in µ.DOM.select_all_from ref_element, '.µ-clientrec.ref-rectangle'
    // m2 = document.createElement 'div'
    // µ.DOM.add_class m2, 'µ-clientrec'
    // µ.DOM.add_class m2, 'ref-rectangle'
    // m2.style.top    = "#{0}px"
    // m2.style.left   = "#{0}px"
    // m2.style.width  = "#{ref_rectangle.width}px"
    // m2.style.height = "#{ref_rectangle.height}px"
    // ref_element.appendChild m2
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
    var button, first_tracker, i, iframe, iframes, len, sub_document;
    log('^123-4^', "ready");
    iframes = µ.DOM.select_all('iframe');
    for (i = 0, len = iframes.length; i < len; i++) {
      iframe = iframes[i];
      sub_document = iframe.contentDocument;
      // first_tracker = µ.DOM.select_first_from sub_document, '.tracker'
      first_tracker = sub_document.querySelector('.tracker');
      debug('^35345^', first_tracker);
      iframe.contentWindow.scrollTo(0, 0);
      // sub_document.scrollTo 0, 100
      // first_tracker.scrollTop = 100
      draw_client_rectangles();
    }
    button = µ.DOM.select_first('#redraw');
    µ.DOM.on(button, 'click', function() {
      debug('^123-1^', "redraw");
      return draw_client_rectangles();
    });
    // #.........................................................................................................
    // log '^123-10^', "set up scroll events"
    // show_scroll_tops = ->
    //   doc_scroll_top      = µ.DOM.get_document_scroll_top().toFixed 0
    //   tracker_scroll_top  = first_tracker.scrollTop.toFixed 0
    //   log '^123-11^', 'scroll', doc_scroll_top, tracker_scroll_top
    //   return null
    // µ.DOM.on document,      'scroll', show_scroll_tops
    // µ.DOM.on first_tracker, 'scroll', show_scroll_tops
    // handler = ->
    //   log '^123-12^', 'scroll tracker'
    // ( µ.DOM.select_first '.tracker' ).addEventListener 'scroll', handler, true
    return null;
  });

  log('^123-5^', "ops2 OK");

}).call(this);

//# sourceMappingURL=ops2.js.map