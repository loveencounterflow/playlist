
'use strict'


############################################################################################################
GUY                       = require 'guy'
{ alert
  debug
  help
  info
  plain
  praise
  urge
  warn
  whisper }               = GUY.trm.get_loggers 'GUY/temp/tests'
{ rpr
  inspect
  echo
  log     }               = GUY.trm
#...........................................................................................................
PATH                      = require 'path'
FS                        = require 'fs'
# { freeze }                = require 'letsfreezethat'
# H                         = require './helpers'
# types                     = new ( require 'intertype' ).Intertype()
# { isa
#   declare
#   type_of
#   validate
#   equals }                = types
{ Pipeline
  Async_pipeline
  $         }             = require 'moonriver'
{ after
  defer
  sleep }                 = GUY.async
#...........................................................................................................
G                         = {}
do ->
  G.project_path  = PATH.dirname __dirname
  G.tmp_path      = PATH.join G.project_path, 'tmp'
  G.public_path   = PATH.join G.project_path, 'public'


#===========================================================================================================
xxx =

  #---------------------------------------------------------------------------------------------------------
  $log_all: -> ( d ) => whisper GUY.datetime.now(), '^858-4^', 'pipeline', d

  #---------------------------------------------------------------------------------------------------------
  $add_as_change: -> ( d, send ) =>
    send d unless d.key is 'add'
    d.key = 'change'
    send d

  #---------------------------------------------------------------------------------------------------------
  $add_file_info: -> ( d, send ) =>
    return send d unless d.path?
    e           = PATH.parse d.path
    d.home      = e.dir
    d.filename  = e.base
    d.extension = e.ext
    d.barename  = e.name
    send d

  #---------------------------------------------------------------------------------------------------------
  $html_from_md: -> ( d, send ) =>
    return send d unless d.key is 'change'
    return send d unless d.extension is '.md'
    #.......................................................................................................
    { $: zx }       = await import( 'zx' )
    source_path     = d.path
    public_filename = "#{d.barename}.html"
    tmp_path        = PATH.join G.tmp_path,     public_filename
    public_path     = PATH.join G.public_path,  public_filename
    help GUY.datetime.now(), '^$html_from_md@858-4^', GUY.trm.reverse " #{d.filename} -> #{public_filename} "
    #.......................................................................................................
    try
      await zx"""pandoc -o #{tmp_path} #{source_path}"""
    catch error
      message = error.message ? error
      warn '^$html_from_md@858-4^', GUY.trm.reverse " #{message} "
    #.......................................................................................................
    try
      await zx"""echo '<!DOCTYPE html>' | cat - #{tmp_path} > #{public_path}"""
    catch error
      message = error.message ? error
      warn '^$html_from_md@858-4^', GUY.trm.reverse " #{message} "
    #.......................................................................................................
    try
      await zx"""trash #{tmp_path}"""
    catch error
      message = error.message ? error
      warn '^$html_from_md@858-4^', GUY.trm.reverse " #{message} "
    #.......................................................................................................
    info GUY.datetime.now(), '^$html_from_md@858-4^', GUY.trm.reverse " OK #{d.filename} -> #{public_filename} "
      # date +"%Y-%m-%d %H:%M:%S"
    #.......................................................................................................
    return null

#===========================================================================================================
create_pipeline = ->
  pipeline        = new Async_pipeline()
  # pipeline.push ( d ) -> warn GUY.datetime.now(), '^858-4^', 'pipeline', d
  pipeline.push xxx.$log_all()
  pipeline.push xxx.$add_as_change()
  pipeline.push xxx.$add_file_info()
  # pipeline.push xxx.$log_all()
  pipeline.push xxx.$html_from_md()
  return pipeline


#===========================================================================================================
class My_watcher extends GUY.watch.Watcher

  #---------------------------------------------------------------------------------------------------------
  constructor: ( pipeline ) ->
    super { ignored: /(^|\/)\..|node_modules/, }
    @pipeline = pipeline
    return undefined

  #---------------------------------------------------------------------------------------------------------
  on_all: ( key, path ) ->
    # whisper GUY.datetime.now(), '^858-1^', 'my_watcher', key, path
    @pipeline.send { key, path, }
    null for await d from @pipeline.walk()
    return null

#-----------------------------------------------------------------------------------------------------------
demo = -> new Promise ( resolve, reject ) =>
  FiveServer = ( require 'five-server' ).default
  cfg =
    open:           false
    root:           './public'
    host:           '0.0.0.0'
    https:          true
    wait:           0.5 # s
  new FiveServer().start cfg
  watcher           = new My_watcher create_pipeline()
  watcher.add_path PATH.join G.project_path, 'pages/**/*.md'
  watcher.add_path PATH.join G.project_path, 'public/**/*.css'
  watcher.add_path PATH.join G.project_path, 'public/**/*.js'
  watcher.add_path PATH.join G.project_path, 'public/**/*.html'
  await after 100, ->
    return resolve()
  #.........................................................................................................
  return null


############################################################################################################
if require.main is module then do =>
  await demo()
  # await demo_zx()

