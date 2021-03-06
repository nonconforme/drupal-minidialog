(function ($, window) {
  "use strict";

  // Add a small plugin for Ajax commands
  $.fn.extend({

    /**
     * Set the minidialog content, implies open
     */
    MiniDialogContent: function (options) {
      if ("string" === typeof options) {
        options = {content: options};
      }
      if (!options.content) {
        return;
      }
      var $content = $("#minidialog").find(".content");
      $content.html(options.content);
      Drupal.attachBehaviors($content);
      // Sometimes it work first time, sometimes not...
      setTimeout(function () {
        Drupal.attachBehaviors($content);
      }, 700);
      $.fn.MiniDialogOpen(options);
    },

    /**
     * Used through a Drupal ajax command
     */
    MiniDialogOpen: function (options) {

      var key = null;
      var $minidialog = $("#minidialog");
      var minidialog = $minidialog.get(0);
      var defaults = {
        width: "600px",
        height: "auto",
        hideTitleBar: false,
        modal: true
      };

      if ("string" === typeof options) {
        options = {content: options};
      }

      // Set "wide" width before applying default
      if (options && options.wide && !options.width) {
        options.width = "900px";
      }

      if (options) {
        for (key in defaults) {
          if (defaults.hasOwnProperty(key) && !options[key]) {
            options[key] = defaults[key];
          }
        }
      } else {
        options = defaults;
      }
      options.open = true;

      $minidialog.dialog(options);

      if (options.hideTitleBar) {
        $minidialog.parent().find(".ui-dialog-titlebar, .modal-title").css({
          display: "none",
          visibility: "hidden"
        });
      }

      $minidialog.find("#minidialog-close").click(function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        $minidialog.find(".content").html("");
        $minidialog.dialog("close")
          .dialog("destroy");
      });

      // Allow caller to change minidialog class for theming
      if (options['class']) {
        minidialog['class'] = options['class'];
      } else {
        minidialog['class'] = "";
      }

      // Appends some behaviors to forms inside to avoid multiple submits.
      if (options.ajaxify) {
        $minidialog
          .find("form")
          .each(function () {
            var $this = $(this);
            var action = $this.attr('action');
            var linkOptions = {
              minidialog: 1,
              ajaxify: 1,
              wide: options.wide ? 1 : 0
            };
            var opt;
            for (opt in linkOptions) {
              if (action && -1 === action.indexOf(opt + '=')) {
                if (-1 === action.indexOf('?')) {
                  action = action + '?' + opt + '=' + linkOptions[opt];
                } else {
                  action = action + '&' + opt + '=' + linkOptions[opt];
                }
              }
            }
            $this.attr('action', action);
          })
          .ajaxForm({
            dataType: 'json',
            success: function (response, status) {
              if ("string" === typeof response) {
                $minidialog.find('.content').html(response);
                Drupal.attachBehaviors($minidialog);
              } else {
                // Else attempt to pass that to Drupal.ajax and prey
                var element = $('<a href="" class="use-ajax">');
                var hugeHack = new Drupal.ajax('you_know_what', element, {url: 'system/ajax'});
                hugeHack.success(response, status);
              }
            }
          })
        ;
      }

      // setTimeout() call is a workaround: in some edge cases the dialog
      // opens too quickly and does not center properly according to content
      // size..
      // see http://stackoverflow.com/questions/2231446
      /*
       * ARGG... Actually, we do have a serious problem when using Drupal.ajax,
       * timeout will disallow some behaviors to be correctly set, I have no
       * idea why on earth this may happen.
       *
      setTimeout(function () {
        $minidialog.dialog("open");
      }, 500);
       */
    },

    /**
     * Used through a Drupal ajax command
     */
    MiniDialogClose: function (redirect) {
      if (redirect) {
        if (true === redirect || redirect === window.location.href) {
          if (window.location.reload) {
            window.location.reload();
          } else {
            window.location.href = window.location.href;
          }
        } else {
          window.location.href = redirect;
        }
      } else {
        $('#minidialog')
          .dialog("close")
          .dialog("destroy")
          .find('.content').html("");
      }
    }
  });

  Drupal.behaviors.minidialog = {
    attach: function (context) {

      // Create the necessary DOM element.
      $('body', context).once('minidialog', function () {
        $(this).append('<div id="minidialog" style="display:none;"><div class="content"></div></div>');
      });

      // Catch our links and add add the right parameter on them.
      $(this).once('minidialog').attr('href', function (i, h) {
        if (h.indexOf('minidialog=1') === -1) {
          h += (h.indexOf('?') !== -1 ? "&minidialog=1" : "?minidialog=1");
        }
        return h;
      });
    }
  };
}(jQuery, window));
