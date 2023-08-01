(function() {
  'use strict';
  var setup_debug_button;

  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //-----------------------------------------------------------------------------------------------------------
  setup_debug_button = function() {
    var button;
    if (!µ.LINE.Distributor.is_main_document()) {
      return null;
    }
    if ((button = µ.DOM.select_first('#debug', null)) == null) {
      return null;
    }
    µ.DOM.on(button, 'click', function() {
      return µ.DOM.toggle_class(µ.DOM.select_first('body'), 'debug');
    });
    return null;
  };

  //===========================================================================================================
  µ.DOM.ready(async function() {
    var distributor;
    log('^123-1^', "ready");
    setup_debug_button();
    if (µ.LINE.Distributor.is_galley_document()) {
      return null;
    }
    if (!µ.LINE.Distributor.is_main_document()) {
      return null;
    }
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