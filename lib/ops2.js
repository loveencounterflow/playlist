(function() {
  'use strict';
  var Column, Iframe_walker, Node_walker, Slug_walker, TMP_to_be_named, Walker;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

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
      this._ø_iframe.window.scrollTo({
        top: this.top
      });
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    set_height_from_slug(ø_slug) {
      this.height = ø_slug.value.rectangle.bottom - this.top;
      return this.height;
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
  Iframe_walker = class Iframe_walker extends Walker {
    //---------------------------------------------------------------------------------------------------------
    constructor(iterator, stop = null) {
      super(iterator, stop);
      this.height = null;
      // @galley_document        = null
      this.window = null;
      this.draw_box = null;
      this.draw_line_cover = null;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    step() {
      /* TAINT may want to return `linefinder` itself */
      var local_linefinder;
      super.step();
      if (this.done) {
        return this._stop;
      }
      this.height = µ.DOM.get_height(this.value);
      // @galley_document        = @value.contentDocument
      this.window = this.value.contentWindow;
      local_linefinder = new this.value.contentWindow.µ.LINEFINDER.Linefinder();
      this.draw_box = local_linefinder.draw_box.bind(local_linefinder);
      this.draw_line_cover = local_linefinder.xxx_draw_line_cover.bind(local_linefinder);
      return this.value;
    }

  };

  //===========================================================================================================
  TMP_to_be_named = class TMP_to_be_named {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    distribute_lines() {
      var _iframes, _nodes, column, linefinder, ø_iframe, ø_node, ø_slug;
      //.......................................................................................................
      if (µ.DOM.page_is_inside_iframe()) {
        log('^123-9^', "leaving b/c document is loaded in iframe");
        return null;
      }
      //.......................................................................................................
      _iframes = µ.DOM.select_all('iframe');
      if (!(_iframes.length > 0)) {
        log('^123-10^', "leaving b/c document does not have iframes");
        return null;
      }
      //.......................................................................................................
      /* Allow user-scrolling for demo */
      // µ.DOM.set ø_iframe.value, 'scrolling', 'true' for ø_iframe.value in µ.DOM.select_all 'ø_iframe.value'
      //.......................................................................................................
      ø_iframe = new Iframe_walker(_iframes.values());
      ø_iframe.step();
      _nodes = ø_iframe.window.µ.DOM.select_all('galley > p');
      ø_node = new Node_walker(_nodes.values());
      linefinder = new ø_iframe.window.µ.LINEFINDER.Linefinder();
      column = null;
      while (true) {
        if (ø_iframe.done) {
          //.......................................................................................................
          break;
        }
        //.....................................................................................................
        if (ø_node.step() == null) {
          log('^123-1^', "nodes done");
          break; // might want to mark galleys without content at this point
        }
        //.....................................................................................................
        ø_slug = new Slug_walker(linefinder.walk_slugs_of_node(ø_node.value));
        while (true) {
          if (ø_slug.step() == null) {
            log('^123-1^', "slugs done");
            break;
          }
          //...................................................................................................
          if ((column != null ? column.first_slug : void 0) == null) {
            column = new Column(ø_iframe, ø_slug);
            column.scroll_to_first_line();
          }
          //...................................................................................................
          column.set_height_from_slug(ø_slug);
          if (ø_iframe.height > column.height) {
            ø_iframe.draw_box(ø_slug.value.rectangle);
            continue;
          }
          //...................................................................................................
          ø_iframe.draw_line_cover(ø_slug.value.rectangle);
          column = null;
          if (ø_iframe.step() == null) {
            log('^123-1^', "iframes done");
            break;
          }
          ø_iframe.draw_box(ø_slug.value.rectangle);
          column = new Column(ø_iframe, ø_slug);
          column.scroll_to_first_line();
        }
      }
      //.......................................................................................................
      return null;
    }

  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var tmp_to_be_named;
    log('^123-8^', "ready");
    tmp_to_be_named = new TMP_to_be_named();
    tmp_to_be_named.distribute_lines();
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