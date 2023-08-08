(function() {
  'use strict';
  globalThis.log = console.log;

  globalThis.debug = console.debug;

  //===========================================================================================================
  µ.DOM.ready(async function() {
    var cfg, distributor;
    log('^123-1^', "ready");
    cfg = {
      paragraph_selector: 'mu-galley > p',
      iframe_selector: 'iframe',
      insert_stylesheet_after: 'link[href$="reset.css"]',
      insert_debug_button: true
    };
    //.........................................................................................................
    if ((!µ.DOM.page_is_inside_iframe()) && ((µ.DOM.select_first('mu-galley', null)) != null)) {
      log('^123-1^', "galley page, not inside an iframe");
      distributor = new µ.LINE.Distributor(cfg);
      await distributor.mark_lines();
      return null;
    }
    if (!µ.LINE.Distributor.is_main_document()) {
      //.........................................................................................................
      return null;
    }
    //.........................................................................................................
    distributor = new µ.LINE.Distributor(cfg);
    await distributor.distribute_lines();
    return null;
  });

}).call(this);

//# sourceMappingURL=ops2.js.map