<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Playlist](#playlist)
  - [80s](#80s)
  - [Arabian](#arabian)
  - [Line Extraction](#line-extraction)
  - [Notes](#notes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# Playlist



## 80s

* Katrina and the Waves: *I'm walking on sunshine*

## Arabian

* [Hamada Enani: *Mizmar vs Violin*](https://www.youtube.com/watch?v=7Q-RU-JZs7s)
* [Nanar Oknaian: *EROTIC & SEXUAL CLASSY LOUNGE MUSIC VOL.2 - MIXED BY NANAR
  (2020)*](https://www.youtube.com/watch?v=TD65i6OSeUU)
* [Buddha's Lounge: *Arabic Lounge Music خنیا Aicha*](https://www.youtube.com/watch?v=aubKbTYx804)

## Line Extraction

* https://sambleckley.com/writing/interaction-words.html
  * https://github.com/bramstein/hypher
  * https://github.com/diiq/unjustifiable


## Notes


entities:

* iframes / target boxes
  * linearly ordered so text flows from one to the next
    * each with width, height, position on page
  * for now:
    * no automatic creation
    * width held constant across iframes
    * position on page irrelevant

* galley:
  * has maximum width of all target frames
  * has margins above, below of at least the maximum target height
  * extensions:
    * when one flow should go into targets with differing widths, need to add
      floating divs left and right to constrain and position lines using CSS
      `shape-outside` (and analogous `clip-path` for visualization)
      `d.style.setProperty( '--path', getComputedStyle(d).getPropertyValue('--path') + ', 20mm 50mm' )`

* lines:
  * currently we always scroll to top of first slug rectangle; this may need a correction because some
    diacritics may extend slightly above the top
  * the first line / slug found to have a `bottom` value that exceeds the current iframe's height is
    called an 'excess line' / 'excess slug'. It triggers moving to next iframe. Since excess lines may
    not be positioned to perfectly align with the iframe's border, a 'line cover' is placed on top of them
    to hide the text. Again, this will need a correction to account for rogue diacritics.
  * When lines are set overly tight and / or use surpising typography, rectangles and even more complex
    shapes may not be sufficient to keep lines visually apart. This is a weakness in the current
    solution's design which will be hard to fix; one could think about inserting an inline element at an
    appropriate position *in the galley* that pushes lines apart visually.
    * Observe that such a solution would require *all* iframes to be reloaded *and* some way to make the
      server deliver the updated document, not the static version (could serialize changes to file system?).
    * That said, all iframes should only load the galley when their turn has come, not earlier.
