(function() {
  'use strict';
  var draw_client_rectangles, wrap_inner;

  globalThis.log = console.log;

  
// // wrap an element with another; super basic but makes it consistent across our apps
// function wrap(el, wrapper) {
//   // ### TAINT issue error message
//   // if (el && el.parentNode) {
//     el.parentNode.insertBefore(wrapper, el);
//     wrapper.appendChild(el);
//   // }
// }

// // Wrap an HTMLElement around each element in an HTMLElement array.
// const wrap = function( element, wrapper ) {
//     // Convert `elms` to an array, if necessary.
//     // Loops backwards to prevent having to clone the wrapper on the
//     // first element (see `child` below).
//         var child = ( false ) ? wrapper.cloneNode(true) : wrapper;

//         // Cache the current parent and sibling.
//         var parent  = element.parentNode;
//         var sibling = element.nextSibling;

//         // Wrap the element (is automatically removed from its current
//         // parent).
//         child.appendChild(element);

//         // If the element had a sibling, insert the wrapper before
//         // the sibling to maintain the HTML structure; otherwise, just
//         // append it to the parent.
//         if (sibling) {
//             parent.insertBefore(child, sibling);
//         } else {
//             parent.appendChild(child);
//         }
//     };


;

  
function addClientRectsOverlay( element ) {
  /* Absolutely position a div over each client rect so that its border width
     is the same as the rectangle's width.
     Note: the overlays will be out of place if the user resizes or zooms. */
  const rectangles = element.getClientRects();
  for (const rectangle of rectangles) {
    const  marker = document.createElement('div');
    µ.DOM.add_class( marker, 'µ-clientrec' );
    marker.style.position           = 'absolute';
    // marker.style.outline            = '1px solid red';
    // marker.style.backgroundColor    = 'rgba(255,255,0,0.5)';
    // marker.style.mixBlendMode       = 'multiply';
    const scroll_top                = µ.DOM2.get_document_scroll_top();
    const scroll_left               = µ.DOM2.get_document_scroll_left();
    marker.style.margin             = '0';
    marker.style.padding            = '0';
    marker.style.top                = `${ rectangle.top  + scroll_top   }px`;
    marker.style.left               = `${ rectangle.left + scroll_left  }px`;
    marker.style.width              = `${ rectangle.width               }px`;
    marker.style.height             = `${ rectangle.height              }px`;
    document.body.appendChild( marker);
  }
}

//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------

// https://stackoverflow.com/a/63984037/7568091

// createRange from DOM element, then getBoundingClientRect for coarse, getClientRects for
// refined estimates of position
/*
const el = document.querySelector("#my-element");
const range = document.createRange();
range.setStart(el, 0);
range.setEnd(el, 200);

// A single rect for the entire range
const rect = range.getBoundingClientRect();

// An array of rectangles for each line of the range
const rectangles = range.getClientRects();
*/

//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------



;

  wrap_inner = function(element, wrapper) {
    element.appendChild(wrapper);
    while (element.firstChild !== wrapper) {
      wrapper.appendChild(element.firstChild);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  draw_client_rectangles = () => {
    var element, elements, i, len;
    elements = µ.DOM.select_all('.tracker > div > span');
    for (i = 0, len = elements.length; i < len; i++) {
      element = elements[i];
      // wrapper = µ.DOM.parse_one '<span></span>'
      // wrap element, wrapper
      // log '^123-1^', wrapper
      addClientRectsOverlay(element);
    }
    return null;
  };

  (function() {
    var element, i, len, ref, results, wrapper;
    ref = µ.DOM.select_all('.tracker > div');
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      element = ref[i];
      wrapper = µ.DOM.parse_one('<span></span>');
      wrapper.innerHTML = element.innerHTML;
      results.push(element.innerHTML = wrapper.outerHTML);
    }
    return results;
  });

  (function() {
    var element, i, len, ref, wrapper;
    ref = µ.DOM.select_all('.tracker > div');
    for (i = 0, len = ref.length; i < len; i++) {
      element = ref[i];
      wrapper = µ.DOM.parse_one('<span></span>');
      wrap_inner(element, wrapper);
    }
    return null;
  })();

  // $( ".tracker > div" ).wrapInner( '<span></span>' )
  µ.DOM.ready(draw_client_rectangles);

  log('^123-2^', "ops2 OK");

  (function() {
    var cr, div, i, j, len, len1, offset_top, p_cr, p_y1, p_y2, ref, ref1, scroll_top, span, y1, y2;
    window.pageYOffset;
    scroll_top = document.body.scrollTop;
    ref = µ.DOM.select_all('.tracker > div');
    for (i = 0, len = ref.length; i < len; i++) {
      div = ref[i];
      // offset_top = µ.DOM.get_offset_top div
      offset_top = div.offsetTop;
      log('^123-3^', {scroll_top, offset_top});
      p_cr = div.getClientRects()[0];
      p_y1 = p_cr.y;
      p_y2 = p_y1 + p_cr.height;
      span = µ.DOM.select_first_from(div, 'span');
      log('^123-4^', {
        y: p_cr.y,
        p_y1,
        p_y2
      });
      log('^123-5^', span);
      ref1 = span.getClientRects();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        cr = ref1[j];
        y1 = cr.y;
        y2 = y1 + cr.height;
        log('^123-6^', {y1, y2});
      }
      break;
    }
    return null;
  })();

  µ.DOM.ready(function() {
    var handler;
    log('^345-1^', "set up scroll events");
    µ.DOM.on(document, 'scroll', function() {
      log('^345-1^', 'scroll', µ.DOM.get_document_scroll_top());
      return null;
    });
    handler = function() {
      return log('^345-2^', 'scroll tracker');
    };
    return (µ.DOM.select_first('.tracker')).addEventListener('scroll', handler, true);
  });

}).call(this);

//# sourceMappingURL=ops2.js.map