(function() {
  //-----------------------------------------------------------------------------------------------------------
  // source_elements = ( document.querySelector '.sample' ).childNodes
  var debug, draw_box, draw_boxes, log, remove_boxes, select_next_chr, walk_chr_rectangles_of_node, warn;

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
  select_next_chr = function(c1, c2, nodes_crossed, node) {
    var range, rectangles, selection;
    TraverseUtil.getNextChar(c1, c2, nodes_crossed, false);
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
  walk_chr_rectangles_of_node = function(node) {
    return null;
  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var box, c1, c2, i, len, node, nodes, rectangle, rectangles;
    log('^123-7^', "ready");
    nodes = µ.DOM.select_all('#p5');
    node = nodes[0].childNodes[0];
    c1 = new Cursor(node, 0, node.data);
    c2 = new Cursor(node, 0, node.data);
    TraverseUtil.setSelection(c1, c2);
    while (true) {
      rectangles = select_next_chr(c1, c2, [], nodes[0]);
      if (rectangles == null) {
        break;
      }
      for (i = 0, len = rectangles.length; i < len; i++) {
        rectangle = rectangles[i];
        box = draw_box(rectangle);
      }
    }
    // for rectangle from walk_chr_rectangles_of_node node
    //   box = draw_box rectangle
    return null;
  });

}).call(this);

//# sourceMappingURL=line-detector.js.map