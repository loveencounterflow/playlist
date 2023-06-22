
<head>
<meta charset='UTF-8'>
<style>
@font-face { font-family: 'anton-regular';  src: url( './Anton-Regular.ttf' ); }
@font-face { font-family: 'futura-heavy';   src: url( './Futura Heavy.otf' ); }
@font-face { font-family: 'bilbo-swash';    src: url( './BilboSwashCaps-Regular.ttf' ); }
@font-face { font-family: 'script-92';      src: url( './Script 92 Normal.ttf' ); }

/* thx to https://developer.mozilla.org/en-US/docs/Web/CSS/line-height-step */
:root {
  --root-font-family:     futura-heavy;
  --artist-font-family:   futura-heavy;
  --title-font-family:    anton-regular;
  --jonas-font-family:    script-92;
  --root-font-size:       4mm;
  --td-padding-top:       calc( 0.5 * var(--root-font-size) );
  --td-shift-top:         calc( 0.5 * var(--root-font-size) );
  --artist-font-size:     calc( 1.0 * var(--root-font-size) );
  --title-font-size:      calc( 1.2 * var(--root-font-size) );
  --jonas-font-size:      calc( 5 * var(--root-font-size) );
  --grid-size:            3mm;
  --root-text-color:      #333;
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
  display:                flow;
  border-collapse:        collapse;
  border:                 none; }

table td,
table th {
  border:                 none; }

.page {
  display:                block flow;
  columns: 2;
  outline:                1px dotted red;
  width:                  210mm;
  height:                 297mm;
  margin:                 var(--grid-size);
  padding:                var(--grid-size); }

spacer {
  display:                block;
  min-height:             20mm; }


/*table {
  table-layout:           auto;
  width:                  100%; }
*/

td, th {
  overflow:               hidden;
  white-space:            nowrap;
  text-overflow:          ellipsis; }

th {
  display:                none; }

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
  border-top:             1px solid red;
  position:               relative;
  top:                    var(--td-shift-top);
  padding-top:            var(--td-padding-top);
  font-family:            var(--artist-font-family);
  font-size:              var(--artist-font-size); }

td:nth-child( 2 ) {
  font-family:            var(--title-font-family);
  font-size:              var(--title-font-size); }

td:nth-child( 2 ) em {
  font-family:            var(--root-font-family);
  font-style:             normal;
  font-size:              var(--root-font-size); }

td a          { text-decoration: none; color:  var(--root-color); }
td a:link     { text-decoration: none; color:  var(--root-color); }
td a:visited  { text-decoration: none; color:  var(--root-color); }
td a:focus    { text-decoration: none; color:  var(--root-color); }
td a:hover    { text-decoration: none; color:  var(--root-color); }
td a:active   { text-decoration: none; color:  var(--root-color); }

h1, h2, h3, h4, h5, h6 {
  font-weight:            normal;
  font-family:            var(--title-font-family); }

.jonas {
  font-family:            var(--jonas-font-family);
  font-size:              var(--jonas-font-size); }

td {
  display:                block; }

td:nth-child( 2 ),
td:nth-child( 3 ) {
  display:                inline; }

td:nth-child( 3 )::before       { content:  '('; }
td:nth-child( 3 )::after        { content:  ')'; }
td:nth-child( 3 ):empty::before { content:  ''; }
td:nth-child( 3 ):empty::after  { content:  ''; }
td:nth-child( 3 ) { position:  relative; top: calc( 0.2 * var(--root-font-size ) ); }

tr { break-inside: avoid; }

</style>
</head>


<div class=page>

<div class=jonas>Jonas</div>


| Artist                          | Titel                                                                              | Anmerkungen           |
| :------                         | :-----                                                                             | ---------             |
| Beatles                         | [Penny Lane](https://www.youtube.com/watch?v=vfxQ1oDiEJM)                          |                       |
| Boy George                      | [Karma Chameleon](https://www.youtube.com/watch?v=JmcA9LIIXWw)                     |                       |
| Charles Aznavour                | [Emmenez-moi](https://www.youtube.com/watch?v=0OrKMaeQUx0)                         |                       |
| Coldplay                        | [Yellow](https://www.youtube.com/watch?v=yKNxeF4KMsY)                              |                       |
| Daisy Door                      | [Du lebst in deiner Welt](https://www.youtube.com/watch?v=2pM_FAkSVlM)             | Hitparade 1971        |
| Daliah Lavi                     | [Jerusalem](https://www.youtube.com/watch?v=JqiFmIJSWaI)                           |                       |
| Daliah Lavi                     | [Meine Art Liebe zu zeigen](https://www.youtube.com/watch?v=WvgyQmBxko0)           |                       |
| Daliah Lavi                     | [Willst du mit mir gehen](https://www.youtube.com/watch?v=yIRKlvhDP_w)             |                       |
| Domenico Modugno                | [Amara terra mia](https://www.youtube.com/watch?v=oRa39T_O4yU)                     |                       |
| Doris Day                       | [Que Será, Será](https://www.youtube.com/watch?v=i9nWB5XifBI)                      |                       |
| Drafi Deutscher                 | [Marmor, Stein und Eisen bricht](https://www.youtube.com/watch?v=BTmtOd4mpco)      |                       |
| Edith Piaf                      | [Je Ne Regrette Rien](https://www.youtube.com/watch?v=fpHAsb2XQOY)                 |                       |
| Gerry & The Pacemakers          | [Ferry Cross The Mersey](https://www.youtube.com/watch?v=08083BNaYcA)              |                       |
| Hilde Knef                      | [In dieser Stadt](https://www.youtube.com/watch?v=zc2ZYOrhTV4)                     | 1966                  |
| Hot Butter                      | [Popcorn](https://www.youtube.com/watch?v=YK3ZP6frAMc)                             | 1972                  |
| Joy Fleming                     | [Ein Lied kann eine Brücke sein](https://www.youtube.com/watch?v=pzDzm3gq530)      | Eurovision 1975       |
| Karel Gott                      | [Einmal um die ganze Welt](https://www.youtube.com/watch?v=gHEa2Oyo1bY)            |                       |
| Katja Ebstein                   | [Diese Welt](https://www.youtube.com/watch?v=u0lg1LcfHBQ)                          | Eurovision 1971       |
| Laid Back                       | [Bakerman](https://www.youtube.com/watch?v=yByP88jUQH4)                            |                       |
| Men At Work                     | [Down Under](https://www.youtube.com/watch?v=XfR9iY5y94s)                          |                       |
| Men At Work                     | [Who Can It Be Now](https://www.youtube.com/watch?v=SECVGN4Bsgg)                   |                       |
| Mireille Mathieu                | [Akropolis Adieu](https://www.youtube.com/watch?v=NeNs4UPoFTA)                     | ZDF Drehscheibe 1971  |
| Nana Mouskouri                  | [Weiße Rosen aus Athen](https://www.youtube.com/watch?v=ZpJiKL4N3V0)               |                       |
| Nancy Sinatra                   | [You Only Live Twice](https://www.youtube.com/watch?v=Z6D6ObD9cMY)                 |                       |
| Nancy Sinatra + Lee Hazelwood   | [Some Velvet Morning](https://www.youtube.com/watch?v=670YMraVnyk)                 |                       |
| Nancy Sinatra + Lee Hazelwood   | [Summer Wine](https://www.youtube.com/watch?v=nbtKHrI-OAs)                         | Ed Sullivan Show 1967 |
| Nina Simone                     | [Lilac Wine](https://www.youtube.com/watch?v=LT38CIgRse4)                          |                       |
| Peggy March                     | [Memories Of Heidelberg](https://www.youtube.com/watch?v=4tB9FNZxB6g)              |                       |
| Peter Alexander                 | [Die kleine Kneipe](https://www.youtube.com/watch?v=A10I_3e8B_I)                   |                       |
| Peter Maffay                    | [Über sieben Brücken musst du gehen](https://www.youtube.com/watch?v=eKwl5HclBeQ)  |                       |
| Reinhard Mai                    | [Über den Wolken](https://www.youtube.com/watch?v=fZMFF8QH3ew)                     |                       |
| Rio Reiser                      | [Junimond](https://www.youtube.com/watch?v=X6VIYLmS6vM)                            |                       |
| Robbie Williams + Nicole Kidman | [Something Stupid](https://www.youtube.com/watch?v=f43nR8Wu_1Y)                    |                       |
| The Muppets                     | [Mahna Mahna](https://www.youtube.com/watch?v=zb47CstE7R4)                         |                       |
| Travis                          | [Sing](https://www.youtube.com/watch?v=eYO1-gGWJyo)                                |                       |
| Udo Jürgens                     | [Griechischer Wein](https://www.youtube.com/watch?v=eKveb4BjK_c)                   |                       |
| Udo Jürgens                     | [Und immer wieder geht die Sonne auf](https://www.youtube.com/watch?v=s06hmLSxNFM) |                       |
| Vickie Leandros                 | [Ich liebe das Leben](https://www.youtube.com/watch?v=7_FsW8RPCTc)                 |                       |

</div>
<spacer></spacer>
