(function() {
  //-----------------------------------------------------------------------------------------------------------
  var _remove_boxes, button, collapse_ws, draw_boxes, extract_lines_from_text_node, source_elements;

  source_elements = (document.querySelector('.sample')).childNodes;

  button = document.querySelector('.button');

  //-----------------------------------------------------------------------------------------------------------
  _remove_boxes = function() {
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
    var box, i, len, rectangle;
    _remove_boxes();
    for (i = 0, len = rectangles.length; i < len; i++) {
      rectangle = rectangles[i];
      box = document.createElement("div");
      box.classList.add("box");
      box.style.top = rectangle.y + "px";
      box.style.left = rectangle.x + "px";
      box.style.width = rectangle.width + "px";
      box.style.height = rectangle.height + "px";
      document.body.appendChild(box);
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  button.addEventListener('click', function(event) {
    var i, idx, j, len, len1, line, ref, source_element;
    console.group("Rendered Lines of Text");
    for (i = 0, len = source_elements.length; i < len; i++) {
      source_element = source_elements[i];
      console.group("Element");
      console.log(source_element);
      ref = extract_lines_from_text_node(source_element);
      for (idx = j = 0, len1 = ref.length; j < len1; idx = ++j) {
        line = ref[idx];
        console.log(idx + 1, line);
      }
    }
    console.groupEnd();
    return null;
  });

  //-----------------------------------------------------------------------------------------------------------
  collapse_ws = function(value) {
    return value.trim().replace(/\s+/g, ' ');
  };

  //-----------------------------------------------------------------------------------------------------------
  extract_lines_from_text_node = function(text_node) {
    var chr_idx, chrs, i, line_chrs, line_idx, lines, range, ref, textContent;
    if (text_node.nodeType !== 3) {
      throw new Error("Lines can only be extracted from text nodes.");
    }
    //.........................................................................................................
    // A Range represents a fragment of the document which contains nodes and
    // parts of text nodes. One thing that's really cool about a Range is that we
    // can access the bounding boxes that contain the contents of the Range. By
    // incrementally adding characters - from our text node - into the range, and
    // then looking at the Range's client rectangles, we can determine which
    // characters belong in which rendered line.
    textContent = text_node.textContent;
    range = document.createRange();
    lines = [];
    line_chrs = [];
//.........................................................................................................
// Iterate over every character in the text node.
    for (chr_idx = i = 0, ref = textContent.length; (0 <= ref ? i < ref : i > ref); chr_idx = 0 <= ref ? ++i : --i) {
      // Set the range to span from the beginning of the text node up to and
      // including the current character (offset).
      range.setStart(text_node, 0);
      range.setEnd(text_node, chr_idx + 1);
      // At this point, the Range's client rectangles will include a rectangle
      // for each visually-rendered line of text. Which means, the last
      // character in our Range (the current character in our for-loop) will be
      // the last character in the last line of text (in our Range). As such, we
      // can use the current rectangle count to determine the line of text.
      line_idx = range.getClientRects().length - 1;
      // If this is the first character in this line, create a new buffer for this line.
      if (lines[line_idx] == null) {
        line_chrs = [];
        lines.push(line_chrs);
      }
      // Add this character to the currently pending line of text.
      line_chrs.push(textContent.charAt(chr_idx));
    }
    lines = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = lines.length; j < len; j++) {
        chrs = lines[j];
        results.push(chrs.join(''));
      }
      return results;
    })();
    draw_boxes(range.getClientRects());
    return lines;
  };

}).call(this);

//# sourceMappingURL=line-detector.js.map