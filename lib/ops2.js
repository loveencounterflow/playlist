(function() {
  'use strict';
  var Column, next_iframe, next_node, next_slug;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //===========================================================================================================
  next_node = function(walker) {
    return walker.next();
  };

  next_slug = function(walker) {
    return walker.next();
  };

  next_iframe = function(walker) {
    /* TAINT may want to return `linefinder` itself */
    var d, local_linefinder;
    d = walker.next();
    if (d.done) {
      return d;
    }
    d.height = µ.DOM.get_height(d.value);
    d.galley_document = d.value.contentDocument;
    d.galley_window = d.value.contentWindow;
    local_linefinder = new d.value.contentWindow.µ.LINEFINDER.Linefinder();
    d.galley_draw_box = local_linefinder.draw_box.bind(local_linefinder);
    d.galley_draw_line_cover = local_linefinder.xxx_draw_line_cover.bind(local_linefinder);
    return d;
  };

  //===========================================================================================================
  Column = class Column {
    constructor(first_slug) {
      this.first_slug = first_slug;
      this.top = first_slug.rectangle.top;
      this.height = 0;
      return void 0;
    }

  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var column, iframe_walker, iframes, linefinder, node_walker, slug_walker, ø_iframe, ø_node, ø_slug;
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
    // µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
    //.........................................................................................................
    iframe_walker = iframes.values();
    ø_iframe = next_iframe(iframe_walker);
    node_walker = (ø_iframe.galley_document.querySelectorAll('galley > p')).values();
    linefinder = new ø_iframe.galley_window.µ.LINEFINDER.Linefinder();
    column = null;
    while (true) {
      if (ø_iframe.done) {
        //.........................................................................................................
        break;
      }
      ø_node = next_node(node_walker);
      //.......................................................................................................
      if (ø_node.done) { // might want to mark galleys without content at this point
        log('^123-1^', "nodes done");
        break;
      }
      //.......................................................................................................
      slug_walker = linefinder.walk_slugs_of_node(ø_node.value);
      while (true) {
        ø_slug = next_slug(slug_walker);
        if (ø_slug.done) {
          log('^123-1^', "slugs done");
          break;
        }
        //.......................................................................................................
        if ((column != null ? column.first_slug : void 0) == null) {
          column = new Column(ø_slug.value);
          ø_iframe.galley_window.scrollTo({
            top: column.top
          });
        }
        //.......................................................................................................
        column.height = ø_slug.value.rectangle.bottom - column.top;
        if (ø_iframe.height > column.height) {
          ø_iframe.galley_draw_box(ø_slug.value.rectangle);
          continue;
        }
        //.......................................................................................................
        ø_iframe.galley_draw_line_cover(ø_slug.value.rectangle);
        ø_iframe = next_iframe(iframe_walker);
        column = null;
        if (!ø_iframe.done) {
          ø_iframe.galley_draw_box(ø_slug.value.rectangle);
        } else {
          log('^123-1^', "iframes done");
          break;
        }
        column = new Column(ø_slug.value);
        ø_iframe.galley_window.scrollTo({
          top: column.top
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