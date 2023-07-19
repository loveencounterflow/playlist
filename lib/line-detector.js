(function() {
  //-----------------------------------------------------------------------------------------------------------
  // source_elements = ( document.querySelector '.sample' ).childNodes
  var _get_next_chr_rectangles, debug, draw_box, draw_boxes, log, remove_boxes, walk_chr_rectangles_of_node, warn;

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
    box.style.top = document.documentElement.scrollTop + rectangle.y + 'px';
    box.style.left = document.documentElement.scrollLeft + rectangle.x + 'px';
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

  //===========================================================================================================
  µ.DOM.ready(function() {
    var bottom_avg, bottom_prv, box, count, height_avg, node, nodes, rectangle, ref;
    log('^123-7^', "ready");
    nodes = µ.DOM.select_all('#p5');
    node = nodes[0];
    height_avg = 0;
    bottom_avg = 0;
    bottom_prv = null;
    count = 0;
    ref = walk_chr_rectangles_of_node(node);
    for (rectangle of ref) {
      count++;
      box = draw_box(rectangle);
      height_avg = (height_avg * (count - 1) / count) + (rectangle.height * 1 / count);
      bottom_avg = (bottom_avg * (count - 1) / count) + (rectangle.bottom * 1 / count);
      // if bottom_prv?
      bottom_prv = rectangle.bottom;
    }
    // debug '^3224^', rectangle
    return null;
  });

}).call(this);

//# sourceMappingURL=line-detector.js.map