(function() {
  //-----------------------------------------------------------------------------------------------------------
  // source_elements = ( document.querySelector '.sample' ).childNodes
  var _get_next_chr_rectangles, _reset_line_walker, debug, draw_box, draw_boxes, log, remove_boxes, walk_chr_rectangles_of_node, walk_line_rectangles_of_node, warn;

  ({log, warn, debug} = console);

  // after           = ( dts, f  ) => new Promise ( resolve ) => setTimeout  ( -> resolve f() ), dts * 1000
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

  //-----------------------------------------------------------------------------------------------------------
  draw_boxes = function(rectangles) {
    var rectangle;
    return (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = rectangles.length; i < len; i++) {
        rectangle = rectangles[i];
        results.push(draw_box(rectangle));
      }
      return results;
    })();
  };

  //-----------------------------------------------------------------------------------------------------------
  draw_box = function(rectangle) {
    var box;
    box = document.createElement('div');
    box.style.top = document.documentElement.scrollTop + rectangle.top + 'px';
    box.style.left = document.documentElement.scrollLeft + rectangle.left + 'px';
    box.style.width = rectangle.width - 1 + 'px'; // collapse borders
    box.style.height = rectangle.height + 'px';
    box.classList.add('box');
    document.body.appendChild(box);
    return box;
  };

  //-----------------------------------------------------------------------------------------------------------
  _get_next_chr_rectangles = function(node, c1, c2) {
    var range, rectangles, selection;
    TraverseUtil.getNextChar(c1, c2, [], false);
    selection = TraverseUtil.setSelection(c1, c2);
    range = selection.getRangeAt(0);
    if (!node.contains(range.startContainer.parentNode)) {
      return null;
    }
    if (!node.contains(range.endContainer.parentNode)) {
      return null;
    }
    rectangles = range.getClientRects();
    return rectangles;
  };

  //-----------------------------------------------------------------------------------------------------------
  walk_chr_rectangles_of_node = function*(node) {
    var c1, c2, rectangles, text_node;
    text_node = node.childNodes[0];
    c1 = new Cursor(text_node, 0, text_node.data);
    c2 = new Cursor(text_node, 0, text_node.data);
    TraverseUtil.setSelection(c1, c2);
    while (true) {
      rectangles = _get_next_chr_rectangles(node, c1, c2);
      if (rectangles == null) {
        break;
      }
      yield* rectangles;
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  _reset_line_walker = function(s) {
    s.min_top = +2e308;
    s.max_bottom = -2e308;
    s.min_left = +2e308;
    s.max_right = -2e308;
    s.avg_height = 0;
    s.avg_bottom = 0;
    s.prv_bottom = null;
    s.count = 0;
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  walk_line_rectangles_of_node = function*(node) {
    var rectangle, ref, s, xxx_height_factor;
    _reset_line_walker(s = {});
    xxx_height_factor = 1 / 2/* relative minimum height to recognize line step */
    ref = walk_chr_rectangles_of_node(node);
    for (rectangle of ref) {
      if (s.count > 0 && rectangle.bottom - s.avg_bottom > s.avg_height * xxx_height_factor) { // new Rectangle
        yield ({
          left: s.min_left,
          top: s.min_top,
          width: s.max_right - s.min_left,
          height: s.max_bottom - s.min_top
        });
        _reset_line_walker(s);
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
      s.prv_bottom = rectangle.bottom;
    }
    //.........................................................................................................
    if (s.count > 0) { // new Rectangle
      yield ({
        left: s.min_left,
        top: s.min_top,
        width: s.max_right - s.min_left,
        height: s.max_bottom - s.min_top
      });
    }
    return null;
  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var i, len, node, nodes, rectangle, ref;
    log('^123-7^', "ready");
    nodes = µ.DOM.select_all('p');
    for (i = 0, len = nodes.length; i < len; i++) {
      node = nodes[i];
      ref = walk_line_rectangles_of_node(node);
      for (rectangle of ref) {
        draw_box(rectangle);
      }
    }
    return null;
  });

}).call(this);

//# sourceMappingURL=line-detector.js.map