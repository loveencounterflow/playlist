(function() {
  'use strict';
  var next_iframe, next_node, next_slug, reset_state;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

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
  //===========================================================================================================
  next_slug = function(walker) {
    var d;
    d = walker.next();
    return {
      slug: d.value,
      slugs_done: d.done
    };
  };

  next_node = function(walker) {
    var d;
    d = walker.next();
    return {
      node: d.value,
      nodes_done: d.done
    };
  };

  next_iframe = function(walker) {
    var iframe, iframes_done, local_linefinder;
    ({
      value: iframe,
      done: iframes_done
    } = walker.next());
    if (iframes_done) {
      return {iframes_done};
    }
    local_linefinder = new iframe.contentWindow.µ.LINEFINDER.Linefinder();
    return {
      iframe: iframe,
      iframe_height: µ.DOM.get_height(iframe),
      galley_document: iframe.contentDocument,
      galley_window: iframe.contentWindow,
      iframes_done: iframes_done,
      /* TAINT may want to return `linefinder` itself */
      galley_draw_box: local_linefinder.draw_box.bind(local_linefinder)
    };
  };

  //===========================================================================================================
  reset_state = function(state) {
    state.first_slug = null;
    state.top = null;
    state.height = null;
    return state;
  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var galley_document, galley_draw_box, galley_window, iframe, iframe_height, iframe_walker, iframes, iframes_done, linefinder, node, node_walker, nodes_done, slug, slug_walker, slugs_done, state, xxx_count;
    log('^123-8^', "ready");
    //.........................................................................................................
    if (µ.DOM.page_is_inside_iframe()) {
      log('^123-9^', "leaving b/c document is loaded in iframe");
      return null;
    }
    //.........................................................................................................
    iframes = µ.DOM.select_all('iframe');
    if (!(iframes.length > 0)) {
      log('^123-10^', "leaving b/c document does not have iframes");
      return null;
    }
    //.........................................................................................................
    /* Allow user-scrolling for demo */
    // µ.DOM.set iframe, 'scrolling', 'true' for iframe in µ.DOM.select_all 'iframe'
    //.........................................................................................................
    iframe_walker = iframes.values();
    ({iframe, iframes_done, iframe_height, galley_document, galley_window, galley_draw_box} = next_iframe(iframe_walker));
    //.........................................................................................................
    node_walker = (galley_document.querySelectorAll('galley > p')).values();
    linefinder = new galley_window.µ.LINEFINDER.Linefinder();
    //.........................................................................................................
    xxx_count = 0;
    state = {};
    /* TAINT prefer to use `new State()`? */
    reset_state(state);
    while (true) {
      if (xxx_count++ > 500/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */) {
        //.........................................................................................................
        break;
      }
      ({node, nodes_done} = next_node(node_walker));
      log('^123-1^', node, nodes_done);
      //.......................................................................................................
      if (nodes_done) {
        // might want to mark galleys without content at this point
        log('^123-1^', "nodes done");
        break;
      }
      //.......................................................................................................
      slug_walker = linefinder.walk_slugs_of_node(node);
      while (true) {
        if (xxx_count++ > 500/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */) {
          break;
        }
        ({slug, slugs_done} = next_slug(slug_walker));
        if (slugs_done) {
          log('^123-1^', "slugs done");
          break;
        }
        //.......................................................................................................
        if (state.first_slug == null) {
          /* TAINT code duplication; use method */
          state.first_slug = slug;
          state.top = state.first_slug.rectangle.top;
          state.height = 0;
          galley_window.scrollTo({
            top: state.top
          });
        }
        //.......................................................................................................
        state.height = slug.rectangle.bottom - state.top;
        if (iframe_height > state.height) {
          galley_draw_box(slug.rectangle);
          continue;
        }
        //.......................................................................................................
        ({iframe, iframes_done, iframe_height, galley_document, galley_window, galley_draw_box} = next_iframe(iframe_walker));
        reset_state(state);
        galley_draw_box(slug.rectangle);
        if (iframes_done) {
          log('^123-1^', "iframes done");
          break;
        }
        /* TAINT code duplication; use method */
        state.first_slug = slug;
        state.top = state.first_slug.rectangle.top;
        state.height = 0;
        galley_window.scrollTo({
          top: state.top
        });
      }
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