
'use strict'


globalThis.log = console.log
globalThis.µ = require 'mudom'

```
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


```

```
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
    const scroll_top                = document.body.scrollTop;
    const scroll_left               = document.body.scrollLeft;
    marker.style.margin             = '0';
    marker.style.padding            = '0';
    marker.style.top                = `${rectangle.top  + scroll_top}px`;
    marker.style.left               = `${rectangle.left + scroll_left}px`;
    // We want rectangle.width to be the border width, so content width is 2px less.
    marker.style.width              = `${rectangle.width}px`;
    marker.style.height             = `${rectangle.height}px`;
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



```

#-----------------------------------------------------------------------------------------------------------
draw_client_rectangles = =>
  elements = µ.DOM.select_all '.tracker > div > span'
  for element in elements
    # wrapper = µ.DOM.parse_one '<span></span>'
    # wrap element, wrapper
    # log '^123-3^', wrapper
    addClientRectsOverlay element
  return null

for element in µ.DOM.select_all '.tracker > div'
  wrapper           = µ.DOM.parse_one '<span></span>'
  wrapper.innerHTML = element.innerHTML
  element.innerHTML = wrapper.outerHTML

# $( ".tracker > div" ).wrap( "<span></span>" )
µ.DOM.ready draw_client_rectangles
log '^123-4^', "ops2 OK"



