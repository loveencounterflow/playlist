(function() {
  'use strict';
  var $, FS, GUY, My_watcher, PATH, Pipeline, after, alert, create_pipeline, debug, defer, demo, demo_zx, echo, help, info, inspect, log, plain, praise, rpr, sleep, urge, warn, whisper;

  //###########################################################################################################
  GUY = require('guy');

  ({alert, debug, help, info, plain, praise, urge, warn, whisper} = GUY.trm.get_loggers('GUY/temp/tests'));

  ({rpr, inspect, echo, log} = GUY.trm);

  //...........................................................................................................
  PATH = require('path');

  FS = require('fs');

  // { freeze }                = require 'letsfreezethat'
  // H                         = require './helpers'
  // types                     = new ( require 'intertype' ).Intertype()
  // { isa
  //   declare
  //   type_of
  //   validate
  //   equals }                = types
  ({Pipeline, $} = require('moonriver'));

  ({after, defer, sleep} = GUY.async);

  //===========================================================================================================
  create_pipeline = function() {
    var pipeline;
    pipeline = new Pipeline();
    // pipeline.push ( d ) -> warn GUY.datetime.now(), '^858-4^', 'pipeline', d
    pipeline.push(function(d) {
      var ref;
      if ((ref = d.key) !== 'add' && ref !== 'change') {
        return null;
      }
      return help(GUY.datetime.now(), '^858-4^', 'pipeline: changed:', d.path);
    });
    return pipeline;
  };

  //===========================================================================================================
  My_watcher = class My_watcher extends GUY.watch.Watcher {
    //---------------------------------------------------------------------------------------------------------
    constructor(pipeline) {
      super({
        ignored: /(^|\/)\..|node_modules/
      });
      this.pipeline = pipeline;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    on_all(key, path) {
      var d, ref;
      // whisper GUY.datetime.now(), '^858-1^', 'my_watcher', key, path
      this.pipeline.send({key, path});
      ref = this.pipeline.walk();
      for (d of ref) {
        null;
      }
      return null;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  demo = function() {
    return new Promise(async(resolve, reject) => {
      var new_folder_path, new_glob, new_path_1, new_path_2, project_path, watcher;
      project_path = PATH.dirname(__dirname);
      watcher = new My_watcher(create_pipeline());
      new_glob = PATH.join(project_path, '**/*.{md,css}');
      watcher.add_path(new_glob);
      await after(100, function() {
        return resolve();
      });
      return;
      //.......................................................................................................
      new_path_1 = PATH.join(folder_path, 'new_1.txt');
      new_folder_path = PATH.join(folder_path, 'sub');
      new_path_2 = PATH.join(folder_path, 'sub/new_2.txt');
      //.......................................................................................................
      // await sleep 0.25
      FS.writeFileSync(new_path_1, 'helo');
      FS.mkdirSync(new_folder_path);
      FS.writeFileSync(new_path_2, 'helo');
      await sleep(0.25);
      FS.writeFileSync(new_path_1, 'sfhsoifhas');
      FS.writeFileSync(new_path_2, 'helo');
      await sleep(0.25);
      FS.writeFileSync(new_path_2, 'helo');
      FS.rmSync(new_path_2);
      FS.rmdirSync(new_folder_path);
      after(0.25, async() => {
        debug(GUY.datetime.now(), '^858-5^', "stopping watcher");
        await watcher.stop();
        debug(GUY.datetime.now(), '^858-6^', `removing ${folder_path}`);
        if (typeof rm === "function") {
          rm();
        }
        return resolve();
      });
      // return null
      return null;
      //.........................................................................................................
      return resolve();
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  demo_zx = async function() {
    var source_path;
    //.........................................................................................................
    ({$} = (await import('zx')));
    source_path = './playlist.md';
    help(`compiling ${source_path}`);
    await $`date +"%Y-%m-%d %H:%M:%S"
pandoc -o ./tmp/playlist.html ${source_path}
echo '<!DOCTYPE html>' | cat - ./tmp/playlist.html > ./public/playlist.html
trash ./tmp/playlist.html`;
    //.........................................................................................................
    return null;
  };

  //###########################################################################################################
  if (require.main === module) {
    (async() => {
      return (await demo());
    })();
  }

  // await demo_zx()

}).call(this);

//# sourceMappingURL=watcher.js.map