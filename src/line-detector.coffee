
#-----------------------------------------------------------------------------------------------------------
# source_elements = ( document.querySelector '.sample' ).childNodes
{ log
  warn
  debug }       = console

#-----------------------------------------------------------------------------------------------------------
remove_boxes = ->
  element.remove() for element in document.querySelectorAll '.box'
  return null

#-----------------------------------------------------------------------------------------------------------
draw_boxes = ( rectangles ) ->
  draw_box rectangle for rectangle in rectangles
  return null

#-----------------------------------------------------------------------------------------------------------
draw_box = ( rectangle ) ->
  box               = document.createElement 'div'
  box.style.top     = document.documentElement.scrollTop  + rectangle.y       + 'px'
  box.style.left    = document.documentElement.scrollLeft + rectangle.x       + 'px'
  box.style.width   =                                       rectangle.width - 1   + 'px' # collapse borders
  box.style.height  =                                       rectangle.height  + 'px'
  box.classList.add 'box'
  document.body.appendChild box
  return null

# #-----------------------------------------------------------------------------------------------------------
# collapse_ws = ( value ) -> value.trim().replace /\s+/g, ' '

# #-----------------------------------------------------------------------------------------------------------
# extract_lines_from_text_node = ( text_node ) ->
#   unless text_node.nodeType is 3
#     throw new Error "Lines can only be extracted from text nodes."
#   #.........................................................................................................
#   # A Range represents a fragment of the document which contains nodes and
#   # parts of text nodes. One thing that's really cool about a Range is that we
#   # can access the bounding boxes that contain the contents of the Range. By
#   # incrementally adding characters - from our text node - into the range, and
#   # then looking at the Range's client rectangles, we can determine which
#   # characters belong in which rendered line.
#   textContent     = text_node.textContent
#   range           = document.createRange()
#   lines           = []
#   line_chrs       = []
#   #.........................................................................................................
#   # Iterate over every character in the text node.
#   for chr_idx in [ 0 ... textContent.length ]
#     # Set the range to span from the beginning of the text node up to and
#     # including the current character (offset).
#     range.setStart  text_node, 0
#     range.setEnd    text_node, chr_idx + 1
#     # At this point, the Range's client rectangles will include a rectangle
#     # for each visually-rendered line of text. Which means, the last
#     # character in our Range (the current character in our for-loop) will be
#     # the last character in the last line of text (in our Range). As such, we
#     # can use the current rectangle count to determine the line of text.
#     line_idx = range.getClientRects().length - 1
#     # If this is the first character in this line, create a new buffer for this line.
#     unless lines[ line_idx ]?
#       line_chrs = []
#       lines.push line_chrs
#     # Add this character to the currently pending line of text.
#     line_chrs.push textContent.charAt chr_idx
#   lines = ( chrs.join '' for chrs in lines )
#   draw_boxes range.getClientRects()
#   return lines

# #-----------------------------------------------------------------------------------------------------------
# button.addEventListener 'click', ( event ) ->
#   console.group "Rendered Lines of Text"
#   for source_element in source_elements
#     console.group "Element"
#     console.log source_element
#     for line, idx in extract_lines_from_text_node source_element
#       console.log idx + 1, line
#   console.groupEnd()
#   return null

# justify_my_text = ->
#   console.group "Unjustifiable"
#   # hyph      = new Hypher 'en-us'
#   hyphenate = ( word ) ->
#     log '^2342^', word
#     # hyph.hyphenate word
#     return Array.from word
#   cfg       =
#     hyphenator:     hyphenate
#     hyphenPenalty:  10
#   justify   = unjustifiable cfg
#   for source_element in document.querySelectorAll 'galley > p'
#     log source_element
#     try justify source_element catch error
#       warn error.message
#     # for line, idx in extract_lines_from_text_node source_element
#     #   console.log idx + 1, line
#   console.groupEnd()
#   return null

#===========================================================================================================
µ.DOM.ready ->
  log '^123-7^', "ready"
  # ( µ.DOM.select_first 'button' ).addEventListener 'click', justify_my_text
  # justify_my_text()
  nc = []
  p = ( µ.DOM.select_all 'p' )[ 1 ].childNodes[ 0 ]
  c1 = new Cursor( p, 0, p.data )
  # Cursor {node: text, index: 0, text: 'An unimaginably excruciatingly detailed unimaginab…unimaginably excruciatingly\n  detailed expression'}
  c2 = new Cursor( p, 0, p.data )
  # Cursor {node: text, index: 20, text: 'An unimaginably excruciatingly detailed unimaginab…unimaginably excruciatingly\n  detailed expression'}
  TraverseUtil.setSelection( c1, c2 )
  # Selection {anchorNode: text, anchorOffset: 0, focusNode: text, focusOffset: 20, isCollapsed: false, …}
  count = 0
  console.time()
  loop
    count++
    TraverseUtil.getNextChar c1, c2, nc, false
    selection   = TraverseUtil.setSelection c1, c2
    range       = selection.getRangeAt 0
    rectangles  = range.getClientRects()
    # debug '^2432^', range.getBoundingClientRect()
    # draw_box range.getBoundingClientRect()
    draw_boxes rectangles
    break if count > 1000
  console.timeEnd()
  # log nc
  return null





