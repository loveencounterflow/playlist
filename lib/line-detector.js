(function() {
  //-----------------------------------------------------------------------------------------------------------
  // source_elements = ( document.querySelector '.sample' ).childNodes
  var Linefinder, after, debug, log, remove_boxes, warn;

  ({log, warn, debug} = console);

  after = (dts, f) => {
    return new Promise((resolve) => {
      return setTimeout((function() {
        return resolve(f());
      }), dts * 1000);
    });
  };

  // sleep           = ( dts     ) -> debug '^2-1^'; new Promise ( resolve ) => debug '^2-2^'; setTimeout  resolve,            dts * 1000
  // defer           = ( f = ->  ) => await sleep 0; return await f()

  //-----------------------------------------------------------------------------------------------------------
  remove_boxes = function() {
    var element, i, len, ref;
    ref = document.querySelectorAll('.box');
    for (i = 0, len = ref.length; i < len; i++) {
      element = ref[i];
      element.remove();
    }
    return null;
  };

  //===========================================================================================================
  Linefinder = class Linefinder {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    draw_box(rectangle) {
      var box;
      box = document.createElement('div');
      box.style.top = document.documentElement.scrollTop + rectangle.top + 'px';
      box.style.left = document.documentElement.scrollLeft + rectangle.left + 'px';
      box.style.width = rectangle.width - 1 + 'px'; // collapse borders
      box.style.height = rectangle.height + 'px';
      box.classList.add('box');
      document.body.appendChild(box);
      return box;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_next_chr_rectangles(node, c1, c2) {
      var range, selection;
      TraverseUtil.getNextChar(c1, c2, [], false);
      selection = TraverseUtil.setSelection(c1, c2);
      range = selection.getRangeAt(0);
      if (!node.contains(range.startContainer.parentNode)) {
        return null;
      }
      if (!node.contains(range.endContainer.parentNode)) {
        return null;
      }
      return range.getClientRects();
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_chr_rectangles_of_node(node) {
      var c1, c2, rectangles, text_node;
      text_node = node.childNodes[0];
      c1 = new Cursor(text_node, 0, text_node.data);
      c2 = new Cursor(text_node, 0, text_node.data);
      TraverseUtil.setSelection(c1, c2);
      while (true) {
        rectangles = this._get_next_chr_rectangles(node, c1, c2);
        if (rectangles == null) {
          break;
        }
        yield* rectangles;
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _reset_line_walker(s) {
      s.min_top = +2e308;
      s.max_bottom = -2e308;
      s.min_left = +2e308;
      s.max_right = -2e308;
      s.avg_height = 0;
      s.avg_bottom = 0;
      s.count = 0;
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_line_rectangles_of_node(node) {
      var rectangle, ref, s, xxx_height_factor;
      this._reset_line_walker(s = {});
      xxx_height_factor = 1 / 2/* relative minimum height to recognize line step */
      ref = this.walk_chr_rectangles_of_node(node);
      for (rectangle of ref) {
        if (s.count > 0 && rectangle.bottom - s.avg_bottom > s.avg_height * xxx_height_factor) {
          yield new DOMRect(s.min_left, s.min_top, s.max_right - s.min_left, s.max_bottom - s.min_top); // left // top // width // height
          this._reset_line_walker(s);
        }
        //.......................................................................................................
        // draw_box rectangle
        s.count++;
        s.min_top = Math.min(s.min_top, rectangle.top);
        s.max_bottom = Math.max(s.max_bottom, rectangle.bottom);
        s.min_left = Math.min(s.min_left, rectangle.left);
        s.max_right = Math.max(s.max_right, rectangle.right);
        s.avg_height = (s.avg_height * (s.count - 1) / s.count) + (rectangle.height * 1 / s.count);
        s.avg_bottom = (s.avg_bottom * (s.count - 1) / s.count) + (rectangle.bottom * 1 / s.count);
      }
      //.........................................................................................................
      if (s.count > 0) {
        yield new DOMRect(s.min_left, s.min_top, s.max_right - s.min_left, s.max_bottom - s.min_top); // left // top // width // height
      }
      return null;
    }

  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var dt, i, idx, len, linefinder, node, nodes, rectangle, rectangles, ref, ref_top, scroll;
    log('^123-7^', "ready");
    nodes = µ.DOM.select_all('p');
    rectangles = [];
    linefinder = new Linefinder();
    for (i = 0, len = nodes.length; i < len; i++) {
      node = nodes[i];
      ref = linefinder.walk_line_rectangles_of_node(node);
      for (rectangle of ref) {
        rectangles.push(rectangle);
        linefinder.draw_box(rectangle);
      }
    }
    ref_top = document.documentElement.scrollTop;
    dt = 0.5;
    idx = -1;
    scroll = async function() {
      var top;
      idx++;
      if ((rectangle = rectangles[idx]) == null) {
        return null;
      }
      top = ref_top + rectangle.top;
      // debug "scrolling to #{top.toFixed 0}px"
      await window.scrollTo({
        top,
        behavior: 'smooth'
      });
      return after(dt, scroll);
    };
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    after(1, scroll);
    return null;
  });

}).call(this);

//# sourceMappingURL=line-detector.js.map