window.theme = window.theme || {};
window.slate = window.slate || {};

/* ================ SLATE ================ */
theme.Sections = function Sections() {
  this.constructors = {};
  this.instances = [];

  $(document)
    .on('shopify:section:load', this._onSectionLoad.bind(this))
    .on('shopify:section:unload', this._onSectionUnload.bind(this))
    .on('shopify:section:select', this._onSelect.bind(this))
    .on('shopify:section:deselect', this._onDeselect.bind(this))
    .on('shopify:block:select', this._onBlockSelect.bind(this))
    .on('shopify:block:deselect', this._onBlockDeselect.bind(this));
};

theme.Sections.prototype = _.assignIn({}, theme.Sections.prototype, {
  _createInstance: function(container, constructor) {
    var $container = $(container);
    var id = $container.attr('data-section-id');
    var type = $container.attr('data-section-type');

    constructor = constructor || this.constructors[type];

    if (_.isUndefined(constructor)) {
      return;
    }

    var instance = _.assignIn(new constructor(container), {
      id: id,
      type: type,
      container: container
    });

    this.instances.push(instance);
  },

  _onSectionLoad: function(evt) {
    var container = $('[data-section-id]', evt.target)[0];
    if (container) {
      this._createInstance(container);
    }
    if (AOS) {
      AOS.refreshHard();
    }
  },
  _loadSubSections: function() {
    if (AOS) {
      AOS.refreshHard();
    }
  },
  _onSectionUnload: function(evt) {
    this.instances = _.filter(this.instances, function(instance) {
      var isEventInstance = instance.id === evt.detail.sectionId;

      if (isEventInstance) {
        if (_.isFunction(instance.onUnload)) {
          instance.onUnload(evt);
        }
      }

      return !isEventInstance;
    });
  },

  _onSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onSelect)) {
      instance.onSelect(evt);
    }
  },

  _onDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onDeselect)) {
      instance.onDeselect(evt);
    }
  },

  _onBlockSelect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockSelect)) {
      instance.onBlockSelect(evt);
    }
  },

  _onBlockDeselect: function(evt) {
    // eslint-disable-next-line no-shadow
    var instance = _.find(this.instances, function(instance) {
      return instance.id === evt.detail.sectionId;
    });

    if (!_.isUndefined(instance) && _.isFunction(instance.onBlockDeselect)) {
      instance.onBlockDeselect(evt);
    }
  },

  register: function(type, constructor) {
    this.constructors[type] = constructor;

    $('[data-section-type=' + type + ']').each(
      function(index, container) {
        this._createInstance(container, constructor);
      }.bind(this)
    );
  }
});

window.slate = window.slate || {};

/**
 * iFrames
 * -----------------------------------------------------------------------------
 * Wrap videos in div to force responsive layout.
 *
 * @namespace iframes
 */

slate.rte = {
  wrapTable: function() {
    $('.rte table').wrap('<div class="rte__table-wrapper"></div>');
  },

  iframeReset: function() {
    var $iframeVideo = $(
      '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"]'
    );
    var $iframeReset = $iframeVideo.add('.rte iframe#admin_bar_iframe');

    $iframeVideo.each(function() {
      // Add wrapper to make video responsive
      $(this).wrap('<div class="video-wrapper"></div>');
    });

    $iframeReset.each(function() {
      // Re-set the src attribute on each iframe after page load
      // for Chrome's "incorrect iFrame content on 'back'" bug.
      // https://code.google.com/p/chromium/issues/detail?id=395791
      // Need to specifically target video and admin bar
      this.src = this.src;
    });
  }
};

window.slate = window.slate || {};

/**
 * A11y Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help make your theme more accessible
 * to users with visual impairments.
 *
 *
 * @namespace a11y
 */

slate.a11y = {
  /**
   * For use when focus shifts to a container rather than a link
   * eg for In-page links, after scroll, focus shifts to content area so that
   * next `tab` is where user expects if focusing a link, just $link.focus();
   *
   * @param {JQuery} $element - The element to be acted upon
   */
  pageLinkFocus: function($element) {
    var focusClass = 'js-focus-hidden';

    $element
      .first()
      .attr('tabIndex', '-1')
      .focus()
      .addClass(focusClass)
      .one('blur', callback);

    function callback() {
      $element
        .first()
        .removeClass(focusClass)
        .removeAttr('tabindex');
    }
  },

  /**
   * If there's a hash in the url, focus the appropriate element
   */
  focusHash: function() {
    var hash = window.location.hash;

    // is there a hash in the url? is it an element on the page?
    if (hash && document.getElementById(hash.slice(1))) {
      this.pageLinkFocus($(hash));
    }
  },

  /**
   * When an in-page (url w/hash) link is clicked, focus the appropriate element
   */
  bindInPageLinks: function() {
    $('a[href*=#]').on(
      'click',
      function(evt) {
        this.pageLinkFocus($(evt.currentTarget.hash));
      }.bind(this)
    );
  },

  /**
   * Traps the focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  trapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  },

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  removeTrapFocus: function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  }
};

/**
 * Currency Helpers
 * -----------------------------------------------------------------------------
 * A collection of useful functions that help with currency formatting
 *
 * Current contents
 * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
 *
 * Alternatives
 * - Accounting.js - http://openexchangerates.github.io/accounting.js/
 *
 */

theme.Currency = (function() {
  var moneyFormat = '${{amount}}'; // eslint-disable-line camelcase

  function formatMoney(cents, format) {
    if (typeof cents === 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || moneyFormat;

    function formatWithDelimiters(number, precision, thousands, decimal) {
      thousands = thousands || ',';
      decimal = decimal || '.';

      if (isNaN(number) || number === null) {
        return 0;
      }

      number = (number / 100.0).toFixed(precision);

      var parts = number.split('.');
      var dollarsAmount = parts[0].replace(
        /(\d)(?=(\d\d\d)+(?!\d))/g,
        '$1' + thousands
      );
      var centsAmount = parts[1] ? decimal + parts[1] : '';

      return dollarsAmount + centsAmount;
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_no_decimals_with_space_separator':
        value = formatWithDelimiters(cents, 0, ' ');
        break;
      case 'amount_with_apostrophe_separator':
        value = formatWithDelimiters(cents, 2, "'");
        break;
    }
    return formatString.replace(placeholderRegex, value);
  }

  return {
    formatMoney: formatMoney
  };
})();

/**
 * Image Helper Functions
 * -----------------------------------------------------------------------------
 * A collection of functions that help with basic image operations.
 *
 */

theme.Images = (function() {
  /**
   * Preloads an image in memory and uses the browsers cache to store it until needed.
   *
   * @param {Array} images - A list of image urls
   * @param {String} size - A shopify image size attribute
   */

  function preload(images, size) {
    if (typeof images === 'string') {
      images = [images];
    }

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      this.loadImage(this.getSizedImageUrl(image, size));
    }
  }

  /**
   * Loads and caches an image in the browsers cache.
   * @param {string} path - An image url
   */
  function loadImage(path) {
    new Image().src = path;
  }

  /**
   * Swaps the src of an image for another OR returns the imageURL to the callback function
   * @param image
   * @param element
   * @param callback
   */
  function switchImage(image, element, callback) {
    var size = this.imageSize(element.src);
    var imageUrl = this.getSizedImageUrl(image.src, size);

    if (callback) {
      callback(imageUrl, image, element); // eslint-disable-line callback-return
    } else {
      element.src = imageUrl;
    }
  }

  /**
   * +++ Useful
   * Find the Shopify image attribute size
   *
   * @param {string} src
   * @returns {null}
   */
  function imageSize(src) {
    src = src || '';

    var match = src.match(
      /.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\\.@]/
    );

    if (match === null) {
      return null;
    } else {
      return match[1];
    }
  }

  /**
   * +++ Useful
   * Adds a Shopify size attribute to a URL
   *
   * @param src
   * @param size
   * @returns {*}
   */
  function getSizedImageUrl(src, size) {
    if (size === null) {
      return src;
    }

    if (size === 'master') {
      return this.removeProtocol(src);
    }

    var match = src.match(
      /\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i
    );

    if (match !== null) {
      var prefix = src.split(match[0]);
      var suffix = match[0];

      return this.removeProtocol(prefix[0] + '_' + size + suffix);
    }

    return null;
  }

  function removeProtocol(path) {
    return path.replace(/http(s)?:/, '');
  }

  return {
    preload: preload,
    loadImage: loadImage,
    switchImage: switchImage,
    imageSize: imageSize,
    getSizedImageUrl: getSizedImageUrl,
    removeProtocol: removeProtocol
  };
})();

/**
 * Variant Selection scripts
 * ------------------------------------------------------------------------------
 *
 * Handles change events from the variant inputs in any `cart/add` forms that may
 * exist.  Also updates the master select and triggers updates when the variants
 * price or image changes.
 *
 * @namespace variants
 */

slate.Variants = (function() {
  /**
   * Variant constructor
   *
   * @param {object} options - Settings from `product.js`
   */
  function Variants(options) {
    this.$container = options.$container;
    this.product = options.product;
    this.singleOptionSelector = options.singleOptionSelector;
    this.originalSelectorId = options.originalSelectorId;
    this.enableHistoryState = options.enableHistoryState;
    this.currentVariant = this._getVariantFromOptions();
    
    $(this.singleOptionSelector, this.$container).on(
      'change',
      this._onSelectChange.bind(this)
    );
  }

  Variants.prototype = _.assignIn({}, Variants.prototype, {
    /**
     * Get the currently selected options from add-to-cart form. Works with all
     * form input elements.
     *
     * @return {array} options - Values of currently selected variants
     */
    _getCurrentOptions: function() {
      var currentOptions = _.map(
        $(this.singleOptionSelector, this.$container),
        function(element) {
          var $element = $(element);
          var type = $element.attr('type');
          var currentOption = {};

          if (type === 'radio' || type === 'checkbox') {
            if ($element[0].checked) {
              currentOption.value = $element.val();
              currentOption.index = $element.data('index');

              return currentOption;
            } else {
              return false;
            }
          } else {
            currentOption.value = $element.val();
            currentOption.index = $element.data('index');

            return currentOption;
          }
        }
      );

      // remove any unchecked input values if using radio buttons or checkboxes
      currentOptions = _.compact(currentOptions);

      return currentOptions;
    },

    /**
     * Find variant based on selected values.
     *
     * @param  {array} selectedValues - Values of variant inputs
     * @return {object || undefined} found - Variant object from product.variants
     */
    _getVariantFromOptions: function() {
      var selectedValues = this._getCurrentOptions();
      var variants = this.product.variants;

      for (var e = selectedValues, s = variants, found = _.find(s, function(variant) {
        return e.every(function(values) {
          return _.isEqual(variant[values.index], values.value)
        })
      }), r = 0; r < e.length; r++) {
      var t = r + 1;
      $(".js-swatch-display--" + t).text(e[r].value)
    }
      return found;
    },

    /**
     * Event handler for when a variant input changes.
     */
    _onSelectChange: function() {
      var variant = this._getVariantFromOptions();

      this.$container.trigger({
        type: 'variantChange',
        variant: variant
      });

      if (!variant) {
        return;
      }

      this._updateMasterSelect(variant);
      this._updateImages(variant);
      this._updatePrice(variant);
      this._updateSKU(variant);
      this.currentVariant = variant;

      if (this.enableHistoryState) {
        this._updateHistoryState(variant);
      }
    },

    /**
     * Trigger event when variant image changes
     *
     * @param  {object} variant - Currently selected variant
     * @return {event}  variantImageChange
     */
    _updateImages: function(variant) {
      var variantImage = variant.featured_image || {};
      var currentVariantImage = this.currentVariant.featured_image || {};

      if (
        !variant.featured_image ||
        variantImage.src === currentVariantImage.src
      ) {
        return;
      }

      this.$container.trigger({
        type: 'variantImageChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant price changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantPriceChange
     */
    _updatePrice: function(variant) {
      if (
        variant.price === this.currentVariant.price &&
        variant.compare_at_price === this.currentVariant.compare_at_price
      ) {
        return;
      }

      this.$container.trigger({
        type: 'variantPriceChange',
        variant: variant
      });
    },

    /**
     * Trigger event when variant sku changes.
     *
     * @param  {object} variant - Currently selected variant
     * @return {event} variantSKUChange
     */
    _updateSKU: function(variant) {
      if (variant.sku === this.currentVariant.sku) {
        return;
      }

      this.$container.trigger({
        type: 'variantSKUChange',
        variant: variant
      });
    },
    /**
     * Update history state for product deeplinking
     *
     * @param  {variant} variant - Currently selected variant
     * @return {k}         [description]
     */
    _updateHistoryState: function(variant) {
      if (!history.replaceState || !variant) {
        return;
      }

      var newurl =
        window.location.protocol +
        '//' +
        window.location.host +
        window.location.pathname +
        '?variant=' +
        variant.id;
      window.history.replaceState({ path: newurl }, '', newurl);
    },

    /**
     * Update hidden master select of variant change
     *
     * @param  {variant} variant - Currently selected variant
     */
    _updateMasterSelect: function(variant) {
      $(this.originalSelectorId, this.$container).val(variant.id);
    }
  });

  return Variants;
})();


/*================ MODULES ================*/
theme.Drawers = (function() {
  var Drawer = function(id, position, options) {
    var defaults = {
      close: '.js-drawer-close',
      open: '.js-drawer-open-' + position,
      openClass: 'js-drawer-open',
      dirOpenClass: 'js-drawer-open-' + position
    };

    this.nodes = {
      $parent: $('body, html'),
      $page: $('.page-element')
    };

    this.config = $.extend(defaults, options);
    this.position = position;

    this.$drawer = $('#' + id);
    if (!this.$drawer.length) {
      return false;
    }

    this.drawerIsOpen = false;
    this.init();
  };

  Drawer.prototype.init = function() {
    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$drawer.on('click', this.config.close, $.proxy(this.close, this));
    
  };

  Drawer.prototype.open = function(evt) {
    // Keep track if drawer was opened from a click, or called by another function
    var externalCall = false;

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the drawer opens, the click event bubbles up to $nodes.page
    // which closes the drawer.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.drawerIsOpen && !externalCall) {
      return this.close();
    }

    // Add is-transitioning class to moved elements on open so drawer can have
    // transition for close animation
    this.$drawer.prepareTransition();

    this.nodes.$parent.addClass(
      this.config.openClass + ' ' + this.config.dirOpenClass
      
    );
    this.drawerIsOpen = true;

    // Set focus on drawer
    this.trapFocus({
      $container: this.$drawer,
      $elementToFocus: this.$drawer.find('.drawer__close-button'),
      namespace: 'drawer_focus'
    });

    // Run function when draw opens if set
    if (
      this.config.onDrawerOpen &&
      typeof this.config.onDrawerOpen === 'function'
    ) {
      if (!externalCall) {
        this.config.onDrawerOpen();
      }
    }

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.nodes.$parent.on(
      'keyup.drawer',
      $.proxy(function(evt) {
        // close on 'esc' keypress
        if (evt.keyCode !== 27) return;

        this.close();
      }, this)
    );

    // Lock scrolling on mobile
    this.nodes.$page.on('touchmove.drawer', function() {
      return false;
    });

    this.nodes.$page.on(
      'click.drawer',
      $.proxy(function() {
        this.close();
        return false;
      }, this)
    );
  };

  Drawer.prototype.close = function() {
    if (!this.drawerIsOpen) return;

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    // Ensure closing transition is applied to moved elements, like the nav
    this.$drawer.prepareTransition();

    this.nodes.$parent.removeClass(
      this.config.dirOpenClass + ' ' + this.config.openClass
    );

    this.drawerIsOpen = false;

    // Remove focus on drawer
    this.removeTrapFocus({
      $container: this.$drawer,
      namespace: 'drawer_focus'
    });

    this.nodes.$page.off('.drawer');
    this.nodes.$parent.off('.drawer');
  };

  /**
  * Traps the focus in a particular container
  *
  * @param {object} options - Options to be used
  * @param {jQuery} options.$container - Container to trap focus within
  * @param {jQuery} options.$elementToFocus - Element to be focused when focus leaves container
  * @param {string} options.namespace - Namespace used for new focus event handler
  */
  Drawer.prototype.trapFocus = function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (!options.$elementToFocus) {
      options.$elementToFocus = options.$container;
    }

    options.$container.attr('tabindex', '-1');
    options.$elementToFocus.focus();

    $(document).on(eventName, function(evt) {
      if (
        options.$container[0] !== evt.target &&
        !options.$container.has(evt.target).length
      ) {
        options.$container.focus();
      }
    });
  };

  /**
   * Removes the trap of focus in a particular container
   *
   * @param {object} options - Options to be used
   * @param {jQuery} options.$container - Container to trap focus within
   * @param {string} options.namespace - Namespace used for new focus event handler
   */
  Drawer.prototype.removeTrapFocus = function(options) {
    var eventName = options.namespace
      ? 'focusin.' + options.namespace
      : 'focusin';

    if (options.$container && options.$container.length) {
      options.$container.removeAttr('tabindex');
    }

    $(document).off(eventName);
  };

  return Drawer;
})();

window.Modals = (function() {
  var Modal = function(id, name, options) {
    var defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-' + name,
      openClass: 'modal--is-active'
    };

    this.$modal = $('#' + id);

    if (!this.$modal.length) {
      return false;
    }

    this.nodes = {
      $body: $('body')
    };

    this.config = $.extend(defaults, options);

    this.modalIsOpen = false;
    this.$focusOnOpen = this.config.focusOnOpen
      ? $(this.config.focusOnOpen)
      : this.$modal;
    this.init();
  };

  Modal.prototype.init = function() {
    var $openBtn = $(this.config.open);

    // Add aria controls
    $openBtn.attr('aria-expanded', 'false');

    $(this.config.open).on('click', $.proxy(this.open, this));
    this.$modal.find(this.config.close).on('click', $.proxy(this.close, this));
  };

  Modal.prototype.open = function(evt) {
    // Keep track if modal was opened from a click, or called by another function
    var externalCall = false;

    // don't open an opened modal
    if (this.modalIsOpen) {
      return;
    }

    // Prevent following href if link is clicked
    if (evt) {
      evt.preventDefault();
    } else {
      externalCall = true;
    }

    // Without this, the modal opens, the click event bubbles up to $nodes.page
    // which closes the modal.
    if (evt && evt.stopPropagation) {
      evt.stopPropagation();
      // save the source of the click, we'll focus to this on close
      this.$activeSource = $(evt.currentTarget);
    }

    if (this.modalIsOpen && !externalCall) {
      return this.close();
    }

    this.$modal.prepareTransition().addClass(this.config.openClass);
    this.nodes.$body.addClass(this.config.openClass);

    this.modalIsOpen = true;

    // Set focus on modal
    slate.a11y.trapFocus({
      $container: this.$modal,
      namespace: 'modal_focus',
      $elementToFocus: this.$focusOnOpen
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'true');
    }

    this.bindEvents();
  };

  Modal.prototype.close = function() {
    // don't close a closed modal
    if (!this.modalIsOpen) {
      return;
    }

    // deselect any focused form elements
    $(document.activeElement).trigger('blur');

    this.$modal.prepareTransition().removeClass(this.config.openClass);
    this.nodes.$body.removeClass(this.config.openClass);

    this.modalIsOpen = false;

    // Remove focus on modal
    slate.a11y.removeTrapFocus({
      $container: this.$modal,
      namespace: 'modal_focus'
    });

    if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
      this.$activeSource.attr('aria-expanded', 'false').focus();
    }

    this.unbindEvents();
  };

  Modal.prototype.bindEvents = function() {
    // Pressing escape closes modal
    this.nodes.$body.on(
      'keyup.modal',
      $.proxy(function(evt) {
        if (evt.keyCode === 27) {
          this.close();
        }
      }, this)
    );
  };

  Modal.prototype.unbindEvents = function() {
    this.nodes.$body.off('.modal');
  };

  return Modal;
})();

window.QtySelector = (function() {
  var QtySelector = function($el) {
    this.cache = {
      $body: $('body'),
      $subtotal: $('#CartSubtotal'),
      $discountTotal: $('#cartDiscountTotal'),
      $cartTable: $('.cart-table'),
      $cartTemplate: $('#CartProducts')
    };

    this.settings = {
      loadingClass: 'js-qty--is-loading',
      isCartTemplate: this.cache.$body.hasClass('template-cart'),
      // On the cart template, minimum is 0. Elsewhere min is 1
      minQty: this.cache.$body.hasClass('template-cart') ? 0 : 1
    };

    this.$el = $el;
    this.qtyUpdateTimeout;
    this.createInputs();
    this.bindEvents();
  };

  QtySelector.prototype.createInputs = function() {
    var $el = this.$el;

    var data = {
      value: $el.val(),
      key: $el.attr('id'),
      name: $el.attr('name'),
      line: $el.attr('data-line')
    };
    var source = $('#QuantityTemplate').html();
    var template = Handlebars.compile(source);

    this.$wrapper = $(template(data)).insertBefore($el);

    // Remove original number input
    $el.remove();
  };

  QtySelector.prototype.validateAvailability = function(line, quantity) {
    var product = theme.cartObject.items[line - 1]; // 0-based index in API
    var handle = product.handle; // needed for the ajax request
    var id = product.id; // needed to find right variant from ajax results

    var params = {
      type: 'GET',
      url: '/products/' + handle + '.js',
      dataType: 'json',
      success: $.proxy(function(cartProduct) {
        this.validateAvailabilityCallback(line, quantity, id, cartProduct);
      }, this)
    };

    $.ajax(params);
  };

  QtySelector.prototype.validateAvailabilityCallback = function(
    line,
    quantity,
    id,
    product
  ) {
    var quantityIsAvailable = true;

    // This returns all variants of a product.
    // Loop through them to get our desired one.
    for (var i = 0; i < product.variants.length; i++) {
      var variant = product.variants[i];
      if (variant.id === id) {
        break;
      }
    }

    // If the variant tracks inventory and does not sell when sold out
    // we can compare the requested with available quantity
    if (
      variant.inventory_management !== null &&
      variant.inventory_policy === 'deny'
    ) {
      if (variant.inventory_quantity < quantity) {

        // Set quantity to max amount available
        this.$wrapper.find('.js-qty__input').val(variant.inventory_quantity);

        quantityIsAvailable = false;
        this.$wrapper.removeClass(this.settings.loadingClass);
      }
    }

    if (quantityIsAvailable) {
      this.updateItemQuantity(line, quantity);
    }
  };

  QtySelector.prototype.validateQty = function(qty) {
    if (parseFloat(qty) === parseInt(qty, 10) && !isNaN(qty)) {
      // We have a valid number!
    } else {
      // Not a number. Default to 1.
      qty = 1;
    }
    return parseInt(qty, 10);
  };

  QtySelector.prototype.adjustQty = function(evt) {
    var $el = $(evt.currentTarget);
    var $input = $el.siblings('.js-qty__input');
    var qty = this.validateQty($input.val());
    var line = $input.attr('data-line');

    if ($el.hasClass('js-qty__adjust--minus')) {
      qty -= 1;
      if (qty <= this.settings.minQty) {
        qty = this.settings.minQty;
      }
    } else {
      qty += 1;
    }

    if (this.settings.isCartTemplate) {
      $el.parent().addClass(this.settings.loadingClass);
      this.updateCartItemPrice(line, qty);
    } else {
      $input.val(qty);
    }
  };

  QtySelector.prototype.bindEvents = function() {
    this.$wrapper
      .find('.js-qty__adjust')
      .on('click', $.proxy(this.adjustQty, this));

    // Select input text on click
    this.$wrapper.on('click', '.js-qty__input', function() {
      this.setSelectionRange(0, this.value.length);
    });

    // If the quantity changes on the cart template, update the price
    if (this.settings.isCartTemplate) {
      this.$wrapper.on(
        'change',
        '.js-qty__input',
        $.proxy(function(evt) {
          var $input = $(evt.currentTarget);
          var line = $input.attr('data-line');
          var qty = this.validateQty($input.val());
          $input.parent().addClass(this.settings.loadingClass);
          this.updateCartItemPrice(line, qty);
        }, this)
      );
    }
  };

  QtySelector.prototype.updateCartItemPrice = function(line, qty) {
    // Update cart after short timeout so user doesn't create simultaneous ajax calls
    clearTimeout(this.qtyUpdateTimeout);
    this.qtyUpdateTimeout = setTimeout(
      $.proxy(function() {
        this.validateAvailability(line, qty);
      }, this),
      200
    );
  };

  QtySelector.prototype.updateItemQuantity = function(line, quantity) {
    var params = {
      type: 'POST',
      url: '/cart/change.js',
      data: 'quantity=' + quantity + '&line=' + line,
      dataType: 'json',
      success: $.proxy(function(cart) {
        this.updateCartItemCallback(cart);
      }, this)
    };

    $.ajax(params);
  };

  QtySelector.prototype.updateCartItemCallback = function(cart) {
    // Reload the page to show the empty cart if no items
    if (cart.item_count === 0) {
      location.reload();
      return;
    }

    // Update cart object
    theme.cartObject = cart;

    // Handlebars.js cart layout
    var data = {};
    var items = [];
    var item = {};
    var source = $('#CartProductTemplate').html();
    var template = Handlebars.compile(source);
    var prodImg;

    // Add each item to our handlebars.js data
    $.each(cart.items, function(index, cartItem) {
      /* Hack to get product image thumbnail
       *   - If image is not null
       *     - Remove file extension, add 240x240, and re-add extension
       *     - Create server relative link
       *   - A hard-coded url of no-image
       */

      if (cartItem.image === null) {
        prodImg =
          '//cdn.shopify.com/s/assets/admin/no-image-medium-cc9732cb976dd349a0df1d39816fbcc7.gif';
      } else {
        prodImg = cartItem.image
          .replace(/(\.[^.]*)$/, '_240x240$1')
          .replace('http:', '');
      }

      if (cartItem.properties !== null) {
        $.each(cartItem.properties, function(key, value) {
          if (key.charAt(0) === '_' || !value) {
            delete cartItem.properties[key];
          }
        });
      }

      // Create item's data object and add to 'items' array
      item = {
        key: cartItem.key,
        line: index + 1, // Shopify uses a 1+ index in the API
        url: cartItem.url,
        img: prodImg,
        name: cartItem.product_title,
        variation: cartItem.variant_title,
        properties: cartItem.properties,
        itemQty: cartItem.quantity,
        price: theme.Currency.formatMoney(cartItem.price, theme.moneyFormat),
        vendor: cartItem.vendor,
        linePrice: theme.Currency.formatMoney(
          cartItem.line_price,
          theme.moneyFormat
        ),
        originalLinePrice: theme.Currency.formatMoney(
          cartItem.original_line_price,
          theme.moneyFormat
        ),
        discounts: cartItem.discounts,
        discountsApplied:
          cartItem.line_price === cartItem.original_line_price ? false : true
      };

      items.push(item);
      //theme.updateCurrencies();
    });

    // Gather all cart data and add to DOM
    data = {
      items: items
    };
    this.cache.$cartTemplate.empty().append(template(data));

    // Create new quantity selectors
    this.cache.$cartTable.find('input[type="number"]').each(function(i, el) {
      new QtySelector($(el));
    });

    // Update the cart subtotal
    this.cache.$subtotal.html(
      theme.Currency.formatMoney(cart.total_price, theme.moneyFormat)
    );

    // Update the cart total discounts
    if (cart.total_discount > 0) {
      this.cache.$discountTotal.html(
        theme.strings.totalCartDiscount.replace(
          '[savings]',
          theme.Currency.formatMoney(cart.total_discount, theme.moneyFormat)
        )
      );
    } else {
      this.cache.$discountTotal.empty();
    }
    
    theme.miniCart.updateElements();
    //theme.updateCurrencies();
    // Set focus on cart table
    slate.a11y.pageLinkFocus(this.cache.$cartTable);
  };

  return QtySelector;
})();

/*
  Allow product to be added to cart via ajax with
  custom success and error responses.
*/
window.AjaxCart = (function() {
  var styleCart = $('.js-mini-cart').attr("data-cartmini");
  var cart = function($form) {
    this.cache = {
      $cartIconIndicator: $('.site-header__cart-indicator')
    };

    this.$form = $form;
    this.eventListeners();
    
    this.showNotice = false;
    if (this.$form.length) {
      this.showNotice  = this.$form.hasClass('js-form--notice')? true : false;
    }
  };

  cart.prototype.eventListeners = function() {
    if (this.$form.length) {
      this.$form.on('submit', $.proxy(this.addItemFromForm, this));
    }
  };

  cart.prototype.addItemFromForm = function(evt) {
    evt.preventDefault();
    var $form = this.$form;
    var $submitButton = $form.find('button[type="submit"]');
    $submitButton.addClass('is-loading');
    var params = {
      type: 'POST',
      url: '/cart/add.js',
      data: this.$form.serialize(),
      dataType: 'json',
      success: $.proxy(function(lineItem) {
        this.success(lineItem);
      }, this),
      error: $.proxy(function(XMLHttpRequest, textStatus) {
        this.error(XMLHttpRequest, textStatus);
      }, this),
      complete: function() {
        $submitButton.removeClass('is-loading');
      }
    };
    $.ajax(params);
  };
  
  cart.prototype.success = function(item) {
    theme.miniCart.updateElements();
    theme.miniCart.generateCart();
    if(styleCart != 'true' ){
      if (this.showNotice) {
        var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
        var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
        theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice');
      }else{
        theme.crosssell.showPopup(item);
      }
    }
  };

  // Error handling reference from Shopify.onError in api.jquery.js
  cart.prototype.error = function(XMLHttpRequest) {
    var data = JSON.parse(XMLHttpRequest.responseText);
    
    if (data.message) {
      theme.alert.new('',data.description,3000,'warning');
    }
  };

  return cart;
})();

/*================ TEMPLATES ================*/
theme.customerTemplates = (function() {
  function initEventListeners() {
    // Show reset password form
    $('#RecoverPassword').on('click', function(evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });

    // Hide reset password form
    $('#HideRecoverPasswordLink').on('click', function(evt) {
      evt.preventDefault();
      toggleRecoverPasswordForm();
    });
  }

  /**
   *
   *  Show/Hide recover password form
   *
   */
  function toggleRecoverPasswordForm() {
    $('#RecoverPasswordForm').toggleClass('hide');
    $('#CustomerLoginForm').toggleClass('hide');
  }

  /**
   *
   *  Show reset password success message
   *
   */
  function resetPasswordSuccess() {
    // check if reset password form was successfully submited
    if (!$('.reset-password-success').length) {
      return;
    }

    // show success message
    $('#ResetSuccess').removeClass('hide');
  }

  /**
   *
   *  Show/hide customer address forms
   *
   */
  function customerAddressForm() {
    var $newAddressForm = $('#AddressNewForm');

    if (!$newAddressForm.length) {
      return;
    }

    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(
        'AddressCountryNew',
        'AddressProvinceNew',
        {
          hideElement: 'AddressProvinceContainerNew'
        }
      );
    }

    // Initialize each edit form's country/province selector
    $('.address-country-option').each(function() {
      var formId = $(this).data('form-id');
      var countrySelector = 'AddressCountry_' + formId;
      var provinceSelector = 'AddressProvince_' + formId;
      var containerSelector = 'AddressProvinceContainer_' + formId;

      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
        hideElement: containerSelector
      });
    });

    // Toggle new/edit address forms
    $('.address-new-toggle').on('click', function() {
      $newAddressForm.toggleClass('hide');
    });

    $('.address-edit-toggle').on('click', function() {
      var formId = $(this).data('form-id');
      $('#EditAddress_' + formId).toggleClass('hide');
    });

    $('.address-delete').on('click', function() {
      var $el = $(this);
      var formId = $el.data('form-id');
      var confirmMessage = $el.data('confirm-message');

      // eslint-disable-next-line no-alert
      if (
        confirm(
          confirmMessage || 'Are you sure you wish to delete this address?'
        )
      ) {
        Shopify.postLink('/account/addresses/' + formId, {
          parameters: { _method: 'delete' }
        });
      }
    });
  }

  /**
   *
   *  Check URL for reset password hash
   *
   */
  function checkUrlHash() {
    var hash = window.location.hash;

    // Allow deep linking to recover password form
    if (hash === '#recover') {
      toggleRecoverPasswordForm();
    }
  }

  return {
    init: function() {
      checkUrlHash();
      initEventListeners();
      resetPasswordSuccess();
      customerAddressForm();
    }
  };
})();

/*================ SECTIONS ================*/
theme.HeaderSection = (function() {
  function HeaderSection(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    var stickyId = $container.attr('data-sticky');
    theme.NavDrawer = new theme.Drawers('NavDrawer', 'left');
    this.selectors = {
      headerID : '.section-' + sectionId,
      typeHeader : stickyId ,
    }
    this.init();
    
  }
  HeaderSection.prototype = _.assignIn({}, HeaderSection.prototype, {
    init: function() {
      this.stickyHeader();
      this.headerSearch();
      this.headerHeight();
      this.delayMenu();
    },
    headerHeight : function(){
      var header = document.querySelector('.site-header');
      var rootElement = document.querySelector(':root');
      rootElement.style.setProperty("--height-header", header.offsetHeight + "px");
    },
    headerSearch: function(){
      let modalOpen =  document.querySelector(".modal__toggle-open"),
          close = document.querySelector(".search-modal__close-button"),
          searchMobile = document.querySelector(".modal__toggle-search-mobile");
          input = document.getElementById("Search-In-Modal"),
          overlayOpen  = document.querySelector(".modal-overlay");

      modalOpen.addEventListener("click", toggleClassSearch);
      overlayOpen.addEventListener("click", toggleClassSearch);
      close.addEventListener("click", toggleClassSearch);
      searchMobile.addEventListener("click", toggleClassSearch);
     
      function toggleClassSearch(){
        document.querySelector(".detail-modal").classList.toggle("active");
        overlayOpen.classList.toggle("active");
        if (window.matchMedia('(min-width: 992px)').matches) {
          input.focus();
        }
      }
      overlayOpen.addEventListener('click', function(){
        input.value = '';
        document.querySelector('.predictive-search').style.display = 'none';
      });
      close.addEventListener('click', function(){
        input.value = '';
        document.querySelector('.predictive-search').style.display = 'none';
      });
    },
    // Stickyheader
    stickyHeader: function() {
      var stickHeaderClass = this.selectors.headerID ;
      var stickyHeader =  this.selectors.typeHeader;
      var offsetHeight = document.querySelector(stickHeaderClass).clientHeight.toString();
      var prevScrollpos = window.pageYOffset;
     if( stickyHeader === 'sticky' ){
       window.onscroll = debounce(function() {
        var currentScrollPos = window.pageYOffset;
        if (currentScrollPos > 30) {
            setTimeout(function() {
                document.querySelector(stickHeaderClass).classList.add("active");
            }, 0); 
        } else {
            setTimeout(function() {
                document.querySelector(stickHeaderClass).classList.remove("active");
            }, 0); 
        }
        prevScrollpos = currentScrollPos;
    }, 100); 
      }
      else if (stickyHeader === 'sticky-top' ){ 
        const mediaQuery = window.matchMedia('(min-width: 1000px)')
        
        window.onscroll = function() {
          var currentScrollPos = window.pageYOffset;
          if (prevScrollpos > currentScrollPos && prevScrollpos - currentScrollPos > offsetHeight) {
            function responsiveHeader(){
              if (mediaQuery.matches) {
                document.querySelector(stickHeaderClass).style.top = "0";
              }
            }
            responsiveHeader();
            document.addEventListener("resize", event => {responsiveHeader()});
            if(currentScrollPos == 0){
              document.querySelector(stickHeaderClass).classList.remove("active");
            }
            else{
              document.querySelector(stickHeaderClass).classList.add("active");
            }
            
          } else if (currentScrollPos - prevScrollpos > offsetHeight) {
            function responsiveHeader2(){
              if (mediaQuery.matches) {
                document.querySelector(stickHeaderClass).style.top = `-${offsetHeight}px`;
              }
            }
            responsiveHeader2();
            document.addEventListener("resize", event => {responsiveHeader2()});
            document.querySelector(stickHeaderClass).classList.remove("active");
          }
          prevScrollpos = currentScrollPos;
        }
        
      }
      else{
        return null;
      }
      function debounce(func, wait) {
          var timeout;
          return function executedFunction() {
              var context = this;
              var args = arguments;
              var later = function() {
                  timeout = null;
                  func.apply(context, args);
              };
              clearTimeout(timeout);
              timeout = setTimeout(later, wait);
          };
      }
    },
    // hoverMenu
    delayMenu: function(){
      var megaMenu = $('.site-nav__item-mega');  
      megaMenu.each(function( index ) {
        var childLink = $(this).find('.d-col-link');
        childLink.each(function( i ) {
          $(this).css("animation-delay", `${(i+1)/10 * 0.8}s`);
        });
      });
    }
  });

  return HeaderSection;
})();

theme.CartDraw = (function() {
  theme.testDrawer = new theme.Drawers('testDrawer', 'left');
  /*$('.drawer-crossell-product').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    variableWidth: true,
    dots: false,
    arrows:true,
    infinite:false,
  });*/
  /*$(document).ready(function() {
    $('body').on('click', '[name="checkout"], [name="goto_pp"], [name="goto_gc"]', function() {
      if ($('#agree_checkout').is(':checked')) {
        $(this).submit();
      }
      else {
        alert("You must agree with the terms and conditions of sales to check out.");
        return false;
      }
    });
  });*/
})();

theme.Product = (function() {
  var defaults = {
    smallBreakpoint: 750,
    productThumbIndex: 0,
    productThumbMax: 0,
    ajaxCart: false,
    stockSetting: false
  };

  function Product(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    var sectionTem = $container.attr('data-id');

    this.selectors = {
      originalSelectorId: '#ProductSelect-' + sectionId,
      modal: 'ProductModal',
      productZoomImage: '#ProductZoomImg',
      addToCart: '#AddToCart-' + sectionId,
      productPrice: '#ProductPrice-' + sectionId,
      comparePrice: '#ComparePrice-' + sectionId,
      addToCartText: '#AddToCartText-' + sectionId,
      SKU: '.js-variant-sku',
      productImageMain: '.gallery-wrap'+ sectionId,
      productImageContainers: '.product__photo-container-' + sectionId,
      productImageWrappers: '.product__photo-wrapper-' + sectionId,
      productThumbContainers: '.product-single__thumbnail-item-' + sectionId,
      productThumbsWrapper: '.product-single__thumbnails-' + sectionId,
      productThumbs: '.product-single__thumbnail-' + sectionId,
      saleTag: '#ProductSaleTag-' + sectionId,
      productStock: '#ProductStock-' + sectionId,
      singleOptionSelector: '.single-option-selector-' + sectionId,
      shopifyPaymentButton: '.shopify-payment-button',
      availability: '.product-single__availability',
      hurrify : '.js-hurrify',
      txtHurrify : '.js-hurrify .js-txt-hurrify',
      labelwrap_sale: '.product-tag-sale',
      numbersale_change : '.product-tag-sale-number'

    };
    this.settings = $.extend({}, defaults, {
      sectionId: sectionId,
      sectionTem:sectionTem,
      ajaxCart: $container.data('ajax'),
      stockSetting: $container.data('stock'),
      enableHistoryState: $container.data('enable-history-state') || false,
      namespace: '.product-' + sectionId
    });

    // Stop parsing if we don't have the product json script tag
    if (!$('#ProductJson-' + sectionId).html()) {
      return;
    }

    this.productSingleObject = JSON.parse(
      $('#ProductJson-' + sectionId).html()
    );
    this.addVariantInfo();

    this.init();
  }

  Product.prototype = _.assignIn({}, Product.prototype, {
    init: function() {
      this._stringOverrides();
      this._initVariants();
      this._productZoomImage();
      this._productThumbSwitch();
      this._productThumbnailSlider();
      this._initQtySelector();

      if (this.settings.ajaxCart) {
        theme.AjaxCart = new window.AjaxCart(
          $('#AddToCartForm-' + this.settings.sectionId)
        );
      }
    },

    _stringOverrides: function() {
      window.productStrings = window.productStrings || {};
      $.extend(theme.strings, window.productStrings);
    },

    addVariantInfo: function() {
      if (!this.productSingleObject || !this.settings.stockSetting) {
        return;
      }

      var variantInfo = JSON.parse(
        $('#VariantJson-' + this.settings.sectionId).html()
      );

      for (var i = 0; i < variantInfo.length; i++) {
        $.extend(this.productSingleObject.variants[i], variantInfo[i]);
      }
    },

    _initVariants: function() {
      var options = {
        $container: this.$container,
        enableHistoryState: this.settings.enableHistoryState,
        product: this.productSingleObject,
        singleOptionSelector: this.selectors.singleOptionSelector,
        originalSelectorId: this.selectors.originalSelectorId
      };

      // eslint-disable-next-line no-new
      this.variants = new slate.Variants(options);
      var variant = this.variants
      if( variant.currentVariant.compare_at_price > variant.currentVariant.price){
        var load_sale_minus = variant.currentVariant.compare_at_price - variant.currentVariant.price;
        var load_sale_per = load_sale_minus*100 / variant.currentVariant.compare_at_price;
        var load_roundNumber = parseInt(load_sale_per);
        $(this.selectors.numbersale_change).text(`${load_roundNumber}%`);
        $(this.selectors.labelwrap_sale).removeClass('hide');
      }else{
        $(this.selectors.labelwrap_sale).addClass('hide');
      }
      this.$container.on(
        'variantChange' + this.settings.namespace,
        this._updateAddToCartBtn.bind(this)
      );
      this.$container.on(
        'variantChange' + this.settings.namespace,
        this._updateStickyCart.bind(this)
      );
      this.$container.on(
        'variantPriceChange' + this.settings.namespace,
        this._updatePrice.bind(this)
      );
      this.$container.on(
        'variantSKUChange' + this.settings.namespace,
        this._updateSKU.bind(this)
      );
      this.$container.on(
        'variantImageChange' + this.settings.namespace,
        this._updateImages.bind(this)
      );
      this.$container.on(
        'variantChange' + this.settings.namespace,
        this._updateSwatchTitle.bind(this)
      );
    },

    _updateStock: function(variant) {
      if (!this.settings.stockSetting) return;

      var $stock = $(this.selectors.productStock),
          $hurrify = $(this.selectors.hurrify),
          $txtHurrify  = $(this.selectors.txtHurrify);

      // If we don't track variant inventory, hide stock
      if (!variant || !variant.inventory_management) {
        $stock.addClass('hide');
        $hurrify.addClass('hide');
        return;
      }

      if (variant.inventory_quantity < 10 && variant.inventory_quantity > 0) {
        $stock
          .html(
            theme.strings.stockAvailable.replace(
              '1',
              variant.inventory_quantity
            )
          )
          .removeClass('hide');
        $hurrify.removeClass('hide').find('.progress-bar').css('width',variant.inventory_quantity*10+'%');
        $txtHurrify.html(
          theme.strings.stringHurrify.replace(
            'number',
            variant.inventory_quantity
          )
        );
        console.log(variant.inventory_quantity);
        return;
      }

      if (variant.inventory_quantity <= 0 && variant.incoming) {
        $stock
          .html(
            theme.strings.willNotShipUntil.replace(
              '[date]',
              variant.next_incoming_date
            )
          )
          .removeClass('hide');
        $hurrify.addClass('hide');
        return;
      }

      // If there's more than 10 available, hide stock
      $stock.addClass('hide');
      $hurrify.addClass('hide');
    },

    _updateIncomingInfo: function(variant) {
      if (!this.settings.stockSetting) return;

      var $stock = $(this.selectors.productStock);

      if (variant.incoming) {
        $stock
          .html(
            theme.strings.willBeInStockAfter.replace(
              '[date]',
              variant.next_incoming_date
            )
          )
          .removeClass('hide');
        return;
      }

      // If there is no stock incoming, hide stock
      $stock.addClass('hide');
    },

    _updateAddToCartBtn: function(evt) {
      var variant = evt.variant;


      var cache = {
        $addToCart: $(this.selectors.addToCart),
        $addToCartText: $(this.selectors.addToCartText)
      };

      if (variant) {
       
        let optionName = this.productSingleObject.options;
        let tagPreOrder = $('.product-single').attr("data-tag");
        // Select a valid variant if available
        theme.noticeSoldout.init(variant);
        if (variant.available) {
          // We have a valid product variant, so enable the submit button
          cache.$addToCart.removeClass('btn--sold-out').prop('disabled', false);
          if(variant.inventory_quantity == 0 && variant.inventory_policy && tagPreOrder == 'preorder'){
            cache.$addToCartText.html(theme.strings.preOrder);
          }else{
            cache.$addToCartText.html(theme.strings.addToCart);
          }
          $(this.selectors.shopifyPaymentButton, this.$container).show();
          // Show how many items are left, if below 10
          this._updateStock(variant);
          //update availability - available
          $(this.selectors.availability).find('span').text(theme.strings.available);
          $('.product__pickup-availabilities').show();
          const a1 = optionName,
                a2 = variant.options,
                someFunction = (...values) => values.join(' '),
                knownValue = ":",
                output = a1.map((value1, i) => someFunction(value1, knownValue, a2[i]));
          $('.pickup-availability-variant').text(output.join(", "));
          
        } else {
          // Variant is sold out, disable the submit button
          cache.$addToCart.prop('disabled', true).addClass('btn--sold-out');
          cache.$addToCartText.html(theme.strings.soldOut);
          $(this.selectors.shopifyPaymentButton, this.$container).hide();
          // Update when stock will be available
          this._updateIncomingInfo(variant);
          //update availability - soldout
          $(this.selectors.availability).find('span').text(theme.strings.soldOut);
          $('.product__pickup-availabilities').hide();
        }
      } else {
        cache.$addToCart.prop('disabled', true).removeClass('btn--sold-out');
        cache.$addToCartText.html(theme.strings.unavailable);
        //update availability - unavailable
        $(this.selectors.availability).find('span').text(theme.strings.unavailable);
        $(this.selectors.shopifyPaymentButton, this.$container).hide();
        // Hide stock display
        this._updateStock();
        $('.product__pickup-availabilities').hide();
      }
    },

    _updatePrice: function(evt) {
      var variant = evt.variant;

      if (variant) {
        $(this.selectors.productPrice).html(
          theme.Currency.formatMoney(variant.price, theme.moneyFormat)
        );

        // Update and show the product's compare price if necessary
        if (variant.compare_at_price > variant.price) {
          var sale_minus = variant.compare_at_price - variant.price;
          var sale_per = sale_minus*100/variant.compare_at_price
          var roundNumber = parseInt(sale_per);
          $(this.selectors.numbersale_change).text(`${roundNumber}%`);
          $(this.selectors.labelwrap_sale).removeClass('hide');

          $(this.selectors.comparePrice)
            .html(
              theme.Currency.formatMoney(
                variant.compare_at_price,
                theme.moneyFormat
              )
            )
            .removeClass('hide');
          $(this.selectors.saleTag).removeClass('hide');
        } else {
          $(this.selectors.comparePrice).addClass('hide');
          $(this.selectors.saleTag).addClass('hide');
          $(this.selectors.labelwrap_sale).addClass('hide');
        }
        
        //theme.updateCurrencies();
      } else {
        
        $(this.selectors.comparePrice).addClass('hide');
      }
    },

    _updateSKU: function(evt) {
      var variant = evt.variant;

      if (variant) {
        $(this.selectors.SKU).html(variant.sku);
      }
    },

    _updateImages: function(evt) {
      var variant = evt.variant;

      if (variant && variant.featured_media) {
        var imageId = variant.featured_media.id;
        this.switchProductImage(imageId);
        this.setActiveThumbnail(imageId);
      }
    },
    _updateSwatchTitle: function(e) {
      const {variant} = e; 
			for (var e = 1; e <= e.length; e++) {
        var option = "option" + e;
        $(".js-swatch-display--" + e).text(variant[option])
      }
		},

    _updateStickyCart: function (evt){
      var variant = evt.variant,
          $stickyPrice = $('#js-sticky-price'),
          $stickyTitle = $('#js-sticky-title'),
          $stickyImage = $('#js-sticky-img'),
          $stickyButton = $('#js-sticky-btn');
      if (variant) {
        //update title
        $stickyTitle.html(' - ' + variant.title);
        //update price
        $stickyPrice.html(theme.Currency.formatMoney(variant.price, theme.moneyFormat));
        //update selectbox
        for (var i = 1; i <= 3; i++) {
          var option = 'option' + i,
              $selecBox = '#js-sticky-option-' + i;
          if (variant[option] !== null){
            var valueOption = variant[option];
            $($selecBox).val(valueOption);
          }
        }
        //update button cart
        if (variant.available) {
          $stickyButton.prop('disabled', false).removeClass('btn--sold-out');
          $stickyButton.html(theme.strings.addToCart);
        } else {
          $stickyButton.prop('disabled', true).addClass('btn--sold-out');
          $stickyButton.html(theme.strings.soldOut);
        }
        //update image
        if (variant.featured_image) {
          $stickyImage.attr('src',theme.Images.getSizedImageUrl(variant.featured_image.src,'200x'));
        }
      } else {
        //update title
        $stickyTitle.html(' - ' + theme.strings.unavailable);
        //update button cart
        $stickyButton.prop('disabled', true).removeClass('btn--sold-out');
        $stickyButton.html(theme.strings.unavailable);
      }
    },

    switchProductImage: function(imageId) {
      var $imageToShow = $(
        this.selectors.productImageContainers +
          "[data-image-id='" +
          imageId +
          "']",
        this.$container
      );
      var $imagesToHide = $(
        this.selectors.productImageContainers +
          ":not([data-image-id='" +
          imageId +
          "'])",
        this.$container
      );
      //$imagesToHide.addClass('hide');
      $imageToShow.removeClass('hide');
      //Scroll to active
      topMenuHeight = $('.site-header').outerHeight();
      if(this.settings.sectionTem === 'media-list' || this.settings.sectionTem === 'media-grid' || this.settings.sectionTem === 'media-collage-1' || this.settings.sectionTem === 'media-collage-2'){
        $([document.documentElement, document.body]).animate({
          scrollTop: $imageToShow.offset().top-topMenuHeight
        }, 600);
      }
    },

    setActiveThumbnail: function(imageId) {
      var $thumbnailToShow = $(
        this.selectors.productThumbContainers +
          "[data-image-id='" +
          imageId +
          "']",
        this.$container
      );
      var $thumbnailsToHide = $(
        this.selectors.productThumbContainers +
          ":not([data-image-id='" +
          imageId +
          "'])",
        this.$container
      );
      $thumbnailsToHide.removeClass('is-active');
      $thumbnailToShow.addClass('is-active');
      $thumbnailToShow.trigger('click');
      var $thumbnails = $(this.selectors.productThumbsWrapper, this.$container);
      // If there is a slick carousel, get the slide index, and position it into view with animation.
      if ($thumbnails.hasClass('slick-initialized')) {
        // eslint-disable-next-line shopify/jquery-dollar-sign-reference
        var currentActiveSlideIndex = $thumbnails.slick('slickCurrentSlide');
        var newActiveSlideIndex = parseInt(
          $thumbnailToShow.attr('data-slick-index')
        );
        if (currentActiveSlideIndex !== newActiveSlideIndex) {
          $thumbnails.slick('slickGoTo', newActiveSlideIndex, false);
        }
      }
      
    },

    _productZoomImage: function() {
      // The zoom image is only used on the product template, so return early
      // even if a featured product section is present.
      if (
        !$('.product-single ' + this.selectors.productImageContainers).length
      ) {
        return;
      }

      var self = this;

      $(this.selectors.productImageWrappers).on(
        'click' + this.settings.namespace,
        function(evt) {
          evt.preventDefault();
          // Empty src before loadig new image to avoid awkward image swap
          $(self.selectors.productZoomImage)
            .attr('src', '')
            .attr('src', $(this).attr('href'));
        }
      );

      this.ProductModal = new window.Modals(
        this.selectors.modal,
        'product-modal'
      );

      // Close modal if clicked, but not if the image is clicked
      this.ProductModal.$modal.on('click' + this.settings.namespace, function(
        evt
      ) {
        if (evt.target.nodeName !== 'IMG') {
          self.ProductModal.close();
        }
      });
    },

    _productThumbSwitch: function() {
      if (!$(this.selectors.productThumbs).length) {
        return;
      }

      var self = this;

      $(this.selectors.productThumbs).on(
        'click' + this.settings.namespace,
        function(evt) {
          evt.preventDefault();
          var imageId = $(this)
            .parent()
            .data('image-id');
          self.setActiveThumbnail(imageId);
          self.switchProductImage(imageId);
        }
      );
      //trigger hover thumb
      // $(this.selectors.productThumbs).on('click',function(){
      //   $(this).trigger('click');
      // });
    },
    /*
      Thumbnail slider
     */
    _productThumbnailSlider: function() {
      var $productThumbsWrapper = $(this.selectors.productThumbsWrapper);
      var $productMainWrapper = $(this.selectors.productImageMain);
      var $productThumbs = $(this.selectors.productThumbs);
      if (!$productThumbs.length) {
        return;
      }

      if ($productThumbs.length > 1) {
        $productThumbsWrapper.on(
          'init' + this.settings.namespace,
          this._productSwipeInit.bind(this)
        );
        if (this.settings.sectionTem === 'media-left' || this.settings.sectionTem === 'media-right'){
          $productThumbsWrapper.slick({
            accessibility: true,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 5,
            slidesToScroll: 1,
            focusOnSelect: true,
            asNavFor: $productMainWrapper,
            vertical: true,
            verticalSwiping: true,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  vertical: false,
                  verticalSwiping: false,
                  slidesToShow: 4,
                  slidesToScroll: 1,
                }
              }
            ]
          }).css('opacity','1');
          slideMain();
        }
        else if (this.settings.sectionTem === 'media-nothumb'){
          $productThumbsWrapper.slick({
            accessibility: true,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 6,
            slidesToScroll: 1,
            focusOnSelect: true,
            asNavFor: $productMainWrapper,
            responsive: [
              {
                breakpoint: 480,
                settings: {
                  slidesToShow: 4,
                  slidesToScroll: 1
                }
              }
            ]
          }).css('opacity','1');
          slideMain();
        }
        else if (this.settings.sectionTem === 'media-list' || this.settings.sectionTem === 'media-grid' || this.settings.sectionTem === 'media-collage-1' || this.settings.sectionTem === 'media-collage-2'){
          $productThumbsWrapper.slick({
            accessibility: true,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 6,
            slidesToScroll: 1,
            focusOnSelect: true,
            asNavFor: $productMainWrapper,
            responsive: [
              {
                breakpoint: 9999,
                settings: 'unslick'
              },
              {
                breakpoint: 480,
                settings: {
                  slidesToShow: 4,
                  slidesToScroll: 1
                }
              }
            ]
          }).css('opacity','1');
          $productMainWrapper.slick({
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 1,
            slidesToScroll: 1,
            fade: true,
            adaptiveHeight: true,
            accessibility: true,
            draggable: false,
            asNavFor: $productThumbsWrapper,
            responsive: [
              {
                breakpoint: 9999,
                settings: 'unslick'
              },
              {
                breakpoint: 480,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1
                }
              }
            ]
          }).css('opacity','1');
          $productThumbsWrapper.slick(
            'slickGoTo',
            $productThumbsWrapper.find('.is-active').attr('data-slick-index'),
            true
          );
          $(window).on('resize', function() {
            $productThumbsWrapper.slick('resize');
            $productMainWrapper.slick('resize');
          });
        }
        else{
          $productThumbsWrapper.slick({
            accessibility: true,
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 6,
            slidesToScroll: 1,
            focusOnSelect: true,
            asNavFor: $productMainWrapper,
            responsive: [
              {
                breakpoint: 480,
                settings: {
                  slidesToShow: 4,
                  slidesToScroll: 1
                }
              }
            ]
          }).css('opacity','1');
          slideMain();
        }
        function slideMain(){
          $productMainWrapper.slick({
            arrows: true,
            dots: false,
            infinite: false,
            autoplay: false,
            slidesToShow: 1,
            slidesToScroll: 1,
            fade: true,
            adaptiveHeight: true,
            accessibility: true,
            draggable: false,
            asNavFor: $productThumbsWrapper,
          }).css('opacity','1');
          }
        }
        // Show highlighted thumbnail by repositioning slider
        if( this.settings.sectionTem === 'media-left' || this.settings.sectionTem === 'media-right' || this.settings.sectionTem === 'media-nothumb' || this.settings.sectionTem === 'media-bottom'){
          $productThumbsWrapper.slick(
            'slickGoTo',
            $productThumbsWrapper.find('.is-active').attr('data-slick-index'),
            true
          );
        }
        
        
    },

    _productSwipeInit: function(evt, obj) {
      // Slider is initialized. Setup custom swipe events
      this.settings.productThumbIndex = obj.currentSlide;
      this.settings.productThumbMax = obj.slideCount - 1; // we need the 0-based index

      var self = this;

      $(this.selectors.productImageWrappers).on(
        'swipeleft swiperight',
        function(event) {
          if (event.type === 'swipeleft') {
            self._goToNextThumbnail();
          }

          if (event.type === 'swiperight') {
            self._goToPrevThumbnail();
          }

          // Trigger click on newly requested thumbnail
          $(
            '.product-single__thumbnail-item[data-slick-index="' +
              self.settings.productThumbIndex +
              '"]'
          )
            .find('.product-single__thumbnail')
            .trigger('click');
          
        }
      );
    },
    _goToNextThumbnail: function() {
      this.settings.productThumbIndex++;

      if (this.settings.productThumbIndex > this.settings.productThumbMax) {
        this.settings.productThumbIndex = 0;
      }

      $(this.selectors.productThumbsWrapper).slick(
        'slickGoTo',
        this.settings.productThumbIndex,
        true
      );
    },

    _goToPrevThumbnail: function() {
      this.settings.productThumbIndex--;

      if (this.settings.productThumbIndex < 0) {
        this.settings.productThumbIndex = this.settings.productThumbMax;
      }

      $(this.selectors.productThumbsWrapper).slick(
        'slickGoTo',
        this.settings.productThumbIndex,
        true
      );
    },

    _initQtySelector: function() {
      this.$container.find('.product-form__quantity').each(function(i, el) {
        // eslint-disable-next-line no-new
        new QtySelector($(el));
      });
    },

    onUnload: function() {
      $(this.selectors.productImageWrappers).off(this.settings.namespace);
      $(this.selectors.productThumbs).off(this.settings.namespace);
      $(this.selectors.productThumbs).slick('unslick');
      if (this.ProductModal) {
        this.ProductModal.$modal.off(this.settings.namespace);
      }
    }
  });

  return Product;
})();

theme.Slideshow = (function() {
  this.$slideshow = null;
  var classes = {
    slideshow: 'slideshow',
    slickActiveMobile: 'slick-active-mobile',
    controlsHover: 'slideshow__controls--hover',
    isPaused: 'is-paused'
  };

  var selectors = {
    section: '.shopify-section',
    wrapper: '#SlideshowWrapper-',
    slides: '.slideshow__slide',
    textWrapperMobile: '.slideshow__text-wrap--mobile',
    textContentMobile: '.slideshow__text-content--mobile',
    controls: '.slideshow__controls',
    dots: '.slick-dots',
    arrowLeft: '.slideshow__arrow-left',
    arrowRight: '.slideshow__arrow-right'
  };

  function slideshow(el, sectionId) {
    var $slideshow = (this.$slideshow = $(el));
    this.adaptHeight = this.$slideshow.data('adapt-height');
    this.$wrapper = this.$slideshow.closest(selectors.wrapper + sectionId);
    this.$section = this.$wrapper.closest(selectors.section);
    this.$controls = this.$wrapper.find(selectors.controls);
    this.$textWrapperMobile = this.$section.find(selectors.textWrapperMobile);
    this.autorotate = this.$slideshow.data('autorotate');
    this.navArrow = this.$slideshow.data('arrow');
    this.navDot = this.$slideshow.data('dot');
    this.transit = this.$slideshow.data('transit');
    var autoplaySpeed = this.$slideshow.data('speed');
    var loadSlideA11yString = this.$slideshow.data('slide-nav-a11y');
    this.settings = {
      rtl:theme.rtl,
      accessibility: false,
      arrows: this.navArrow,
      dots:  this.navDot,
      fade:  (this.transit === 'slide' ? false : true),
      draggable: true,
      touchThreshold: 20,
      autoplay: this.autorotate,
      autoplaySpeed: autoplaySpeed,
      pauseOnFocus: this.autorotate? false:true, 
      pauseOnHover: this.autorotate? false:true,
      useTransform: true,
      infinite: true,
    };

    this.$slideshow.on('beforeChange', beforeChange.bind(this));
    this.$slideshow.on('init', slideshowA11ySetup.bind(this));

    // Add class to style mobile dots & show the correct text content for the
    // first slide on mobile when the slideshow initialises
    this.$slideshow.on(
      'init',
      function() {
        this.$mobileDots
          .find('li:first-of-type')
          .addClass(classes.slickActiveMobile);
        this.showMobileText(0);
      }.bind(this)
    );

    if (this.adaptHeight) {
      this.setSlideshowHeight();
      $(window).resize($.debounce(50, this.setSlideshowHeight.bind(this)));
    }

    this.$slideshow.slick(this.settings);
    this.$slideshow.on('beforeChange', function(event, slick, currentSlide, nextSlide){
        if ($(this).data('transit') === 'slide-fade' ) {
          var $outGoing = $(slick.$slides.get(currentSlide));
          $outGoing.addClass('slick-going');
        }
    });
    this.$slideshow.on('afterChange', function(event, slick, currentSlide, nextSlide){
      $(slick.$slides).filter('.slick-going').removeClass('slick-going');
    });
    // This can't be called when the slick 'init' event fires due to how slick
    // adds a11y features.
    slideshowPostInitA11ySetup.bind(this)();
    
  }

  function slideshowA11ySetup(event, obj) {
    var $slider = obj.$slider;
    var $list = obj.$list;
    this.$dots = this.$section.find(selectors.dots);
    this.$mobileDots = this.$dots.eq(1);

    // Remove default Slick aria-live attr until slider is focused
    $list.removeAttr('aria-live');

//     this.$wrapper.on('keyup', keyboardNavigation.bind(this));
//     this.$controls.on('keyup', keyboardNavigation.bind(this));
//     this.$textWrapperMobile.on('keyup', keyboardNavigation.bind(this));

    // When an element in the slider is focused
    // pause slideshow and set aria-live.
    this.$wrapper
      .on(
        'focusin',
        function(evt) {
          if (!this.$wrapper.has(evt.target).length) {
            return;
          }

          $list.attr('aria-live', 'polite');
          if (this.autorotate) {
            $slider.slick('slickPause');
          }
        }.bind(this)
      )
      .on(
        'focusout',
        function(evt) {
          if (!this.$wrapper.has(evt.target).length) {
            return;
          }

          $list.removeAttr('aria-live');
        }.bind(this)
      );

    // Add arrow key support when focused
    if (this.$dots) {
      this.$dots
        .find('a')
        .each(function() {
          var $dot = $(this);
          $dot.on('click keyup', function(evt) {
            if (
              evt.type === 'keyup' &&
              evt.which !== slate.utils.keyboardKeys.ENTER
            )
              return;

            evt.preventDefault();

            var slideNumber = $(evt.target).data('slide-number');

            $slider.attr('tabindex', -1).slick('slickGoTo', slideNumber);

            if (evt.type === 'keyup') {
              $slider.focus();
            }
          });
        })
        .eq(0)
        .attr('aria-current', 'true');
    }

    this.$controls
      .on('focusin', highlightControls.bind(this))
      .on('focusout', unhighlightControls.bind(this));
  }

  function slideshowPostInitA11ySetup() {
    var $slides = this.$slideshow.find(selectors.slides);

    $slides.removeAttr('role').removeAttr('aria-labelledby');
    this.$dots
      .removeAttr('role')
      .find('li')
      .removeAttr('role')
      .removeAttr('aria-selected')
      .each(function() {
        var $dot = $(this);
        var ariaControls = $dot.attr('aria-controls');
        $dot
          .removeAttr('aria-controls')
          .find('a')
          .attr('aria-controls', ariaControls);
      });
  }

  function beforeChange(event, slick, currentSlide, nextSlide) {
    var $dotLinks = this.$dots.find('a');
    var $mobileDotLinks = this.$mobileDots.find('li');
    $dotLinks
      .removeAttr('aria-current')
      .eq(nextSlide)
      .attr('aria-current', 'true');

    $mobileDotLinks
      .removeClass(classes.slickActiveMobile)
      .eq(nextSlide)
      .addClass(classes.slickActiveMobile);
    this.showMobileText(nextSlide);
  }

//   function keyboardNavigation() {
//     if (event.keyCode === slate.utils.keyboardKeys.LEFTARROW) {
//       this.$slideshow.slick('slickPrev');
//     }
//     if (event.keyCode === slate.utils.keyboardKeys.RIGHTARROW) {
//       this.$slideshow.slick('slickNext');
//     }
//   }

  function highlightControls() {
    this.$controls.addClass(classes.controlsHover);
  }

  function unhighlightControls() {
    this.$controls.removeClass(classes.controlsHover);
  }

  slideshow.prototype.setSlideshowHeight = function() {
    var minAspectRatio = this.$slideshow.data('min-aspect-ratio');
    this.$slideshow.height($(document).width() / minAspectRatio);
  };

  slideshow.prototype.showMobileText = function(slideIndex) {
    var $allTextContent = this.$textWrapperMobile.find(
      selectors.textContentMobile
    );
    var currentTextContentSelector =
      selectors.textContentMobile + '-' + slideIndex;
    var $currentTextContent = this.$textWrapperMobile.find(
      currentTextContentSelector
    );
    if (
      !$currentTextContent.length &&
      this.$slideshow.find(selectors.slides).length === 1
    ) {
      this.$textWrapperMobile.hide();
    } else {
      this.$textWrapperMobile.show();
    }
    $allTextContent.hide();
    $currentTextContent.show();
  };

  function getSlideshowId($el) {
    return '#Slideshow-' + $el.data('id');
  }

  return slideshow;
})();

theme.slideshows = {};

theme.SlideshowSection = (function() {
  function SlideshowSection(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    var slideshow = (this.slideshow = '#Slideshow-' + sectionId);

    theme.slideshows[slideshow] = new theme.Slideshow(slideshow, sectionId);
  }

  return SlideshowSection;
})();

theme.SlideshowSection.prototype = _.assignIn(
  {},
  theme.SlideshowSection.prototype,
  {
    onUnload: function() {
      delete theme.slideshows[this.slideshow];
    },

    onBlockSelect: function(evt) {
      var $slideshow = $(this.slideshow);
      var adaptHeight = $slideshow.data('adapt-height');

      if (adaptHeight) {
        theme.slideshows[this.slideshow].setSlideshowHeight();
      }

      // Ignore the cloned version
      var $slide = $(
        '.slideshow__slide--' + evt.detail.blockId + ':not(.slick-cloned)'
      );
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause auto-rotate
      $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
    },

    onBlockDeselect: function() {
      // Resume auto-rotate
      $(this.slideshow).slick('slickPlay');
    }
  }
);

theme.slideshows = {};

theme.Cart = (function() {
  var selectors = {
    cartNote: '#CartSpecialInstructions',
    cartQtyInput: '.cart__quantity',
    cartNoCookiesClass: 'cart--no-cookies'
  };

  function Cart(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');

    theme.cartObject = JSON.parse($('#CartJson-' + sectionId).html());

    this.init($container);
  }

  Cart.prototype = _.assignIn({}, Cart.prototype, {
    init: function($container) {
      this._initQtySelector();
      this._initCartNote();

      if (!this._cookiesEnabled()) {
        $container.addClass(selectors.cartNoCookiesClass);
      }
    },

    _initQtySelector: function() {
      $(selectors.cartQtyInput).each(function(i, el) {
        // eslint-disable-next-line no-new
        new QtySelector($(el));
      });
    },

    _initCartNote: function() {
      if (!$(selectors.cartNote).length) {
        return;
      }

      var $el = $(selectors.cartNote);
      var noteText;
      var params;
      var noteOffset = $el[0].offsetHeight - $el[0].clientHeight;

      // Auto grow the cart note if text fills it up
      $el.on('keyup input', function() {
        $(this)
          .css('height', 'auto')
          .css('height', $el[0].scrollHeight + noteOffset);
          
      });
      // Save the cart note via ajax. A safeguard in case
      // a user decides to leave the page before clicking 'Update Cart'
      $el.on(
        'change',
        $.proxy(function() {
          noteText = $el.val();
          params = {
            type: 'POST',
            url: '/cart/update.js',
            data: 'note=' + this._attributeToString(noteText),
            dataType: 'json'
          };
          $.ajax(params);
          
        }, this)
      );
    },

    _attributeToString: function(attr) {
      if (typeof attr !== 'string') {
        attr = String(attr);
        if (attr === 'undefined') {
          attr = '';
        }
      }
      return $.trim(attr);
    },

    _cookiesEnabled: function() {
      var cookieEnabled = navigator.cookieEnabled;

      if (!cookieEnabled) {
        document.cookie = 'testcookie';
        cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
      }
      return cookieEnabled;
    }
  });

  return Cart;
})();

theme.noteCart = (function() {
  if($('.block-notecart') != undefined ){
    var $el = $('#cart__note');
    var $btnsubmit = $('.cart-notes-submit');
    var $editNote = $('.edit-notecart');
    var $closeNote = $('.cart-note-close');
    var $drawCart = $('.mini-cart-content');
    var noteText;
    function noteUpdate(noteText){
        params = {
          type: 'POST',
          url: '/cart/update.js',
          data: 'note=' + theme.attributeToString(noteText)
        };
        $.ajax(params);
    }
    $btnsubmit.on( "click", function() {
      noteText = $el.val();
      noteUpdate(noteText);
      $(this).closest('.js-note-cart').removeClass('active');
    });
    $editNote.on( "click", function() {
      $(this).siblings().toggleClass('active');
      $(this).closest($drawCart).toggleClass('overlay');
    });
    $closeNote.on( "click", function() {
      $(this).closest('.js-note-cart').removeClass('active');
      $(this).closest($drawCart).removeClass('overlay');
    });
  }
  
})();
theme.attributeToString = function(attribute) {
	if (typeof attribute !== 'string') {
		attribute += '';
		if (attribute === 'undefined') {
			attribute = '';
		}
	}
	return jQuery.trim(attribute);
}

// Instagrams
theme.Instagrams = (function() {
  function Instagrams(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    //console.log(this.$container);
    this.settings = {
      style 			: this.$container.data('style'),
      accesstoken 		: this.$container.data('accesstoken'),
      userid			: this.$container.data('userid'),
      limit 			: this.$container.data('limit'),
      resolution 		: this.$container.data('resolution'),
      target 			: this.$container.attr('id'),
      rows 			: this.$container.data('rows'),
      
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      infinite 			: this.$container.data('infinite') || false,
      arrows 			: this.$container.data('arrows') || false,
      draggable 		: this.$container.data('draggable') || false,
      dots 				: this.$container.data('dots') || false,
    }
    this.settings.slidesToShow1200 		= (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  		= (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  		= (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  		= 2;
    
    var _self = this;
    var $instagramSelector = $('#'+this.settings.target);
    if (this.settings.style === 'grid'){
      var afterInstagram = function(){} // blank function
    }else if (this.settings.style === 'carousel'){
      var afterInstagram = function(){
        $instagramSelector.slick({
          slidesToShow		: _self.settings.slidesToShow,
          slidesToScroll	: _self.settings.slidesToShow,
          arrows			: _self.settings.arrows,
          dots				: _self.settings.dots,
          draggable		 	: _self.settings.draggable,
          infinite		 	: _self.settings.infinite,
          rows : _self.settings.rows,
          accessibility:false,
          responsive: [
            {
              breakpoint: 1200,
              settings: {
                slidesToShow	: _self.settings.slidesToShow1200,
                slidesToScroll	: _self.settings.slidesToShow1200,
              }
            },
            {
              breakpoint: 992,
              settings: {
                slidesToShow	: _self.settings.slidesToShow992,
                slidesToScroll	: _self.settings.slidesToShow992,
              }
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow	: _self.settings.slidesToShow768,
                slidesToScroll	: _self.settings.slidesToShow768,
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow	: _self.settings.slidesToShow480,
                slidesToScroll	: _self.settings.slidesToShow480,
              }
            }
          ]
        })
      }
    }

    var feed = new Instafeed({
      get			: 'user',
      target 		: this.settings.target,
      userId		: this.settings.userid,
      accessToken	: this.settings.accesstoken,
      limit			: this.settings.limit,
      resolution	: this.settings.resolution,
      template		: '<div class="col hv-image-brightness"><a class="instagram-item" href="{{link}}" target="_blank" id="{{id}}"><img alt="instagram image" class="transition lazyload" data-src="{{image}}" /></a></div>',
      after			: afterInstagram
    });

    feed.run();
  }

  Instagrams.prototype = _.assignIn({}, Instagrams.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    }
  });

  return Instagrams;
})();

// Slick carousel
theme.slickCarousel = (function (){
  function Carousels(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.settings = {
      rows 				: this.$container.data('rows') || 1,
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      slidesToScroll	: this.$container.data('slidestoscroll') || 1,
      infinite 			: this.$container.data('infinite') || false,
      arrows 			: this.$container.data('arrows') || false,
      dots 				: this.$container.data('dots') || false,
      autoplay 			: this.$container.data('autoplay') || false,
      draggable 		: this.$container.data('draggable') || false,
      accessibility 	: this.$container.data('accessibility') || false,
      slidesToShowMobile 		: this.$container.data('slidestoshow-mobile') || 1,
    }
    this.settings.slidesToShow1200 		= (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  		= (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  		= (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  		= (this.settings.slidesToShow - 4) > 1? (this.settings.slidesToShow - 4) : 1;
    this.settings.slidesToScroll1200 	= (this.settings.slidesToScroll - 1) > 1? (this.settings.slidesToScroll - 1) : 1;
    this.settings.slidesToScroll992  	= (this.settings.slidesToScroll - 2) > 1? (this.settings.slidesToScroll - 2) : 1;
    this.settings.slidesToScroll768  	= (this.settings.slidesToScroll - 3) > 1? (this.settings.slidesToScroll - 3) : 1;
    this.settings.slidesToScroll480  	= (this.settings.slidesToScroll - 4) > 1? (this.settings.slidesToScroll - 4) : 1;
    this.$container.slick({
      rtl				: theme.rtl,
      rows 				: this.settings.rows,
      slidesToShow		: this.settings.slidesToShow,
      slidesToScroll 	: this.settings.slidesToScroll,
      arrows			: this.settings.arrows,
      dots				: this.settings.dots,
      autoplay			: this.settings.autoplay,
      accessibility		: this.settings.accessibility,
      draggable			: this.settings.draggable,
      infinite			: this.settings.infinite,
      adaptiveHeight: true,
      responsive: [
        {
          breakpoint: 1200,
          settings: {
            slidesToShow: this.settings.slidesToShow1200,
            slidesToScroll: this.settings.slidesToScroll1200
          }
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow: this.settings.slidesToShow992,
            slidesToScroll: this.settings.slidesToScroll992
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: this.settings.slidesToShow768,
            slidesToScroll: this.settings.slidesToScroll768
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: this.settings.slidesToShowMobile,
            slidesToScroll: this.settings.slidesToShowMobile
          }
        }
      ]
    }).css('opacity','1');
   
    if($('.shopthelook').length){
      var $container = (this.$container = $(container)),
          sectionId = $container.attr('data-section-id'),
          $dotID = $container.closest('.shopthelook').find(`#dot-${sectionId}`).find("li");
          $dotID.click(function(){
            var pos = $(this).data('pos');
            $dotID.removeClass('active');
            $(this).addClass("active");
            $container.slick("slickGoTo", pos);
          });
          $container.on('afterChange', function(event, slick, currentSlide, nextSlide){
              var $dotPos = $container.closest('.shopthelook').find(`#dot-${sectionId}`).find(`li[data-pos=${currentSlide}]`);
              $dotID.removeClass('active');
              $dotPos.addClass('active');
          });
    }
    
  }

  Carousels.prototype = _.assignIn({}, Carousels.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },
    
    _goToSlide: function(slideIndex) {
      this.$container.slick('slickGoTo', slideIndex);
    },

    onUnload: function() {
      delete this.$container;
    },

    onBlockSelect: function(evt) {
      // Ignore the cloned version
      var $slide = $(
        '.carousel__slide-wrapper--' + evt.detail.blockId + ':not(.slick-cloned)'
      );
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause autoplay
      this._goToSlide(slideIndex);
      
    }
  });

  return Carousels;
})()

// Slick Press
theme.slickPress = (function (){
  function slickPress(container) {

    this.$container = $(container).on('init', this._a11y.bind(this));
    var sectionId = this.$container.data('section-id');
    var pressSub = '#sub-'+ sectionId;
    
    this.settings = {
      arrows 			: this.$container.data('arrows') || false,
      dots 				: this.$container.data('dots') || false,
    }
      this.$container.slick({
      rtl				: theme.rtl,
      rows 				: 1,
      slidesToShow		: 1,
      slidesToScroll 	: 1,
      arrows			: this.settings.arrows,
      dots				: this.settings.dots,
      autoplay			: false,
      accessibility		: true,
      draggable			: true,
      infinite			: true,
      adaptiveHeight: true,
      asNavFor: pressSub,
      
    }).css('opacity','1');

    $(pressSub).slick({
      slidesToShow		: 3,
      slidesToScroll 	: 1,
      infinite			: true,
      arrows			: false,
      asNavFor: this.$container,
      draggable			: true,
      accessibility		: true,
      focusOnSelect: true,
      centerMode: true,
      centerPadding: '0px',
    });
  }

  slickPress.prototype = _.assignIn({}, slickPress.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container;
      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },
    
    _goToSlide: function(slideIndex) {
      this.$container.slick('slickGoTo', slideIndex);
    },

    onUnload: function() {
      delete  this.$container;
    },

    onBlockSelect: function(evt) {
      // Ignore the cloned version
      var $slide = $(
        '.carousel__slide-wrapper--' + evt.detail.blockId + ':not(.slick-cloned)'
      );
      var slideIndex = $slide.data('slick-index');

      // Go to selected slide, pause autoplay
      console.log(this);
      this._goToSlide(slideIndex);
      
    }
  });

  return slickPress;
})()

// Productlists
theme.Productlists = (function() {
  function Productlists(container) {
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.settings = {
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      rows 				: this.$container.data('rows') || 1,
      arrows 			: this.$container.data('arrows') || false,
      dots 				: this.$container.data('dots') || false,
      draggable 		: this.$container.data('draggable') || false,
      infinite 			: this.$container.data('infinite') || false,
    }
    this.settings.slidesToShow1200 = (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  = (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  = (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  = 2;
    this.$container.slick({
      rtl				: theme.rtl,
      accessibility		: false,
      slidesToShow		: this.settings.slidesToShow,
      slidesToScroll	: this.settings.slidesToShow,
      rows				: this.settings.rows,
      arrows			: this.settings.arrows,
      dots				: this.settings.dots,
      infinite 			: this.settings.infinite,
      draggable			: this.settings.draggable,
      responsive		: [
        {
          breakpoint: 1200,
          settings: {
            slidesToShow	: this.settings.slidesToShow1200,
            slidesToScroll	: this.settings.slidesToShow1200
          }
        },
        {
          breakpoint: 992,
          settings: {
            slidesToShow	: this.settings.slidesToShow992,
            slidesToScroll	: this.settings.slidesToShow992
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow	: this.settings.slidesToShow768,
            slidesToScroll	: this.settings.slidesToShow768
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow	: this.settings.slidesToShow480,
            slidesToScroll	: this.settings.slidesToShow480
          }
        }
      ]
    }).css('opacity','1');
  }

  Productlists.prototype = _.assignIn({}, Productlists.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },

    _goToSlide: function(slideIndex) {
      this.$container.slick('slickGoTo', slideIndex);
    },

    onUnload: function() {
      delete this.$container;
    }
  });

  return Productlists;
})();

// Producttabs
theme.Producttabs = (function() {
  function Producttabs(container) {
    var _self = this; // avoid conflict
    this.$container = $(container).on('init', this._a11y.bind(this));
    this.slickWrap 	= '.prdtab-content';
    this.settings 	= {
      slidesToShow 		: this.$container.data('slidestoshow') || 1,
      arrows 			: this.$container.data('arrows') || false,
      rows 				: this.$container.data('rows') || 1,
      dots 				: this.$container.data('dots') || false,
      draggable			: this.$container.data('draggable') || false,
      infinite			: this.$container.data('infinite') || false,
    }
    this.settings.slidesToShow1200 = (this.settings.slidesToShow - 1) > 1? (this.settings.slidesToShow - 1) : 1;
    this.settings.slidesToShow992  = (this.settings.slidesToShow - 2) > 1? (this.settings.slidesToShow - 2) : 1;
    this.settings.slidesToShow768  = (this.settings.slidesToShow - 3) > 1? (this.settings.slidesToShow - 3) : 1;
    this.settings.slidesToShow480  = 2;

    this._initSlick();
    this.$container.find('a[data-toggle="tab"]').on("shown.bs.tab", function(e) {
      _self._unSlick();
      _self._initSlick();
      theme.tooltip.load();
    })
  }

  Producttabs.prototype = _.assignIn({}, Producttabs.prototype, {
    _a11y: function(event, obj) {
      var $list = obj.$list;
      var $wrapper = this.$container.parent();

      // Remove default Slick aria-live attr until slider is focused
      $list.removeAttr('aria-live');

      // When an element in the slider is focused set aria-live
      $wrapper.on('focusin', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.attr('aria-live', 'polite');
        }
      });

      // Remove aria-live
      $wrapper.on('focusout', function(evt) {
        if ($wrapper.has(evt.target).length) {
          $list.removeAttr('aria-live');
        }
      });
    },

    _getSliderSettings : function (){
      return {
        rtl				: theme.rtl,
        accessibility	: true,
        slidesToShow	: this.settings.slidesToShow,
        slidesToScroll	: this.settings.slidesToShow,
        arrows			: this.settings.arrows,
        rows			: this.settings.rows,
        dots			: this.settings.dots,
        infinite 		: this.settings.infinite,
        draggable		: this.settings.draggable,
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: this.settings.slidesToShow1200,
              slidesToScroll: this.settings.slidesToShow1200
            }
          },
          {
            breakpoint: 992,
            settings: {
              slidesToShow: this.settings.slidesToShow992,
              slidesToScroll: this.settings.slidesToShow992
            }
          },
          {
            breakpoint: 768,
            settings: {
              slidesToShow: this.settings.slidesToShow768,
              slidesToScroll: this.settings.slidesToShow768
            }
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: this.settings.slidesToShow480,
              slidesToScroll: this.settings.slidesToShow480
            }
          }
        ]
      }
    },

    _initSlick : function (){
      this.$container.find(this.slickWrap).slick(this._getSliderSettings()).css('opacity','1');
    },

    _unSlick : function(){
      this.$container.find(this.slickWrap).slick('unslick');
    },

    onUnload: function() {
      delete this.$container;
    },

    onSelect: function() {
      this._unSlick();
      this._initSlick();
    },

    onBlockSelect: function(evt) {
      var navItem = $('.nav-link-' + evt.detail.blockId);
      navItem.tab('show');
      this._unSlick();
      this._initSlick();
    }
  });

  return Producttabs;
})();

theme.Video = (function() {
  var promiseYoutubeAPI;
  var promiseVimeoAPI;

  var youtube = {
    promiseAPI: function() {
      if (!promiseYoutubeAPI) {
        var tag = document.createElement('script');

        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        promiseYoutubeAPI = $.Deferred(function(defer) {
          window.onYouTubeIframeAPIReady = defer.resolve;

          setTimeout(function() {
            defer.reject('Request for YouTube API timed out after 30 seconds.');
          }, 30000);
        });
      }

      return promiseYoutubeAPI;
    },
    promisePlayer: function(id, options) {
      return this.promiseAPI().then(function() {
        return $.Deferred(function(defer) {
          if (typeof window.YT === 'undefined') {
            defer.reject(
              "We're sorry, something went wrong. The YouTube API has not loaded correctly."
            );
          }

          /* eslint-disable no-undef */
          var player = new YT.Player(id, options); // global YT variable injected by YouTube API

          player.addEventListener('onReady', function() {
            defer.resolve(player);
          });

          setTimeout(function() {
            defer.reject(
              'Request for YouTube player has timed out after 30 seconds.'
            );
          }, 30000);
        });
      });
    }
  };

  var vimeo = {
    promiseAPI: function() {
      if (!promiseVimeoAPI) {
        promiseVimeoAPI = $.Deferred(function(defer) {
          var tag = document.createElement('script');
          tag.src = 'https://player.vimeo.com/api/player.js';
          tag.onload = tag.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'complete') {
              defer.resolve();
            }
          };

          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          setTimeout(function() {
            defer.reject('Request for Vimeo API timed out after 30 seconds.');
          }, 30000);
        });
      }

      return promiseVimeoAPI;
    },

    promisePlayer: function(id, options) {
      return this.promiseAPI().then(function() {
        return $.Deferred(function(defer) {
          if (typeof window.Vimeo === 'undefined') {
            defer.reject(
              "We're sorry, something went wrong. The Vimeo API has not loaded correctly."
            );
          }

          var player = new window.Vimeo.Player(id, options);

          setTimeout(function() {
            defer.reject(
              'Request for Vimeo player has timed out after 30 seconds.'
            );
          }, 30000);

          player.ready().then(function() {
            defer.resolve(player);
          });
        });
      });
    }
  };

  var selectors = {
    loadPlayerButton: '.video-section__load-player-button',
    closePlayerButton: '.video-section__player-close',
    playerContainer: '.video-section__player',
    cover: '.video-section__cover',
    errorMessage: '.video-section__error',
    bodyOverlay: '.video-section__body-overlay',
    body: 'body'
  };
  var classes = {
    playerLoading: 'video-section--loading',
    playerLoaded: 'video-section--loaded',
    playerError: 'video-section--error',
    videoPlaying: 'video-playing'
  };

  function Video(container) {
    this.$container = $(container);
    var sectionId = this.$container.attr('data-section-id');
    this.namespace = '.' + sectionId;
    this.onLoad();
  }

  Video.prototype = _.assignIn({}, Video.prototype, {
    onLoad: function() {
      this.$container
        .on('click', selectors.loadPlayerButton, this._loadPlayer.bind(this))
        .on('click', selectors.closePlayerButton, this._closePlayer.bind(this))
        .on('click', selectors.bodyOverlay, this._closePlayer.bind(this));
    },

    _loadPlayer: function() {
      var $container = this.$container;
      var $playerContainer = $(selectors.playerContainer, $container);
      var playerType = this.$container.attr('data-video-type');

      var promiseVideoPlayer;

      if (playerType === 'youtube') {
        promiseVideoPlayer = this._loadYoutubePlayer($playerContainer[0]);
      } else if (playerType === 'vimeo') {
        promiseVideoPlayer = this._loadVimeoPlayer($playerContainer[0]);
      }

      return promiseVideoPlayer
        .then(this._onPlayerLoadReady.bind(this))
        .fail(this._onPlayerLoadError.bind(this));
    },

    _loadYoutubePlayer: function(container) {
      return youtube
        .promisePlayer(container, {
          videoId: this.$container.attr('data-video-id'),
          ratio: 16 / 9,
          playerVars: {
            modestbranding: 1,
            autoplay: 1,
            showinfo: 0,
            rel: 0
          }
        })
        .then(
          function(player) {
            this.player = player;
          }.bind(this)
        );
    },

    _loadVimeoPlayer: function(container) {
      return vimeo
        .promisePlayer(container, {
          id: this.$container.attr('data-video-id')
        })
        .then(
          function(player) {
            this.player = player;
            this.player.play();
          }.bind(this)
        );
    },

    _onPlayerLoadReady: function() {
      $(selectors.closePlayerButton, this.$container)
        .show()
        .focus();
      $(selectors.cover, this.$container).addClass(classes.playerLoaded);
      this.$container.addClass(classes.playerLoaded);

      this._setScrollPositionValues();

      $(selectors.body).addClass(classes.videoPlaying);

      $(document).on('keyup' + this.namespace, this._closeOnEscape.bind(this));
      $(window).on(
        'resize' + this.namespace,
        this._setScrollPositionValues.bind(this)
      );
      slate.a11y.trapFocus({
        $container: this.$container,
        namespace: this.namespace
      });
    },

    _onPlayerLoadError: function(err) {
      this.$container.addClass(classes.playerError);
      $(selectors.errorMessage, this.$container).text(err);
    },

    _closeOnEscape: function(evt) {
      if (evt.keyCode !== 27) {
        return;
      }

      this._closePlayer();
      $(selectors.loadPlayerButton, this.$container).focus();
    },

    _onScroll: function() {
      var scrollTop = $(window).scrollTop();

      if (
        scrollTop > this.videoTop + 0.25 * this.videoHeight ||
        scrollTop + this.windowHeight <
          this.videoBottom - 0.25 * this.videoHeight
      ) {
        // Debounce DOM edits to the next frame with requestAnimationFrame
        requestAnimationFrame(this._closePlayer.bind(this));
      }
    },

    _setScrollPositionValues: function() {
      this.videoHeight = this.$container.outerHeight(true);
      this.videoTop = this.$container.offset().top;
      this.videoBottom = this.videoTop + this.videoHeight;
      this.windowHeight = $(window).innerHeight();
    },

    _closePlayer: function() {
      $(selectors.body).removeClass(classes.videoPlaying);
      $(selectors.cover, this.$container).removeClass(classes.playerLoaded);
      this.$container.removeClass(classes.playerLoaded);
      $(selectors.closePlayerButton, this.$container).hide();

      slate.a11y.removeTrapFocus({
        $container: this.$container,
        namespace: this.namespace
      });

      if (typeof this.player.destroy === 'function') {
        this.player.destroy();
      } else if (typeof this.player.unload === 'function') {
        this.player.unload();
      }

      $(document).off(this.namespace);
      $(window).off(this.namespace);
    }
  });

  return Video;
})();



theme.SwiperCustom = (function() {
  function SwiperCustom(container) {
    this.container = container;
    this.sectionId = $(container).attr('data-section-id');
    this.nav = '.swiper-wrapper-' + this.sectionId;
    this.namespace = '.swipercol-' + this.sectionId;
    var perviewDesktop= $(container).data('perview-desktop');
    var perviewMobile= $(container).data('perview-mobile') || 2.2;
    var spaceBetween= $(container).data('space-between');
    var swiper = new Swiper(this.namespace, {
      slidesPerView: "auto",
      freeMode: false,
      autoHeight: true,
      calculateHeight:true,
      freeModeSticky: true,
      centeredSlides: false,
      grabCursor: true,
      watchSlidesVisibility: true,
      watchSlidesProgress: true,
      preloadImages: true,
      updateOnImagesReady: true,
      spaceBetween: spaceBetween,
      observer: true,
      observeParents: true,
      parallax:true,
      a11y: true,
      keyboard: {
        enabled: true,
      },
      breakpoints: {
        320: {
          slidesPerView: perviewMobile,
          spaceBetween: 20
        },
        576: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 3,
        },
        992: {
          slidesPerView: perviewDesktop,
        },
      },
      scrollbar: {
        el: $(this.namespace).find(".swiper-scrollbar")[0],
      },
      navigation: {
        nextEl: $(this.nav).find(".swiper-button-next")[0],
        prevEl: $(this.nav).find(".swiper-button-prev")[0],
      },
    });
   
  }
  return SwiperCustom;
})();


theme.AnnouncementSwiper = (function() {
  function AnnouncementSwiper(container) {
    this.container = container;
    this.sectionId = $(container).attr('data-section-id');
    this.namespace = '.announswipercol-' + this.sectionId;
    var rootElement = document.querySelector(':root');
    var anNounBar = document.querySelector('.announcement-bar-carousel');
    rootElement.style.setProperty("--height-announbar", anNounBar.offsetHeight + "px");
    var swiper = new Swiper(this.namespace, {
      slidesPerView:1,
      loop: $(this.namespace).find(".slider .slide").length == 1 ? true: false,
      autoHeight: true,
      calculateHeight:true,
      observer: true,
      a11y: true,
      navigation: {
        nextEl: $(this.namespace).find(".swiper-button-next")[0],
        prevEl: $(this.namespace).find(".swiper-button-prev")[0],
      }
    });
    document.addEventListener('shopify:block:select', function (event) {
      var sectionId = event.detail.sectionId;
      var blockId = event.detail.blockId;
      var load = event.detail.load;
      var index = $(`#${blockId}`).index();
      swiper.slideTo(index);
    });
  }
  return AnnouncementSwiper;
})();

theme.init = function() {
  theme.customerTemplates.init();
  slate.rte.wrapTable();
  slate.rte.iframeReset();

  // Common a11y fixes
  slate.a11y.pageLinkFocus($(window.location.hash));

  $('.in-page-link').on('click', function(evt) {
    slate.a11y.pageLinkFocus($(evt.currentTarget.hash));
  });

  $('a[href="#"]').on('click', function(evt) {
    evt.preventDefault();
  });


    //scroll animation
    
  AOS.init({
    startEvent: 'DOMContentLoaded',
    offset: 30, // offset (in px) from the original trigger point
    delay: 0, // values from 0 to 3000, with step 50ms
    duration: 700,
    once: true
  });
  
  window.addEventListener('load', function() {
    AOS.refresh();
  });
  document.querySelectorAll('img')
    .forEach((img) =>
        img.addEventListener('load', () =>
            AOS.refresh()
        )
    );
  


  // Sections
  var sections = new theme.Sections();
  sections.register('header', theme.HeaderSection);
  sections.register('product', theme.Product);
  sections.register('slideshow-section', theme.SlideshowSection);
  sections.register('cart', theme.Cart);
  sections.register('instagrams', theme.Instagrams);
  sections.register('productlist', theme.Productlists);
  sections.register('producttab', theme.Producttabs);
  sections.register('slickCarousels', theme.slickCarousel);
  sections.register('slickPress', theme.slickPress);
  sections.register('video', theme.Video);
  sections.register('swipercustom',theme.SwiperCustom);
  sections.register('announcementswiper',theme.AnnouncementSwiper);
  sections.register('cookie', theme.CookieSection);
  sections.register('popupnewletter', theme.popupNewletter);
  sections.register('beforeafter', theme.BeforeAfter);
  sections.register('bundleproduct', theme.bundleProduct);
  sections.register('footer', theme.FooterSection);
  

  // Standalone modules
  $(window).on('load', theme.articleImages);
  theme.passwordModalInit();
};

theme.articleImages = function() {
  var $indentedRteImages = $('.rte--indented-images');
  if (!$indentedRteImages.length) {
    return;
  }

  $indentedRteImages.find('img').each(function(i, el) {
    var $el = $(el);
    var attr = $el.attr('style');

    // Check if undefined or float: none
    if (!attr || attr === 'float: none;') {
      // Add class to parent paragraph tag if image is wider than container
      if ($el.width() >= $indentedRteImages.width()) {
        $el.parent('p').addClass('rte__image-indent');
      }
    }
  });
};

theme.passwordModalInit = function() {
  var $loginModal = $('#LoginModal');
  if (!$loginModal.length) {
    return;
  }

  // Initialize modal
  theme.PasswordModal = new window.Modals('LoginModal', 'login-modal', {
    focusOnOpen: '#Password'
  });

  // Open modal if errors exist
  if ($loginModal.find('.errors').length) {
    theme.PasswordModal.open();
  }
};


// Quickview https://github.com/kellyvaughn/quickview-for-shopify/blob/master/quickview.js.liquid
theme.quickview = (function() {
  var product_handle = '',
      quickviewButtonClass = '.js-btn-quickview',
      quickviewId = '#jsQuickview',
      quickviewOption = '#jsQuickview select',
      quickviewThumb = '#qv-product-images',
      quickviewAddCartButton = '.qv-add-button',
      quickviewPrice = '.qv-product-price',
      quickviewComparePrice = '.qv-product-compare-price';
      quickLoad = '#loading_qv';
      quickQty = '.popup-quantity';
  // 1. Show quickview
  $(quickLoad).removeClass('activeload');
  $(quickviewId).removeClass('loadqvpopup');

  //quanity quickview
  
  $(".qv-qtity").on("click", function () {
    var $button = $(this);
    var oldValue = $button.closest(quickQty).find("input.qv-quantity").val();
    if ($button.text() == "+") {
        var newVal = parseFloat(oldValue) + 1;
    } else {
        // Don't allow decrementing below zero
        if (oldValue > 1) {
            var newVal = parseFloat(oldValue) - 1;
        } else {
            newVal = 1;
        }
    }
    $button.closest(quickQty).find("input.qv-quantity").val(newVal);
  });
  //click
  $(document).on('click',quickviewButtonClass, function() {
    $(quickQty).find("input.qv-quantity").val(1);
    //ResetQuickview
    $(quickLoad).addClass('activeload');
    var qv_color = $(quickviewId).data('color');
    var quickviewAvaible = $(this).attr("data-pavailable");
    var tagOrder = $(this).attr("data-tag");
    var jdmgReview = $(this).attr("data-viewjdmg");
    product_handle = $(this).data('handle');
    $(quickviewThumb).removeClass().empty();
    $('.qv-product-options').empty().removeClass('pb-3');
    var desc = $(this).find('.txt-short').text();
    
    //Pushdata
    $(quickviewId).addClass(product_handle).data({
      'handle' : product_handle,
      'tag' : tagOrder
    });
      $.getJSON({
        url: '/products/' + product_handle + '.js?' + new Date().getTime(),
        beforeSend: function() {
          $(quickviewButtonClass+`[data-handle=${product_handle}]`).addClass('qv-loading');
        },
        
      }).done(function(product) {
        $(quickviewId).removeClass().addClass('modal fade show loadqvpopup');
        var title = product.title;
        var type = product.type;
        var vendor = product.vendor;
        var price = 0;
        var compare_price = 0;
        var images = product.images;
        var variants = product.variants;
        var options = product.options;
        var url = '/products/' + product_handle;
        
        $('.qv-product-title').text(title);
        function renderReview(){
          if(window.SPR &&  theme.review ){
            $('.qv-product-rv').html(`<span class="shopify-product-reviews-badge" data-id="${product.id}"></span>`);
            return window.SPR.registerCallbacks(),
            window.SPR.initRatingHandler(),
            window.SPR.initDomEls(),
            window.SPR.loadProducts(),
            window.SPR.loadBadges()
          }
          if(theme.review && typeof jdgm !== 'undefined' ){
            $('.qv-product-rv').html(`<div class='pt-1 small' >${jdmgReview}</div>`);
            return jdgm.customizeBadges();
          }
        }
        renderReview();
        $('.qv-product-type').text(type);
        $('.qv-product-description').html(desc);
        $('.qv-view-product').attr('href', url);
        $('.qv-view-product').click(function(){
          window.location.href = url;
        });
        $('.qv-view-type').text(type);
        $('.qv-view-vendor').text(vendor);
        if ($('.qv-product-description').is(':empty')){
          $('.qv-product-description').removeClass('mb-1');
        }
        else{
          $('.qv-product-description').addClass('mb-1');
        }
        if(quickviewAvaible == 'true'){
          if(tagOrder == 'preorder'){
            $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.preOrder);
          }
          else{
            $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.addToCart);
          }
        }
        else{
          $(quickviewAddCartButton).prop('disabled', true).html(theme.strings.soldOut);
        }
        $(product.variants).each(function(i,variants) {
          if(variants.sku != null){
            $('.qv-sku').addClass("show").removeClass("hide");
            $('.qv-view-sku').text(product.variants[0].sku);
          }
          else{
            $('.qv-sku').addClass("hide").removeClass("show");
          }
          
        });
        var imageCount = $(images).length;
        $(images).each(function(i, image) {
          image_embed = '<div><img class="lazyload " role="presentation"  data-src="' + image+"&width=800" + '" srcset="' + image+"&width=800" + '" src="' + image+"&width=800" + '" ></div>';
          $(quickviewThumb).append(image_embed);
        });
        $(quickviewThumb).slick({
          rtl:theme.rtl,
          'dots': true,
          'arrows': true,
          'respondTo': 'min',
          'useTransform': true
        }).css('opacity', '1');
  
        if (product.variants[0].option1 !== "Default Title"){
          $(options).each(function(i, option) {
            var name = option.name;
            var opt = name.replace(/ /g, '-').toLowerCase();
            var selectClass = '.option.' + opt;
            $('.qv-product-options').append('<div class="option-selection ' + opt + '"><span class="option text-body  ">' + option.name + ' :<span class="pl-2 txt-body-70 js-option-label-'+i+' ">'+option.values[0]+'</span></span><select class="option-' + i + ' option ' + opt + '"></select></div>').addClass('pb-3');
            $(option.values).each(function(i, value) {
              $('.option.' + opt).append($('<option>', {
                value: value,
                text: value
              }));
            });
            //list
            if ($("#jsQuickview").data('type') == 'list') {
              var str = '<div class="single-option-radio js-option-' + i + ' ">';
              if (option.name.includes(theme.strings.colorVariant1) || option.name.includes(theme.strings.colorVariant2)) {
                var k = i + 1;
              }
              
              //option.values = option.values.sort();
              $(option.values).each(function(i, value) {
                var cl="";
                var nvl = value.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
                const escapedValue = nvl;
                if (i == 0){
                  cl="active";
                }
                if (option.name.includes(theme.strings.colorVariant1) || option.name.includes(theme.strings.colorVariant2)) {
                  var variant_img = '';
                  for (cc = 0; cc < variants.length; cc++) { 
                    if (variants[cc]['option'+k] == value) {
                      if (variants[cc]['featured_image'] && variants[cc]['featured_image']['src']) {
                        variant_img = variants[cc]['featured_image']['src'];
                      }
                    }
                  }
                  
                  if (variant_img == '') {
                    if(qv_color){
                      str += `<label class="have-background st-color-${escapedValue} ${cl}" data-value="${value}" style="background-color:${value};"><span class="st-color-${escapedValue} st-color"></span><span>${value}</span></label>`;
                    }
                    else{
                      str += '<label class="'+cl+'" data-value="'+value+'">'+value+'</label>';
                    }
                    
                  } else {
                    if(qv_color){
                      var file = variant_img;
                      file = file.slice(0, file.lastIndexOf("/products"));
                      str += `<label class="have-background st-color-${escapedValue} ${cl}" data-value="${value}" style="background-color:${value};"><span class="st-color-${escapedValue} st-color"></span><span>${value}</span></label>`;

                    }
                    else{
                      str += '<label class="have-background '+cl+'" data-value="'+value+'" style="background-image:url('+variant_img+')">'+value+'</label>';	
                    }                  
                     
                  }
                  
                } else{
                  str += '<label class="'+cl+'" data-value="'+value+'">'+value+'</label>';
                }
                
              });
              str += '</div>';
              $(`.option-selection.${opt}`).append(str);
            }
          });
          if ($("#jsQuickview").data('type') == 'list') {
            $("#jsQuickview .option-selection label").click(function(){
  
              $(this).closest('.option-selection').find('select').val($(this).data('value'));
              $(this).closest('.option-selection').find('label').removeClass('active');
              $(this).addClass('active');
              
              var arr_option = [];
              $("#jsQuickview").find('select.option').each(function(){
                arr_option.push($(this).val());
              });
              var variant = '';
              for (i=0; i<variants.length; i++) {
                var status = true;
                for (j=0; j<arr_option.length; j++) {
                  if (arr_option[j] != variants[i]['options'][j]) {
                    status = false;
                    break;
                  }
                }
                // if (variants[i]['available'] == false) {
                //     status = false;
                // }
                if (status == true) {
                  variant = variants[i];
                  break;
                }
              }
              //console.log(variant);
              //console.log(variant['available']);
              if (variant != '') {
                if (variant['available']) {
                  $(".qv-add-button").prop( "disabled", false );
                  } else {
                      $(".qv-add-button").prop("disabled", true).html(theme.strings.soldOut);
                  }
              } else {
                $(".qv-add-button").prop("disabled", true).html(theme.strings.unavailable);
              }
              
              
              var selectedOptions = '';
              $(quickviewOption).each(function(i) {
                if (selectedOptions == '') {
                  selectedOptions = $(this).val();
                } else {
                  selectedOptions = selectedOptions + ' / ' + $(this).val();
                }
              });
              var targetVl = $(this).data("value");
              for (i=0; i<variants.length; i++) {
                $(this).closest('.option-selection').find('.js-option-label-'+i+'').text(targetVl);
              }
              
              jQuery.getJSON(`/products/${product_handle}.js`, function(product) {
                $(product.variants).each(function(i, v) {
                  if (v.title == selectedOptions) {
                    if (v.featured_image !== null){
                      var iSlick = v.featured_image.position - 1;
                      $(quickviewThumb).slick('slickGoTo', iSlick);
                    }
                    var price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
                    var compare_price = theme.Currency.formatMoney(v.compare_at_price, theme.moneyFormat);
                    $(quickviewPrice).html(price);
                    $(quickviewComparePrice).html(compare_price);
                    if (v.compare_at_price !== null) {
                      $(quickviewComparePrice).html(compare_price).show();
                    } else {
                      $(quickviewComparePrice).hide();
                    }
                    
                    if (v) {
                      if (v.available == true) {
                          if(tagOrder == 'preorder'){
                            $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.preOrder);
                          }
                          else{
                            $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.addToCart);
                          }
                      }
                      else {
                        $(quickviewAddCartButton).prop('disabled', true).html(theme.strings.soldOut);
                      }
                    }
                    else {
                      $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.unavailable);
                    }
                  }
  
                });
              });
  
            });
          }
        }
        $(product.variants).each(function(i, v) {
          price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
          compare_price = theme.Currency.formatMoney(v.compare_at_price, theme.moneyFormat);
          $(quickviewPrice).html(price);
          if (v.compare_at_price !== null) {
            $(quickviewComparePrice).html(compare_price).show();
          } else {
            $(quickviewComparePrice).hide();
          }
          //theme.updateCurrencies();
          //v.inventory_quantity == 0 && v.inventory_management == 'shopify'
          if (v.inventory_quantity == 0 && v.inventory_management == 'shopify') {
            $(quickviewAddCartButton).prop('disabled', true).val(theme.strings.soldOut);
            return true
          } else {
            $('select.option-0').val(v.option1);
            $('select.option-1').val(v.option2);
            $('select.option-2').val(v.option3);
            return false
          }
        });
       
      }).fail(function() {
      console.log( "error" );
    }).always(function() {
        $(quickviewButtonClass+`[data-handle=${product_handle}]`).removeClass('qv-loading');
        $(quickLoad).removeClass('activeload');
    });
    //addCartQuickview
  });
  $(quickviewId).on("hidden.bs.modal", function () {
    $(quickviewId).removeClass('loadqvpopup');
    $(quickLoad).removeClass('activeload');
  });
  // 2. Add to cart
  $(document).on('click',quickviewAddCartButton, function(){
    product_handle = $(quickviewId).data('handle');
    var tagOrder = $(quickviewId).data('tag');
    var spinner = '<div class="product-card__loading spinner-border d-block" role="status"></div>';
    var qty = $('.qv-quantity').val(),
        selectedOptions = '',
        var_id = '';
    function processCart() {
      $.post({
        url: '/cart/add.js',
        data: {
          quantity: qty,
          id: var_id
        },
        dataType: 'json',
        beforeSend: function() {
          $(quickviewAddCartButton).html(spinner);
        }
      })
      .done(function(item) {
        var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
        var styleCart = $('.js-mini-cart').attr("data-cartmini");
        
        if(styleCart != 'true'){
        var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
        theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice');
        }
        
        theme.miniCart.updateElements();
        theme.miniCart.generateCart();

        if(theme.cartpage){
          location.reload();
          $("html, body").animate({ scrollTop: 0 }, "slow");
        }
      })
      .fail(function($xhr) {
        var data = $xhr.responseJSON;
        theme.alert.new('',data.description,3000,'warning');
      }).always(function() {
        if(tagOrder == 'preorder'){
          $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.preOrder);
        }
        else{
          $(quickviewAddCartButton).prop('disabled', false).html(theme.strings.addToCart);
        }
        $(quickviewId).modal('hide');
      });
    }
    $(quickviewOption).each(function(i) {
      if (selectedOptions == '') {
        selectedOptions = $(this).val();
      } else {
        selectedOptions = selectedOptions + ' / ' + $(this).val();
      }
    });
    jQuery.getJSON('/products/' + product_handle + '.js', function(product) {
      if (product.variants.length === 1){
        var_id = product.variants[0].id;
      }else{
        $(product.variants).each(function(i, v) {
          if (v.title == selectedOptions) {
            var_id = v.id;
          }
        });
      }
      processCart();
    });
  });
  // 3. Select variants
  $(document).on('change', quickviewOption, function() {
    var selectedOptions = '';
    $(quickviewOption).each(function(i) {
      if (selectedOptions == '') {
        selectedOptions = $(this).val();
      } else {
        selectedOptions = selectedOptions + ' / ' + $(this).val();
      }
    });
    jQuery.getJSON('/products/' + product_handle + '.js', function(product) {
      $(product.variants).each(function(i, v) {
        
        if (v.title == selectedOptions) {
          if (v.featured_image !== null){
            var iSlick = v.featured_image.position - 1;
            $(quickviewThumb).slick('slickGoTo', iSlick);
          }
          var price = theme.Currency.formatMoney(v.price, theme.moneyFormat);
          var compare_price = theme.Currency.formatMoney(v.compare_at_price, theme.moneyFormat);
          $(quickviewPrice).html(price);
          $(quickviewComparePrice).html(compare_price);
          if(v.sku != null){
            $('.qv-sku').addClass("show").removeClass("hide");
            $('.qv-view-sku').text(v.sku);
          }
          else{
            $('.qv-sku').addClass("hide").removeClass("show");
          }
          if (v.compare_at_price !== null) {
            $(quickviewComparePrice).html(compare_price).show();
          } else {
            $(quickviewComparePrice).hide();
          }
          if (v.inventory_management === null) {
            $(quickviewAddCartButton).prop('disabled', false).val(theme.strings.addToCart);
          } else {
            if (v.inventory_quantity < 1) {
              $(quickviewAddCartButton).prop('disabled', true).val(theme.strings.soldOut);
            } else {
              $(quickviewAddCartButton).prop('disabled', false).val(theme.strings.addToCart);
            }
          }
        }
      });
    });
  });
})()

// Button add to cart (in grid item)
theme.addCartButton = (function(){
  var buttonClass = '.js-grid-cart';
  $(document).on('click',buttonClass,function(){
    var $this = $(this);
    var id = $this.data('id');
    $this.addClass('is-loading');
    Shopify.addItem(id,1,function(item){
      var htmlVariant = item.variant_title !== null ? '<i>('+item.variant_title+')</i>' : '';
      var styleCart = $('.js-mini-cart').attr("data-cartmini");
        if(styleCart != 'true'){
          var htmlAlert = '<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="'+item.image+'"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">'+item.product_title+' x '+ item.quantity +'</p>'+htmlVariant+'<div><div>';
        }
        theme.miniCart.generateCart();
        theme.miniCart.updateElements();
        setTimeout(function() {
          styleCart != 'true' ? theme.alert.new(theme.strings.addToCartSuccess,htmlAlert,3000,'notice'): '';
        
          $this.removeClass('is-loading');
        }, 300);
        if(theme.cartpage){
          location.reload();
          $("html, body").animate({ scrollTop: 0 }, "slow");
        }
    });
    
  })
})()

theme.GiftWrap = (function(){
  var openBox = '.open-gift',
      giftWrap = '.giftwrap'
      addGift    = '.add-gift',
      boxGift = '.boxgift',
      closeBtn = '.close-gift__btn',
      idGift = $(addGift).data('id'),
      cartDraw = $('.mini-cart-content');
  $(document).on('click',openBox,function(){
    $(this).next().addClass('active');
    $(this).closest(cartDraw).addClass('overlay');
  });
  $(document).on('click',closeBtn,function(){
    $(this).closest(boxGift).removeClass('active');
    $(this).closest(cartDraw).removeClass('overlay');
  });
  function addGiftInCart() {
    
    $(document).on('click',addGift,function(e){
      e.preventDefault();
      $(this).addClass('is-loading');
      
      Shopify.addItem(idGift,1,function(item){
        //console.log(item);
          theme.miniCart.generateCart();
          theme.miniCart.updateElements();
          setTimeout(function() {
            $(this).removeClass('is-loading');
          },300);
          if(theme.cartpage){
            location.reload();
            $("html, body").animate({ scrollTop: 0 }, "normal");
          }
      });
      
    })
  }
  addGiftInCart();
  function hideGift(id){
    if(id === idGift){
      $(giftWrap).addClass('hide');
      $(boxGift).removeClass('active');
      $(addGift).removeClass('is-loading');
      $(cartDraw).removeClass('overlay');
    } 
  }
  function checkGift(id){
    if(id === idGift){
      $(giftWrap).removeClass('hide');
      $(boxGift).removeClass('active');
      $(addGift).removeClass('is-loading');
      $(cartDraw).removeClass('overlay');
    } 
  }
  return{
    
    hideGift:hideGift,
    checkGift: checkGift,
  }
})()

theme.openAddon = (function(){
  var openBlock = '.js-open-addon',
      closeBlock = '.btn-close-addon',
      addonBlock = '.block-addon__box--wrap'
      cartDraw = $('.mini-cart-content');
      $(document).on('click',openBlock,function(){
        $(this).next().addClass('active');
        $(this).closest(cartDraw).addClass('overlay');
      });
      $(document).on('click',closeBlock,function(){
        $(this).closest(addonBlock).removeClass('active');
        $(this).closest(cartDraw).removeClass('overlay');
      });
})()



// MiniCart
theme.miniCart = (function(){
  var miniCart = '.js-mini-cart',
      styleCart = $(miniCart).attr("data-cartmini"),
      cartToggle = '.js-toggle-cart',
      cartCount = '.js-cart-count',
      cartContent = '.js-mini-cart-content',
      cartTotal = '.js-cart-total',
      $crosellcart = '.drawer-crossell',
      $cartBottom = '.js-cart-bottom',
      $btnCheckout = $('.js-cart-btn-checkout'),
      numberDisplayed = 5,
      buttonHtml = '<a class="btn btn-outline w-100 mt-5" href='+theme.strings.cartCollection+'>'+theme.strings.cartEmptyButton+'</a>',
      emptyCartHTML = '<div class="alert mini-cart-empty h-100 d-flex align-items-center flex-column justify-content-center"><div class=""><div class="iconcart-empty">'+theme.strings.cartIcon+'</div><div class="txtcart-empty mt-4">'+theme.strings.cartEmpty+'</div>'+buttonHtml+'</div></div>',
      cartimgsize = $(cartContent).attr('data-sizeimg');


  function updateElements(){
    Shopify.getCart(function(cart){
      if (cart.item_count === 0) {
        $(cartContent).html(emptyCartHTML);
        //$btnCheckout.addClass('disabled');
        $(`${$cartBottom}, ${$crosellcart}`).hide(100);
        styleCart === 'true' ? $(miniCart).removeClass('active') : null;
        
      }else{
        //$(cartContent).html(emptyCartHTML).fadeOut(1000);
        //$btnCheckout.removeClass('disabled');
        $(`${$cartBottom}, ${$crosellcart}`).show(100);
        styleCart === 'true' ? $(miniCart).addClass('active') : null;
      }
      $(cartCount).text(cart.item_count);
      $(cartTotal).html(theme.Currency.formatMoney(cart.total_price, theme.moneyFormat));
      theme.freeShipping.load(cart);
      //theme.updateCurrencies();
    })
  }
  function generateCart(){
    
    Shopify.getCart(function(cart){
      var htmlCart = cart.item_count === 0? emptyCartHTML:'',
          itemCount = cart.items.length,
          forLoop = itemCount < numberDisplayed ? itemCount : numberDisplayed;
          if (cart.item_count === 0) {	
            $(`${$cartBottom}, ${$crosellcart}`).hide(100);
          }else{	
            $(`${$cartBottom}, ${$crosellcart}`).show(100);
            
          }
          //styleCart === 'true' ? cart.items.length ? $(miniCart).addClass('active'): $(miniCart).removeClass('active') :null;

      // add list items
      for (let i = 0; i < forLoop; i++) { 
        var line = i+1;
        var product = cart.items[i],
        productPrice = theme.Currency.formatMoney(product.price, theme.moneyFormat);
        theme.GiftWrap.hideGift(product.id);
        htmlCart += `<div class="mini-cart-item">`;
        htmlCart += `	<a class="mini-cart-image " href="${product.url}"> <span class="d-block mini-cart-img ${cartimgsize}">`;
        htmlCart += `		<img src="${product.image}&width=160"/>`;
        htmlCart += `	</span></a>`;
        htmlCart += `	<div class="mini-cart-meta">`;
        htmlCart += `		<div class="mb-1"><a href="${product.url}">${product.title}</a></div>`;
        htmlCart += `		<span>${productPrice}</span> x ${product.quantity}<div class="d-flex align-items-center mt-2 justify-content-between"><div class="js-qty mt-1"><input data-line="`+ line + `" type="text" min="0" class="change-minicart js-qty__input" pattern="[0-9]*" value="${product.quantity}"><button type="button" class="js-qty__adjust js-qty__minus" aria-label="Reduce item quantity by one"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-minus" viewBox="0 0 22 3"><path fill="#000" d="M21.5.5v2H.5v-2z" fill-rule="evenodd"></path></svg><span class="icon__fallback-text">−</span></button><button type="button" class="js-qty__adjust js-qty__plus" aria-label="Increase item quantity by one"><svg aria-hidden="true" focusable="false" role="presentation" class="icon icon-plus" viewBox="0 0 22 21"><path d="M12 11.5h9.5v-2H12V0h-2v9.5H.5v2H10V21h2v-9.5z" fill="#000" fill-rule="evenodd"></path></svg><span class="icon__fallback-text">+</span></button></div><button class="btn js-remove-mini-cart link pr-0" data-id="${product.id}">Remove</button></div>`;
        htmlCart += `	</div>`;
        htmlCart += `</div>`;
      }
      if (itemCount > numberDisplayed){
        htmlCart += '<p><a class="js-btn-viewmore small" href="/cart">'+theme.strings.cartMore+' ('+(itemCount - numberDisplayed)+')</a></p>'
      }
      // add total price and cart button / checkout button
      $(cartContent).html(htmlCart);
      $(".js-qty__plus").unbind('click');
      $(".js-qty__minus").click(function(){
        if ($(this).parent().find('input').val() < 1) {
          $(this).parent().find('input').val(0);
        }else{
          $(this).parent().find('input').val(parseInt($(this).parent().find('input').val()) - 1);
        }
        var qty = $(this).parent().find('input').val();
        var line = $(this).parent().find('input').data('line');
      	jQuery.post('/cart/change.js', {
          quantity: qty,
          line: line
        },null,"json").done(function(item) {
          theme.miniCart.updateElements();
          theme.miniCart.generateCart();
        })
      });
      $(".js-qty__plus").unbind('click');
      $(".js-qty__plus").click(function(){
        $(this).parent().find('input').val(parseInt($(this).parent().find('input').val()) + 1);
        
        var qty = $(this).parent().find('input').val();
        var line = $(this).parent().find('input').data('line');
        jQuery.post('/cart/change.js', {
          quantity: qty,
          line: line
        },null,"json").done(function(item) {
          theme.miniCart.updateElements();
          theme.miniCart.generateCart();
        })
        
      });
      
      $(cartTotal).html(theme.Currency.formatMoney(cart.total_price, theme.moneyFormat));
      //theme.updateCurrencies();
    })
  }
  // 2. Button remove items
  $(document).on('click','.js-remove-mini-cart',function(){
    var itemId = $(this).data('id');
    var isOuterMiniCart = $(this).closest(miniCart).length === 0? true : false;  // check element from mini cart or not
    
    // hide items
    $(this).parents('.mini-cart-item').fadeOut();
    theme.GiftWrap.checkGift(itemId);
    //remove from cart
    Shopify.changeItem(itemId,0,updateElements);
    Shopify.getCart(function(cart){
      if (cart.items.length > numberDisplayed || isOuterMiniCart) {
        generateCart();
      }
    });
  });

  //Keep popup when click cart / UX
  $(document).on('click',cartToggle,function(){
    $(this).parent(miniCart).toggleClass('active');
  });
  $(document).on('click','.overlaycart, .close',function(){
    $(this).parents(miniCart).removeClass('active');
  });

  // gen minicart when load page
  generateCart();
  return{
    updateElements:updateElements,
    generateCart: generateCart
  }
})()

// Free shipping
theme.freeShipping = (function(){
  var $freeShippingClass = $('.js-free-shipping'),
      $freeShippingTextClass = $('.js-free-shipping-text'),
      $free_fisrt = $freeShippingClass.attr('data-start'),
      $free_end = $freeShippingClass.attr('data-end')
      minOrderValue = parseInt($freeShippingClass.data('value')) || 0,
      $percentClass = $('.js-free-shipping .progress-bar');

  function generate(cart){
    var priceCart = cart.total_price;
    priceCart == 0 ? $freeShippingClass.hide() : $freeShippingClass.show();
    if (priceCart >= minOrderValue){
      $percentClass.css('width','100%').removeClass('progress-bar-striped bg-primary');
      $freeShippingTextClass.text(theme.strings.freeShipping);
      $freeShippingTextClass.prev('svg').removeClass('hide');
    }else{
      let percent = priceCart / minOrderValue * 100;
      let left = Shopify.formatMoney((minOrderValue - priceCart),theme.moneyFormat);
      $percentClass.css('width',percent+'%').addClass('progress-bar-striped primary');
      $freeShippingTextClass.html($free_fisrt +' '+ left +' '+ $free_end);
      $freeShippingTextClass.prev('svg').removeClass('hide');
      //theme.updateCurrencies();
    }
  }

  Shopify.getCart(function(cart){
    generate(cart);
  });

  return {
    load:generate
  }
})()

// Shipping time - https://github.com/phstc/jquery-dateFormat
theme.shippingTime = (function(){
  var $shippingTime = $('.js-shipping-time'),
      shippingTime = $shippingTime.data('time') || '',
      now = new Date(),
      restHour = 23 - now.getHours(),
      restMinute = 59 - now.getMinutes();
  if (shippingTime !== ''){
    var nextTime = new Date(now.getTime() + shippingTime * 86400000),
        formatTime = $.format.date(nextTime, "ddd, dd MMMM yyyy"),
        htmlShipping = 'Order in the next <b>'+restHour+'</b> hours <b>'+restMinute+'</b> minutes to get it by <b>'+formatTime+'</b>. ';
    $shippingTime.html(htmlShipping);
  }
})()




// Wishlist
theme.wishlist = (function () {
  const btnWishlist = '.js-btn-wishlist',
        btnRemoveWishlist = '.js-remove-wishlist',
        $wishlistCount = $('.js-wishlist-count'),
        $wishlistContainer = $('.js-wishlist-content'),
        wishlist = JSON.parse(localStorage.getItem('localWishlist')) || [],
        wishlistPageUrl = $('.js-wishlist-link').attr('href');

  function showNoResult() {
    $wishlistContainer.html(`
      <div class="col text-center">
        <div class="alert alert-warning d-inline-block">${theme.strings.wishlistNoResult}</div>
      </div>
    `);
  }

  function updateWishlist(self) {
    const productHandle = $(self).data('handle');
    const allSimilarProducts = $(`${btnWishlist}[data-handle="${productHandle}"]`);
    const isAdded = wishlist.includes(productHandle);

    if (isAdded) {
      window.location.href = wishlistPageUrl;
    } else {
      wishlist.push(productHandle);
      allSimilarProducts.fadeOut('slow').fadeIn('fast').html(`${theme.strings.wishlistIconAdded}${theme.strings.wishlistTextAdded}`);
      allSimilarProducts.attr('data-original-title', theme.strings.wishlistTextAdded);
      $('.tooltip-inner').text(theme.strings.wishlistTextAdded);
    }

    localStorage.setItem('localWishlist', JSON.stringify(wishlist));
    $wishlistCount.text(wishlist.length);
  }

  function loadWishlist() {
    $wishlistContainer.empty();

    if (wishlist.length > 0) {
      wishlist.forEach((productHandle) => {
        jQuery.getJSON(window.Shopify.routes.root + `products/${productHandle}.js`, function(product) {
          const productPrice = product.price_varies
            ? `from ${theme.Currency.formatMoney(product.price_min, theme.moneyFormat)}`
            : theme.Currency.formatMoney(product.price, theme.moneyFormat);
          const productComparePrice = product.compare_at_price_min !== 0
            ? theme.Currency.formatMoney(product.compare_at_price_min, theme.moneyFormat)
            : '';
          const priceClass = productComparePrice ? 'wl-sale' : '';

          const htmlProduct = `
            <div class="js-wishlist-item col-md-4 col-sm-6 col-xs-6 col-12 mb-4 pb-3">
              <div class="js-wishlist-itembox">
                <div class="d-flex flex-row">
                  <a class="d-inline-block mr-4 wl-left" href="${product.url}">
                    <img class="lazyload" data-src="${product.featured_image}"/>
                  </a>
                  <div>
                    <a href="${product.url}" class="title-product d-block product-card__name mb-1">${product.title}</a>
                    <span class="${priceClass}">${productPrice}</span>
                    <s>${productComparePrice}</s>
                    <p><button class="btn js-remove-wishlist link px-0 small" data-handle="${product.handle}">${theme.strings.wishlistRemove}</button></p>
                  </div>
                </div>
              </div>
            </div>
          `;

          $wishlistContainer.append(htmlProduct);
        });
      });
    } else {
      showNoResult();
    }

    $wishlistCount.text(wishlist.length);

    $(btnWishlist).each(function () {
      const productHandle = $(this).data('handle');
      const isProductAdded = wishlist.includes(productHandle);
      const iconWishlist = isProductAdded ? theme.strings.wishlistIconAdded : theme.strings.wishlistIcon;
      const textWishlist = isProductAdded ? theme.strings.wishlistTextAdded : theme.strings.wishlistText;

      $(this).html(`${iconWishlist}${textWishlist}`).attr('title', textWishlist);
    });
  }

  $(document).on('click', btnWishlist, function (event) {
    event.preventDefault();
    updateWishlist(this);
  });

  $(document).on('click', btnRemoveWishlist, function () {
    const productHandle = $(this).data('handle');
    const allSimilarProducts = $(`${btnWishlist}[data-handle="${productHandle}"]`);

    allSimilarProducts.html(`${theme.strings.wishlistIcon}${theme.strings.wishlistText}`);
    allSimilarProducts.attr('data-original-title', theme.strings.wishlistText);

    const productIndex = wishlist.indexOf(productHandle);
    if (productIndex !== -1) {
      wishlist.splice(productIndex, 1);
      localStorage.setItem('localWishlist', JSON.stringify(wishlist));
    }

    $(this).closest('.js-wishlist-item').fadeOut(() => {
      $(this).remove();
      if (wishlist.length === 0) {
        showNoResult();
      }
    });

    $wishlistCount.text(wishlist.length);
  });

  loadWishlist();
  $(document).on('shopify:section:load', loadWishlist);

  return {
    load: loadWishlist
  };
})();



// Compare
theme.compare = (function (){
  var compareButtonClass = '.js-btn-compare',
      compareRemoveButtonClass = '.js-remove-compare',
      $compareCount = $('.js-compare-count'),
      $compareContainer = $('.js-compare-content'),
      compareObject = JSON.parse(localStorage.getItem('localCompare')) || [],
      alertClass='notice';
  function updateCompare(self) {
    var productHandle = $(self).data('handle'),
        alertText = '';
    var isAdded = $.inArray(productHandle,compareObject) !== -1 ? true:false;
    if (isAdded) {
      compareObject.splice(compareObject.indexOf(productHandle), 1);
      alertText = theme.strings.compareNotifyRemoved;
      alertClass = 'notice';
    }else{
      if (compareObject.length === 4){
        alertText = theme.strings.compareNotifyMaximum;
        alertClass = 'error';
      }else{
        alertClass = 'notice';
        compareObject.push(productHandle);
        alertText = theme.strings.compareNotifyAdded;
      }
    }
    localStorage.setItem('localCompare', JSON.stringify(compareObject)); 
    theme.alert.new(theme.strings.compareText,alertText,2000,alertClass);
    $compareCount.text(compareObject.length);
  };
  function loadCompare(){
    var compareGrid;
    $compareContainer.html('');
    //popup compare
    if (compareObject.length > 0){
      compareGrid = compareObject.length === 1? 'col-md-12 col-sm-6' : 'col';
      for (var i = 0; i < compareObject.length; i++) { 
        var productHandle = compareObject[i];
        Shopify.getProduct(productHandle,function(product){
          var htmlProduct = '',
              productPrice = product.price_varies? 'from ' + theme.Currency.formatMoney(product.price_min, theme.moneyFormat) : theme.Currency.formatMoney(product.price, theme.moneyFormat),
              productComparePrice = product.compare_at_price_min !== 0 ? theme.Currency.formatMoney(product.compare_at_price_min, theme.moneyFormat) : '',
              productAvailable = product.available ? theme.strings.available : theme.strings.unavailable,
              productAvailableClass = product.available ? 'alert-success' : 'alert-danger',
              productTypeHTML = product.type !== "" ? '<a class="link" href="/collections/types?q='+ product.type +'">'+ product.type +'</a>' : '<span>'+ theme.strings.none +'</span>',
              productVendorHTML = product.vendor !== "" ? '<a class="link" href="/collections/vendors?q='+ product.vendor +'">'+ product.vendor +'</a>' : '<span>'+ theme.strings.none +'</span>';
          htmlProduct += '<div class="compare-item '+compareGrid+' col-xs-6 px-0">';
          htmlProduct += '  <p class="py-3"><button class="js-remove-compare link " data-handle="'+product.handle+'">'+ theme.strings.compareTextRemove +'</button></p>';
          htmlProduct += '	<a class="d-block mb-4 px-4" href="'+ product.url +'">';
          htmlProduct += '		<img src="'+ Shopify.resizeImage(product.featured_image,'x230') +'"/>';
          htmlProduct += '	</a>';
          htmlProduct += '	<hr /><h5 >'+ product.title +'</h5>';
          htmlProduct += '	<hr /><s class="small">'+ productComparePrice +'</s>';
          htmlProduct += '	<span> '+ productPrice +'</span>';
          htmlProduct += '	<hr /><span class="px-2 py-1 rounded '+ productAvailableClass +'"> '+ productAvailable +'</span>';
          htmlProduct += '	<hr />'+ productTypeHTML;
          htmlProduct += '	<hr /><div class="pb-3">'+ productVendorHTML+'</div>';
          htmlProduct += '</div>';
          $compareContainer.append(htmlProduct);
          //theme.updateCurrencies();
        });
      }
    }else{
      $compareContainer.html('<div class="alert alert-warning d-inline-block mb-0">'+ theme.strings.compareNoResult + '</div>');
    }
    
    //button text
    $(compareButtonClass).each(function(){
      var productHandle = $(this).data('handle');
      var status = $.inArray(productHandle,compareObject) !== -1 ? 'added' : '';
      $(this).removeClass('added').addClass(status);
    });

    //count items
    $compareCount.text(compareObject.length);
  }
  $(document).on('click',compareButtonClass,function (event) {
    event.preventDefault();
    updateCompare(this);
    loadCompare();
  });
  $(document).on('click',compareRemoveButtonClass,function(){
    var productHandle = $(this).data('handle');
    compareObject.splice(compareObject.indexOf(productHandle), 1);
    localStorage.setItem('localCompare', JSON.stringify(compareObject)); 
    loadCompare();
  });

  loadCompare();
  $(document).on('shopify:section:load', loadCompare);
  return{
    load:loadCompare
  }
})()

// Popup newsletter
theme.popupNewletter = (function(){
  function popupNewletter(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    this.selectors = {
      popupSection : '.popupnew-' + sectionId,
      formSection : '#jsPopupNewsletter' + sectionId
    }
    this.init();
  }
  popupNewletter.prototype = _.assignIn({}, popupNewletter.prototype, {
    init: function() {
      this.showPopup();
    },
    showPopup: function(){
      var $popupNewsletter = $(this.selectors.formSection),
          $newsletterForm = $(this.selectors.formSection).find("form"),
          date = new Date(),
          minutes = theme.timePopupNewsletter;
          minutesdelay = $popupNewsletter.attr('data-delay');
      if ($popupNewsletter.length === 1){
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        var setCookies = function (){
          $.cookie('cookiesNewsletter', 'disabled', { expires: date, path: '/' } );
        };
        if ($.cookie('cookiesNewsletter') !== "disabled") {
          $(window).on('load',function(){
            setTimeout(function () {
              $popupNewsletter.modal('show');
            }, minutesdelay * 1000);
          });
          $popupNewsletter.on('hidden.bs.modal', setCookies);
          $newsletterForm.submit(setCookies);     
        }
      }
      if(Shopify.designMode){
        document.addEventListener('shopify:section:select', function(event){
          $(event.target).find($popupNewsletter).modal('show');
        });
        document.addEventListener('shopify:section:deselect', function(event){
          $(event.target).find($popupNewsletter).modal('hide');
        });
      }
    }
  });
  
  return popupNewletter;
})()


theme.BeforeAfter = (function(){
  function BeforeAfter(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    this.selectors = {
      bablockSection : '#beer-slider-' + sectionId
    }
    this.init();
  }
  BeforeAfter.prototype = _.assignIn({}, BeforeAfter.prototype, {
    init: function() {
      this.showBeforeAfter();
    },
    showBeforeAfter: function(){
      var $baBlock = $(this.selectors.bablockSection);
      $.fn.BeerSlider = function ( options ) {
        options = options || {};
        return this.each(function() {
          new BeerSlider(this, options);
        });
      };
      $($baBlock).BeerSlider({start: 50});
    }
  });
  
  return BeforeAfter;
})()

// Cookie policy

theme.CookieSection = (function() {
  class CookieSection {
    constructor(container) {
      this.$container = $(container);
      this.sectionId = this.$container.attr('data-section-id');
      this.cookieSelector = '.cookie-' + this.sectionId;
      this.closeButtonSelector = '.js-btn-ok';
      this.declineButton = '.js-btn-decline';
      this.init();
    }

    init() {
      this.showCookie();
    }

    showCookie() {
      const $cookiePolicy = $(this.cookieSelector);
      const $closeButton = $(this.closeButtonSelector);
      const $declineButton = $(this.declineButton);
      const isAccepted = localStorage.getItem('localCookie') || '';

      if (!isAccepted) {
        $cookiePolicy.fadeIn('slow');
      }

      $closeButton.on('click', () => {
        localStorage.setItem('localCookie', 'accept');
        $cookiePolicy.fadeOut('slow');
      });
      $declineButton.on('click', () => {
        $cookiePolicy.fadeOut('slow');
      });

      if (Shopify.designMode) {
        document.addEventListener('shopify:section:load', () => {
          $cookiePolicy.fadeOut('slow');
        });

        document.addEventListener('shopify:section:select', event => {
          $(event.target).find($cookiePolicy).fadeIn('fast');
        });

        document.addEventListener('shopify:section:deselect', event => {
          $(event.target).find($cookiePolicy).fadeOut('slow');
        });
      }
    }
  }

  return CookieSection;
})();



// Popup newsletter
theme.FooterSection = (function(){
  function FooterSection(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    var enableAcc = Boolean($container.attr('data-acc'));
    this.selectors = {
      footerSection : '.footer-' + sectionId,
      enableAcc : enableAcc,
    }
    this.init();
  }
  FooterSection.prototype = _.assignIn({}, FooterSection.prototype, {
    init: function() {
      this.accordionResponsive();
    },

    accordionResponsive: function(){
        //var mqr = window.matchMedia('screen and (max-width: 749px)');
        if (this.selectors.enableAcc == true){
          $('.site-footer__section-title').click(function() {
            $(this).toggleClass('active');
            $(this).next().slideToggle('fast');
            return false;
          });
        }
    }
  });
  
  return FooterSection;
})()


// Open external link in new tab
theme.exLink = (function(){
  var links = document.links;
  for (let i = 0, linksLength = links.length ; i < linksLength ; i++) {
    if (links[i].hostname !== window.location.hostname && $(links[i]).attr('href') !== 'javascript:void(0)') {
      links[i].target = '_blank';
    }
  }
})()


// Collection view - Collection page
theme.collectionView =  (function (){
  var btnView = '.js-btn-view',
      btnViewActive = '.js-btn-view.active';

  $(document).on('click',btnView,function(){
    var value = $(this).data('col'),
        $gridItemCol = $('.js-col');

    $(btnView).removeClass('active');
    $(this).addClass('active');

    $gridItemCol.removeClass().addClass('js-col col-sm-6 col-6');
    if (value === 3){
      $gridItemCol.addClass('col-lg-4');
    }else if(value === 4){
      $gridItemCol.addClass('col-lg-3');
    }else if(value === 5){
      $gridItemCol.addClass('col-lg-2-4');
    }else if(value === 6){
      $gridItemCol.addClass('col-lg-2');
    };
  })

  function triggerCollectionView(){
    $(btnViewActive).trigger('click');
  }

  return {
    triggerView:triggerCollectionView
  }
})()

// Swath variant in card item
theme.swatchCard = (function() {
  const $swatches = '.js-swatch-card-item';
  const $image = '.product-card__image img';
  const $cart = '.js-grid-cart';

  function handleSwatchClick() {
    const $swatch = $(this);
    const newImage = $swatch.data('image');
    const id = $swatch.data('id');
    const $card = $swatch.closest('.js-product-card');

    $card.find($swatches).removeClass('active');
    $swatch.addClass('active');

    $card.find($image).attr('srcset', newImage);
    $card.find($cart).data('id', id);
  }

  $(document).on('click', $swatches, handleSwatchClick);
})();




theme.swatchCard2 = (function(){
  function initVariant(id){
    var productJson = JSON.parse($('.customJson-' + id).html());
    var $selectorForm = $('.customform-' + id);
    var $button = $('.js-customform-addtocart-' + id);
    var $buttontext = $button.find('span');
    var $wrapObject = $selectorForm.closest('.js-product-card');
    var options = {
      $container: $selectorForm,
      enableHistoryState: false,
      product: productJson,
      singleOptionSelector: '.single-option-selector-' + id,
      originalSelectorId: '#ProductSelect-' + id
    };
    var variants = new slate.Variants(options);
    var AjaxCart = new window.AjaxCart($selectorForm);
    var _updateButton = function (evt){
      var variant = evt.variant;
      if (variant === undefined){
        $button.prop('disabled', true).removeClass('btn--sold-out');
        $buttontext.html(theme.strings.unavailable);
      }else{
        if (variant.available){
          $button.removeClass('btn--sold-out').prop('disabled', false);
          $buttontext.html(theme.strings.addToCart);
        }else{
          $button.prop('disabled', true).addClass('btn--sold-out');
          $buttontext.html(theme.strings.soldOut);
        }
      }
    }
    var _updateImage = function (evt){
      var variant = evt.variant;
      var $mainImage = $wrapObject.find('.product-card__image').find('img');
      if (variant !== undefined && variant.featured_image !== null){
        var variantImage = variant.featured_image;
        $mainImage.attr('srcset',variantImage.src);
      }
    }
    var _updatePrice = function (evt){
      var $price = $wrapObject.find('.product-card__price');
      var variant = evt.variant;
      if (variant !== undefined){
        var htmlComparePrice = variant.compare_at_price !== null ? '<s class="product-card__regular-price"><span class="money">'+variant.compare_at_price+'</span></s>' : '';
        var htmlPrice = '<span class="money">'+variant.price+'</span>' + htmlComparePrice ;
        $price.html(htmlPrice);
        //theme.updateCurrencies();
      }
    }
    variants.$container.on(
      'variantChange' , _updateButton
    );
    variants.$container.on(
      'variantChange' , _updateImage
    );
    variants.$container.on(
      'variantChange' , _updatePrice
    );
  }
  function initForm(){
    $('.js-customform').each(function(){
      var id = $(this).data('id');
      initVariant(id);
    })
  }

  initForm();
  return{
    load:initForm
  }
})()

// Loading
theme.loading = (function(){
  var $loading = $('#js-loading'),
      hasLoading = $('#js-loading').length === 0? false : true;
  if (hasLoading){
    $(window).load(function () {
      $loading.fadeOut();
    });  
  }
})()

theme.effectLeavingPage = (function(){
  window.onbeforeunload = function(){
    $('body').css('opacity','0');
  }
})()


theme.bundleProduct = (function(){
  function bundleProduct(container) {
    var $container = (this.$container = $(container));
    var sectionId = $container.attr('data-section-id');
    this.selectors = {
      bundleSection : '#bundle-' + sectionId
    }
    this.init();
  }
  bundleProduct.prototype = _.assignIn({}, bundleProduct.prototype, {
    init: function() {
      this.bundleList();
    },
    bundleList : function(){
      let variantSelectClass = '.fbtproduct-form__variants',
      parentClass = '.fbt-item',
      totalPrice = '.fpt-total',
      totalPriceCompare = '.fpt-totalcompare',
      totalSave = '.fpt-save',
      checkBox = '.fbt-checkbox';

        updateTotal();
        checkItem();
        
        // change update variant
        $(document).on('change',variantSelectClass,function(){
          var selectVariant = $(this).children(':selected'),
              selectVariantId = selectVariant.data('id'),
              newPrice = theme.Currency.formatMoney(selectVariant.data('price'), theme.moneyFormat);
              newPriceCompare = theme.Currency.formatMoney(selectVariant.data('price-compare'), theme.moneyFormat);
              
          if (selectVariant.data('image') !== ''){
            $(this).closest(parentClass).find('img').attr({
              "src": selectVariant.data('image'),
              "data-srcset" : selectVariant.data('image'),
              "srcset" : selectVariant.data('image')
            });
          }
          $(this).closest(parentClass).attr('data-item',selectVariantId);
          $(this).closest(parentClass).find('.fbt-price').attr('data-fbtprice',selectVariant.data('price'));
          $(this).closest(parentClass).find('.fbt-price').html(newPrice);
          if (selectVariant.data('price-compare') !== undefined) {
            $(this).closest(parentClass).find('.fbt-price-compare').html(newPriceCompare).removeClass('hide');    
            $(this).closest(parentClass).find('.fbt-price-compare').attr('data-price-at',selectVariant.data('price-compare'));
          } else {
            $(this).closest(parentClass).find('.fbt-price-compare').attr('data-price-at','').addClass('hide');
          }
          updateTotal();
        });
        
        // checkChecked
        function checkItem(){
          $(checkBox).change(function() {
            if(this.checked) {
              $(this).closest(parentClass).attr('data-checked',true);
            }
            else{
              $(this).closest(parentClass).attr('data-checked',false);
            }
            updateTotal();
          });
        }
        function updateTotal(){
          let total = 0;
          let totalCompare = 0;
          $('.fbt-item-price').each(function() {
            let isChecked = $(this).closest('.fbt-item').find('.fbt-checkbox').is(':checked');
            let isPriceCompare = $(this).find('.fbt-price-compare').attr('data-price-at');
            if (isChecked){
              let value = parseFloat($(this).find('.fbt-price').attr('data-fbtprice'));
              
              total += value;
              if( isPriceCompare !== undefined && isPriceCompare !== '' ){
                let valueCompare = parseFloat(isPriceCompare);
                totalCompare += valueCompare - value;
              }
            }
          });
          //console.log(totalCompare); 
          $(totalPrice).html(theme.Currency.formatMoney(total, theme.moneyFormat));
            let totalSale  = totalCompare + total ;
            if( totalSale > total){
                $(totalPriceCompare).show();
                $(totalSave).show().html(`${$(totalSave).attr('data-txtsave')} <span class="text-theme">${theme.Currency.formatMoney(totalSale - total , theme.moneyFormat)}</span>` );
            }
            else{
              $(totalPriceCompare).hide();
              $(totalSave).hide().html();
            }
          $(totalPriceCompare).html(theme.Currency.formatMoney(totalCompare + total , theme.moneyFormat));
        }
        //click add product
        $('#fbt-button').click(function(e) {
          e.preventDefault();
          function addMultipleItemsToCart(productsToAdd) {
            var cartUrl = '/cart/add.js';
            var cartData = {
              items: productsToAdd
            };
          
            $.ajax({
              type: 'POST',
              url: cartUrl,
              data: cartData,
              dataType: 'json',
              beforeSend: function() {
               
                $('#fbt-button').addClass('is-loading');
              },
              success: function(data) {
                $('#fbt-button').removeClass('is-loading');
                theme.miniCart.updateElements();
                theme.miniCart.generateCart();
              },
              error: function(XMLHttpRequest, textStatus,err) {
                $('#fbt-button').removeClass('is-loading');
                console.log(err);
              }
            });
          }
          var productsToAdd = $(parentClass).map(function() {
            if($(this).attr('data-checked') === 'true' ){
              return {
                id: parseInt($(this).attr('data-item')),
                quantity: 1,
              };
            }
            
          }).get();
          addMultipleItemsToCart(productsToAdd);
        });
    }
  });
  return bundleProduct;
})()




// Upsell
theme.upsell = (function() {
  const upsellPopupSelector = '#jsUpsell';
  const $acceptButton = $('#jsUpsell .btn');
  const upsellProductId = $('#jsUpsell').data('id') || '';
  const acceptButtonClass = 'js-btn-accept';
  const delayTime = $('#jsUpsell').data('delay') || 3000;
  const isUpsellActive = $(upsellPopupSelector).length === 1;

  function showUpsellPopupWithDelay() {
    setTimeout(() => {
      $(upsellPopupSelector).modal('show');
    }, delayTime);
  }

  function handleAcceptButtonClick() {
    const isAcceptButton = $acceptButton.hasClass(acceptButtonClass);
    
    if (isAcceptButton) {
      Shopify.addItem(upsellProductId, 1, item => {
        theme.miniCart.updateElements();
        theme.miniCart.generateCart();

        const variantInfo = item.variant_title !== null ? `<i>(${item.variant_title})</i>` : '';
        const alertContent = `<div class="media mt-2 alert--cart"><a class="mr-3" href="/cart"><img class="lazyload" data-src="${item.image}"></a><div class="media-body align-self-center"><p class="m-0 font-weight-bold">${item.product_title} x ${item.quantity}</p>${variantInfo}<div><div>`;
        
        theme.alert.new(theme.strings.addToCartSuccess, alertContent, 3000, 'notice');
      });
    }
    
    $(upsellPopupSelector).modal('hide');
  }

  if (isUpsellActive) {
    $(document).ready(showUpsellPopupWithDelay);
    $acceptButton.on('click', handleAcceptButtonClick);
  }
})();




// Overwrite Shopify.onError in Shopify API
Shopify.onError = function(t, r) {
    var e = eval("(" + t.responseText + ")");
    var mess = e.message ? e.message + "(" + e.status + "): " + e.description : "Error : " + Shopify.fullMessagesFromErrors(e).join("; ") + "."
    theme.alert.new('Alert',mess,3000,'warning');
}


// Fake-viewers
theme.fakeViewer = (function() {
  var $fakeViewClass = $('.js-fake-view'),
      minValue = $fakeViewClass.data('min'),
      maxValue = $fakeViewClass.data('max'),
      duration = $fakeViewClass.data('duration');

  function updateFakeViewCount() {
    var value = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
    $fakeViewClass.text(value);
  }

  function initFakeViewCount() {
    updateFakeViewCount();

    if (minValue !== undefined && maxValue !== undefined && duration) {
      setInterval(updateFakeViewCount, duration);
    }
  }

  initFakeViewCount();
})();


// Product-suggest
theme.productSuggest = (function() {
  var $productNotification = $('.product-notification'),
      $closeButton = $('.close-notifi'),
      suggestionDuration = $productNotification.data('time') || 0,
      suggestionCookie = 'productSuggestClosed';

  function closeSuggestion() {
    $productNotification.remove();
    $.cookie(suggestionCookie, 'closed', { expires: 1, path: '/' });
  }

  function toggleSuggestion() {
    if ($productNotification.hasClass('active')) {
      $productNotification.removeClass('active');
    } else {
      var $productItems = $('.data-product'),
          randomIndex = Math.floor(Math.random() * $productItems.length),
          $selectedProduct = $($productItems[randomIndex]);

      $productNotification.addClass('active');
      var $productImage = $productNotification.find('.product-image img');
      $productImage.attr({
        'src': $selectedProduct.data('image'),
        'width': $selectedProduct.data('wimage'),
        'height': $selectedProduct.data('himage')
      });
      $productNotification.find('.product-image').attr({
        'href': $selectedProduct.data('url'),
        'title': $selectedProduct.data('title')
      });
      $productNotification.find('.product-name').text($selectedProduct.data('title')).attr('href', $selectedProduct.data('url'));
      $productNotification.find('.time-ago').text($selectedProduct.data('time'));
      $productNotification.find('.from-ago').text($selectedProduct.data('local'));
    }
  }

  function handleSuggestionInterval() {
    if (suggestionDuration !== 0) {
      setInterval(toggleSuggestion, suggestionDuration);
    }
  }

  function init() {
    if ($.cookie(suggestionCookie) === 'closed') {
      $productNotification.remove();
    } else {
      $closeButton.on('click', closeSuggestion);
      handleSuggestionInterval();
    }
  }

  init();
})();




theme.activeAccordion = (function(){
  $('.collapse').on('shown.bs.collapse', function () {
       $(this).prev().addClass('active-acc');
   });
   $('.collapse').on('hidden.bs.collapse', function () {
       $(this).prev().removeClass('active-acc');
   });
})()


// Anchor scroll
theme.anchorScroll = (function() {
  $(document).on('click', 'a[href^="#"]', function(event) {
    event.preventDefault();
    
    var $clickedLink = $(this);
    var disableAnchor = $clickedLink.hasClass('disabled-anchor');
    
    if (!disableAnchor) {
      var target = $clickedLink.attr('href');
      var targetOffsetTop = $(target).offset().top;
      
      $('html, body').animate({
        scrollTop: targetOffsetTop
      }, 500);
    }
  });
})();

// Notice when soldout
theme.alert = (function(){
  function createAlert(title,mess,time,type){
    var aTitle = title || '',
        aTime = time || 2000,
        aMessage = mess || '',
        aClass = type || 'default';
    $.growl({ 
      title: aTitle,
      message: aMessage,
      duration: aTime,
      style: aClass,
      size: 'large'
    });
  }

  return{
    new:createAlert
  }
})()

// Notice when soldout
theme.noticeSoldout = (function(){
  var $soldoutWrapFormClass = $('.js-contact-soldout'),
      $textClass = $('.js-notify-text'),
      $soldoutValueId = $('#ContactProduct');
  function noticeSoldout(variant){
    $soldoutWrapFormClass.find('.form-success').remove()
    if (variant.available){
      $textClass.find('span').text('');
      $soldoutWrapFormClass.addClass('hide');
    }else{
      $textClass.find('span').text(+ variant.name);
      $soldoutWrapFormClass.removeClass('hide');
      $soldoutValueId.val(variant.name).attr('value',variant.name);
    }
  }
  return {
    init : noticeSoldout
  }
})()

// Sticky cart
theme.stickyCart = (function() {
  var $anchor = $('#js-anchor-sticky-cart'),
      $stickyCartWrapper = $('.sticky-cart-wr');

  if ($anchor.length) {
    function handleStickyCart() {
      var anchorTop = $anchor.offset().top,
          anchorHeight = $anchor.outerHeight(),
          windowHeight = $(window).height(),
          windowScroll = $(window).scrollTop();

      $stickyCartWrapper.toggleClass('active', windowScroll > (anchorTop + anchorHeight - windowHeight));
    }

    $(window).on('scroll', handleStickyCart);
    handleStickyCart();
  }
})();

//Fix reload safari
window.addEventListener("pageshow", function(evt){
  if(evt.persisted){
  setTimeout(function(){
      window.location.reload();
  },10);
}
}, false);

// Back to top
theme.backToTop = (function(){
  $(document).ready(function(){"use strict";
  var progressPath = document.querySelector('.progress-wrap path');
  if ( progressPath != null ){
  var pathLength = progressPath.getTotalLength();
  progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
  progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
  progressPath.style.strokeDashoffset = pathLength;
  progressPath.getBoundingClientRect();
  progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';    
  var updateProgress = function () {
    var scroll = $(window).scrollTop();
    var height = $(document).height() - $(window).height();
    var progress = pathLength - (scroll * pathLength / height);
    progressPath.style.strokeDashoffset = progress;
  }
  updateProgress();
  $(window).scroll(updateProgress); 
  var offset = 50;
  var duration = 550;
  jQuery(window).on('scroll', function() {
    if (jQuery(this).scrollTop() > offset) {
      jQuery('.progress-wrap').addClass('active-progress');
    } else {
      jQuery('.progress-wrap').removeClass('active-progress');
    }
  });       
  jQuery('.progress-wrap').on('click', function(event) {
    event.preventDefault();
    jQuery('html, body').animate({scrollTop: 0}, duration);
    return false;
  })
}

});
})()

theme.popOver = (function(){
  $('body').on('click', function (e) {
    $('[data-hotspot]').each(function () {
        // hide any open popovers when the anywhere else in the body is clicked
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).next().removeClass('active');
        }
        else{
          $(this).next().addClass('active');
        }
    });
});
  
})()


// Tooltip
theme.tooltip = (function(){
  var selector = '[data-toggle="tooltip"],[data-tooltip="true"]';
  function loadTooltip(){
    $(selector).tooltip(); //Bootstrap 4
  };
  $(document).on('click',selector,function(){
    $(this).tooltip('hide');
  });
  loadTooltip();
  return{
    load:loadTooltip
  }
})()


theme.hasInput = (function(){
  var inPut= $('.form-group .form-control');

  inPut.blur(function (){
    if(!this.value){
      $(this).removeClass('has-value');
    }else{
      $(this).addClass('has-value');
    }
  });

  var inpuSearch = $('#Search-In-Template');
  if (inpuSearch.length != 0 ) {
    if(inpuSearch.val().length != 0 ){
      inpuSearch.addClass('has-value');
    }
  }
  else{
    return;
  }
  
})()


$(theme.init);

class CountdownTimer extends HTMLElement {
  connectedCallback() {
    if (!this.countdownInitialized) {
      this.countdownInitialized = true; 

      const second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;

      const countDownDate = new Date(this.getAttribute('data-time')).getTime();
      const countdownContainer = document.createElement('div'); 

      this.appendChild(countdownContainer);

      function updateCountdown() {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        const days = Math.floor(distance / day);
        const hours = Math.floor((distance % day) / hour);
        const minutes = Math.floor((distance % hour) / minute);
        const seconds = Math.floor((distance % minute) / second);

        countdownContainer.innerHTML = `
        <ul class="list--inline or-countdown">
          <li>
          <span class="countdown-time">${days}</span><span class="countdown-text">Days</span> <span class="hide countdown-time-single">D</span>
          </li>
          <li>
          <span class="countdown-time">${hours}</span> <span class="countdown-text">Hours</span> <span class="hide countdown-time-single">H</span>
          </li>
          <li>
          <span class="countdown-time">${minutes}</span> <span class="countdown-text">Mins</span> <span class="hide countdown-time-single">M</span>
          </li>
          <li>
          <span class="countdown-time">${seconds}</span> <span class="countdown-text">Secs</span> <span class="hide countdown-time-single">S</span>
          </li>
          </ul>
        `;

        if (distance > 0) {
          requestAnimationFrame(updateCountdown);
        } else {
          countdownContainer.innerHTML = "Countdown Finished!";
        }
      }

      updateCountdown();
    }
  }
}

customElements.define('countdown-timer', CountdownTimer);


class CheckoutButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', this.handleClick.bind(this));
  }

  connectedCallback() {
    this.checkAgreement();
  }

  handleClick(event) {
    const agreeCheckbox = this.querySelector('.checkbox__input');
    const checkoutButton = this.querySelector('a[name="checkout"]');
    
    if (event.target === agreeCheckbox || event.target === this.querySelector('.checkbox__label')) {
      if (agreeCheckbox.checked) {
        checkoutButton.classList.remove('disabled');
      } else {
        checkoutButton.classList.add('disabled');
      }
    }
  }
  checkAgreement() {
    const agreeCheckbox = this.querySelector('.checkbox__input');
    return agreeCheckbox.checked;
  }
}

customElements.define('checkout-button', CheckoutButton);
