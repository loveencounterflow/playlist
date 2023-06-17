
<head>
<meta charset='UTF-8'>
<style>
@font-face { font-family: 'anton-regular';  src: url( './Anton-Regular.ttf' ); }
@font-face { font-family: 'futura-heavy';  src: url( './Futura Heavy.otf' ); }

/* thx to https://developer.mozilla.org/en-US/docs/Web/CSS/line-height-step */
:root {
  --root-font-family:     futura-heavy;
  --artist-font-family:   futura-heavy;
  --title-font-family:    anton-regular;
  --root-font-size:       6mm;
  --td-padding:           calc( 0.25 * var(--root-font-size) );
  --artist-font-size:     calc( 1.0 * var(--root-font-size) );
  --title-font-size:      calc( 1.2 * var(--root-font-size) );
  --grid-size:            8mm;
  --root-text-color:      #555;
  --link-color:           #f55;
  font-family:            var(--root-font-family);
  font-size:              var(--root-font-size);
  line-height-step:       var(--grid-size); }

html, body {
  /*background-color:       #9eaeb5;*/
  /*height:                 100vh;*/
  /*width:                  100vw;*/
  padding:                0mm;
  margin:                 0mm;
  color:                  var(--root-text-color);
  /*position:               absolute;*/
  /*overflow:               hidden;*/
  /*font-size:              6mm;*/
}


table {
  /*table-layout:           fixed;*/
  /*width:                  100%;*/
  border-collapse:        collapse;
  border:                 1px solid black; }

table td,
table th {
  border:                 1px solid black; }

article {
  display:                block;
  padding:                var(--grid-size); }

spacer {
  display:                block;
  min-height:             20mm; }


/*table {
  table-layout:           auto;
  width:                  100%; }
*/

td, th {
  padding:                var(--td-padding);
  overflow:               hidden;
  white-space:            nowrap;
  text-overflow:          ellipsis; }

/*col:nth-child( 3 ),
col:nth-child( 3 ) {
  background:  pink;
  width:              10%;
*/

col:nth-child( 1 ) {
  min-width:              5% !important;
  max-width:              5% !important;
  width:                  5% !important; }

col:nth-child( 2 ) {
  min-width:              90% !important;
  max-width:              90% !important;
  width:                  90% !important; }

col:nth-child( 3 ) {
  min-width:              10mm !important;
  max-width:              10mm !important;
  width:                  10mm !important; }

td:nth-child( 1 ) {
  font-family:            var(--artist-font-family);
  font-size:              var(--artist-font-size); }

td:nth-child( 2 ) {
  font-family:            var(--title-font-family);
  font-size:              var(--title-font-size); }

td a          { text-decoration: none; color:  var(--link-color); }
td a:link     { text-decoration: none; color:  var(--link-color); }
td a:visited  { text-decoration: none; color:  var(--link-color); }
td a:focus    { text-decoration: none; color:  var(--link-color); }
td a:hover    { text-decoration: none; color:  var(--link-color); }
td a:active   { text-decoration: none; color:  var(--link-color); }

h1, h2, h3, h4, h5, h6 {
  font-weight:            normal;
  font-family:            var(--title-font-family); }

</style>
</head>

<article>


## Jonas Playlist


| Artist                        | Titel                                                                                           | Vote      |
| :------                       | :-----                                                                                          | --------- |
| Men At Work                   | [Down Under](https://www.youtube.com/watch?v=XfR9iY5y94s)                                       |           |
| Men At Work                   | [Who Can It Be Now](https://www.youtube.com/watch?v=SECVGN4Bsgg)                                |           |
| Reinhard Mai                  | [Über den Wolken](https://www.youtube.com/watch?v=fZMFF8QH3ew)                                  |           |
| Peter Alexander               | [Die kleine Kneipe](https://www.youtube.com/watch?v=A10I_3e8B_I)                                |           |
| Udo Jürgens                   | [Griechischer Wein](https://www.youtube.com/watch?v=eKveb4BjK_c)                                |           |
| Udo Jürgens                   | [Und immer wieder geht die Sonne auf](https://www.youtube.com/watch?v=s06hmLSxNFM)              |           |
| Vickie Leandros               | [Ich liebe das Leben](https://www.youtube.com/watch?v=7_FsW8RPCTc)                              |           |
| Domenico Modugno              | [Amara terra mia](https://www.youtube.com/watch?v=oRa39T_O4yU)                                  |           |
| Karel Gott                    | [Einmal um die ganze Welt](https://www.youtube.com/watch?v=gHEa2Oyo1bY)                         |           |
| Daliah Lavi                   | [Jerusalem](https://www.youtube.com/watch?v=JqiFmIJSWaI)                                        |           |
| Daliah Lavi                   | [Meine Art Liebe zu zeigen](https://www.youtube.com/watch?v=WvgyQmBxko0)                        |           |
| Daliah Lavi                   | [Willst du mit mir gehen](https://www.youtube.com/watch?v=yIRKlvhDP_w)                          |           |
| Peter Maffay                  | [Über sieben Brücken musst du gehen](https://www.youtube.com/watch?v=eKwl5HclBeQ)               |           |
| Joy Fleming                   | [Ein Lied kann eine Brücke sein (Eurovision 1975)](https://www.youtube.com/watch?v=pzDzm3gq530) |           |
| Daisy Door                    | [Du lebst in deiner Welt (Hitparade 1971)](https://www.youtube.com/watch?v=2pM_FAkSVlM)         |           |
| Rio Reiser                    | Junimond                                                                                        |           |
| Laid Back                     | [Bakerman](https://www.youtube.com/watch?v=yByP88jUQH4)                                         |           |
| Hot Butter                    | [Popcorn (1972)](https://www.youtube.com/watch?v=YK3ZP6frAMc)                                   |           |
| Katja Ebstein                 | Diese Welt                                                                                      |           |
| Beatles                       | Penny Lane                                                                                      |           |
| Boy George                    | Karma Chameleon                                                                                 |           |
| Doris Day                     | Que Será, Será                                                                                  |           |
| Nancy Sinatra + Lee Hazelwood | Summer Wine                                                                                     |           |
| Nina Simone                   | [Lilac Wine](https://www.youtube.com/watch?v=LT38CIgRse4)                                       |           |
| Nancy Sinatra + Lee Hazelwood | Fedora                                                                                          |           |
| The Muppets                   | [Mahna Mahna](https://www.youtube.com/watch?v=zb47CstE7R4)                                      |           |
| Hilde Knef                    | In dieser Stadt                                                                                 |           |
| Nancy Sinatra                 | You Only Live Twice                                                                             |           |
| Nana Mouskouri                | Weiße Rosen aus Athen                                                                           |           |
| Nana Mouskouri                | Akropolis Adieu                                                                                 |           |
| Coldplay                      | [Yellow](https://www.youtube.com/watch?v=yKNxeF4KMsY)                                           |           |
| Peggy March                   | [Memories Of Heidelberg](https://www.youtube.com/watch?v=4tB9FNZxB6g)                           |           |
| Drafi Deutscher               | [Marmor, Stein und Eisen bricht](https://www.youtube.com/watch?v=BTmtOd4mpco)                   |           |
| Charles Aznavour              | [Emmenez-moi](https://www.youtube.com/watch?v=0OrKMaeQUx0)                                      |           |
| Edith Piaf                    | [Je Ne Regrette Rien](https://www.youtube.com/watch?v=fpHAsb2XQOY)                              |           |
| Travis                        | [Sing](https://www.youtube.com/watch?v=eYO1-gGWJyo)                                             |           |
| Peggy March                   | [Memories Of Heidelberg](https://www.youtube.com/watch?v=4tB9FNZxB6g)                           |           |
| Gerry & The Pacemakers        | [Ferry Cross The Mersey](https://www.youtube.com/watch?v=08083BNaYcA)                           |           |
|                               |                                                                                                 |           |

</article>
<spacer></spacer>
