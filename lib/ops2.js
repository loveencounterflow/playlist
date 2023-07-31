(function() {
  'use strict';
  var Column, Node_walker, Slug_walker, Walker, next_iframe;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //===========================================================================================================
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
    //---------------------------------------------------------------------------------------------------------
    constructor(ø_iframe, ø_slug) {
      this._ø_iframe = ø_iframe;
      this.first_slug = ø_slug.value;
      this.top = ø_slug.value.rectangle.top;
      this.height = 0;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    scroll_to_first_line() {
      this._ø_iframe.galley_window.scrollTo({
        top: this.top
      });
      return null;
    }

  };

  //===========================================================================================================
  Walker = class Walker {
    //---------------------------------------------------------------------------------------------------------
    constructor(iterator, stop = null) {
      this._iterator = iterator;
      this._stop = stop;
      this.done = false;
      this.value = stop;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    step() {
      var done, value;
      ({value, done} = this._iterator.next());
      if (done) {
        this.done = true;
        this.value = this._stop;
        return this._stop;
      }
      this.value = value;
      return value;
    }

  };

  //===========================================================================================================
  Node_walker = class Node_walker extends Walker {};

  Slug_walker = class Slug_walker extends Walker {};

  //===========================================================================================================
  µ.DOM.ready(function() {
    var _nodes, column, iframe_walker, iframes, linefinder, ø_iframe, ø_node, ø_slug;
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
    _nodes = ø_iframe.galley_document.querySelectorAll('galley > p');
    ø_node = new Node_walker(_nodes.values());
    linefinder = new ø_iframe.galley_window.µ.LINEFINDER.Linefinder();
    column = null;
    while (true) {
      if (ø_iframe.done) {
        //.........................................................................................................
        break;
      }
      //.......................................................................................................
      if (ø_node.step() == null) {
        log('^123-1^', "nodes done");
        break; // might want to mark galleys without content at this point
      }
      //.......................................................................................................
      ø_slug = new Slug_walker(linefinder.walk_slugs_of_node(ø_node.value));
      while (true) {
        if (ø_slug.step() == null) {
          log('^123-1^', "slugs done");
          break;
        }
        //.......................................................................................................
        if ((column != null ? column.first_slug : void 0) == null) {
          column = new Column(ø_iframe, ø_slug);
          column.scroll_to_first_line();
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
        column = new Column(ø_iframe, ø_slug);
        column.scroll_to_first_line();
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