(function() {
  'use strict';
  var $, Async_pipeline, FS, G, GUY, My_watcher, PATH, Pipeline, after, alert, create_pipeline, debug, defer, demo, echo, help, info, inspect, log, plain, praise, rpr, sleep, urge, warn, whisper, xxx;

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
  ({Pipeline, Async_pipeline, $} = require('moonriver'));

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
        var e;
        if (d.path == null) {
          return send(d);
        }
        e = PATH.parse(d.path);
        d.home = e.dir;
        d.filename = e.base;
        d.extension = e.ext;
        d.barename = e.name;
        return send(d);
      };
    },
    //---------------------------------------------------------------------------------------------------------
    $html_from_md: function() {
      return async(d, send) => {
        var error, message, public_filename, public_path, ref, ref1, ref2, source_path, tmp_path, zx;
        if (d.key !== 'change') {
          return send(d);
        }
        if (d.extension !== '.md') {
          return send(d);
        }
        ({
          //.......................................................................................................
          $: zx
        } = (await import('zx')));
        source_path = d.path;
        public_filename = `${d.barename}.html`;
        tmp_path = PATH.join(G.tmp_path, public_filename);
        public_path = PATH.join(G.public_path, public_filename);
        help(GUY.datetime.now(), '^$html_from_md@858-4^', GUY.trm.reverse(` ${d.filename} -> ${public_filename} `));
        try {
          //.......................................................................................................
          await zx`pandoc -o ${tmp_path} ${source_path}`;
        } catch (error1) {
          error = error1;
          message = (ref = error.message) != null ? ref : error;
          warn('^$html_from_md@858-4^', GUY.trm.reverse(` ${message} `));
        }
        try {
          //.......................................................................................................
          await zx`echo '<!DOCTYPE html>' | cat - ${tmp_path} > ${public_path}`;
        } catch (error1) {
          error = error1;
          message = (ref1 = error.message) != null ? ref1 : error;
          warn('^$html_from_md@858-4^', GUY.trm.reverse(` ${message} `));
        }
        try {
          //.......................................................................................................
          await zx`trash ${tmp_path}`;
        } catch (error1) {
          error = error1;
          message = (ref2 = error.message) != null ? ref2 : error;
          warn('^$html_from_md@858-4^', GUY.trm.reverse(` ${message} `));
        }
        //.......................................................................................................
        info(GUY.datetime.now(), '^$html_from_md@858-4^', GUY.trm.reverse(` OK ${d.filename} -> ${public_filename} `));
        // date +"%Y-%m-%d %H:%M:%S"
        //.......................................................................................................
        return null;
      };
    }
  };

  //===========================================================================================================
  create_pipeline = function() {
    var pipeline;
    pipeline = new Async_pipeline();
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
    async on_all(key, path) {
      var d, ref;
      // whisper GUY.datetime.now(), '^858-1^', 'my_watcher', key, path
      this.pipeline.send({key, path});
      ref = this.pipeline.walk();
      for await (d of ref) {
        null;
      }
      return null;
    }

  };

  //-----------------------------------------------------------------------------------------------------------
  demo = function() {
    return new Promise(async(resolve, reject) => {
      var FiveServer, cfg, watcher;
      FiveServer = (require('five-server')).default;
      cfg = {
        open: false,
        root: './public',
        host: '0.0.0.0',
        https: true
      };
      new FiveServer().start(cfg);
      watcher = new My_watcher(create_pipeline());
      watcher.add_path(PATH.join(G.project_path, 'pages/**/*.md'));
      watcher.add_path(PATH.join(G.project_path, 'public/**/*.css'));
      watcher.add_path(PATH.join(G.project_path, 'public/**/*.js'));
      watcher.add_path(PATH.join(G.project_path, 'public/**/*.html'));
      await after(100, function() {
        return resolve();
      });
      //.........................................................................................................
      return null;
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