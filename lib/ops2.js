(function() {
  'use strict';
  var Aligner, add_line_markers;

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
      // if idx is 0
      //   debug '^123-1^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop
      marker_left = rectangle.left - ref_rectangle.left;
      marker_width = rectangle.width;
      marker_height = rectangle.height;
      marker_bottom = marker_top + marker_height;
      // marker                    = µ.DOM.parse_one "<div>#{marker_top.toFixed 0}px</div>"
      marker = µ.DOM.parse_one("<div></div>");
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

  // #-----------------------------------------------------------------------------------------------------------
  // draw_client_rectangles = =>
  //   ref_elements = µ.DOM.select_all '.tracker'
  //   for ref_element in ref_elements
  //     debug "draw_client_rectangles for ref_element", ref_element
  //     elements = µ.DOM.select_all_from ref_element, '& > div > span'
  //     for element in elements
  //       # debug '^123-2^', element
  //       add_line_markers ref_element, element
  //   return null

    // #-----------------------------------------------------------------------------------------------------------
  // do ->
  //   for element in µ.DOM.select_all '.tracker > div'
  //     µ.DOM.wrap_inner element, µ.DOM.parse_one '<span></span>'
  //   return null

    //===========================================================================================================
  Aligner = class Aligner {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      this._insert_spans();
      this._mark_line_rectangles();
      this._xxx();
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _insert_spans() {
      /* all relevant iframes show the same underlying document so we only add spans for the document in the
         first iframe */
      /* NB µDOM rejects sub_document b/c not considered an 'element', may change that */
      var element, first_iframe, first_tracker, i, len, ref, sub_document;
      first_iframe = µ.DOM.select_first('iframe');
      sub_document = first_iframe.contentDocument;
      first_tracker = sub_document.querySelector('.tracker');
      ref = first_tracker.querySelectorAll(':scope > div');
      /* `:scope` is akin to `this`, refers to present element;
         thx to https://stackoverflow.com/a/17206138/7568091 */
      for (i = 0, len = ref.length; i < len; i++) {
        element = ref[i];
        // debug '^123-3^', element
        µ.DOM.wrap_inner(element, µ.DOM.parse_one("<span class='µ-aligner'></span>"));
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _mark_line_rectangles() {
      /* NB µDOM rejects sub_document b/c not considered an 'element', may change that */
      var element, elements, first_iframe, first_tracker, i, len, sub_document;
      first_iframe = µ.DOM.select_first('iframe');
      sub_document = first_iframe.contentDocument;
      first_tracker = sub_document.querySelector('.tracker');
      /* `:scope` is akin to `this`, refers to present element;
         thx to https://stackoverflow.com/a/17206138/7568091 */
      debug("draw_client_rectangles for first_tracker", first_tracker);
      elements = first_tracker.querySelectorAll(':scope > div > span');
      for (i = 0, len = elements.length; i < len; i++) {
        element = elements[i];
        // debug '^123-4^', element
        add_line_markers(first_tracker, element);
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _xxx() {
      /*

      entities:

        * iframes / target boxes
          * linearly ordered so text flows from one to the next
            * each with width, height, position on page
          * for now:
            * no automatic creation
            * width held constant across iframes
            * position on page irrelevant

        * galley:
          * has maximum width of all target frames
          * has margins above, below of at least the maximum target height
          * extensions:
            * when one flow should go into targets with differing widths, need to add
              floating divs left and right to constrain and position lines using CSS
              `shape-outside` (and analogous `clip-path` for visualization)
              `d.style.setProperty( '--path', getComputedStyle(d).getPropertyValue('--path') + ', 20mm 50mm' )`

       */
      /* NB µDOM rejects sub_document b/c not considered an 'element', may change that */
      var element, elements, first_iframe, first_tracker, i, idx, j, len, len1, marker_bottom, marker_height, marker_left, marker_top, marker_width, rectangle, ref, ref_element, ref_rectangle, scroll_left, scroll_top, sub_document;
      first_iframe = µ.DOM.select_first('iframe');
      sub_document = first_iframe.contentDocument;
      first_tracker = sub_document.querySelector('.tracker');
      ref_element = first_tracker;
      ref_rectangle = ref_element.getBoundingClientRect();
      elements = first_tracker.querySelectorAll(':scope > div > span');
      for (i = 0, len = elements.length; i < len; i++) {
        element = elements[i];
        debug('^123-5^', element);
        ref = element.getClientRects();
        for (idx = j = 0, len1 = ref.length; j < len1; idx = ++j) {
          rectangle = ref[idx];
          scroll_top = 0; // -element.scrollTop
          scroll_left = 0; // -element.scrollLeft
          // scroll_top                = µ.DOM.get_document_scroll_top()
          // scroll_left               = µ.DOM.get_document_scroll_left()
          marker_top = rectangle.top - ref_rectangle.top + ref_element.scrollTop;
          if (idx === 0) {
            debug('^123-6^', marker_top, rectangle.top, ref_rectangle.top, ref_element.scrollTop);
          }
          marker_left = rectangle.left - ref_rectangle.left;
          marker_width = rectangle.width;
          marker_height = rectangle.height;
          marker_bottom = marker_top + marker_height;
        }
      }
      return null;
    }

  };

  //===========================================================================================================
  globalThis.draw_line_boxes = function*(nodes = null) {
    var i, len, linefinder, node, ref, ref_top, slug;
    if (nodes == null) {
      nodes = document.querySelectorAll('galley > div');
    }
    // slugs         = []
    linefinder = new µ.LINEFINDER.Linefinder();
    for (i = 0, len = nodes.length; i < len; i++) {
      node = nodes[i];
      ref = linefinder.walk_slugs_of_node(node);
      // log '^123-8^', ( d for d from linefinder.walk_line_rectangles_of_node node )
      for (slug of ref) {
        // slugs.push slug
        linefinder.draw_box(slug.rectangle);
        yield slug;
      }
    }
    ref_top = document.documentElement.scrollTop;
    return null;
  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var galley_document, galley_iframe, galley_window, i, iframe, len, ref, ref1, slug;
    log('^123-9^', "ready");
    //.........................................................................................................
    if (µ.DOM.page_is_inside_iframe()) {
      log('^123-10^', "leaving b/c document is loaded in iframe");
      return null;
    }
    //.........................................................................................................
    if ((galley_iframe = µ.DOM.select_first('iframe', null)) == null) {
      log('^123-11^', "leaving b/c document does not have galley");
      return null;
    }
    ref = µ.DOM.select_all('iframe');
    //.........................................................................................................
    /* Allow user-scrolling for demo */
    for (i = 0, len = ref.length; i < len; i++) {
      iframe = ref[i];
      µ.DOM.set(iframe, 'scrolling', 'true');
    }
    //.........................................................................................................
    galley_document = galley_iframe.contentDocument;
    galley_window = galley_iframe.contentWindow;
    //.........................................................................................................
    /* Demo */
    galley_window.scrollTo({
      top: 500
    });
    //.........................................................................................................
    log('^123-12^', galley_document.querySelector('galley'));
    ref1 = galley_window.draw_line_boxes();
    /* Demo */
    for (slug of ref1) {
      log('^123-13^', slug);
    }
    return null;
  });

  /*
  button  = µ.DOM.select_first '#redraw'
  µ.DOM.on button, 'click', ->
    debug '^123-14^', "redraw"
    draw_client_rectangles()
  return null
*/

}).call(this);

//# sourceMappingURL=ops2.js.map