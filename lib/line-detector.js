(function() {
  //-----------------------------------------------------------------------------------------------------------
  // source_elements = ( document.querySelector '.sample' ).childNodes
  var after, debug, log, remove_boxes, warn;

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
  µ.DOM.ready(function() {
    var dt, i, idx, len, linefinder, node, nodes, rectangle, rectangles, ref, ref_top, scroll;
    log('^123-7^', "ready");
    // log '^123-7^', Object.keys µ
    // log '^123-7^', µ.Linefinder
    nodes = µ.DOM.select_all('p');
    rectangles = [];
    linefinder = new µ.LINEFINDER.Linefinder();
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