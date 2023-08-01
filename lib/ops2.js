(function() {
  'use strict';
  var setup_debug_button;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //-----------------------------------------------------------------------------------------------------------
  setup_debug_button = function() {
    var button;
    // return null unless  µ.LINE.Distributor.is_main_document()
    // return null unless ( button = µ.DOM.select_first '#debug', null )?
    if ((button = µ.DOM.select_first('button#debug', null)) == null) {
      return;
    }
    µ.DOM.on(button, 'click', function() {
      /* TAINT should use same cfg as below */
      /* TAINT convert to regular iterator */
      var galley_µ, results, ø_iframe;
      µ.DOM.toggle_class(µ.DOM.select_first('body'), 'debug');
      ø_iframe = (new µ.LINE.Distributor()).new_iframe_walker();
      results = [];
      while (ø_iframe.step() != null) {
        galley_µ = ø_iframe.window.µ;
        results.push(galley_µ.DOM.toggle_class(galley_µ.DOM.select_first('body'), 'debug'));
      }
      return results;
    });
    return null;
  };

  //===========================================================================================================
  µ.DOM.ready(async function() {
    var distributor;
    log('^123-1^', "ready");
    if (!µ.LINE.Distributor.is_main_document()) {
      // return null if      µ.LINE.Distributor.is_galley_document()
      return null;
    }
    setup_debug_button();
    distributor = new µ.LINE.Distributor({
      paragraph_selector: 'galley > p',
      iframe_selector: 'iframe'
    });
    log('^123-2^', "distributing lines...");
    await distributor.distribute_lines();
    log('^123-3^', "distributing lines done");
    return null;
  });

}).call(this);

//# sourceMappingURL=ops2.js.map