
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
  $         }             = require 'moonriver'
{ after
  defer
  sleep }                 = GUY.async


#===========================================================================================================
create_pipeline = ->
  pipeline        = new Pipeline()
  # pipeline.push ( d ) -> warn GUY.datetime.now(), '^858-4^', 'pipeline', d
  pipeline.push ( d ) ->
    return null unless d.key in [ 'add', 'change', ]
    help GUY.datetime.now(), '^858-4^', 'pipeline: changed:', d.path
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
    null for d from @pipeline.walk()
    return null

#-----------------------------------------------------------------------------------------------------------
demo = -> new Promise ( resolve, reject ) =>
  project_path      = PATH.dirname __dirname
  watcher           = new My_watcher create_pipeline()
  new_glob          = PATH.join project_path, '**/*.{md,css}'
  watcher.add_path new_glob
  await after 100, ->
    return resolve()
  return
  #.......................................................................................................
  new_path_1        = PATH.join folder_path, 'new_1.txt'
  new_folder_path   = PATH.join folder_path, 'sub'
  new_path_2        = PATH.join folder_path, 'sub/new_2.txt'
  #.......................................................................................................
  # await sleep 0.25
  FS.writeFileSync new_path_1, 'helo'
  FS.mkdirSync new_folder_path
  FS.writeFileSync new_path_2, 'helo'
  await sleep 0.25
  FS.writeFileSync new_path_1, 'sfhsoifhas'
  FS.writeFileSync new_path_2, 'helo'
  await sleep 0.25
  FS.writeFileSync new_path_2, 'helo'
  FS.rmSync new_path_2
  FS.rmdirSync new_folder_path
  after 0.25, =>
    debug GUY.datetime.now(), '^858-5^', "stopping watcher"
    await watcher.stop()
    debug GUY.datetime.now(), '^858-6^', "removing #{folder_path}"
    rm?()
    resolve()
    # return null
  return null
  #.........................................................................................................
  resolve()

#-----------------------------------------------------------------------------------------------------------
demo_zx = ->
  #.........................................................................................................
  { $ } = await import( 'zx' )
  source_path = './playlist.md'
  help "compiling #{source_path}"
  await $"""
    date +"%Y-%m-%d %H:%M:%S"
    pandoc -o ./tmp/playlist.html #{source_path}
    echo '<!DOCTYPE html>' | cat - ./tmp/playlist.html > ./public/playlist.html
    trash ./tmp/playlist.html"""
  #.........................................................................................................
  return null


############################################################################################################
if require.main is module then do =>
  await demo()
  # await demo_zx()

