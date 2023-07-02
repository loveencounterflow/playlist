(function() {
  'use strict';
  var $, FS, GUY, My_watcher, PATH, Pipeline, after, alert, debug, defer, demo, demo_zx, echo, help, info, inspect, log, plain, praise, rpr, sleep, urge, warn, whisper;

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
  My_watcher = class My_watcher extends GUY.watch.Watcher {
    //---------------------------------------------------------------------------------------------------------
    constructor(pipeline) {
      super();
      this.pipeline = pipeline;
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    on_all(key, path) {
      var d, ref;
      whisper('^858-1^', 'my_watcher', key, path);
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
      var new_folder_path, new_glob, new_path_1, new_path_2, pipeline, project_path, watcher;
      project_path = PATH.dirname(__dirname);
      return resolve();
      //.......................................................................................................
      new_path_1 = PATH.join(folder_path, 'new_1.txt');
      new_folder_path = PATH.join(folder_path, 'sub');
      new_path_2 = PATH.join(folder_path, 'sub/new_2.txt');
      new_glob = PATH.join(folder_path, '**/*');
      //.......................................................................................................
      pipeline = new Pipeline();
      pipeline.push(function(d) {
        return warn('^858-4^', 'pipeline', d);
      });
      pipeline.push(function(d) {
        var ref;
        if ((ref = d.key) !== 'add' && ref !== 'change') {
          return null;
        }
        return help('^858-4^', 'pipeline: changed:', d.path);
      });
      watcher = new My_watcher(pipeline);
      watcher.add_path(new_glob);
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
        debug('^858-5^', "stopping watcher");
        await watcher.stop();
        debug('^858-6^', `removing ${folder_path}`);
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
    //.........................................................................................................
    ({$} = (await import('zx')));
    $`date +"%Y-%m-%d %H:%M:%S";`;
    $`echo 'pandoc ./playlist.md'`;
    $`pandoc -o ./tmp/playlist.html ./playlist.md`;
    $`echo '<!DOCTYPE html>' | cat - ./tmp/playlist.html > ./public/playlist.html`;
    $`trash ./tmp/playlist.html`;
    //.........................................................................................................
    return null;
  };

  //###########################################################################################################
  if (require.main === module) {
    (async() => {
      // await demo()
      return (await demo_zx());
    })();
  }

}).call(this);

//# sourceMappingURL=watcher.js.map