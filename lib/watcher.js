(function() {
  'use strict';
  var $, FS, G, GUY, My_watcher, PATH, Pipeline, after, alert, create_pipeline, debug, defer, demo, echo, help, info, inspect, log, plain, praise, rpr, sleep, urge, warn, whisper, xxx;

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

  //...........................................................................................................
  G = {};

  (function() {
    G.project_path = PATH.dirname(__dirname);
    G.tmp_path = PATH.join(G.project_path, 'tmp');
    return G.public_path = PATH.join(G.project_path, 'public');
  })();

  //===========================================================================================================
  xxx = {
    //---------------------------------------------------------------------------------------------------------
    $log_all: function() {
      return (d) => {
        return whisper(GUY.datetime.now(), '^858-4^', 'pipeline', d);
      };
    },
    //---------------------------------------------------------------------------------------------------------
    $add_as_change: function() {
      return (d, send) => {
        if (d.key !== 'add') {
          send(d);
        }
        d.key = 'change';
        return send(d);
      };
    },
    //---------------------------------------------------------------------------------------------------------
    $add_file_info: function() {
      return (d, send) => {
        if (d.path == null) {
          return send(d);
        }
        d.filename = PATH.basename(d.path);
        d.extension = PATH.extname(d.filename);
        return send(d);
      };
    },
    //---------------------------------------------------------------------------------------------------------
    $html_from_md: function() {
      return async(d, send) => {
        var public_path, source_path, tmp_path, zx;
        if (d.key !== 'change') {
          return send(d);
        }
        if (d.extension !== '.md') {
          return send(d);
        }
        //.......................................................................................................
        ({zx} = (await import('zx')));
        source_path = d.path;
        tmp_path = PATH.join(G.tmp_path, d.filename);
        public_path = PATH.join(G.public_path, d.filename);
        help(GUY.datetime.now(), '^858-4^', '$html_from_md', source_path, tmp_path, public_path);
        await zx`date +"%Y-%m-%d %H:%M:%S"
pandoc -o ${tmp_path} ${source_path}
echo '<!DOCTYPE html>' | cat - ${tmp_path} > ${public_path}
trash ${tmp_path}`;
        //.......................................................................................................
        return null;
      };
    }
  };

  //===========================================================================================================
  create_pipeline = function() {
    var pipeline;
    pipeline = new Pipeline();
    // pipeline.push ( d ) -> warn GUY.datetime.now(), '^858-4^', 'pipeline', d
    pipeline.push(xxx.$log_all());
    pipeline.push(xxx.$add_as_change());
    pipeline.push(xxx.$add_file_info());
    // pipeline.push xxx.$log_all()
    pipeline.push(xxx.$html_from_md());
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
      var new_folder_path, new_path_1, new_path_2, watcher;
      watcher = new My_watcher(create_pipeline());
      watcher.add_path(PATH.join(G.project_path, 'pages/**/*.md'));
      watcher.add_path(PATH.join(G.project_path, 'public/**/*.css'));
      watcher.add_path(PATH.join(G.project_path, 'public/**/*.js'));
      watcher.add_path(PATH.join(G.project_path, 'public/**/*.html'));
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

  //###########################################################################################################
  if (require.main === module) {
    (async() => {
      return (await demo());
    })();
  }

  // await demo_zx()

}).call(this);

//# sourceMappingURL=watcher.js.map