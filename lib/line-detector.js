(function() {
  //-----------------------------------------------------------------------------------------------------------
  // source_elements = ( document.querySelector '.sample' ).childNodes
  var debug, draw_box, draw_boxes, log, remove_boxes, select_next_chr, warn;

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
    var boxes, range, rectangles, selection;
    TraverseUtil.getNextChar(c1, c2, nodes_crossed, false);
    selection = TraverseUtil.setSelection(c1, c2);
    range = selection.getRangeAt(0);
    rectangles = range.getClientRects();
    if (!node.contains(range.startContainer.parentNode)) {
      return false;
    }
    if (!node.contains(range.endContainer.parentNode)) {
      return false;
    }
    boxes = draw_boxes(rectangles);
    return true;
  };

  //===========================================================================================================
  µ.DOM.ready(function() {
    var c1, c2, f, nodes, nodes_crossed, p;
    log('^123-7^', "ready");
    nodes_crossed = [];
    nodes = µ.DOM.select_all('#p4');
    p = nodes[0].childNodes[0];
    c1 = new Cursor(p, 0, p.data);
    c2 = new Cursor(p, 0, p.data);
    TraverseUtil.setSelection(c1, c2);
    //.........................................................................................................
    f = function() {
      var crossed_node;
      if (!select_next_chr(c1, c2, nodes_crossed, nodes[0])) {
        return null;
      }
      log(nodes_crossed);
      log((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = nodes_crossed.length; i < len; i++) {
          crossed_node = nodes_crossed[i];
          results.push(nodes[0].contains(crossed_node));
        }
        return results;
      })());
      return setTimeout(f, 0);
    };
    while (true) {
      if (!select_next_chr(c1, c2, nodes_crossed, nodes[0])) {
        // f()
        break;
      }
    }
    return null;
  });

}).call(this);

//# sourceMappingURL=line-detector.js.map