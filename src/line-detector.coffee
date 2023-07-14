
#-----------------------------------------------------------------------------------------------------------
source_elements = ( document.querySelector '.sample' ).childNodes
button          = document.querySelector '.button'

#-----------------------------------------------------------------------------------------------------------
_remove_boxes = ->
  for element in document.querySelectorAll '.box'
    element.remove()
  return null

#-----------------------------------------------------------------------------------------------------------
draw_boxes = ( rectangles ) ->
  _remove_boxes()
  for rectangle in rectangles
    box = document.createElement "div"
    box.classList.add( "box" )
    box.style.top     = rectangle.y + "px"
    box.style.left    = rectangle.x + "px"
    box.style.width   = rectangle.width + "px"
    box.style.height  = rectangle.height + "px"
    document.body.appendChild box
  return null

#-----------------------------------------------------------------------------------------------------------
button.addEventListener 'click', ( event ) ->
  console.group "Rendered Lines of Text"
  for source_element in source_elements
    console.group "Element"
    console.log source_element
    for line, idx in extract_lines_from_text_node source_element
      console.log idx + 1, line
  console.groupEnd()
  return null

#-----------------------------------------------------------------------------------------------------------
collapse_ws = ( value ) -> value.trim().replace /\s+/g, ' '

#-----------------------------------------------------------------------------------------------------------
extract_lines_from_text_node = ( text_node ) ->
  unless text_node.nodeType is 3
    throw new Error "Lines can only be extracted from text nodes."
  #.........................................................................................................
  # A Range represents a fragment of the document which contains nodes and
  # parts of text nodes. One thing that's really cool about a Range is that we
  # can access the bounding boxes that contain the contents of the Range. By
  # incrementally adding characters - from our text node - into the range, and
  # then looking at the Range's client rectangles, we can determine which
  # characters belong in which rendered line.
  textContent     = text_node.textContent
  range           = document.createRange()
  lines           = []
  line_chrs       = []
  #.........................................................................................................
  # Iterate over every character in the text node.
  for chr_idx in [ 0 ... textContent.length ]
    # Set the range to span from the beginning of the text node up to and
    # including the current character (offset).
    range.setStart  text_node, 0
    range.setEnd    text_node, chr_idx + 1
    # At this point, the Range's client rectangles will include a rectangle
    # for each visually-rendered line of text. Which means, the last
    # character in our Range (the current character in our for-loop) will be
    # the last character in the last line of text (in our Range). As such, we
    # can use the current rectangle count to determine the line of text.
    line_idx = range.getClientRects().length - 1
    # If this is the first character in this line, create a new buffer for this line.
    unless lines[ line_idx ]?
      line_chrs = []
      lines.push line_chrs
    # Add this character to the currently pending line of text.
    line_chrs.push textContent.charAt chr_idx
  lines = ( chrs.join '' for chrs in lines )
  draw_boxes range.getClientRects()
  return lines







