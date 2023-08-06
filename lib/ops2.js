(function() {
  'use strict';
  var setup_debug_button;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //-----------------------------------------------------------------------------------------------------------
  setup_debug_button = function(distributor) {
    var button;
    if ((button = µ.DOM.select_first('button#debug', null)) == null) {
      return;
    }
    µ.DOM.on(button, 'click', function() {
      var galley_µ, ref, results, ø_iframe;
      µ.DOM.toggle_class(µ.DOM.select_first('body'), 'debug');
      ref = distributor.new_iframe_walker();
      results = [];
      for (ø_iframe of ref) {
        galley_µ = ø_iframe.window.µ;
        results.push(galley_µ.DOM.toggle_class(galley_µ.DOM.select_first('body'), 'debug'));
      }
      return results;
    });
    return null;
  };

  //===========================================================================================================
  µ.DOM.ready(async function() {
    var cfg, distributor;
    log('^123-1^', "ready");
    if ((!µ.DOM.page_is_inside_iframe()) && ((µ.DOM.select_first('galley', null)) != null)) {
      log('^123-1^', "galley page, not inside an iframe");
    }
    if (!µ.LINE.Distributor.is_main_document()) {
      return null;
    }
    cfg = {
      paragraph_selector: 'galley > p',
      iframe_selector: 'iframe',
      insert_stylesheet_after: 'link[href$="reset.css"]'
    };
    distributor = new µ.LINE.Distributor(cfg);
    setup_debug_button(distributor);
    log('^123-2^', "distributing lines...");
    await distributor.distribute_lines();
    log('^123-3^', "distributing lines done");
    return null;
  });

}).call(this);

//# sourceMappingURL=ops2.js.map