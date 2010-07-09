/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Functions for setting, getting and deleting cookies
 */

/**
 * Namespace for cookie functions
 */

// TODO: find the official solution for a cookies library
var shindig = shindig || {};
shindig.cookies = shindig.cookies || {};


shindig.cookies.JsType_ = {
  UNDEFINED: 'undefined'
};

shindig.cookies.isDef = function(val) {
  return typeof val != shindig.cookies.JsType_.UNDEFINED;
};


/**
 * Sets a cookie.
 * The max_age can be -1 to set a session cookie. To remove and expire cookies,
 * use remove() instead.
 *
 * @param {string} name The cookie name.
 * @param {string} value The cookie value.
 * @param {number} opt_maxAge The max age in seconds (from now). Use -1 to set
 *                            a session cookie. If not provided, the default is
 *                            -1 (i.e. set a session cookie).
 * @param {string} opt_path The path of the cookie, or null to not specify a
 *                          path attribute (browser will use the full request
 *                          path). If not provided, the default is '/' (i.e.
 *                          path=/).
 * @param {string} opt_domain The domain of the cookie, or null to not specify
 *                            a domain attribute (browser will use the full
 *                            request host name). If not provided, the default
 *                            is null (i.e. let browser use full request host
 *                            name).
 */
shindig.cookies.set = function(name, value, opt_maxAge, opt_path, opt_domain) {
  // we do not allow '=' or ';' in the name
  if (/;=/g.test(name)) {
    throw new Error('Invalid cookie name "' + name + '"');
  }
  // we do not allow ';' in value
  if (/;/g.test(value)) {
    throw new Error('Invalid cookie value "' + value + '"');
  }

  if (!shindig.cookies.isDef(opt_maxAge)) {
    opt_maxAge = -1;
  }

  var domainStr = opt_domain ? ';domain=' + opt_domain : '';
  var pathStr = opt_path ? ';path=' + opt_path : '';

  var expiresStr;

  // Case 1: Set a session cookie.
  if (opt_maxAge < 0) {
    expiresStr = '';

  // Case 2: Expire the cookie.
  // Note: We don't tell people about this option in the function doc because
  // we prefer people to use ExpireCookie() to expire cookies.
  } else if (opt_maxAge === 0) {
    // Note: Don't use Jan 1, 1970 for date because NS 4.76 will try to convert
    // it to local time, and if the local time is before Jan 1, 1970, then the
    // browser will ignore the Expires attribute altogether.
    var pastDate = new Date(1970, 1 /*Feb*/, 1);  // Feb 1, 1970
    expiresStr = ';expires=' + pastDate.toUTCString();

  // Case 3: Set a persistent cookie.
  } else {
    var futureDate = new Date((new Date).getTime() + opt_maxAge * 1000);
    expiresStr = ';expires=' + futureDate.toUTCString();
  }

  document.cookie = name + '=' + value + domainStr + pathStr + expiresStr;
};


/**
 * Returns the value for the first cookie with the given name
 * @param {string} name The name of the cookie to get
 * @param {string} opt_default If not found this is returned instead.
 * @return {string|undefined} The value of the cookie. If no cookie is set this
 *                            returns opt_default or undefined if opt_default is
 *                            not provided.
 */
shindig.cookies.get = function(name, opt_default) {
  var nameEq = name + "=";
  var cookie = String(document.cookie);
  for (var pos = -1; (pos = cookie.indexOf(nameEq, pos + 1)) >= 0;) {
    var i = pos;
    // walk back along string skipping whitespace and looking for a ; before
    // the name to make sure that we don't match cookies whose name contains
    // the given name as a suffix.
    while (--i >= 0) {
      var ch = cookie.charAt(i);
      if (ch == ';') {
        i = -1;  // indicate success
        break;
      }
    }
    if (i == -1) {  // first cookie in the string or we found a ;
      var end = cookie.indexOf(';', pos);
      if (end < 0) {
        end = cookie.length;
      }
      return cookie.substring(pos + nameEq.length, end);
    }
  }
  return opt_default;
};


/**
 * Removes and expires a cookie.
 *
 * @param {string} name The cookie name.
 * @param {string} opt_path The path of the cookie, or null to expire a cookie
 *                          set at the full request path. If not provided, the
 *                          default is '/' (i.e. path=/).
 * @param {string} opt_domain The domain of the cookie, or null to expire a
 *                            cookie set at the full request host name. If not
 *                            provided, the default is null (i.e. cookie at
 *                            full request host name).
 */
shindig.cookies.remove = function(name, opt_path, opt_domain) {
  var rv = shindig.cookies.containsKey(name);
  shindig.cookies.set(name, '', 0, opt_path, opt_domain);
  return rv;
};


/**
 * Gets the names and values for all the cookies
 * @private
 * @return {Object} An object with keys and values
 */
shindig.cookies.getKeyValues_ = function() {
  var cookie = String(document.cookie);
  var parts = cookie.split(/\s*;\s*/);
  var keys = [], values = [], index, part;
  for (var i = 0; part = parts[i]; i++) {
    index = part.indexOf('=');

    if (index == -1) { // empty name
      keys.push('');
      values.push(part);
    } else {
      keys.push(part.substring(0, index));
      values.push(part.substring(index + 1));
    }
  }
  return {keys: keys, values: values};
};


/**
 * Gets the names for all the cookies
 * @return {Array} An array with the names of the cookies
 */
shindig.cookies.getKeys = function() {
  return shindig.cookies.getKeyValues_().keys;
};


/**
 * Gets the values for all the cookies
 * @return {Array} An array with the values of the cookies
 */
shindig.cookies.getValues = function() {
  return shindig.cookies.getKeyValues_().values;
};


/**
 * Whether there are any cookies for this document
 * @return {boolean}
 */
shindig.cookies.isEmpty = function() {
  return document.cookie === '';
};


/**
 * Returns the number of cookies for this document
 * @return {number}
 */
shindig.cookies.getCount = function() {
  var cookie = String(document.cookie);
  if (cookie === '') {
    return 0;
  }
  var parts = cookie.split(/\s*;\s*/);
  return parts.length;
};


/**
 * Returns whether there is a cookie with the given name
 * @param {string} key The name of the cookie to test for
 * @return {boolean}
 */
shindig.cookies.containsKey = function(key) {
  var sentinel = {};
  // if get does not find the key it returns the default value. We therefore
  // compare the result with an object to ensure we do not get any false
  // positives.
  return shindig.cookies.get(key, sentinel) !== sentinel;
};


/**
 * Returns whether there is a cookie with the given value. (This is an O(n)
 * operation.)
 * @param {string} value The value to check for
 * @return {boolean}
 */
shindig.cookies.containsValue = function(value) {
  // this O(n) in any case so lets do the trivial thing.
  var values = shindig.cookies.getKeyValues_().values;
  for (var i = 0; i < values.length; i++) {
    if (values[i] == value) {
      return true;
    }
  }
  return false;
};


/**
 * Removes all cookies for this document
 */
shindig.cookies.clear = function() {
  var keys = shindig.cookies.getKeyValues_().keys;
  for (var i = keys.length - 1; i >= 0; i--) {
    shindig.cookies.remove(keys[i]);
  }
};

/**
 * Static constant for the size of cookies. Per the spec, there's a 4K limit
 * to the size of a cookie. To make sure users can't break this limit, we
 * should truncate long cookies at 3950 bytes, to be extra careful with dumb
 * browsers/proxies that interpret 4K as 4000 rather than 4096
 * @type number
 */
shindig.cookies.MAX_COOKIE_LENGTH = 3950;
/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Utility functions for the Open Gadget Container
 */

Function.prototype.inherits = function(parentCtor) {
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  this.superClass_ = parentCtor.prototype;
  this.prototype = new tempCtor();
  this.prototype.constructor = this;
};/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Open Gadget Container
 */

var gadgets = gadgets || {};

gadgets.error = {};
gadgets.error.SUBCLASS_RESPONSIBILITY = 'subclass responsibility';
gadgets.error.TO_BE_DONE = 'to be done';

gadgets.log = function(message) {
  if (window.console && console.log) {
    console.log(message);
  } else {
    var logEntry = document.createElement('div');
    logEntry.className = 'gadgets-log-entry';
    logEntry.innerHTML = message;
    document.body.appendChild(logEntry);
  }
};

/**
 * Calls an array of asynchronous functions and calls the continuation
 * function when all are done.
 * @param {Array} functions Array of asynchronous functions, each taking
 *     one argument that is the continuation function that handles the result
 *     That is, each function is something like the following:
 *     function(continuation) {
 *       // compute result asynchronously
 *       continuation(result);
 *     }
 * @param {Function} continuation Function to call when all results are in.  It
 *     is pass an array of all results of all functions
 * @param {Object} opt_this Optional object used as "this" when calling each
 *     function
 */
gadgets.callAsyncAndJoin = function(functions, continuation, opt_this) {
  var pending = functions.length;
  var results = [];
  for (var i = 0; i < functions.length; i++) {
    // we need a wrapper here because i changes and we need one index
    // variable per closure
    var wrapper = function(index) {
      functions[index].call(opt_this, function(result) {
        results[index] = result;
        if (--pending === 0) {
          continuation(results);
        }
      });
    };
    wrapper(i);
  }
};


// ----------
// Extensible

gadgets.Extensible = function() {
};

/**
 * Sets the dependencies.
 * @param {Object} dependencies Object whose properties are set on this
 *     container as dependencies
 */
gadgets.Extensible.prototype.setDependencies = function(dependencies) {
  for (var p in dependencies) {
    this[p] = dependencies[p];
  }
};

/**
 * Returns a dependency given its name.
 * @param {String} name Name of dependency
 * @return {Object} Dependency with that name or undefined if not found
 */
gadgets.Extensible.prototype.getDependencies = function(name) {
  return this[name];
};



// -------------
// UserPrefStore

/**
 * User preference store interface.
 * @constructor
 */
gadgets.UserPrefStore = function() {
};

/**
 * Gets all user preferences of a gadget.
 * @param {Object} gadget Gadget object
 * @return {Object} All user preference of given gadget
 */
gadgets.UserPrefStore.prototype.getPrefs = function(gadget) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

/**
 * Saves user preferences of a gadget in the store.
 * @param {Object} gadget Gadget object
 * @param {Object} prefs User preferences
 */
gadgets.UserPrefStore.prototype.savePrefs = function(gadget) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};


// -------------
// DefaultUserPrefStore

/**
 * User preference store implementation.
 * TODO: Turn this into a real implementation that is production safe
 * @constructor
 */
gadgets.DefaultUserPrefStore = function() {
  gadgets.UserPrefStore.call(this);
};
gadgets.DefaultUserPrefStore.inherits(gadgets.UserPrefStore);

gadgets.DefaultUserPrefStore.prototype.getPrefs = function(gadget) { };

gadgets.DefaultUserPrefStore.prototype.savePrefs = function(gadget) { };


// -------------
// GadgetService

/**
 * Interface of service provided to gadgets for resizing gadgets,
 * setting title, etc.
 * @constructor
 */
gadgets.GadgetService = function() {
};

gadgets.GadgetService.prototype.setHeight = function(elementId, height) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

gadgets.GadgetService.prototype.setTitle = function(gadget, title) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

gadgets.GadgetService.prototype.setUserPref = function(id) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};


// ----------------
// IfrGadgetService

/**
 * Base implementation of GadgetService.
 * @constructor
 */
gadgets.IfrGadgetService = function() {
  gadgets.GadgetService.call(this);
  gadgets.rpc.register('resize_iframe', this.setHeight);
  gadgets.rpc.register('set_pref', this.setUserPref);
  gadgets.rpc.register('set_title', this.setTitle);
  gadgets.rpc.register('requestNavigateTo', this.requestNavigateTo);
};

gadgets.IfrGadgetService.inherits(gadgets.GadgetService);

gadgets.IfrGadgetService.prototype.setHeight = function(height) {
  if (height > gadgets.container.maxheight_) {
    height = gadgets.container.maxheight_;
  }

  var element = document.getElementById(this.f);
  if (element) {
    element.style.height = height + 'px';
  }
};

gadgets.IfrGadgetService.prototype.setTitle = function(title) {
  var element = document.getElementById(this.f + '_title');
  if (element) {
    element.innerHTML = title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }
};

/**
 * Sets one or more user preferences
 * @param {String} editToken
 * @param {String} name Name of user preference
 * @param {String} value Value of user preference
 * More names and values may follow
 */
gadgets.IfrGadgetService.prototype.setUserPref = function(editToken, name,
    value) {
  var id = gadgets.container.gadgetService.getGadgetIdFromModuleId(this.f);
  var gadget = gadgets.container.getGadget(id);
  var prefs = gadget.getUserPrefs() || {};
  for (var i = 1, j = arguments.length; i < j; i += 2) {
    prefs[arguments[i]] = arguments[i + 1];
  }
  gadget.setUserPrefs(prefs);
};

/**
 * Navigates the page to a new url based on a gadgets requested view and
 * parameters.
 */
gadgets.IfrGadgetService.prototype.requestNavigateTo = function(view,
    opt_params) {
  var id = gadgets.container.gadgetService.getGadgetIdFromModuleId(this.f);
  var url = gadgets.container.gadgetService.getUrlForView(view);

  if (opt_params) {
    var paramStr = gadgets.json.stringify(opt_params);
    if (paramStr.length > 0) {
      url += '&appParams=' + encodeURIComponent(paramStr);
    }
  }

  if (url && document.location.href.indexOf(url) == -1) {
    document.location.href = url;
  }
};

/**
 * This is a silly implementation that will need to be overriden by almost all
 * real containers.
 * TODO: Find a better default for this function
 *
 * @param view The view name to get the url for
 */
gadgets.IfrGadgetService.prototype.getUrlForView = function(
    view) {
  if (view === 'canvas') {
    return '/canvas';
  } else if (view === 'profile') {
    return '/profile';
  } else {
    return null;
  }
};

gadgets.IfrGadgetService.prototype.getGadgetIdFromModuleId = function(
    moduleId) {
  // Quick hack to extract the gadget id from module id
  return parseInt(moduleId.match(/_([0-9]+)$/)[1], 10);
};


// -------------
// LayoutManager

/**
 * Layout manager interface.
 * @constructor
 */
gadgets.LayoutManager = function() {
};

/**
 * Gets the HTML element that is the chrome of a gadget into which the content
 * of the gadget can be rendered.
 * @param {Object} gadget Gadget instance
 * @return {Object} HTML element that is the chrome for the given gadget
 */
gadgets.LayoutManager.prototype.getGadgetChrome = function(gadget) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

// -------------------
// StaticLayoutManager

/**
 * Static layout manager where gadget ids have a 1:1 mapping to chrome ids.
 * @constructor
 */
gadgets.StaticLayoutManager = function() {
  gadgets.LayoutManager.call(this);
};

gadgets.StaticLayoutManager.inherits(gadgets.LayoutManager);

/**
 * Sets chrome ids, whose indexes are gadget instance ids (starting from 0).
 * @param {Array} gadgetChromeIds Gadget id to chrome id map
 */
gadgets.StaticLayoutManager.prototype.setGadgetChromeIds =
    function(gadgetChromeIds) {
  this.gadgetChromeIds_ = gadgetChromeIds;
};

gadgets.StaticLayoutManager.prototype.getGadgetChrome = function(gadget) {
  var chromeId = this.gadgetChromeIds_[gadget.id];
  return chromeId ? document.getElementById(chromeId) : null;
};


// ----------------------
// FloatLeftLayoutManager

/**
 * FloatLeft layout manager where gadget ids have a 1:1 mapping to chrome ids.
 * @constructor
 * @param {String} layoutRootId Id of the element that is the parent of all
 *     gadgets.
 */
gadgets.FloatLeftLayoutManager = function(layoutRootId) {
  gadgets.LayoutManager.call(this);
  this.layoutRootId_ = layoutRootId;
};

gadgets.FloatLeftLayoutManager.inherits(gadgets.LayoutManager);

gadgets.FloatLeftLayoutManager.prototype.getGadgetChrome =
    function(gadget) {
  var layoutRoot = document.getElementById(this.layoutRootId_);
  if (layoutRoot) {
    var chrome = document.createElement('div');
    chrome.className = 'gadgets-gadget-chrome';
    chrome.style.cssFloat = 'left';
    layoutRoot.appendChild(chrome);
    return chrome;
  } else {
    return null;
  }
};


// ------
// Gadget

/**
 * Creates a new instance of gadget.  Optional parameters are set as instance
 * variables.
 * @constructor
 * @param {Object} params Parameters to set on gadget.  Common parameters:
 *    "specUrl": URL to gadget specification
 *    "private": Whether gadget spec is accessible only privately, which means
 *        browser can load it but not gadget server
 *    "spec": Gadget Specification in XML
 *    "viewParams": a javascript object containing attribute value pairs
 *        for this gadgets
 *    "secureToken": an encoded token that is passed on the URL hash
 *    "hashData": Query-string like data that will be added to the
 *        hash portion of the URL.
 *    "specVersion": a hash value used to add a v= param to allow for better caching
 *    "title": the default title to use for the title bar.
 *    "height": height of the gadget
 *    "width": width of the gadget
 *    "debug": send debug=1 to the gadget server, gets us uncompressed
 *        javascript
 */
gadgets.Gadget = function(params) {
  this.userPrefs_ = {};

  if (params) {
    for (var name in params)  if (params.hasOwnProperty(name)) {
      this[name] = params[name];
    }
  }
  if (!this.secureToken) {
    // Assume that the default security token implementation is
    // in use on the server.
    this.secureToken = 'john.doe:john.doe:appid:cont:url:0:default';
  }
};

gadgets.Gadget.prototype.getUserPrefs = function() {
  return this.userPrefs_;
};

gadgets.Gadget.prototype.setUserPrefs = function(userPrefs) {
  this.userPrefs_ = userPrefs;
  gadgets.container.userPrefStore.savePrefs(this);
};

gadgets.Gadget.prototype.getUserPref = function(name) {
  return this.userPrefs_[name];
};

gadgets.Gadget.prototype.setUserPref = function(name, value) {
  this.userPrefs_[name] = value;
  gadgets.container.userPrefStore.savePrefs(this);
};

gadgets.Gadget.prototype.render = function(chrome) {
  if (chrome) {
    var gadget = this;
    this.getContent(function(content) {
      chrome.innerHTML = content;
      window.frames[gadget.getIframeId()].location = gadget.getIframeUrl(); 
    });
  }
};

gadgets.Gadget.prototype.getContent = function(continuation) {
  gadgets.callAsyncAndJoin([
      this.getTitleBarContent, this.getUserPrefsDialogContent,
      this.getMainContent], function(results) {
        continuation(results.join(''));
      }, this);
};

/**
 * Gets title bar content asynchronously or synchronously.
 * @param {Function} continuation Function that handles title bar content as
 *     the one and only argument
 */
gadgets.Gadget.prototype.getTitleBarContent = function(continuation) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

/**
 * Gets user preferences dialog content asynchronously or synchronously.
 * @param {Function} continuation Function that handles user preferences
 *     content as the one and only argument
 */
gadgets.Gadget.prototype.getUserPrefsDialogContent = function(continuation) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

/**
 * Gets gadget content asynchronously or synchronously.
 * @param {Function} continuation Function that handles gadget content as
 *     the one and only argument
 */
gadgets.Gadget.prototype.getMainContent = function(continuation) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

/*
 * Gets additional parameters to append to the iframe url
 * Override this method if you need any custom params.
 */
gadgets.Gadget.prototype.getAdditionalParams = function() {
  return '';
};


// ---------
// IfrGadget

gadgets.IfrGadget = function(opt_params) {
  gadgets.Gadget.call(this, opt_params);
  this.serverBase_ = '../../'; // default gadget server
};

gadgets.IfrGadget.inherits(gadgets.Gadget);

gadgets.IfrGadget.prototype.GADGET_IFRAME_PREFIX_ = 'remote_iframe_';

gadgets.IfrGadget.prototype.CONTAINER = 'default';

gadgets.IfrGadget.prototype.cssClassGadget = 'gadgets-gadget';
gadgets.IfrGadget.prototype.cssClassTitleBar = 'gadgets-gadget-title-bar';
gadgets.IfrGadget.prototype.cssClassTitle = 'gadgets-gadget-title';
gadgets.IfrGadget.prototype.cssClassTitleButtonBar =
    'gadgets-gadget-title-button-bar';
gadgets.IfrGadget.prototype.cssClassGadgetUserPrefsDialog =
    'gadgets-gadget-user-prefs-dialog';
gadgets.IfrGadget.prototype.cssClassGadgetUserPrefsDialogActionBar =
    'gadgets-gadget-user-prefs-dialog-action-bar';
gadgets.IfrGadget.prototype.cssClassTitleButton = 'gadgets-gadget-title-button';
gadgets.IfrGadget.prototype.cssClassGadgetContent = 'gadgets-gadget-content';
gadgets.IfrGadget.prototype.rpcToken = (0x7FFFFFFF * Math.random()) | 0;
gadgets.IfrGadget.prototype.rpcRelay = 'files/container/rpc_relay.html';

gadgets.IfrGadget.prototype.getTitleBarContent = function(continuation) {
  continuation('<div id="' + this.cssClassTitleBar + '-' + this.id +
      '" class="' + this.cssClassTitleBar + '"><span id="' +
      this.getIframeId() + '_title" class="' +
      this.cssClassTitle + '">' + (this.title ? this.title : 'Title') + '</span> | <span class="' +
      this.cssClassTitleButtonBar +
      '"><a href="#" onclick="gadgets.container.getGadget(' + this.id +
      ').handleOpenUserPrefsDialog();return false;" class="' + this.cssClassTitleButton +
      '">settings</a> <a href="#" onclick="gadgets.container.getGadget(' +
      this.id + ').handleToggle();return false;" class="' + this.cssClassTitleButton +
      '">toggle</a></span></div>');
};

gadgets.IfrGadget.prototype.getUserPrefsDialogContent = function(continuation) {
  continuation('<div id="' + this.getUserPrefsDialogId() + '" class="' +
      this.cssClassGadgetUserPrefsDialog + '"></div>');
};

gadgets.IfrGadget.prototype.setServerBase = function(url) {
  this.serverBase_ = url;
};

gadgets.IfrGadget.prototype.getServerBase = function() {
  return this.serverBase_;
};

gadgets.IfrGadget.prototype.getMainContent = function(continuation) {
  var iframeId = this.getIframeId();
  gadgets.rpc.setRelayUrl(iframeId, this.serverBase_ + this.rpcRelay);
  gadgets.rpc.setAuthToken(iframeId, this.rpcToken);
  continuation('<div class="' + this.cssClassGadgetContent + '"><iframe id="' +
      iframeId + '" name="' + iframeId + '" class="' + this.cssClassGadget +
      '" src="about:blank' +
      '" frameborder="no" scrolling="no"' +
      (this.height ? ' height="' + this.height + '"' : '') +
      (this.width ? ' width="' + this.width + '"' : '') +
      '></iframe></div>');
};

gadgets.IfrGadget.prototype.getIframeId = function() {
  return this.GADGET_IFRAME_PREFIX_ + this.id;
};

gadgets.IfrGadget.prototype.getUserPrefsDialogId = function() {
  return this.getIframeId() + '_userPrefsDialog';
};

gadgets.IfrGadget.prototype.getIframeUrl = function() {
  return this.serverBase_ + 'ifr?' +
      'container=' + this.CONTAINER +
      '&mid=' +  this.id +
      '&nocache=' + gadgets.container.nocache_ +
      '&country=' + gadgets.container.country_ +
      '&lang=' + gadgets.container.language_ +
      '&view=' + gadgets.container.view_ +
      (this.specVersion ? '&v=' + this.specVersion : '') +
      (gadgets.container.parentUrl_ ? '&parent=' + encodeURIComponent(gadgets.container.parentUrl_) : '') +
      (this.debug ? '&debug=1' : '') +
      this.getAdditionalParams() +
      this.getUserPrefsParams() +
      (this.secureToken ? '&st=' + this.secureToken : '') +
      '&url=' + encodeURIComponent(this.specUrl) +
      '#rpctoken=' + this.rpcToken +
      (this.viewParams ?
          '&view-params=' +  encodeURIComponent(gadgets.json.stringify(this.viewParams)) : '') +
      (this.hashData ? '&' + this.hashData : '');
};

gadgets.IfrGadget.prototype.getUserPrefsParams = function() {
  var params = '';
  if (this.getUserPrefs()) {
    for(var name in this.getUserPrefs()) {
      var value = this.getUserPref(name);
      params += '&up_' + encodeURIComponent(name) + '=' +
          encodeURIComponent(value);
    }
  }
  return params;
};

gadgets.IfrGadget.prototype.handleToggle = function() {
  var gadgetIframe = document.getElementById(this.getIframeId());
  if (gadgetIframe) {
    var gadgetContent = gadgetIframe.parentNode;
    var display = gadgetContent.style.display;
    gadgetContent.style.display = display ? '' : 'none';
  }
};

gadgets.IfrGadget.prototype.handleOpenUserPrefsDialog = function() {
  if (this.userPrefsDialogContentLoaded) {
    this.showUserPrefsDialog();
  } else {
    var gadget = this;
    var igCallbackName = 'ig_callback_' + this.id;
    window[igCallbackName] = function(userPrefsDialogContent) {
      gadget.userPrefsDialogContentLoaded = true;
      gadget.buildUserPrefsDialog(userPrefsDialogContent);
      gadget.showUserPrefsDialog();
    };

    var script = document.createElement('script');
    script.src = 'http://gmodules.com/ig/gadgetsettings?mid=' + this.id +
        '&output=js' + this.getUserPrefsParams() +  '&url=' + this.specUrl;
    document.body.appendChild(script);
  }
};

gadgets.IfrGadget.prototype.buildUserPrefsDialog = function(content) {
  var userPrefsDialog = document.getElementById(this.getUserPrefsDialogId());
  userPrefsDialog.innerHTML = content +
      '<div class="' + this.cssClassGadgetUserPrefsDialogActionBar +
      '"><input type="button" value="Save" onclick="gadgets.container.getGadget(' +
      this.id +').handleSaveUserPrefs()"> <input type="button" value="Cancel" onclick="gadgets.container.getGadget(' +
      this.id +').handleCancelUserPrefs()"></div>';
  userPrefsDialog.childNodes[0].style.display = '';
};

gadgets.IfrGadget.prototype.showUserPrefsDialog = function(opt_show) {
  var userPrefsDialog = document.getElementById(this.getUserPrefsDialogId());
  userPrefsDialog.style.display = (opt_show || opt_show === undefined)
      ? '' : 'none';
};

gadgets.IfrGadget.prototype.hideUserPrefsDialog = function() {
  this.showUserPrefsDialog(false);
};

gadgets.IfrGadget.prototype.handleSaveUserPrefs = function() {
  this.hideUserPrefsDialog();

  var prefs = {};
  var numFields = document.getElementById('m_' + this.id +
      '_numfields').value;
  for (var i = 0; i < numFields; i++) {
    var input = document.getElementById('m_' + this.id + '_' + i);
    if (input.type != 'hidden') {
      var userPrefNamePrefix = 'm_' + this.id + '_up_';
      var userPrefName = input.name.substring(userPrefNamePrefix.length);
      var userPrefValue = input.value;
      prefs[userPrefName] = userPrefValue;
    }
  }

  this.setUserPrefs(prefs);
  this.refresh();
};

gadgets.IfrGadget.prototype.handleCancelUserPrefs = function() {
  this.hideUserPrefsDialog();
};

gadgets.IfrGadget.prototype.refresh = function() {
  var iframeId = this.getIframeId();
  document.getElementById(iframeId).src = this.getIframeUrl();
};


// ---------
// Container

/**
 * Container interface.
 * @constructor
 */
gadgets.Container = function() {
  this.gadgets_ = {};
  this.parentUrl_ = 'http://' + document.location.host;
  this.country_ = 'ALL';
  this.language_ = 'ALL';
  this.view_ = 'default';
  this.nocache_ = 1;

  // signed max int
  this.maxheight_ = 0x7FFFFFFF;
};

gadgets.Container.inherits(gadgets.Extensible);

/**
 * Known dependencies:
 *     gadgetClass: constructor to create a new gadget instance
 *     userPrefStore: instance of a subclass of gadgets.UserPrefStore
 *     gadgetService: instance of a subclass of gadgets.GadgetService
 *     layoutManager: instance of a subclass of gadgets.LayoutManager
 */

gadgets.Container.prototype.gadgetClass = gadgets.Gadget;

gadgets.Container.prototype.userPrefStore = new gadgets.DefaultUserPrefStore();

gadgets.Container.prototype.gadgetService = new gadgets.GadgetService();

gadgets.Container.prototype.layoutManager =
    new gadgets.StaticLayoutManager();

gadgets.Container.prototype.setParentUrl = function(url) {
  this.parentUrl_ = url;
};

gadgets.Container.prototype.setCountry = function(country) {
  this.country_ = country;
};

gadgets.Container.prototype.setNoCache = function(nocache) {
  this.nocache_ = nocache;
};

gadgets.Container.prototype.setLanguage = function(language) {
  this.language_ = language;
};

gadgets.Container.prototype.setView = function(view) {
  this.view_ = view;
};

gadgets.Container.prototype.setMaxHeight = function(maxheight) {
  this.maxheight_ = maxheight;
};

gadgets.Container.prototype.getGadgetKey_ = function(instanceId) {
  return 'gadget_' + instanceId;
};

gadgets.Container.prototype.getGadget = function(instanceId) {
  return this.gadgets_[this.getGadgetKey_(instanceId)];
};

gadgets.Container.prototype.createGadget = function(opt_params) {
  return new this.gadgetClass(opt_params);
};

gadgets.Container.prototype.addGadget = function(gadget) {
  gadget.id = this.getNextGadgetInstanceId();
  gadget.setUserPrefs(this.userPrefStore.getPrefs(gadget));
  this.gadgets_[this.getGadgetKey_(gadget.id)] = gadget;
};

gadgets.Container.prototype.addGadgets = function(gadgets) {
  for (var i = 0; i < gadgets.length; i++) {
    this.addGadget(gadgets[i]);
  }
};

/**
 * Renders all gadgets in the container.
 */
gadgets.Container.prototype.renderGadgets = function() {
  for (var key in this.gadgets_) {
    this.renderGadget(this.gadgets_[key]);
  }
};

/**
 * Renders a gadget.  Gadgets are rendered inside their chrome element.
 * @param {Object} gadget Gadget object
 */
gadgets.Container.prototype.renderGadget = function(gadget) {
  throw Error(gadgets.error.SUBCLASS_RESPONSIBILITY);
};

gadgets.Container.prototype.nextGadgetInstanceId_ = 0;

gadgets.Container.prototype.getNextGadgetInstanceId = function() {
  return this.nextGadgetInstanceId_++;
};

/**
 * Refresh all the gadgets in the container.
 */
gadgets.Container.prototype.refreshGadgets = function() {
  for (var key in this.gadgets_) {
    this.gadgets_[key].refresh();
  }
};


// ------------
// IfrContainer

/**
 * Container that renders gadget using ifr.
 * @constructor
 */
gadgets.IfrContainer = function() {
  gadgets.Container.call(this);
};

gadgets.IfrContainer.inherits(gadgets.Container);

gadgets.IfrContainer.prototype.gadgetClass = gadgets.IfrGadget;

gadgets.IfrContainer.prototype.gadgetService = new gadgets.IfrGadgetService();

gadgets.IfrContainer.prototype.setParentUrl = function(url) {
  if (!url.match(/^http[s]?:\/\//)) {
    url = document.location.href.match(/^[^?#]+\//)[0] + url;
  }

  this.parentUrl_ = url;
};

/**
 * Renders a gadget using ifr.
 * @param {Object} gadget Gadget object
 */
gadgets.IfrContainer.prototype.renderGadget = function(gadget) {
  var chrome = this.layoutManager.getGadgetChrome(gadget);
  gadget.render(chrome);
};

/**
 * Default container.
 */
gadgets.container = new gadgets.IfrContainer();
/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Implements the gadgets.UserPrefStore interface using a cookies
 * based implementation. Depends on cookies.js. This code should not be used in
 * a production environment.
 */

/**
 * Cookie-based user preference store.
 * @constructor
 */
gadgets.CookieBasedUserPrefStore = function() {
  gadgets.UserPrefStore.call(this);
};

gadgets.CookieBasedUserPrefStore.inherits(gadgets.UserPrefStore);

gadgets.CookieBasedUserPrefStore.prototype.USER_PREFS_PREFIX =
    'gadgetUserPrefs-';

gadgets.CookieBasedUserPrefStore.prototype.getPrefs = function(gadget) {
  var userPrefs = {};
  var cookieName = this.USER_PREFS_PREFIX + gadget.id;
  var cookie = shindig.cookies.get(cookieName);
  if (cookie) {
    var pairs = cookie.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var nameValue = pairs[i].split('=');
      var name = decodeURIComponent(nameValue[0]);
      var value = decodeURIComponent(nameValue[1]);
      userPrefs[name] = value;
    }
  }

  return userPrefs;
};

gadgets.CookieBasedUserPrefStore.prototype.savePrefs = function(gadget) {
  var pairs = [];
  for (var name in gadget.getUserPrefs()) {
    var value = gadget.getUserPref(name);
    var pair = encodeURIComponent(name) + '=' + encodeURIComponent(value);
    pairs.push(pair);
  }

  var cookieName = this.USER_PREFS_PREFIX + gadget.id;
  var cookieValue = pairs.join('&');
  shindig.cookies.set(cookieName, cookieValue);
};

gadgets.Container.prototype.userPrefStore =
    new gadgets.CookieBasedUserPrefStore();
/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
if(typeof YAHOO=="undefined"||!YAHOO){var YAHOO={};}YAHOO.namespace=function(){var A=arguments,E=null,C,B,D;for(C=0;C<A.length;C=C+1){D=(""+A[C]).split(".");E=YAHOO;for(B=(D[0]=="YAHOO")?1:0;B<D.length;B=B+1){E[D[B]]=E[D[B]]||{};E=E[D[B]];}}return E;};YAHOO.log=function(D,A,C){var B=YAHOO.widget.Logger;if(B&&B.log){return B.log(D,A,C);}else{return false;}};YAHOO.register=function(A,E,D){var I=YAHOO.env.modules,B,H,G,F,C;if(!I[A]){I[A]={versions:[],builds:[]};}B=I[A];H=D.version;G=D.build;F=YAHOO.env.listeners;B.name=A;B.version=H;B.build=G;B.versions.push(H);B.builds.push(G);B.mainClass=E;for(C=0;C<F.length;C=C+1){F[C](B);}if(E){E.VERSION=H;E.BUILD=G;}else{YAHOO.log("mainClass is undefined for module "+A,"warn");}};YAHOO.env=YAHOO.env||{modules:[],listeners:[]};YAHOO.env.getVersion=function(A){return YAHOO.env.modules[A]||null;};YAHOO.env.ua=function(){var C={ie:0,opera:0,gecko:0,webkit:0,mobile:null,air:0,caja:0},B=navigator.userAgent,A;if((/KHTML/).test(B)){C.webkit=1;}A=B.match(/AppleWebKit\/([^\s]*)/);if(A&&A[1]){C.webkit=parseFloat(A[1]);if(/ Mobile\//.test(B)){C.mobile="Apple";}else{A=B.match(/NokiaN[^\/]*/);if(A){C.mobile=A[0];}}A=B.match(/AdobeAIR\/([^\s]*)/);if(A){C.air=A[0];}}if(!C.webkit){A=B.match(/Opera[\s\/]([^\s]*)/);if(A&&A[1]){C.opera=parseFloat(A[1]);A=B.match(/Opera Mini[^;]*/);if(A){C.mobile=A[0];}}else{A=B.match(/MSIE\s([^;]*)/);if(A&&A[1]){C.ie=parseFloat(A[1]);}else{A=B.match(/Gecko\/([^\s]*)/);if(A){C.gecko=1;A=B.match(/rv:([^\s\)]*)/);if(A&&A[1]){C.gecko=parseFloat(A[1]);}}}}}A=B.match(/Caja\/([^\s]*)/);if(A&&A[1]){C.caja=parseFloat(A[1]);}return C;}();(function(){YAHOO.namespace("util","widget","example");if("undefined"!==typeof YAHOO_config){var B=YAHOO_config.listener,A=YAHOO.env.listeners,D=true,C;if(B){for(C=0;C<A.length;C=C+1){if(A[C]==B){D=false;break;}}if(D){A.push(B);}}}})();YAHOO.lang=YAHOO.lang||{};(function(){var B=YAHOO.lang,F="[object Array]",C="[object Function]",A=Object.prototype,E=["toString","valueOf"],D={isArray:function(G){return A.toString.apply(G)===F;},isBoolean:function(G){return typeof G==="boolean";},isFunction:function(G){return A.toString.apply(G)===C;},isNull:function(G){return G===null;},isNumber:function(G){return typeof G==="number"&&isFinite(G);},isObject:function(G){return(G&&(typeof G==="object"||B.isFunction(G)))||false;},isString:function(G){return typeof G==="string";},isUndefined:function(G){return typeof G==="undefined";},_IEEnumFix:(YAHOO.env.ua.ie)?function(I,H){var G,K,J;for(G=0;G<E.length;G=G+1){K=E[G];J=H[K];if(B.isFunction(J)&&J!=A[K]){I[K]=J;}}}:function(){},extend:function(J,K,I){if(!K||!J){throw new Error("extend failed, please check that "+"all dependencies are included.");}var H=function(){},G;H.prototype=K.prototype;J.prototype=new H();J.prototype.constructor=J;J.superclass=K.prototype;if(K.prototype.constructor==A.constructor){K.prototype.constructor=K;}if(I){for(G in I){if(B.hasOwnProperty(I,G)){J.prototype[G]=I[G];}}B._IEEnumFix(J.prototype,I);}},augmentObject:function(K,J){if(!J||!K){throw new Error("Absorb failed, verify dependencies.");}var G=arguments,I,L,H=G[2];if(H&&H!==true){for(I=2;I<G.length;I=I+1){K[G[I]]=J[G[I]];}}else{for(L in J){if(H||!(L in K)){K[L]=J[L];}}B._IEEnumFix(K,J);}},augmentProto:function(J,I){if(!I||!J){throw new Error("Augment failed, verify dependencies.");}var G=[J.prototype,I.prototype],H;for(H=2;H<arguments.length;H=H+1){G.push(arguments[H]);}B.augmentObject.apply(this,G);},dump:function(G,L){var I,K,N=[],O="{...}",H="f(){...}",M=", ",J=" => ";if(!B.isObject(G)){return G+"";}else{if(G instanceof Date||("nodeType" in G&&"tagName" in G)){return G;}else{if(B.isFunction(G)){return H;}}}L=(B.isNumber(L))?L:3;if(B.isArray(G)){N.push("[");for(I=0,K=G.length;I<K;I=I+1){if(B.isObject(G[I])){N.push((L>0)?B.dump(G[I],L-1):O);}else{N.push(G[I]);}N.push(M);}if(N.length>1){N.pop();}N.push("]");}else{N.push("{");for(I in G){if(B.hasOwnProperty(G,I)){N.push(I+J);if(B.isObject(G[I])){N.push((L>0)?B.dump(G[I],L-1):O);}else{N.push(G[I]);}N.push(M);}}if(N.length>1){N.pop();}N.push("}");}return N.join("");},substitute:function(V,H,O){var L,K,J,R,S,U,Q=[],I,M="dump",P=" ",G="{",T="}",N;for(;;){L=V.lastIndexOf(G);if(L<0){break;}K=V.indexOf(T,L);if(L+1>=K){break;}I=V.substring(L+1,K);R=I;U=null;J=R.indexOf(P);if(J>-1){U=R.substring(J+1);R=R.substring(0,J);}S=H[R];if(O){S=O(R,S,U);}if(B.isObject(S)){if(B.isArray(S)){S=B.dump(S,parseInt(U,10));}else{U=U||"";N=U.indexOf(M);if(N>-1){U=U.substring(4);}if(S.toString===A.toString||N>-1){S=B.dump(S,parseInt(U,10));}else{S=S.toString();}}}else{if(!B.isString(S)&&!B.isNumber(S)){S="~-"+Q.length+"-~";Q[Q.length]=I;}}V=V.substring(0,L)+S+V.substring(K+1);}for(L=Q.length-1;L>=0;L=L-1){V=V.replace(new RegExp("~-"+L+"-~"),"{"+Q[L]+"}","g");}return V;},trim:function(G){try{return G.replace(/^\s+|\s+$/g,"");}catch(H){return G;}},merge:function(){var J={},H=arguments,G=H.length,I;for(I=0;I<G;I=I+1){B.augmentObject(J,H[I],true);}return J;},later:function(N,H,O,J,K){N=N||0;H=H||{};var I=O,M=J,L,G;if(B.isString(O)){I=H[O];}if(!I){throw new TypeError("method undefined");}if(!B.isArray(M)){M=[J];}L=function(){I.apply(H,M);};G=(K)?setInterval(L,N):setTimeout(L,N);return{interval:K,cancel:function(){if(this.interval){clearInterval(G);}else{clearTimeout(G);}}};},isValue:function(G){return(B.isObject(G)||B.isString(G)||B.isNumber(G)||B.isBoolean(G));}};B.hasOwnProperty=(A.hasOwnProperty)?function(G,H){return G&&G.hasOwnProperty(H);}:function(G,H){return !B.isUndefined(G[H])&&G.constructor.prototype[H]!==G[H];};D.augmentObject(B,D,true);YAHOO.util.Lang=B;B.augment=B.augmentProto;YAHOO.augment=B.augmentProto;YAHOO.extend=B.extend;})();YAHOO.register("yahoo",YAHOO,{version:"2.7.0",build:"1796"});(function(){YAHOO.env._id_counter=YAHOO.env._id_counter||0;var E=YAHOO.util,L=YAHOO.lang,m=YAHOO.env.ua,A=YAHOO.lang.trim,d={},h={},N=/^t(?:able|d|h)$/i,X=/color$/i,K=window.document,W=K.documentElement,e="ownerDocument",n="defaultView",v="documentElement",t="compatMode",b="offsetLeft",P="offsetTop",u="offsetParent",Z="parentNode",l="nodeType",C="tagName",O="scrollLeft",i="scrollTop",Q="getBoundingClientRect",w="getComputedStyle",a="currentStyle",M="CSS1Compat",c="BackCompat",g="class",F="className",J="",B=" ",s="(?:^|\\s)",k="(?= |$)",U="g",p="position",f="fixed",V="relative",j="left",o="top",r="medium",q="borderLeftWidth",R="borderTopWidth",D=m.opera,I=m.webkit,H=m.gecko,T=m.ie;E.Dom={CUSTOM_ATTRIBUTES:(!W.hasAttribute)?{"for":"htmlFor","class":F}:{"htmlFor":"for","className":g},get:function(y){var AA,Y,z,x,G;if(y){if(y[l]||y.item){return y;}if(typeof y==="string"){AA=y;y=K.getElementById(y);if(y&&y.id===AA){return y;}else{if(y&&K.all){y=null;Y=K.all[AA];for(x=0,G=Y.length;x<G;++x){if(Y[x].id===AA){return Y[x];}}}}return y;}if(y.DOM_EVENTS){y=y.get("element");}if("length" in y){z=[];for(x=0,G=y.length;x<G;++x){z[z.length]=E.Dom.get(y[x]);}return z;}return y;}return null;},getComputedStyle:function(G,Y){if(window[w]){return G[e][n][w](G,null)[Y];}else{if(G[a]){return E.Dom.IE_ComputedStyle.get(G,Y);}}},getStyle:function(G,Y){return E.Dom.batch(G,E.Dom._getStyle,Y);},_getStyle:function(){if(window[w]){return function(G,y){y=(y==="float")?y="cssFloat":E.Dom._toCamel(y);var x=G.style[y],Y;if(!x){Y=G[e][n][w](G,null);if(Y){x=Y[y];}}return x;};}else{if(W[a]){return function(G,y){var x;switch(y){case"opacity":x=100;try{x=G.filters["DXImageTransform.Microsoft.Alpha"].opacity;}catch(z){try{x=G.filters("alpha").opacity;}catch(Y){}}return x/100;case"float":y="styleFloat";default:y=E.Dom._toCamel(y);x=G[a]?G[a][y]:null;return(G.style[y]||x);}};}}}(),setStyle:function(G,Y,x){E.Dom.batch(G,E.Dom._setStyle,{prop:Y,val:x});},_setStyle:function(){if(T){return function(Y,G){var x=E.Dom._toCamel(G.prop),y=G.val;if(Y){switch(x){case"opacity":if(L.isString(Y.style.filter)){Y.style.filter="alpha(opacity="+y*100+")";if(!Y[a]||!Y[a].hasLayout){Y.style.zoom=1;}}break;case"float":x="styleFloat";default:Y.style[x]=y;}}else{}};}else{return function(Y,G){var x=E.Dom._toCamel(G.prop),y=G.val;if(Y){if(x=="float"){x="cssFloat";}Y.style[x]=y;}else{}};}}(),getXY:function(G){return E.Dom.batch(G,E.Dom._getXY);},_canPosition:function(G){return(E.Dom._getStyle(G,"display")!=="none"&&E.Dom._inDoc(G));},_getXY:function(){if(K[v][Q]){return function(y){var z,Y,AA,AF,AE,AD,AC,G,x,AB=Math.floor,AG=false;if(E.Dom._canPosition(y)){AA=y[Q]();AF=y[e];z=E.Dom.getDocumentScrollLeft(AF);Y=E.Dom.getDocumentScrollTop(AF);AG=[AB(AA[j]),AB(AA[o])];if(T&&m.ie<8){AE=2;AD=2;AC=AF[t];G=S(AF[v],q);x=S(AF[v],R);if(m.ie===6){if(AC!==c){AE=0;AD=0;}}if((AC==c)){if(G!==r){AE=parseInt(G,10);}if(x!==r){AD=parseInt(x,10);}}AG[0]-=AE;AG[1]-=AD;}if((Y||z)){AG[0]+=z;AG[1]+=Y;}AG[0]=AB(AG[0]);AG[1]=AB(AG[1]);}else{}return AG;};}else{return function(y){var x,Y,AA,AB,AC,z=false,G=y;if(E.Dom._canPosition(y)){z=[y[b],y[P]];x=E.Dom.getDocumentScrollLeft(y[e]);Y=E.Dom.getDocumentScrollTop(y[e]);AC=((H||m.webkit>519)?true:false);while((G=G[u])){z[0]+=G[b];z[1]+=G[P];if(AC){z=E.Dom._calcBorders(G,z);}}if(E.Dom._getStyle(y,p)!==f){G=y;while((G=G[Z])&&G[C]){AA=G[i];AB=G[O];if(H&&(E.Dom._getStyle(G,"overflow")!=="visible")){z=E.Dom._calcBorders(G,z);}if(AA||AB){z[0]-=AB;z[1]-=AA;}}z[0]+=x;z[1]+=Y;}else{if(D){z[0]-=x;z[1]-=Y;}else{if(I||H){z[0]+=x;z[1]+=Y;}}}z[0]=Math.floor(z[0]);z[1]=Math.floor(z[1]);}else{}return z;};}}(),getX:function(G){var Y=function(x){return E.Dom.getXY(x)[0];};return E.Dom.batch(G,Y,E.Dom,true);},getY:function(G){var Y=function(x){return E.Dom.getXY(x)[1];};return E.Dom.batch(G,Y,E.Dom,true);},setXY:function(G,x,Y){E.Dom.batch(G,E.Dom._setXY,{pos:x,noRetry:Y});},_setXY:function(G,z){var AA=E.Dom._getStyle(G,p),y=E.Dom.setStyle,AD=z.pos,Y=z.noRetry,AB=[parseInt(E.Dom.getComputedStyle(G,j),10),parseInt(E.Dom.getComputedStyle(G,o),10)],AC,x;if(AA=="static"){AA=V;y(G,p,AA);}AC=E.Dom._getXY(G);if(!AD||AC===false){return false;}if(isNaN(AB[0])){AB[0]=(AA==V)?0:G[b];}if(isNaN(AB[1])){AB[1]=(AA==V)?0:G[P];}if(AD[0]!==null){y(G,j,AD[0]-AC[0]+AB[0]+"px");}if(AD[1]!==null){y(G,o,AD[1]-AC[1]+AB[1]+"px");}if(!Y){x=E.Dom._getXY(G);if((AD[0]!==null&&x[0]!=AD[0])||(AD[1]!==null&&x[1]!=AD[1])){E.Dom._setXY(G,{pos:AD,noRetry:true});}}},setX:function(Y,G){E.Dom.setXY(Y,[G,null]);},setY:function(G,Y){E.Dom.setXY(G,[null,Y]);},getRegion:function(G){var Y=function(x){var y=false;if(E.Dom._canPosition(x)){y=E.Region.getRegion(x);}else{}return y;};return E.Dom.batch(G,Y,E.Dom,true);},getClientWidth:function(){return E.Dom.getViewportWidth();},getClientHeight:function(){return E.Dom.getViewportHeight();},getElementsByClassName:function(AB,AF,AC,AE,x,AD){AB=L.trim(AB);AF=AF||"*";AC=(AC)?E.Dom.get(AC):null||K;if(!AC){return[];}var Y=[],G=AC.getElementsByTagName(AF),z=E.Dom.hasClass;for(var y=0,AA=G.length;y<AA;++y){if(z(G[y],AB)){Y[Y.length]=G[y];}}if(AE){E.Dom.batch(Y,AE,x,AD);}return Y;},hasClass:function(Y,G){return E.Dom.batch(Y,E.Dom._hasClass,G);},_hasClass:function(x,Y){var G=false,y;if(x&&Y){y=E.Dom.getAttribute(x,F)||J;if(Y.exec){G=Y.test(y);}else{G=Y&&(B+y+B).indexOf(B+Y+B)>-1;}}else{}return G;},addClass:function(Y,G){return E.Dom.batch(Y,E.Dom._addClass,G);},_addClass:function(x,Y){var G=false,y;if(x&&Y){y=E.Dom.getAttribute(x,F)||J;if(!E.Dom._hasClass(x,Y)){E.Dom.setAttribute(x,F,A(y+B+Y));G=true;}}else{}return G;},removeClass:function(Y,G){return E.Dom.batch(Y,E.Dom._removeClass,G);},_removeClass:function(y,x){var Y=false,AA,z,G;if(y&&x){AA=E.Dom.getAttribute(y,F)||J;E.Dom.setAttribute(y,F,AA.replace(E.Dom._getClassRegex(x),J));z=E.Dom.getAttribute(y,F);if(AA!==z){E.Dom.setAttribute(y,F,A(z));Y=true;if(E.Dom.getAttribute(y,F)===""){G=(y.hasAttribute&&y.hasAttribute(g))?g:F;y.removeAttribute(G);}}}else{}return Y;},replaceClass:function(x,Y,G){return E.Dom.batch(x,E.Dom._replaceClass,{from:Y,to:G});
},_replaceClass:function(y,x){var Y,AB,AA,G=false,z;if(y&&x){AB=x.from;AA=x.to;if(!AA){G=false;}else{if(!AB){G=E.Dom._addClass(y,x.to);}else{if(AB!==AA){z=E.Dom.getAttribute(y,F)||J;Y=(B+z.replace(E.Dom._getClassRegex(AB),B+AA)).split(E.Dom._getClassRegex(AA));Y.splice(1,0,B+AA);E.Dom.setAttribute(y,F,A(Y.join(J)));G=true;}}}}else{}return G;},generateId:function(G,x){x=x||"yui-gen";var Y=function(y){if(y&&y.id){return y.id;}var z=x+YAHOO.env._id_counter++;if(y){if(y[e].getElementById(z)){return E.Dom.generateId(y,z+x);}y.id=z;}return z;};return E.Dom.batch(G,Y,E.Dom,true)||Y.apply(E.Dom,arguments);},isAncestor:function(Y,x){Y=E.Dom.get(Y);x=E.Dom.get(x);var G=false;if((Y&&x)&&(Y[l]&&x[l])){if(Y.contains&&Y!==x){G=Y.contains(x);}else{if(Y.compareDocumentPosition){G=!!(Y.compareDocumentPosition(x)&16);}}}else{}return G;},inDocument:function(G,Y){return E.Dom._inDoc(E.Dom.get(G),Y);},_inDoc:function(Y,x){var G=false;if(Y&&Y[C]){x=x||Y[e];G=E.Dom.isAncestor(x[v],Y);}else{}return G;},getElementsBy:function(Y,AF,AB,AD,y,AC,AE){AF=AF||"*";AB=(AB)?E.Dom.get(AB):null||K;if(!AB){return[];}var x=[],G=AB.getElementsByTagName(AF);for(var z=0,AA=G.length;z<AA;++z){if(Y(G[z])){if(AE){x=G[z];break;}else{x[x.length]=G[z];}}}if(AD){E.Dom.batch(x,AD,y,AC);}return x;},getElementBy:function(x,G,Y){return E.Dom.getElementsBy(x,G,Y,null,null,null,true);},batch:function(x,AB,AA,z){var y=[],Y=(z)?AA:window;x=(x&&(x[C]||x.item))?x:E.Dom.get(x);if(x&&AB){if(x[C]||x.length===undefined){return AB.call(Y,x,AA);}for(var G=0;G<x.length;++G){y[y.length]=AB.call(Y,x[G],AA);}}else{return false;}return y;},getDocumentHeight:function(){var Y=(K[t]!=M||I)?K.body.scrollHeight:W.scrollHeight,G=Math.max(Y,E.Dom.getViewportHeight());return G;},getDocumentWidth:function(){var Y=(K[t]!=M||I)?K.body.scrollWidth:W.scrollWidth,G=Math.max(Y,E.Dom.getViewportWidth());return G;},getViewportHeight:function(){var G=self.innerHeight,Y=K[t];if((Y||T)&&!D){G=(Y==M)?W.clientHeight:K.body.clientHeight;}return G;},getViewportWidth:function(){var G=self.innerWidth,Y=K[t];if(Y||T){G=(Y==M)?W.clientWidth:K.body.clientWidth;}return G;},getAncestorBy:function(G,Y){while((G=G[Z])){if(E.Dom._testElement(G,Y)){return G;}}return null;},getAncestorByClassName:function(Y,G){Y=E.Dom.get(Y);if(!Y){return null;}var x=function(y){return E.Dom.hasClass(y,G);};return E.Dom.getAncestorBy(Y,x);},getAncestorByTagName:function(Y,G){Y=E.Dom.get(Y);if(!Y){return null;}var x=function(y){return y[C]&&y[C].toUpperCase()==G.toUpperCase();};return E.Dom.getAncestorBy(Y,x);},getPreviousSiblingBy:function(G,Y){while(G){G=G.previousSibling;if(E.Dom._testElement(G,Y)){return G;}}return null;},getPreviousSibling:function(G){G=E.Dom.get(G);if(!G){return null;}return E.Dom.getPreviousSiblingBy(G);},getNextSiblingBy:function(G,Y){while(G){G=G.nextSibling;if(E.Dom._testElement(G,Y)){return G;}}return null;},getNextSibling:function(G){G=E.Dom.get(G);if(!G){return null;}return E.Dom.getNextSiblingBy(G);},getFirstChildBy:function(G,x){var Y=(E.Dom._testElement(G.firstChild,x))?G.firstChild:null;return Y||E.Dom.getNextSiblingBy(G.firstChild,x);},getFirstChild:function(G,Y){G=E.Dom.get(G);if(!G){return null;}return E.Dom.getFirstChildBy(G);},getLastChildBy:function(G,x){if(!G){return null;}var Y=(E.Dom._testElement(G.lastChild,x))?G.lastChild:null;return Y||E.Dom.getPreviousSiblingBy(G.lastChild,x);},getLastChild:function(G){G=E.Dom.get(G);return E.Dom.getLastChildBy(G);},getChildrenBy:function(Y,y){var x=E.Dom.getFirstChildBy(Y,y),G=x?[x]:[];E.Dom.getNextSiblingBy(x,function(z){if(!y||y(z)){G[G.length]=z;}return false;});return G;},getChildren:function(G){G=E.Dom.get(G);if(!G){}return E.Dom.getChildrenBy(G);},getDocumentScrollLeft:function(G){G=G||K;return Math.max(G[v].scrollLeft,G.body.scrollLeft);},getDocumentScrollTop:function(G){G=G||K;return Math.max(G[v].scrollTop,G.body.scrollTop);},insertBefore:function(Y,G){Y=E.Dom.get(Y);G=E.Dom.get(G);if(!Y||!G||!G[Z]){return null;}return G[Z].insertBefore(Y,G);},insertAfter:function(Y,G){Y=E.Dom.get(Y);G=E.Dom.get(G);if(!Y||!G||!G[Z]){return null;}if(G.nextSibling){return G[Z].insertBefore(Y,G.nextSibling);}else{return G[Z].appendChild(Y);}},getClientRegion:function(){var x=E.Dom.getDocumentScrollTop(),Y=E.Dom.getDocumentScrollLeft(),y=E.Dom.getViewportWidth()+Y,G=E.Dom.getViewportHeight()+x;return new E.Region(x,y,G,Y);},setAttribute:function(Y,G,x){G=E.Dom.CUSTOM_ATTRIBUTES[G]||G;Y.setAttribute(G,x);},getAttribute:function(Y,G){G=E.Dom.CUSTOM_ATTRIBUTES[G]||G;return Y.getAttribute(G);},_toCamel:function(Y){var x=d;function G(y,z){return z.toUpperCase();}return x[Y]||(x[Y]=Y.indexOf("-")===-1?Y:Y.replace(/-([a-z])/gi,G));},_getClassRegex:function(Y){var G;if(Y!==undefined){if(Y.exec){G=Y;}else{G=h[Y];if(!G){Y=Y.replace(E.Dom._patterns.CLASS_RE_TOKENS,"\\$1");G=h[Y]=new RegExp(s+Y+k,U);}}}return G;},_patterns:{ROOT_TAG:/^body|html$/i,CLASS_RE_TOKENS:/([\.\(\)\^\$\*\+\?\|\[\]\{\}])/g},_testElement:function(G,Y){return G&&G[l]==1&&(!Y||Y(G));},_calcBorders:function(x,y){var Y=parseInt(E.Dom[w](x,R),10)||0,G=parseInt(E.Dom[w](x,q),10)||0;if(H){if(N.test(x[C])){Y=0;G=0;}}y[0]+=G;y[1]+=Y;return y;}};var S=E.Dom[w];if(m.opera){E.Dom[w]=function(Y,G){var x=S(Y,G);if(X.test(G)){x=E.Dom.Color.toRGB(x);}return x;};}if(m.webkit){E.Dom[w]=function(Y,G){var x=S(Y,G);if(x==="rgba(0, 0, 0, 0)"){x="transparent";}return x;};}})();YAHOO.util.Region=function(C,D,A,B){this.top=C;this.y=C;this[1]=C;this.right=D;this.bottom=A;this.left=B;this.x=B;this[0]=B;this.width=this.right-this.left;this.height=this.bottom-this.top;};YAHOO.util.Region.prototype.contains=function(A){return(A.left>=this.left&&A.right<=this.right&&A.top>=this.top&&A.bottom<=this.bottom);};YAHOO.util.Region.prototype.getArea=function(){return((this.bottom-this.top)*(this.right-this.left));};YAHOO.util.Region.prototype.intersect=function(E){var C=Math.max(this.top,E.top),D=Math.min(this.right,E.right),A=Math.min(this.bottom,E.bottom),B=Math.max(this.left,E.left);if(A>=C&&D>=B){return new YAHOO.util.Region(C,D,A,B);
}else{return null;}};YAHOO.util.Region.prototype.union=function(E){var C=Math.min(this.top,E.top),D=Math.max(this.right,E.right),A=Math.max(this.bottom,E.bottom),B=Math.min(this.left,E.left);return new YAHOO.util.Region(C,D,A,B);};YAHOO.util.Region.prototype.toString=function(){return("Region {"+"top: "+this.top+", right: "+this.right+", bottom: "+this.bottom+", left: "+this.left+", height: "+this.height+", width: "+this.width+"}");};YAHOO.util.Region.getRegion=function(D){var F=YAHOO.util.Dom.getXY(D),C=F[1],E=F[0]+D.offsetWidth,A=F[1]+D.offsetHeight,B=F[0];return new YAHOO.util.Region(C,E,A,B);};YAHOO.util.Point=function(A,B){if(YAHOO.lang.isArray(A)){B=A[1];A=A[0];}YAHOO.util.Point.superclass.constructor.call(this,B,A,B,A);};YAHOO.extend(YAHOO.util.Point,YAHOO.util.Region);(function(){var B=YAHOO.util,A="clientTop",F="clientLeft",J="parentNode",K="right",W="hasLayout",I="px",U="opacity",L="auto",D="borderLeftWidth",G="borderTopWidth",P="borderRightWidth",V="borderBottomWidth",S="visible",Q="transparent",N="height",E="width",H="style",T="currentStyle",R=/^width|height$/,O=/^(\d[.\d]*)+(em|ex|px|gd|rem|vw|vh|vm|ch|mm|cm|in|pt|pc|deg|rad|ms|s|hz|khz|%){1}?/i,M={get:function(X,Z){var Y="",a=X[T][Z];if(Z===U){Y=B.Dom.getStyle(X,U);}else{if(!a||(a.indexOf&&a.indexOf(I)>-1)){Y=a;}else{if(B.Dom.IE_COMPUTED[Z]){Y=B.Dom.IE_COMPUTED[Z](X,Z);}else{if(O.test(a)){Y=B.Dom.IE.ComputedStyle.getPixel(X,Z);}else{Y=a;}}}}return Y;},getOffset:function(Z,e){var b=Z[T][e],X=e.charAt(0).toUpperCase()+e.substr(1),c="offset"+X,Y="pixel"+X,a="",d;if(b==L){d=Z[c];if(d===undefined){a=0;}a=d;if(R.test(e)){Z[H][e]=d;if(Z[c]>d){a=d-(Z[c]-d);}Z[H][e]=L;}}else{if(!Z[H][Y]&&!Z[H][e]){Z[H][e]=b;}a=Z[H][Y];}return a+I;},getBorderWidth:function(X,Z){var Y=null;if(!X[T][W]){X[H].zoom=1;}switch(Z){case G:Y=X[A];break;case V:Y=X.offsetHeight-X.clientHeight-X[A];break;case D:Y=X[F];break;case P:Y=X.offsetWidth-X.clientWidth-X[F];break;}return Y+I;},getPixel:function(Y,X){var a=null,b=Y[T][K],Z=Y[T][X];Y[H][K]=Z;a=Y[H].pixelRight;Y[H][K]=b;return a+I;},getMargin:function(Y,X){var Z;if(Y[T][X]==L){Z=0+I;}else{Z=B.Dom.IE.ComputedStyle.getPixel(Y,X);}return Z;},getVisibility:function(Y,X){var Z;while((Z=Y[T])&&Z[X]=="inherit"){Y=Y[J];}return(Z)?Z[X]:S;},getColor:function(Y,X){return B.Dom.Color.toRGB(Y[T][X])||Q;},getBorderColor:function(Y,X){var Z=Y[T],a=Z[X]||Z.color;return B.Dom.Color.toRGB(B.Dom.Color.toHex(a));}},C={};C.top=C.right=C.bottom=C.left=C[E]=C[N]=M.getOffset;C.color=M.getColor;C[G]=C[P]=C[V]=C[D]=M.getBorderWidth;C.marginTop=C.marginRight=C.marginBottom=C.marginLeft=M.getMargin;C.visibility=M.getVisibility;C.borderColor=C.borderTopColor=C.borderRightColor=C.borderBottomColor=C.borderLeftColor=M.getBorderColor;B.Dom.IE_COMPUTED=C;B.Dom.IE_ComputedStyle=M;})();(function(){var C="toString",A=parseInt,B=RegExp,D=YAHOO.util;D.Dom.Color={KEYWORDS:{black:"000",silver:"c0c0c0",gray:"808080",white:"fff",maroon:"800000",red:"f00",purple:"800080",fuchsia:"f0f",green:"008000",lime:"0f0",olive:"808000",yellow:"ff0",navy:"000080",blue:"00f",teal:"008080",aqua:"0ff"},re_RGB:/^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,re_hex:/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,re_hex3:/([0-9A-F])/gi,toRGB:function(E){if(!D.Dom.Color.re_RGB.test(E)){E=D.Dom.Color.toHex(E);}if(D.Dom.Color.re_hex.exec(E)){E="rgb("+[A(B.$1,16),A(B.$2,16),A(B.$3,16)].join(", ")+")";}return E;},toHex:function(H){H=D.Dom.Color.KEYWORDS[H]||H;if(D.Dom.Color.re_RGB.exec(H)){var G=(B.$1.length===1)?"0"+B.$1:Number(B.$1),F=(B.$2.length===1)?"0"+B.$2:Number(B.$2),E=(B.$3.length===1)?"0"+B.$3:Number(B.$3);H=[G[C](16),F[C](16),E[C](16)].join("");}if(H.length<6){H=H.replace(D.Dom.Color.re_hex3,"$1$1");}if(H!=="transparent"&&H.indexOf("#")<0){H="#"+H;}return H.toLowerCase();}};}());YAHOO.register("dom",YAHOO.util.Dom,{version:"2.7.0",build:"1796"});YAHOO.util.CustomEvent=function(D,C,B,A){this.type=D;this.scope=C||window;this.silent=B;this.signature=A||YAHOO.util.CustomEvent.LIST;this.subscribers=[];if(!this.silent){}var E="_YUICEOnSubscribe";if(D!==E){this.subscribeEvent=new YAHOO.util.CustomEvent(E,this,true);}this.lastError=null;};YAHOO.util.CustomEvent.LIST=0;YAHOO.util.CustomEvent.FLAT=1;YAHOO.util.CustomEvent.prototype={subscribe:function(A,B,C){if(!A){throw new Error("Invalid callback for subscriber to '"+this.type+"'");}if(this.subscribeEvent){this.subscribeEvent.fire(A,B,C);}this.subscribers.push(new YAHOO.util.Subscriber(A,B,C));},unsubscribe:function(D,F){if(!D){return this.unsubscribeAll();}var E=false;for(var B=0,A=this.subscribers.length;B<A;++B){var C=this.subscribers[B];if(C&&C.contains(D,F)){this._delete(B);E=true;}}return E;},fire:function(){this.lastError=null;var K=[],E=this.subscribers.length;if(!E&&this.silent){return true;}var I=[].slice.call(arguments,0),G=true,D,J=false;if(!this.silent){}var C=this.subscribers.slice(),A=YAHOO.util.Event.throwErrors;for(D=0;D<E;++D){var M=C[D];if(!M){J=true;}else{if(!this.silent){}var L=M.getScope(this.scope);if(this.signature==YAHOO.util.CustomEvent.FLAT){var B=null;if(I.length>0){B=I[0];}try{G=M.fn.call(L,B,M.obj);}catch(F){this.lastError=F;if(A){throw F;}}}else{try{G=M.fn.call(L,this.type,I,M.obj);}catch(H){this.lastError=H;if(A){throw H;}}}if(false===G){if(!this.silent){}break;}}}return(G!==false);},unsubscribeAll:function(){var A=this.subscribers.length,B;for(B=A-1;B>-1;B--){this._delete(B);}this.subscribers=[];return A;},_delete:function(A){var B=this.subscribers[A];if(B){delete B.fn;delete B.obj;}this.subscribers.splice(A,1);},toString:function(){return"CustomEvent: "+"'"+this.type+"', "+"context: "+this.scope;}};YAHOO.util.Subscriber=function(A,B,C){this.fn=A;this.obj=YAHOO.lang.isUndefined(B)?null:B;this.overrideContext=C;};YAHOO.util.Subscriber.prototype.getScope=function(A){if(this.overrideContext){if(this.overrideContext===true){return this.obj;}else{return this.overrideContext;}}return A;};YAHOO.util.Subscriber.prototype.contains=function(A,B){if(B){return(this.fn==A&&this.obj==B);}else{return(this.fn==A);}};YAHOO.util.Subscriber.prototype.toString=function(){return"Subscriber { obj: "+this.obj+", overrideContext: "+(this.overrideContext||"no")+" }";};if(!YAHOO.util.Event){YAHOO.util.Event=function(){var H=false;var I=[];var J=[];var G=[];var E=[];var C=0;var F=[];var B=[];var A=0;var D={63232:38,63233:40,63234:37,63235:39,63276:33,63277:34,25:9};var K=YAHOO.env.ua.ie?"focusin":"focus";var L=YAHOO.env.ua.ie?"focusout":"blur";return{POLL_RETRYS:2000,POLL_INTERVAL:20,EL:0,TYPE:1,FN:2,WFN:3,UNLOAD_OBJ:3,ADJ_SCOPE:4,OBJ:5,OVERRIDE:6,lastError:null,isSafari:YAHOO.env.ua.webkit,webkit:YAHOO.env.ua.webkit,isIE:YAHOO.env.ua.ie,_interval:null,_dri:null,DOMReady:false,throwErrors:false,startInterval:function(){if(!this._interval){var M=this;var N=function(){M._tryPreloadAttach();};this._interval=setInterval(N,this.POLL_INTERVAL);}},onAvailable:function(S,O,Q,R,P){var M=(YAHOO.lang.isString(S))?[S]:S;for(var N=0;N<M.length;N=N+1){F.push({id:M[N],fn:O,obj:Q,overrideContext:R,checkReady:P});}C=this.POLL_RETRYS;this.startInterval();},onContentReady:function(P,M,N,O){this.onAvailable(P,M,N,O,true);},onDOMReady:function(M,N,O){if(this.DOMReady){setTimeout(function(){var P=window;if(O){if(O===true){P=N;}else{P=O;}}M.call(P,"DOMReady",[],N);},0);}else{this.DOMReadyEvent.subscribe(M,N,O);}},_addListener:function(O,M,Y,S,W,b){if(!Y||!Y.call){return false;}if(this._isValidCollection(O)){var Z=true;for(var T=0,V=O.length;T<V;++T){Z=this.on(O[T],M,Y,S,W)&&Z;}return Z;}else{if(YAHOO.lang.isString(O)){var R=this.getEl(O);if(R){O=R;}else{this.onAvailable(O,function(){YAHOO.util.Event.on(O,M,Y,S,W);});return true;}}}if(!O){return false;}if("unload"==M&&S!==this){J[J.length]=[O,M,Y,S,W];return true;}var N=O;if(W){if(W===true){N=S;}else{N=W;}}var P=function(c){return Y.call(N,YAHOO.util.Event.getEvent(c,O),S);};var a=[O,M,Y,P,N,S,W];var U=I.length;I[U]=a;if(this.useLegacyEvent(O,M)){var Q=this.getLegacyIndex(O,M);if(Q==-1||O!=G[Q][0]){Q=G.length;B[O.id+M]=Q;G[Q]=[O,M,O["on"+M]];E[Q]=[];O["on"+M]=function(c){YAHOO.util.Event.fireLegacyEvent(YAHOO.util.Event.getEvent(c),Q);};}E[Q].push(a);}else{try{this._simpleAdd(O,M,P,b);}catch(X){this.lastError=X;this.removeListener(O,M,Y);return false;}}return true;},addListener:function(N,Q,M,O,P){return this._addListener(N,Q,M,O,P,false);},addFocusListener:function(N,M,O,P){return this._addListener(N,K,M,O,P,true);},removeFocusListener:function(N,M){return this.removeListener(N,K,M);},addBlurListener:function(N,M,O,P){return this._addListener(N,L,M,O,P,true);},removeBlurListener:function(N,M){return this.removeListener(N,L,M);},fireLegacyEvent:function(R,P){var T=true,M,V,U,N,S;V=E[P].slice();for(var O=0,Q=V.length;O<Q;++O){U=V[O];if(U&&U[this.WFN]){N=U[this.ADJ_SCOPE];S=U[this.WFN].call(N,R);T=(T&&S);}}M=G[P];if(M&&M[2]){M[2](R);}return T;},getLegacyIndex:function(N,O){var M=this.generateId(N)+O;if(typeof B[M]=="undefined"){return -1;}else{return B[M];}},useLegacyEvent:function(M,N){return(this.webkit&&this.webkit<419&&("click"==N||"dblclick"==N));},removeListener:function(N,M,V){var Q,T,X;if(typeof N=="string"){N=this.getEl(N);}else{if(this._isValidCollection(N)){var W=true;for(Q=N.length-1;Q>-1;Q--){W=(this.removeListener(N[Q],M,V)&&W);}return W;}}if(!V||!V.call){return this.purgeElement(N,false,M);}if("unload"==M){for(Q=J.length-1;Q>-1;Q--){X=J[Q];if(X&&X[0]==N&&X[1]==M&&X[2]==V){J.splice(Q,1);return true;}}return false;}var R=null;var S=arguments[3];if("undefined"===typeof S){S=this._getCacheIndex(N,M,V);}if(S>=0){R=I[S];}if(!N||!R){return false;}if(this.useLegacyEvent(N,M)){var P=this.getLegacyIndex(N,M);var O=E[P];if(O){for(Q=0,T=O.length;Q<T;++Q){X=O[Q];if(X&&X[this.EL]==N&&X[this.TYPE]==M&&X[this.FN]==V){O.splice(Q,1);break;}}}}else{try{this._simpleRemove(N,M,R[this.WFN],false);}catch(U){this.lastError=U;return false;}}delete I[S][this.WFN];delete I[S][this.FN];
I.splice(S,1);return true;},getTarget:function(O,N){var M=O.target||O.srcElement;return this.resolveTextNode(M);},resolveTextNode:function(N){try{if(N&&3==N.nodeType){return N.parentNode;}}catch(M){}return N;},getPageX:function(N){var M=N.pageX;if(!M&&0!==M){M=N.clientX||0;if(this.isIE){M+=this._getScrollLeft();}}return M;},getPageY:function(M){var N=M.pageY;if(!N&&0!==N){N=M.clientY||0;if(this.isIE){N+=this._getScrollTop();}}return N;},getXY:function(M){return[this.getPageX(M),this.getPageY(M)];},getRelatedTarget:function(N){var M=N.relatedTarget;if(!M){if(N.type=="mouseout"){M=N.toElement;}else{if(N.type=="mouseover"){M=N.fromElement;}}}return this.resolveTextNode(M);},getTime:function(O){if(!O.time){var N=new Date().getTime();try{O.time=N;}catch(M){this.lastError=M;return N;}}return O.time;},stopEvent:function(M){this.stopPropagation(M);this.preventDefault(M);},stopPropagation:function(M){if(M.stopPropagation){M.stopPropagation();}else{M.cancelBubble=true;}},preventDefault:function(M){if(M.preventDefault){M.preventDefault();}else{M.returnValue=false;}},getEvent:function(O,M){var N=O||window.event;if(!N){var P=this.getEvent.caller;while(P){N=P.arguments[0];if(N&&Event==N.constructor){break;}P=P.caller;}}return N;},getCharCode:function(N){var M=N.keyCode||N.charCode||0;if(YAHOO.env.ua.webkit&&(M in D)){M=D[M];}return M;},_getCacheIndex:function(Q,R,P){for(var O=0,N=I.length;O<N;O=O+1){var M=I[O];if(M&&M[this.FN]==P&&M[this.EL]==Q&&M[this.TYPE]==R){return O;}}return -1;},generateId:function(M){var N=M.id;if(!N){N="yuievtautoid-"+A;++A;M.id=N;}return N;},_isValidCollection:function(N){try{return(N&&typeof N!=="string"&&N.length&&!N.tagName&&!N.alert&&typeof N[0]!=="undefined");}catch(M){return false;}},elCache:{},getEl:function(M){return(typeof M==="string")?document.getElementById(M):M;},clearCache:function(){},DOMReadyEvent:new YAHOO.util.CustomEvent("DOMReady",this),_load:function(N){if(!H){H=true;var M=YAHOO.util.Event;M._ready();M._tryPreloadAttach();}},_ready:function(N){var M=YAHOO.util.Event;if(!M.DOMReady){M.DOMReady=true;M.DOMReadyEvent.fire();M._simpleRemove(document,"DOMContentLoaded",M._ready);}},_tryPreloadAttach:function(){if(F.length===0){C=0;if(this._interval){clearInterval(this._interval);this._interval=null;}return;}if(this.locked){return;}if(this.isIE){if(!this.DOMReady){this.startInterval();return;}}this.locked=true;var S=!H;if(!S){S=(C>0&&F.length>0);}var R=[];var T=function(V,W){var U=V;if(W.overrideContext){if(W.overrideContext===true){U=W.obj;}else{U=W.overrideContext;}}W.fn.call(U,W.obj);};var N,M,Q,P,O=[];for(N=0,M=F.length;N<M;N=N+1){Q=F[N];if(Q){P=this.getEl(Q.id);if(P){if(Q.checkReady){if(H||P.nextSibling||!S){O.push(Q);F[N]=null;}}else{T(P,Q);F[N]=null;}}else{R.push(Q);}}}for(N=0,M=O.length;N<M;N=N+1){Q=O[N];T(this.getEl(Q.id),Q);}C--;if(S){for(N=F.length-1;N>-1;N--){Q=F[N];if(!Q||!Q.id){F.splice(N,1);}}this.startInterval();}else{if(this._interval){clearInterval(this._interval);this._interval=null;}}this.locked=false;},purgeElement:function(Q,R,T){var O=(YAHOO.lang.isString(Q))?this.getEl(Q):Q;var S=this.getListeners(O,T),P,M;if(S){for(P=S.length-1;P>-1;P--){var N=S[P];this.removeListener(O,N.type,N.fn);}}if(R&&O&&O.childNodes){for(P=0,M=O.childNodes.length;P<M;++P){this.purgeElement(O.childNodes[P],R,T);}}},getListeners:function(O,M){var R=[],N;if(!M){N=[I,J];}else{if(M==="unload"){N=[J];}else{N=[I];}}var T=(YAHOO.lang.isString(O))?this.getEl(O):O;for(var Q=0;Q<N.length;Q=Q+1){var V=N[Q];if(V){for(var S=0,U=V.length;S<U;++S){var P=V[S];if(P&&P[this.EL]===T&&(!M||M===P[this.TYPE])){R.push({type:P[this.TYPE],fn:P[this.FN],obj:P[this.OBJ],adjust:P[this.OVERRIDE],scope:P[this.ADJ_SCOPE],index:S});}}}}return(R.length)?R:null;},_unload:function(T){var N=YAHOO.util.Event,Q,P,O,S,R,U=J.slice(),M;for(Q=0,S=J.length;Q<S;++Q){O=U[Q];if(O){M=window;if(O[N.ADJ_SCOPE]){if(O[N.ADJ_SCOPE]===true){M=O[N.UNLOAD_OBJ];}else{M=O[N.ADJ_SCOPE];}}O[N.FN].call(M,N.getEvent(T,O[N.EL]),O[N.UNLOAD_OBJ]);U[Q]=null;}}O=null;M=null;J=null;if(I){for(P=I.length-1;P>-1;P--){O=I[P];if(O){N.removeListener(O[N.EL],O[N.TYPE],O[N.FN],P);}}O=null;}G=null;N._simpleRemove(window,"unload",N._unload);},_getScrollLeft:function(){return this._getScroll()[1];},_getScrollTop:function(){return this._getScroll()[0];},_getScroll:function(){var M=document.documentElement,N=document.body;if(M&&(M.scrollTop||M.scrollLeft)){return[M.scrollTop,M.scrollLeft];}else{if(N){return[N.scrollTop,N.scrollLeft];}else{return[0,0];}}},regCE:function(){},_simpleAdd:function(){if(window.addEventListener){return function(O,P,N,M){O.addEventListener(P,N,(M));};}else{if(window.attachEvent){return function(O,P,N,M){O.attachEvent("on"+P,N);};}else{return function(){};}}}(),_simpleRemove:function(){if(window.removeEventListener){return function(O,P,N,M){O.removeEventListener(P,N,(M));};}else{if(window.detachEvent){return function(N,O,M){N.detachEvent("on"+O,M);};}else{return function(){};}}}()};}();(function(){var EU=YAHOO.util.Event;EU.on=EU.addListener;EU.onFocus=EU.addFocusListener;EU.onBlur=EU.addBlurListener;
/* DOMReady: based on work by: Dean Edwards/John Resig/Matthias Miller */
if(EU.isIE){YAHOO.util.Event.onDOMReady(YAHOO.util.Event._tryPreloadAttach,YAHOO.util.Event,true);var n=document.createElement("p");EU._dri=setInterval(function(){try{n.doScroll("left");clearInterval(EU._dri);EU._dri=null;EU._ready();n=null;}catch(ex){}},EU.POLL_INTERVAL);}else{if(EU.webkit&&EU.webkit<525){EU._dri=setInterval(function(){var rs=document.readyState;if("loaded"==rs||"complete"==rs){clearInterval(EU._dri);EU._dri=null;EU._ready();}},EU.POLL_INTERVAL);}else{EU._simpleAdd(document,"DOMContentLoaded",EU._ready);}}EU._simpleAdd(window,"load",EU._load);EU._simpleAdd(window,"unload",EU._unload);EU._tryPreloadAttach();})();}YAHOO.util.EventProvider=function(){};YAHOO.util.EventProvider.prototype={__yui_events:null,__yui_subscribers:null,subscribe:function(A,C,F,E){this.__yui_events=this.__yui_events||{};var D=this.__yui_events[A];if(D){D.subscribe(C,F,E);
}else{this.__yui_subscribers=this.__yui_subscribers||{};var B=this.__yui_subscribers;if(!B[A]){B[A]=[];}B[A].push({fn:C,obj:F,overrideContext:E});}},unsubscribe:function(C,E,G){this.__yui_events=this.__yui_events||{};var A=this.__yui_events;if(C){var F=A[C];if(F){return F.unsubscribe(E,G);}}else{var B=true;for(var D in A){if(YAHOO.lang.hasOwnProperty(A,D)){B=B&&A[D].unsubscribe(E,G);}}return B;}return false;},unsubscribeAll:function(A){return this.unsubscribe(A);},createEvent:function(G,D){this.__yui_events=this.__yui_events||{};var A=D||{};var I=this.__yui_events;if(I[G]){}else{var H=A.scope||this;var E=(A.silent);var B=new YAHOO.util.CustomEvent(G,H,E,YAHOO.util.CustomEvent.FLAT);I[G]=B;if(A.onSubscribeCallback){B.subscribeEvent.subscribe(A.onSubscribeCallback);}this.__yui_subscribers=this.__yui_subscribers||{};var F=this.__yui_subscribers[G];if(F){for(var C=0;C<F.length;++C){B.subscribe(F[C].fn,F[C].obj,F[C].overrideContext);}}}return I[G];},fireEvent:function(E,D,A,C){this.__yui_events=this.__yui_events||{};var G=this.__yui_events[E];if(!G){return null;}var B=[];for(var F=1;F<arguments.length;++F){B.push(arguments[F]);}return G.fire.apply(G,B);},hasEvent:function(A){if(this.__yui_events){if(this.__yui_events[A]){return true;}}return false;}};(function(){var A=YAHOO.util.Event,C=YAHOO.lang;YAHOO.util.KeyListener=function(D,I,E,F){if(!D){}else{if(!I){}else{if(!E){}}}if(!F){F=YAHOO.util.KeyListener.KEYDOWN;}var G=new YAHOO.util.CustomEvent("keyPressed");this.enabledEvent=new YAHOO.util.CustomEvent("enabled");this.disabledEvent=new YAHOO.util.CustomEvent("disabled");if(C.isString(D)){D=document.getElementById(D);}if(C.isFunction(E)){G.subscribe(E);}else{G.subscribe(E.fn,E.scope,E.correctScope);}function H(O,N){if(!I.shift){I.shift=false;}if(!I.alt){I.alt=false;}if(!I.ctrl){I.ctrl=false;}if(O.shiftKey==I.shift&&O.altKey==I.alt&&O.ctrlKey==I.ctrl){var J,M=I.keys,L;if(YAHOO.lang.isArray(M)){for(var K=0;K<M.length;K++){J=M[K];L=A.getCharCode(O);if(J==L){G.fire(L,O);break;}}}else{L=A.getCharCode(O);if(M==L){G.fire(L,O);}}}}this.enable=function(){if(!this.enabled){A.on(D,F,H);this.enabledEvent.fire(I);}this.enabled=true;};this.disable=function(){if(this.enabled){A.removeListener(D,F,H);this.disabledEvent.fire(I);}this.enabled=false;};this.toString=function(){return"KeyListener ["+I.keys+"] "+D.tagName+(D.id?"["+D.id+"]":"");};};var B=YAHOO.util.KeyListener;B.KEYDOWN="keydown";B.KEYUP="keyup";B.KEY={ALT:18,BACK_SPACE:8,CAPS_LOCK:20,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,META:224,NUM_LOCK:144,PAGE_DOWN:34,PAGE_UP:33,PAUSE:19,PRINTSCREEN:44,RIGHT:39,SCROLL_LOCK:145,SHIFT:16,SPACE:32,TAB:9,UP:38};})();YAHOO.register("event",YAHOO.util.Event,{version:"2.7.0",build:"1796"});YAHOO.register("yahoo-dom-event", YAHOO, {version: "2.7.0", build: "1796"});
/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
YAHOO.util.Attribute=function(B,A){if(A){this.owner=A;this.configure(B,true);}};YAHOO.util.Attribute.prototype={name:undefined,value:null,owner:null,readOnly:false,writeOnce:false,_initialConfig:null,_written:false,method:null,setter:null,getter:null,validator:null,getValue:function(){var A=this.value;if(this.getter){A=this.getter.call(this.owner,this.name);}return A;},setValue:function(F,B){var E,A=this.owner,C=this.name;var D={type:C,prevValue:this.getValue(),newValue:F};if(this.readOnly||(this.writeOnce&&this._written)){return false;}if(this.validator&&!this.validator.call(A,F)){return false;}if(!B){E=A.fireBeforeChangeEvent(D);if(E===false){return false;}}if(this.setter){F=this.setter.call(A,F,this.name);if(F===undefined){}}if(this.method){this.method.call(A,F,this.name);}this.value=F;this._written=true;D.type=C;if(!B){this.owner.fireChangeEvent(D);}return true;},configure:function(B,C){B=B||{};if(C){this._written=false;}this._initialConfig=this._initialConfig||{};for(var A in B){if(B.hasOwnProperty(A)){this[A]=B[A];if(C){this._initialConfig[A]=B[A];}}}},resetValue:function(){return this.setValue(this._initialConfig.value);},resetConfig:function(){this.configure(this._initialConfig,true);},refresh:function(A){this.setValue(this.value,A);}};(function(){var A=YAHOO.util.Lang;YAHOO.util.AttributeProvider=function(){};YAHOO.util.AttributeProvider.prototype={_configs:null,get:function(C){this._configs=this._configs||{};var B=this._configs[C];if(!B||!this._configs.hasOwnProperty(C)){return null;}return B.getValue();},set:function(D,E,B){this._configs=this._configs||{};var C=this._configs[D];if(!C){return false;}return C.setValue(E,B);},getAttributeKeys:function(){this._configs=this._configs;var C=[],B;for(B in this._configs){if(A.hasOwnProperty(this._configs,B)&&!A.isUndefined(this._configs[B])){C[C.length]=B;}}return C;},setAttributes:function(D,B){for(var C in D){if(A.hasOwnProperty(D,C)){this.set(C,D[C],B);}}},resetValue:function(C,B){this._configs=this._configs||{};if(this._configs[C]){this.set(C,this._configs[C]._initialConfig.value,B);return true;}return false;},refresh:function(E,C){this._configs=this._configs||{};var F=this._configs;E=((A.isString(E))?[E]:E)||this.getAttributeKeys();for(var D=0,B=E.length;D<B;++D){if(F.hasOwnProperty(E[D])){this._configs[E[D]].refresh(C);}}},register:function(B,C){this.setAttributeConfig(B,C);},getAttributeConfig:function(C){this._configs=this._configs||{};var B=this._configs[C]||{};var D={};for(C in B){if(A.hasOwnProperty(B,C)){D[C]=B[C];}}return D;},setAttributeConfig:function(B,C,D){this._configs=this._configs||{};C=C||{};if(!this._configs[B]){C.name=B;this._configs[B]=this.createAttribute(C);}else{this._configs[B].configure(C,D);}},configureAttribute:function(B,C,D){this.setAttributeConfig(B,C,D);},resetAttributeConfig:function(B){this._configs=this._configs||{};this._configs[B].resetConfig();},subscribe:function(B,C){this._events=this._events||{};if(!(B in this._events)){this._events[B]=this.createEvent(B);}YAHOO.util.EventProvider.prototype.subscribe.apply(this,arguments);},on:function(){this.subscribe.apply(this,arguments);},addListener:function(){this.subscribe.apply(this,arguments);},fireBeforeChangeEvent:function(C){var B="before";B+=C.type.charAt(0).toUpperCase()+C.type.substr(1)+"Change";C.type=B;return this.fireEvent(C.type,C);},fireChangeEvent:function(B){B.type+="Change";return this.fireEvent(B.type,B);},createAttribute:function(B){return new YAHOO.util.Attribute(B,this);}};YAHOO.augment(YAHOO.util.AttributeProvider,YAHOO.util.EventProvider);})();(function(){var B=YAHOO.util.Dom,C=YAHOO.util.AttributeProvider;var A=function(D,E){this.init.apply(this,arguments);};A.DOM_EVENTS={"click":true,"dblclick":true,"keydown":true,"keypress":true,"keyup":true,"mousedown":true,"mousemove":true,"mouseout":true,"mouseover":true,"mouseup":true,"focus":true,"blur":true,"submit":true,"change":true};A.prototype={DOM_EVENTS:null,DEFAULT_HTML_SETTER:function(F,D){var E=this.get("element");if(E){E[D]=F;}},DEFAULT_HTML_GETTER:function(D){var E=this.get("element"),F;if(E){F=E[D];}return F;},appendChild:function(D){D=D.get?D.get("element"):D;return this.get("element").appendChild(D);},getElementsByTagName:function(D){return this.get("element").getElementsByTagName(D);},hasChildNodes:function(){return this.get("element").hasChildNodes();},insertBefore:function(D,E){D=D.get?D.get("element"):D;E=(E&&E.get)?E.get("element"):E;return this.get("element").insertBefore(D,E);},removeChild:function(D){D=D.get?D.get("element"):D;return this.get("element").removeChild(D);},replaceChild:function(D,E){D=D.get?D.get("element"):D;E=E.get?E.get("element"):E;return this.get("element").replaceChild(D,E);},initAttributes:function(D){},addListener:function(H,G,I,F){var E=this.get("element")||this.get("id");F=F||this;var D=this;if(!this._events[H]){if(E&&this.DOM_EVENTS[H]){YAHOO.util.Event.addListener(E,H,function(J){if(J.srcElement&&!J.target){J.target=J.srcElement;}D.fireEvent(H,J);},I,F);}this.createEvent(H,this);}return YAHOO.util.EventProvider.prototype.subscribe.apply(this,arguments);},on:function(){return this.addListener.apply(this,arguments);},subscribe:function(){return this.addListener.apply(this,arguments);},removeListener:function(E,D){return this.unsubscribe.apply(this,arguments);},addClass:function(D){B.addClass(this.get("element"),D);},getElementsByClassName:function(E,D){return B.getElementsByClassName(E,D,this.get("element"));},hasClass:function(D){return B.hasClass(this.get("element"),D);},removeClass:function(D){return B.removeClass(this.get("element"),D);},replaceClass:function(E,D){return B.replaceClass(this.get("element"),E,D);},setStyle:function(E,D){return B.setStyle(this.get("element"),E,D);},getStyle:function(D){return B.getStyle(this.get("element"),D);},fireQueue:function(){var E=this._queue;for(var F=0,D=E.length;F<D;++F){this[E[F][0]].apply(this,E[F][1]);}},appendTo:function(E,F){E=(E.get)?E.get("element"):B.get(E);this.fireEvent("beforeAppendTo",{type:"beforeAppendTo",target:E});
F=(F&&F.get)?F.get("element"):B.get(F);var D=this.get("element");if(!D){return false;}if(!E){return false;}if(D.parent!=E){if(F){E.insertBefore(D,F);}else{E.appendChild(D);}}this.fireEvent("appendTo",{type:"appendTo",target:E});return D;},get:function(D){var F=this._configs||{},E=F.element;if(E&&!F[D]&&!YAHOO.lang.isUndefined(E.value[D])){this._setHTMLAttrConfig(D);}return C.prototype.get.call(this,D);},setAttributes:function(J,G){var E={},H=this._configOrder;for(var I=0,D=H.length;I<D;++I){if(J[H[I]]!==undefined){E[H[I]]=true;this.set(H[I],J[H[I]],G);}}for(var F in J){if(J.hasOwnProperty(F)&&!E[F]){this.set(F,J[F],G);}}},set:function(E,G,D){var F=this.get("element");if(!F){this._queue[this._queue.length]=["set",arguments];if(this._configs[E]){this._configs[E].value=G;}return;}if(!this._configs[E]&&!YAHOO.lang.isUndefined(F[E])){this._setHTMLAttrConfig(E);}return C.prototype.set.apply(this,arguments);},setAttributeConfig:function(D,E,F){this._configOrder.push(D);C.prototype.setAttributeConfig.apply(this,arguments);},createEvent:function(E,D){this._events[E]=true;return C.prototype.createEvent.apply(this,arguments);},init:function(E,D){this._initElement(E,D);},destroy:function(){var D=this.get("element");YAHOO.util.Event.purgeElement(D,true);this.unsubscribeAll();if(D&&D.parentNode){D.parentNode.removeChild(D);}this._queue=[];this._events={};this._configs={};this._configOrder=[];},_initElement:function(F,E){this._queue=this._queue||[];this._events=this._events||{};this._configs=this._configs||{};this._configOrder=[];E=E||{};E.element=E.element||F||null;var H=false;var D=A.DOM_EVENTS;this.DOM_EVENTS=this.DOM_EVENTS||{};for(var G in D){if(D.hasOwnProperty(G)){this.DOM_EVENTS[G]=D[G];}}if(typeof E.element==="string"){this._setHTMLAttrConfig("id",{value:E.element});}if(B.get(E.element)){H=true;this._initHTMLElement(E);this._initContent(E);}YAHOO.util.Event.onAvailable(E.element,function(){if(!H){this._initHTMLElement(E);}this.fireEvent("available",{type:"available",target:B.get(E.element)});},this,true);YAHOO.util.Event.onContentReady(E.element,function(){if(!H){this._initContent(E);}this.fireEvent("contentReady",{type:"contentReady",target:B.get(E.element)});},this,true);},_initHTMLElement:function(D){this.setAttributeConfig("element",{value:B.get(D.element),readOnly:true});},_initContent:function(D){this.initAttributes(D);this.setAttributes(D,true);this.fireQueue();},_setHTMLAttrConfig:function(D,F){var E=this.get("element");F=F||{};F.name=D;F.setter=F.setter||this.DEFAULT_HTML_SETTER;F.getter=F.getter||this.DEFAULT_HTML_GETTER;F.value=F.value||E[D];this._configs[D]=new YAHOO.util.Attribute(F,this);}};YAHOO.augment(A,C);YAHOO.util.Element=A;})();YAHOO.register("element",YAHOO.util.Element,{version:"2.7.0",build:"1796"});/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
if(!YAHOO.util.DragDropMgr){YAHOO.util.DragDropMgr=function(){var A=YAHOO.util.Event,B=YAHOO.util.Dom;return{useShim:false,_shimActive:false,_shimState:false,_debugShim:false,_createShim:function(){var C=document.createElement("div");C.id="yui-ddm-shim";if(document.body.firstChild){document.body.insertBefore(C,document.body.firstChild);}else{document.body.appendChild(C);}C.style.display="none";C.style.backgroundColor="red";C.style.position="absolute";C.style.zIndex="99999";B.setStyle(C,"opacity","0");this._shim=C;A.on(C,"mouseup",this.handleMouseUp,this,true);A.on(C,"mousemove",this.handleMouseMove,this,true);A.on(window,"scroll",this._sizeShim,this,true);},_sizeShim:function(){if(this._shimActive){var C=this._shim;C.style.height=B.getDocumentHeight()+"px";C.style.width=B.getDocumentWidth()+"px";C.style.top="0";C.style.left="0";}},_activateShim:function(){if(this.useShim){if(!this._shim){this._createShim();}this._shimActive=true;var C=this._shim,D="0";if(this._debugShim){D=".5";}B.setStyle(C,"opacity",D);this._sizeShim();C.style.display="block";}},_deactivateShim:function(){this._shim.style.display="none";this._shimActive=false;},_shim:null,ids:{},handleIds:{},dragCurrent:null,dragOvers:{},deltaX:0,deltaY:0,preventDefault:true,stopPropagation:true,initialized:false,locked:false,interactionInfo:null,init:function(){this.initialized=true;},POINT:0,INTERSECT:1,STRICT_INTERSECT:2,mode:0,_execOnAll:function(E,D){for(var F in this.ids){for(var C in this.ids[F]){var G=this.ids[F][C];if(!this.isTypeOfDD(G)){continue;}G[E].apply(G,D);}}},_onLoad:function(){this.init();A.on(document,"mouseup",this.handleMouseUp,this,true);A.on(document,"mousemove",this.handleMouseMove,this,true);A.on(window,"unload",this._onUnload,this,true);A.on(window,"resize",this._onResize,this,true);},_onResize:function(C){this._execOnAll("resetConstraints",[]);},lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isLocked:function(){return this.locked;},locationCache:{},useCache:true,clickPixelThresh:3,clickTimeThresh:1000,dragThreshMet:false,clickTimeout:null,startX:0,startY:0,fromTimeout:false,regDragDrop:function(D,C){if(!this.initialized){this.init();}if(!this.ids[C]){this.ids[C]={};}this.ids[C][D.id]=D;},removeDDFromGroup:function(E,C){if(!this.ids[C]){this.ids[C]={};}var D=this.ids[C];if(D&&D[E.id]){delete D[E.id];}},_remove:function(E){for(var D in E.groups){if(D){var C=this.ids[D];if(C&&C[E.id]){delete C[E.id];}}}delete this.handleIds[E.id];},regHandle:function(D,C){if(!this.handleIds[D]){this.handleIds[D]={};}this.handleIds[D][C]=C;},isDragDrop:function(C){return(this.getDDById(C))?true:false;},getRelated:function(H,D){var G=[];for(var F in H.groups){for(var E in this.ids[F]){var C=this.ids[F][E];if(!this.isTypeOfDD(C)){continue;}if(!D||C.isTarget){G[G.length]=C;}}}return G;},isLegalTarget:function(G,F){var D=this.getRelated(G,true);for(var E=0,C=D.length;E<C;++E){if(D[E].id==F.id){return true;}}return false;},isTypeOfDD:function(C){return(C&&C.__ygDragDrop);},isHandle:function(D,C){return(this.handleIds[D]&&this.handleIds[D][C]);},getDDById:function(D){for(var C in this.ids){if(this.ids[C][D]){return this.ids[C][D];}}return null;},handleMouseDown:function(E,D){this.currentTarget=YAHOO.util.Event.getTarget(E);this.dragCurrent=D;var C=D.getEl();this.startX=YAHOO.util.Event.getPageX(E);this.startY=YAHOO.util.Event.getPageY(E);this.deltaX=this.startX-C.offsetLeft;this.deltaY=this.startY-C.offsetTop;this.dragThreshMet=false;this.clickTimeout=setTimeout(function(){var F=YAHOO.util.DDM;F.startDrag(F.startX,F.startY);F.fromTimeout=true;},this.clickTimeThresh);},startDrag:function(C,E){if(this.dragCurrent&&this.dragCurrent.useShim){this._shimState=this.useShim;this.useShim=true;}this._activateShim();clearTimeout(this.clickTimeout);var D=this.dragCurrent;if(D&&D.events.b4StartDrag){D.b4StartDrag(C,E);D.fireEvent("b4StartDragEvent",{x:C,y:E});}if(D&&D.events.startDrag){D.startDrag(C,E);D.fireEvent("startDragEvent",{x:C,y:E});}this.dragThreshMet=true;},handleMouseUp:function(C){if(this.dragCurrent){clearTimeout(this.clickTimeout);if(this.dragThreshMet){if(this.fromTimeout){this.fromTimeout=false;this.handleMouseMove(C);}this.fromTimeout=false;this.fireEvents(C,true);}else{}this.stopDrag(C);this.stopEvent(C);}},stopEvent:function(C){if(this.stopPropagation){YAHOO.util.Event.stopPropagation(C);}if(this.preventDefault){YAHOO.util.Event.preventDefault(C);}},stopDrag:function(E,D){var C=this.dragCurrent;if(C&&!D){if(this.dragThreshMet){if(C.events.b4EndDrag){C.b4EndDrag(E);C.fireEvent("b4EndDragEvent",{e:E});}if(C.events.endDrag){C.endDrag(E);C.fireEvent("endDragEvent",{e:E});}}if(C.events.mouseUp){C.onMouseUp(E);C.fireEvent("mouseUpEvent",{e:E});}}if(this._shimActive){this._deactivateShim();if(this.dragCurrent&&this.dragCurrent.useShim){this.useShim=this._shimState;this._shimState=false;}}this.dragCurrent=null;this.dragOvers={};},handleMouseMove:function(F){var C=this.dragCurrent;if(C){if(YAHOO.util.Event.isIE&&!F.button){this.stopEvent(F);return this.handleMouseUp(F);}else{if(F.clientX<0||F.clientY<0){}}if(!this.dragThreshMet){var E=Math.abs(this.startX-YAHOO.util.Event.getPageX(F));var D=Math.abs(this.startY-YAHOO.util.Event.getPageY(F));if(E>this.clickPixelThresh||D>this.clickPixelThresh){this.startDrag(this.startX,this.startY);}}if(this.dragThreshMet){if(C&&C.events.b4Drag){C.b4Drag(F);C.fireEvent("b4DragEvent",{e:F});}if(C&&C.events.drag){C.onDrag(F);C.fireEvent("dragEvent",{e:F});}if(C){this.fireEvents(F,false);}}this.stopEvent(F);}},fireEvents:function(V,L){var a=this.dragCurrent;if(!a||a.isLocked()||a.dragOnly){return;}var N=YAHOO.util.Event.getPageX(V),M=YAHOO.util.Event.getPageY(V),P=new YAHOO.util.Point(N,M),K=a.getTargetCoord(P.x,P.y),F=a.getDragEl(),E=["out","over","drop","enter"],U=new YAHOO.util.Region(K.y,K.x+F.offsetWidth,K.y+F.offsetHeight,K.x),I=[],D={},Q=[],c={outEvts:[],overEvts:[],dropEvts:[],enterEvts:[]};for(var S in this.dragOvers){var d=this.dragOvers[S];if(!this.isTypeOfDD(d)){continue;
}if(!this.isOverTarget(P,d,this.mode,U)){c.outEvts.push(d);}I[S]=true;delete this.dragOvers[S];}for(var R in a.groups){if("string"!=typeof R){continue;}for(S in this.ids[R]){var G=this.ids[R][S];if(!this.isTypeOfDD(G)){continue;}if(G.isTarget&&!G.isLocked()&&G!=a){if(this.isOverTarget(P,G,this.mode,U)){D[R]=true;if(L){c.dropEvts.push(G);}else{if(!I[G.id]){c.enterEvts.push(G);}else{c.overEvts.push(G);}this.dragOvers[G.id]=G;}}}}}this.interactionInfo={out:c.outEvts,enter:c.enterEvts,over:c.overEvts,drop:c.dropEvts,point:P,draggedRegion:U,sourceRegion:this.locationCache[a.id],validDrop:L};for(var C in D){Q.push(C);}if(L&&!c.dropEvts.length){this.interactionInfo.validDrop=false;if(a.events.invalidDrop){a.onInvalidDrop(V);a.fireEvent("invalidDropEvent",{e:V});}}for(S=0;S<E.length;S++){var Y=null;if(c[E[S]+"Evts"]){Y=c[E[S]+"Evts"];}if(Y&&Y.length){var H=E[S].charAt(0).toUpperCase()+E[S].substr(1),X="onDrag"+H,J="b4Drag"+H,O="drag"+H+"Event",W="drag"+H;if(this.mode){if(a.events[J]){a[J](V,Y,Q);a.fireEvent(J+"Event",{event:V,info:Y,group:Q});}if(a.events[W]){a[X](V,Y,Q);a.fireEvent(O,{event:V,info:Y,group:Q});}}else{for(var Z=0,T=Y.length;Z<T;++Z){if(a.events[J]){a[J](V,Y[Z].id,Q[0]);a.fireEvent(J+"Event",{event:V,info:Y[Z].id,group:Q[0]});}if(a.events[W]){a[X](V,Y[Z].id,Q[0]);a.fireEvent(O,{event:V,info:Y[Z].id,group:Q[0]});}}}}}},getBestMatch:function(E){var G=null;var D=E.length;if(D==1){G=E[0];}else{for(var F=0;F<D;++F){var C=E[F];if(this.mode==this.INTERSECT&&C.cursorIsOver){G=C;break;}else{if(!G||!G.overlap||(C.overlap&&G.overlap.getArea()<C.overlap.getArea())){G=C;}}}}return G;},refreshCache:function(D){var F=D||this.ids;for(var C in F){if("string"!=typeof C){continue;}for(var E in this.ids[C]){var G=this.ids[C][E];if(this.isTypeOfDD(G)){var H=this.getLocation(G);if(H){this.locationCache[G.id]=H;}else{delete this.locationCache[G.id];}}}}},verifyEl:function(D){try{if(D){var C=D.offsetParent;if(C){return true;}}}catch(E){}return false;},getLocation:function(H){if(!this.isTypeOfDD(H)){return null;}var F=H.getEl(),K,E,D,M,L,N,C,J,G;try{K=YAHOO.util.Dom.getXY(F);}catch(I){}if(!K){return null;}E=K[0];D=E+F.offsetWidth;M=K[1];L=M+F.offsetHeight;N=M-H.padding[0];C=D+H.padding[1];J=L+H.padding[2];G=E-H.padding[3];return new YAHOO.util.Region(N,C,J,G);},isOverTarget:function(K,C,E,F){var G=this.locationCache[C.id];if(!G||!this.useCache){G=this.getLocation(C);this.locationCache[C.id]=G;}if(!G){return false;}C.cursorIsOver=G.contains(K);var J=this.dragCurrent;if(!J||(!E&&!J.constrainX&&!J.constrainY)){return C.cursorIsOver;}C.overlap=null;if(!F){var H=J.getTargetCoord(K.x,K.y);var D=J.getDragEl();F=new YAHOO.util.Region(H.y,H.x+D.offsetWidth,H.y+D.offsetHeight,H.x);}var I=F.intersect(G);if(I){C.overlap=I;return(E)?true:C.cursorIsOver;}else{return false;}},_onUnload:function(D,C){this.unregAll();},unregAll:function(){if(this.dragCurrent){this.stopDrag();this.dragCurrent=null;}this._execOnAll("unreg",[]);this.ids={};},elementCache:{},getElWrapper:function(D){var C=this.elementCache[D];if(!C||!C.el){C=this.elementCache[D]=new this.ElementWrapper(YAHOO.util.Dom.get(D));}return C;},getElement:function(C){return YAHOO.util.Dom.get(C);},getCss:function(D){var C=YAHOO.util.Dom.get(D);return(C)?C.style:null;},ElementWrapper:function(C){this.el=C||null;this.id=this.el&&C.id;this.css=this.el&&C.style;},getPosX:function(C){return YAHOO.util.Dom.getX(C);},getPosY:function(C){return YAHOO.util.Dom.getY(C);},swapNode:function(E,C){if(E.swapNode){E.swapNode(C);}else{var F=C.parentNode;var D=C.nextSibling;if(D==E){F.insertBefore(E,C);}else{if(C==E.nextSibling){F.insertBefore(C,E);}else{E.parentNode.replaceChild(C,E);F.insertBefore(E,D);}}}},getScroll:function(){var E,C,F=document.documentElement,D=document.body;if(F&&(F.scrollTop||F.scrollLeft)){E=F.scrollTop;C=F.scrollLeft;}else{if(D){E=D.scrollTop;C=D.scrollLeft;}else{}}return{top:E,left:C};},getStyle:function(D,C){return YAHOO.util.Dom.getStyle(D,C);},getScrollTop:function(){return this.getScroll().top;},getScrollLeft:function(){return this.getScroll().left;},moveToEl:function(C,E){var D=YAHOO.util.Dom.getXY(E);YAHOO.util.Dom.setXY(C,D);},getClientHeight:function(){return YAHOO.util.Dom.getViewportHeight();},getClientWidth:function(){return YAHOO.util.Dom.getViewportWidth();},numericSort:function(D,C){return(D-C);},_timeoutCount:0,_addListeners:function(){var C=YAHOO.util.DDM;if(YAHOO.util.Event&&document){C._onLoad();}else{if(C._timeoutCount>2000){}else{setTimeout(C._addListeners,10);if(document&&document.body){C._timeoutCount+=1;}}}},handleWasClicked:function(C,E){if(this.isHandle(E,C.id)){return true;}else{var D=C.parentNode;while(D){if(this.isHandle(E,D.id)){return true;}else{D=D.parentNode;}}}return false;}};}();YAHOO.util.DDM=YAHOO.util.DragDropMgr;YAHOO.util.DDM._addListeners();}(function(){var A=YAHOO.util.Event;var B=YAHOO.util.Dom;YAHOO.util.DragDrop=function(E,C,D){if(E){this.init(E,C,D);}};YAHOO.util.DragDrop.prototype={events:null,on:function(){this.subscribe.apply(this,arguments);},id:null,config:null,dragElId:null,handleElId:null,invalidHandleTypes:null,invalidHandleIds:null,invalidHandleClasses:null,startPageX:0,startPageY:0,groups:null,locked:false,lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isTarget:true,padding:null,dragOnly:false,useShim:false,_domRef:null,__ygDragDrop:true,constrainX:false,constrainY:false,minX:0,maxX:0,minY:0,maxY:0,deltaX:0,deltaY:0,maintainOffset:false,xTicks:null,yTicks:null,primaryButtonOnly:true,available:false,hasOuterHandles:false,cursorIsOver:false,overlap:null,b4StartDrag:function(C,D){},startDrag:function(C,D){},b4Drag:function(C){},onDrag:function(C){},onDragEnter:function(C,D){},b4DragOver:function(C){},onDragOver:function(C,D){},b4DragOut:function(C){},onDragOut:function(C,D){},b4DragDrop:function(C){},onDragDrop:function(C,D){},onInvalidDrop:function(C){},b4EndDrag:function(C){},endDrag:function(C){},b4MouseDown:function(C){},onMouseDown:function(C){},onMouseUp:function(C){},onAvailable:function(){},getEl:function(){if(!this._domRef){this._domRef=B.get(this.id);
}return this._domRef;},getDragEl:function(){return B.get(this.dragElId);},init:function(F,C,D){this.initTarget(F,C,D);A.on(this._domRef||this.id,"mousedown",this.handleMouseDown,this,true);for(var E in this.events){this.createEvent(E+"Event");}},initTarget:function(E,C,D){this.config=D||{};this.events={};this.DDM=YAHOO.util.DDM;this.groups={};if(typeof E!=="string"){this._domRef=E;E=B.generateId(E);}this.id=E;this.addToGroup((C)?C:"default");this.handleElId=E;A.onAvailable(E,this.handleOnAvailable,this,true);this.setDragElId(E);this.invalidHandleTypes={A:"A"};this.invalidHandleIds={};this.invalidHandleClasses=[];this.applyConfig();},applyConfig:function(){this.events={mouseDown:true,b4MouseDown:true,mouseUp:true,b4StartDrag:true,startDrag:true,b4EndDrag:true,endDrag:true,drag:true,b4Drag:true,invalidDrop:true,b4DragOut:true,dragOut:true,dragEnter:true,b4DragOver:true,dragOver:true,b4DragDrop:true,dragDrop:true};if(this.config.events){for(var C in this.config.events){if(this.config.events[C]===false){this.events[C]=false;}}}this.padding=this.config.padding||[0,0,0,0];this.isTarget=(this.config.isTarget!==false);this.maintainOffset=(this.config.maintainOffset);this.primaryButtonOnly=(this.config.primaryButtonOnly!==false);this.dragOnly=((this.config.dragOnly===true)?true:false);this.useShim=((this.config.useShim===true)?true:false);},handleOnAvailable:function(){this.available=true;this.resetConstraints();this.onAvailable();},setPadding:function(E,C,F,D){if(!C&&0!==C){this.padding=[E,E,E,E];}else{if(!F&&0!==F){this.padding=[E,C,E,C];}else{this.padding=[E,C,F,D];}}},setInitPosition:function(F,E){var G=this.getEl();if(!this.DDM.verifyEl(G)){if(G&&G.style&&(G.style.display=="none")){}else{}return;}var D=F||0;var C=E||0;var H=B.getXY(G);this.initPageX=H[0]-D;this.initPageY=H[1]-C;this.lastPageX=H[0];this.lastPageY=H[1];this.setStartPosition(H);},setStartPosition:function(D){var C=D||B.getXY(this.getEl());this.deltaSetXY=null;this.startPageX=C[0];this.startPageY=C[1];},addToGroup:function(C){this.groups[C]=true;this.DDM.regDragDrop(this,C);},removeFromGroup:function(C){if(this.groups[C]){delete this.groups[C];}this.DDM.removeDDFromGroup(this,C);},setDragElId:function(C){this.dragElId=C;},setHandleElId:function(C){if(typeof C!=="string"){C=B.generateId(C);}this.handleElId=C;this.DDM.regHandle(this.id,C);},setOuterHandleElId:function(C){if(typeof C!=="string"){C=B.generateId(C);}A.on(C,"mousedown",this.handleMouseDown,this,true);this.setHandleElId(C);this.hasOuterHandles=true;},unreg:function(){A.removeListener(this.id,"mousedown",this.handleMouseDown);this._domRef=null;this.DDM._remove(this);},isLocked:function(){return(this.DDM.isLocked()||this.locked);},handleMouseDown:function(J,I){var D=J.which||J.button;if(this.primaryButtonOnly&&D>1){return;}if(this.isLocked()){return;}var C=this.b4MouseDown(J),F=true;if(this.events.b4MouseDown){F=this.fireEvent("b4MouseDownEvent",J);}var E=this.onMouseDown(J),H=true;if(this.events.mouseDown){H=this.fireEvent("mouseDownEvent",J);}if((C===false)||(E===false)||(F===false)||(H===false)){return;}this.DDM.refreshCache(this.groups);var G=new YAHOO.util.Point(A.getPageX(J),A.getPageY(J));if(!this.hasOuterHandles&&!this.DDM.isOverTarget(G,this)){}else{if(this.clickValidator(J)){this.setStartPosition();this.DDM.handleMouseDown(J,this);this.DDM.stopEvent(J);}else{}}},clickValidator:function(D){var C=YAHOO.util.Event.getTarget(D);return(this.isValidHandleChild(C)&&(this.id==this.handleElId||this.DDM.handleWasClicked(C,this.id)));},getTargetCoord:function(E,D){var C=E-this.deltaX;var F=D-this.deltaY;if(this.constrainX){if(C<this.minX){C=this.minX;}if(C>this.maxX){C=this.maxX;}}if(this.constrainY){if(F<this.minY){F=this.minY;}if(F>this.maxY){F=this.maxY;}}C=this.getTick(C,this.xTicks);F=this.getTick(F,this.yTicks);return{x:C,y:F};},addInvalidHandleType:function(C){var D=C.toUpperCase();this.invalidHandleTypes[D]=D;},addInvalidHandleId:function(C){if(typeof C!=="string"){C=B.generateId(C);}this.invalidHandleIds[C]=C;},addInvalidHandleClass:function(C){this.invalidHandleClasses.push(C);},removeInvalidHandleType:function(C){var D=C.toUpperCase();delete this.invalidHandleTypes[D];},removeInvalidHandleId:function(C){if(typeof C!=="string"){C=B.generateId(C);}delete this.invalidHandleIds[C];},removeInvalidHandleClass:function(D){for(var E=0,C=this.invalidHandleClasses.length;E<C;++E){if(this.invalidHandleClasses[E]==D){delete this.invalidHandleClasses[E];}}},isValidHandleChild:function(F){var E=true;var H;try{H=F.nodeName.toUpperCase();}catch(G){H=F.nodeName;}E=E&&!this.invalidHandleTypes[H];E=E&&!this.invalidHandleIds[F.id];for(var D=0,C=this.invalidHandleClasses.length;E&&D<C;++D){E=!B.hasClass(F,this.invalidHandleClasses[D]);}return E;},setXTicks:function(F,C){this.xTicks=[];this.xTickSize=C;var E={};for(var D=this.initPageX;D>=this.minX;D=D-C){if(!E[D]){this.xTicks[this.xTicks.length]=D;E[D]=true;}}for(D=this.initPageX;D<=this.maxX;D=D+C){if(!E[D]){this.xTicks[this.xTicks.length]=D;E[D]=true;}}this.xTicks.sort(this.DDM.numericSort);},setYTicks:function(F,C){this.yTicks=[];this.yTickSize=C;var E={};for(var D=this.initPageY;D>=this.minY;D=D-C){if(!E[D]){this.yTicks[this.yTicks.length]=D;E[D]=true;}}for(D=this.initPageY;D<=this.maxY;D=D+C){if(!E[D]){this.yTicks[this.yTicks.length]=D;E[D]=true;}}this.yTicks.sort(this.DDM.numericSort);},setXConstraint:function(E,D,C){this.leftConstraint=parseInt(E,10);this.rightConstraint=parseInt(D,10);this.minX=this.initPageX-this.leftConstraint;this.maxX=this.initPageX+this.rightConstraint;if(C){this.setXTicks(this.initPageX,C);}this.constrainX=true;},clearConstraints:function(){this.constrainX=false;this.constrainY=false;this.clearTicks();},clearTicks:function(){this.xTicks=null;this.yTicks=null;this.xTickSize=0;this.yTickSize=0;},setYConstraint:function(C,E,D){this.topConstraint=parseInt(C,10);this.bottomConstraint=parseInt(E,10);this.minY=this.initPageY-this.topConstraint;this.maxY=this.initPageY+this.bottomConstraint;if(D){this.setYTicks(this.initPageY,D);
}this.constrainY=true;},resetConstraints:function(){if(this.initPageX||this.initPageX===0){var D=(this.maintainOffset)?this.lastPageX-this.initPageX:0;var C=(this.maintainOffset)?this.lastPageY-this.initPageY:0;this.setInitPosition(D,C);}else{this.setInitPosition();}if(this.constrainX){this.setXConstraint(this.leftConstraint,this.rightConstraint,this.xTickSize);}if(this.constrainY){this.setYConstraint(this.topConstraint,this.bottomConstraint,this.yTickSize);}},getTick:function(I,F){if(!F){return I;}else{if(F[0]>=I){return F[0];}else{for(var D=0,C=F.length;D<C;++D){var E=D+1;if(F[E]&&F[E]>=I){var H=I-F[D];var G=F[E]-I;return(G>H)?F[D]:F[E];}}return F[F.length-1];}}},toString:function(){return("DragDrop "+this.id);}};YAHOO.augment(YAHOO.util.DragDrop,YAHOO.util.EventProvider);})();YAHOO.util.DD=function(C,A,B){if(C){this.init(C,A,B);}};YAHOO.extend(YAHOO.util.DD,YAHOO.util.DragDrop,{scroll:true,autoOffset:function(C,B){var A=C-this.startPageX;var D=B-this.startPageY;this.setDelta(A,D);},setDelta:function(B,A){this.deltaX=B;this.deltaY=A;},setDragElPos:function(C,B){var A=this.getDragEl();this.alignElWithMouse(A,C,B);},alignElWithMouse:function(C,G,F){var E=this.getTargetCoord(G,F);if(!this.deltaSetXY){var H=[E.x,E.y];YAHOO.util.Dom.setXY(C,H);var D=parseInt(YAHOO.util.Dom.getStyle(C,"left"),10);var B=parseInt(YAHOO.util.Dom.getStyle(C,"top"),10);this.deltaSetXY=[D-E.x,B-E.y];}else{YAHOO.util.Dom.setStyle(C,"left",(E.x+this.deltaSetXY[0])+"px");YAHOO.util.Dom.setStyle(C,"top",(E.y+this.deltaSetXY[1])+"px");}this.cachePosition(E.x,E.y);var A=this;setTimeout(function(){A.autoScroll.call(A,E.x,E.y,C.offsetHeight,C.offsetWidth);},0);},cachePosition:function(B,A){if(B){this.lastPageX=B;this.lastPageY=A;}else{var C=YAHOO.util.Dom.getXY(this.getEl());this.lastPageX=C[0];this.lastPageY=C[1];}},autoScroll:function(J,I,E,K){if(this.scroll){var L=this.DDM.getClientHeight();var B=this.DDM.getClientWidth();var N=this.DDM.getScrollTop();var D=this.DDM.getScrollLeft();var H=E+I;var M=K+J;var G=(L+N-I-this.deltaY);var F=(B+D-J-this.deltaX);var C=40;var A=(document.all)?80:30;if(H>L&&G<C){window.scrollTo(D,N+A);}if(I<N&&N>0&&I-N<C){window.scrollTo(D,N-A);}if(M>B&&F<C){window.scrollTo(D+A,N);}if(J<D&&D>0&&J-D<C){window.scrollTo(D-A,N);}}},applyConfig:function(){YAHOO.util.DD.superclass.applyConfig.call(this);this.scroll=(this.config.scroll!==false);},b4MouseDown:function(A){this.setStartPosition();this.autoOffset(YAHOO.util.Event.getPageX(A),YAHOO.util.Event.getPageY(A));},b4Drag:function(A){this.setDragElPos(YAHOO.util.Event.getPageX(A),YAHOO.util.Event.getPageY(A));},toString:function(){return("DD "+this.id);}});YAHOO.util.DDProxy=function(C,A,B){if(C){this.init(C,A,B);this.initFrame();}};YAHOO.util.DDProxy.dragElId="ygddfdiv";YAHOO.extend(YAHOO.util.DDProxy,YAHOO.util.DD,{resizeFrame:true,centerFrame:false,createFrame:function(){var B=this,A=document.body;if(!A||!A.firstChild){setTimeout(function(){B.createFrame();},50);return;}var F=this.getDragEl(),E=YAHOO.util.Dom;if(!F){F=document.createElement("div");F.id=this.dragElId;var D=F.style;D.position="absolute";D.visibility="hidden";D.cursor="move";D.border="2px solid #aaa";D.zIndex=999;D.height="25px";D.width="25px";var C=document.createElement("div");E.setStyle(C,"height","100%");E.setStyle(C,"width","100%");E.setStyle(C,"background-color","#ccc");E.setStyle(C,"opacity","0");F.appendChild(C);A.insertBefore(F,A.firstChild);}},initFrame:function(){this.createFrame();},applyConfig:function(){YAHOO.util.DDProxy.superclass.applyConfig.call(this);this.resizeFrame=(this.config.resizeFrame!==false);this.centerFrame=(this.config.centerFrame);this.setDragElId(this.config.dragElId||YAHOO.util.DDProxy.dragElId);},showFrame:function(E,D){var C=this.getEl();var A=this.getDragEl();var B=A.style;this._resizeProxy();if(this.centerFrame){this.setDelta(Math.round(parseInt(B.width,10)/2),Math.round(parseInt(B.height,10)/2));}this.setDragElPos(E,D);YAHOO.util.Dom.setStyle(A,"visibility","visible");},_resizeProxy:function(){if(this.resizeFrame){var H=YAHOO.util.Dom;var B=this.getEl();var C=this.getDragEl();var G=parseInt(H.getStyle(C,"borderTopWidth"),10);var I=parseInt(H.getStyle(C,"borderRightWidth"),10);var F=parseInt(H.getStyle(C,"borderBottomWidth"),10);var D=parseInt(H.getStyle(C,"borderLeftWidth"),10);if(isNaN(G)){G=0;}if(isNaN(I)){I=0;}if(isNaN(F)){F=0;}if(isNaN(D)){D=0;}var E=Math.max(0,B.offsetWidth-I-D);var A=Math.max(0,B.offsetHeight-G-F);H.setStyle(C,"width",E+"px");H.setStyle(C,"height",A+"px");}},b4MouseDown:function(B){this.setStartPosition();var A=YAHOO.util.Event.getPageX(B);var C=YAHOO.util.Event.getPageY(B);this.autoOffset(A,C);},b4StartDrag:function(A,B){this.showFrame(A,B);},b4EndDrag:function(A){YAHOO.util.Dom.setStyle(this.getDragEl(),"visibility","hidden");},endDrag:function(D){var C=YAHOO.util.Dom;var B=this.getEl();var A=this.getDragEl();C.setStyle(A,"visibility","");C.setStyle(B,"visibility","hidden");YAHOO.util.DDM.moveToEl(B,A);C.setStyle(A,"visibility","hidden");C.setStyle(B,"visibility","");},toString:function(){return("DDProxy "+this.id);}});YAHOO.util.DDTarget=function(C,A,B){if(C){this.initTarget(C,A,B);}};YAHOO.extend(YAHOO.util.DDTarget,YAHOO.util.DragDrop,{toString:function(){return("DDTarget "+this.id);}});YAHOO.register("dragdrop",YAHOO.util.DragDropMgr,{version:"2.7.0",build:"1796"});/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
(function(){var E=YAHOO.util.Dom,A=YAHOO.util.Event,C=YAHOO.lang;var B=function(F,D){var G={element:F,attributes:D||{}};B.superclass.constructor.call(this,G.element,G.attributes);};B._instances={};B.getResizeById=function(D){if(B._instances[D]){return B._instances[D];}return false;};YAHOO.extend(B,YAHOO.util.Element,{CSS_RESIZE:"yui-resize",CSS_DRAG:"yui-draggable",CSS_HOVER:"yui-resize-hover",CSS_PROXY:"yui-resize-proxy",CSS_WRAP:"yui-resize-wrap",CSS_KNOB:"yui-resize-knob",CSS_HIDDEN:"yui-resize-hidden",CSS_HANDLE:"yui-resize-handle",CSS_STATUS:"yui-resize-status",CSS_GHOST:"yui-resize-ghost",CSS_RESIZING:"yui-resize-resizing",_resizeEvent:null,dd:null,browser:YAHOO.env.ua,_locked:null,_positioned:null,_dds:null,_wrap:null,_proxy:null,_handles:null,_currentHandle:null,_currentDD:null,_cache:null,_active:null,_createProxy:function(){if(this.get("proxy")){this._proxy=document.createElement("div");this._proxy.className=this.CSS_PROXY;this._proxy.style.height=this.get("element").clientHeight+"px";this._proxy.style.width=this.get("element").clientWidth+"px";this._wrap.parentNode.appendChild(this._proxy);}else{this.set("animate",false);}},_createWrap:function(){this._positioned=false;if(this.get("wrap")===false){switch(this.get("element").tagName.toLowerCase()){case"img":case"textarea":case"input":case"iframe":case"select":this.set("wrap",true);break;}}if(this.get("wrap")===true){this._wrap=document.createElement("div");this._wrap.id=this.get("element").id+"_wrap";this._wrap.className=this.CSS_WRAP;if(this.get("element").tagName.toLowerCase()=="textarea"){E.addClass(this._wrap,"yui-resize-textarea");}E.setStyle(this._wrap,"width",this.get("width")+"px");E.setStyle(this._wrap,"height",this.get("height")+"px");E.setStyle(this._wrap,"z-index",this.getStyle("z-index"));this.setStyle("z-index",0);var F=E.getStyle(this.get("element"),"position");E.setStyle(this._wrap,"position",((F=="static")?"relative":F));E.setStyle(this._wrap,"top",E.getStyle(this.get("element"),"top"));E.setStyle(this._wrap,"left",E.getStyle(this.get("element"),"left"));if(E.getStyle(this.get("element"),"position")=="absolute"){this._positioned=true;E.setStyle(this.get("element"),"position","relative");E.setStyle(this.get("element"),"top","0");E.setStyle(this.get("element"),"left","0");}var D=this.get("element").parentNode;D.replaceChild(this._wrap,this.get("element"));this._wrap.appendChild(this.get("element"));}else{this._wrap=this.get("element");if(E.getStyle(this._wrap,"position")=="absolute"){this._positioned=true;}}if(this.get("draggable")){this._setupDragDrop();}if(this.get("hover")){E.addClass(this._wrap,this.CSS_HOVER);}if(this.get("knobHandles")){E.addClass(this._wrap,this.CSS_KNOB);}if(this.get("hiddenHandles")){E.addClass(this._wrap,this.CSS_HIDDEN);}E.addClass(this._wrap,this.CSS_RESIZE);},_setupDragDrop:function(){E.addClass(this._wrap,this.CSS_DRAG);this.dd=new YAHOO.util.DD(this._wrap,this.get("id")+"-resize",{dragOnly:true,useShim:this.get("useShim")});this.dd.on("dragEvent",function(){this.fireEvent("dragEvent",arguments);},this,true);},_createHandles:function(){this._handles={};this._dds={};var G=this.get("handles");for(var F=0;F<G.length;F++){this._handles[G[F]]=document.createElement("div");this._handles[G[F]].id=E.generateId(this._handles[G[F]]);this._handles[G[F]].className=this.CSS_HANDLE+" "+this.CSS_HANDLE+"-"+G[F];var D=document.createElement("div");D.className=this.CSS_HANDLE+"-inner-"+G[F];this._handles[G[F]].appendChild(D);this._wrap.appendChild(this._handles[G[F]]);A.on(this._handles[G[F]],"mouseover",this._handleMouseOver,this,true);A.on(this._handles[G[F]],"mouseout",this._handleMouseOut,this,true);this._dds[G[F]]=new YAHOO.util.DragDrop(this._handles[G[F]],this.get("id")+"-handle-"+G,{useShim:this.get("useShim")});this._dds[G[F]].setPadding(15,15,15,15);this._dds[G[F]].on("startDragEvent",this._handleStartDrag,this._dds[G[F]],this);this._dds[G[F]].on("mouseDownEvent",this._handleMouseDown,this._dds[G[F]],this);}this._status=document.createElement("span");this._status.className=this.CSS_STATUS;document.body.insertBefore(this._status,document.body.firstChild);},_ieSelectFix:function(){return false;},_ieSelectBack:null,_setAutoRatio:function(D){if(this.get("autoRatio")){if(D&&D.shiftKey){this.set("ratio",true);}else{this.set("ratio",this._configs.ratio._initialConfig.value);}}},_handleMouseDown:function(D){if(this._locked){return false;}if(E.getStyle(this._wrap,"position")=="absolute"){this._positioned=true;}if(D){this._setAutoRatio(D);}if(this.browser.ie){this._ieSelectBack=document.body.onselectstart;document.body.onselectstart=this._ieSelectFix;}},_handleMouseOver:function(G){if(this._locked){return false;}E.removeClass(this._wrap,this.CSS_RESIZE);if(this.get("hover")){E.removeClass(this._wrap,this.CSS_HOVER);}var D=A.getTarget(G);if(!E.hasClass(D,this.CSS_HANDLE)){D=D.parentNode;}if(E.hasClass(D,this.CSS_HANDLE)&&!this._active){E.addClass(D,this.CSS_HANDLE+"-active");for(var F in this._handles){if(C.hasOwnProperty(this._handles,F)){if(this._handles[F]==D){E.addClass(D,this.CSS_HANDLE+"-"+F+"-active");break;}}}}E.addClass(this._wrap,this.CSS_RESIZE);},_handleMouseOut:function(G){E.removeClass(this._wrap,this.CSS_RESIZE);if(this.get("hover")&&!this._active){E.addClass(this._wrap,this.CSS_HOVER);}var D=A.getTarget(G);if(!E.hasClass(D,this.CSS_HANDLE)){D=D.parentNode;}if(E.hasClass(D,this.CSS_HANDLE)&&!this._active){E.removeClass(D,this.CSS_HANDLE+"-active");for(var F in this._handles){if(C.hasOwnProperty(this._handles,F)){if(this._handles[F]==D){E.removeClass(D,this.CSS_HANDLE+"-"+F+"-active");break;}}}}E.addClass(this._wrap,this.CSS_RESIZE);},_handleStartDrag:function(G,F){var D=F.getDragEl();if(E.hasClass(D,this.CSS_HANDLE)){if(E.getStyle(this._wrap,"position")=="absolute"){this._positioned=true;}this._active=true;this._currentDD=F;if(this._proxy){this._proxy.style.visibility="visible";this._proxy.style.zIndex="1000";this._proxy.style.height=this.get("element").clientHeight+"px";this._proxy.style.width=this.get("element").clientWidth+"px";
}for(var H in this._handles){if(C.hasOwnProperty(this._handles,H)){if(this._handles[H]==D){this._currentHandle=H;var I="_handle_for_"+H;E.addClass(D,this.CSS_HANDLE+"-"+H+"-active");F.on("dragEvent",this[I],this,true);F.on("mouseUpEvent",this._handleMouseUp,this,true);break;}}}E.addClass(D,this.CSS_HANDLE+"-active");if(this.get("proxy")){var J=E.getXY(this.get("element"));E.setXY(this._proxy,J);if(this.get("ghost")){this.addClass(this.CSS_GHOST);}}E.addClass(this._wrap,this.CSS_RESIZING);this._setCache();this._updateStatus(this._cache.height,this._cache.width,this._cache.top,this._cache.left);this.fireEvent("startResize",{type:"startresize",target:this});}},_setCache:function(){this._cache.xy=E.getXY(this._wrap);E.setXY(this._wrap,this._cache.xy);this._cache.height=this.get("clientHeight");this._cache.width=this.get("clientWidth");this._cache.start.height=this._cache.height;this._cache.start.width=this._cache.width;this._cache.start.top=this._cache.xy[1];this._cache.start.left=this._cache.xy[0];this._cache.top=this._cache.xy[1];this._cache.left=this._cache.xy[0];this.set("height",this._cache.height,true);this.set("width",this._cache.width,true);},_handleMouseUp:function(F){this._active=false;var G="_handle_for_"+this._currentHandle;this._currentDD.unsubscribe("dragEvent",this[G],this,true);this._currentDD.unsubscribe("mouseUpEvent",this._handleMouseUp,this,true);if(this._proxy){this._proxy.style.visibility="hidden";this._proxy.style.zIndex="-1";if(this.get("setSize")){this.resize(F,this._cache.height,this._cache.width,this._cache.top,this._cache.left,true);}else{this.fireEvent("resize",{ev:"resize",target:this,height:this._cache.height,width:this._cache.width,top:this._cache.top,left:this._cache.left});}if(this.get("ghost")){this.removeClass(this.CSS_GHOST);}}if(this.get("hover")){E.addClass(this._wrap,this.CSS_HOVER);}if(this._status){E.setStyle(this._status,"display","none");}if(this.browser.ie){document.body.onselectstart=this._ieSelectBack;}if(this.browser.ie){E.removeClass(this._wrap,this.CSS_RESIZE);}for(var D in this._handles){if(C.hasOwnProperty(this._handles,D)){E.removeClass(this._handles[D],this.CSS_HANDLE+"-active");}}if(this.get("hover")&&!this._active){E.addClass(this._wrap,this.CSS_HOVER);}E.removeClass(this._wrap,this.CSS_RESIZING);E.removeClass(this._handles[this._currentHandle],this.CSS_HANDLE+"-"+this._currentHandle+"-active");E.removeClass(this._handles[this._currentHandle],this.CSS_HANDLE+"-active");if(this.browser.ie){E.addClass(this._wrap,this.CSS_RESIZE);}this._resizeEvent=null;this._currentHandle=null;if(!this.get("animate")){this.set("height",this._cache.height,true);this.set("width",this._cache.width,true);}this.fireEvent("endResize",{ev:"endResize",target:this,height:this._cache.height,width:this._cache.width,top:this._cache.top,left:this._cache.left});},_setRatio:function(K,N,Q,I){var O=K,G=N;if(this.get("ratio")){var P=this._cache.height,H=this._cache.width,F=parseInt(this.get("height"),10),L=parseInt(this.get("width"),10),M=this.get("maxHeight"),R=this.get("minHeight"),D=this.get("maxWidth"),J=this.get("minWidth");switch(this._currentHandle){case"l":K=F*(N/L);K=Math.min(Math.max(R,K),M);N=L*(K/F);Q=(this._cache.start.top-(-((F-K)/2)));I=(this._cache.start.left-(-((L-N))));break;case"r":K=F*(N/L);K=Math.min(Math.max(R,K),M);N=L*(K/F);Q=(this._cache.start.top-(-((F-K)/2)));break;case"t":N=L*(K/F);K=F*(N/L);I=(this._cache.start.left-(-((L-N)/2)));Q=(this._cache.start.top-(-((F-K))));break;case"b":N=L*(K/F);K=F*(N/L);I=(this._cache.start.left-(-((L-N)/2)));break;case"bl":K=F*(N/L);N=L*(K/F);I=(this._cache.start.left-(-((L-N))));break;case"br":K=F*(N/L);N=L*(K/F);break;case"tl":K=F*(N/L);N=L*(K/F);I=(this._cache.start.left-(-((L-N))));Q=(this._cache.start.top-(-((F-K))));break;case"tr":K=F*(N/L);N=L*(K/F);I=(this._cache.start.left);Q=(this._cache.start.top-(-((F-K))));break;}O=this._checkHeight(K);G=this._checkWidth(N);if((O!=K)||(G!=N)){Q=0;I=0;if(O!=K){G=this._cache.width;}if(G!=N){O=this._cache.height;}}}return[O,G,Q,I];},_updateStatus:function(K,G,J,F){if(this._resizeEvent&&(!C.isString(this._resizeEvent))){K=((K===0)?this._cache.start.height:K);G=((G===0)?this._cache.start.width:G);var I=parseInt(this.get("height"),10),D=parseInt(this.get("width"),10);if(isNaN(I)){I=parseInt(K,10);}if(isNaN(D)){D=parseInt(G,10);}var L=(parseInt(K,10)-I);var H=(parseInt(G,10)-D);this._cache.offsetHeight=L;this._cache.offsetWidth=H;if(this.get("status")){E.setStyle(this._status,"display","inline");this._status.innerHTML="<strong>"+parseInt(K,10)+" x "+parseInt(G,10)+"</strong><em>"+((L>0)?"+":"")+L+" x "+((H>0)?"+":"")+H+"</em>";E.setXY(this._status,[A.getPageX(this._resizeEvent)+12,A.getPageY(this._resizeEvent)+12]);}}},lock:function(D){this._locked=true;if(D&&this.dd){E.removeClass(this._wrap,"yui-draggable");this.dd.lock();}return this;},unlock:function(D){this._locked=false;if(D&&this.dd){E.addClass(this._wrap,"yui-draggable");this.dd.unlock();}return this;},isLocked:function(){return this._locked;},reset:function(){this.resize(null,this._cache.start.height,this._cache.start.width,this._cache.start.top,this._cache.start.left,true);return this;},resize:function(M,J,P,Q,H,F,K){if(this._locked){return false;}this._resizeEvent=M;var G=this._wrap,I=this.get("animate"),O=true;if(this._proxy&&!F){G=this._proxy;I=false;}this._setAutoRatio(M);if(this._positioned){if(this._proxy){Q=this._cache.top-Q;H=this._cache.left-H;}}var L=this._setRatio(J,P,Q,H);J=parseInt(L[0],10);P=parseInt(L[1],10);Q=parseInt(L[2],10);H=parseInt(L[3],10);if(Q==0){Q=E.getY(G);}if(H==0){H=E.getX(G);}if(this._positioned){if(this._proxy&&F){if(!I){G.style.top=this._proxy.style.top;G.style.left=this._proxy.style.left;}else{Q=this._proxy.style.top;H=this._proxy.style.left;}}else{if(!this.get("ratio")&&!this._proxy){Q=this._cache.top+-(Q);H=this._cache.left+-(H);}if(Q){if(this.get("minY")){if(Q<this.get("minY")){Q=this.get("minY");}}if(this.get("maxY")){if(Q>this.get("maxY")){Q=this.get("maxY");}}}if(H){if(this.get("minX")){if(H<this.get("minX")){H=this.get("minX");
}}if(this.get("maxX")){if((H+P)>this.get("maxX")){H=(this.get("maxX")-P);}}}}}if(!K){var N=this.fireEvent("beforeResize",{ev:"beforeResize",target:this,height:J,width:P,top:Q,left:H});if(N===false){return false;}}this._updateStatus(J,P,Q,H);if(this._positioned){if(this._proxy&&F){}else{if(Q){E.setY(G,Q);this._cache.top=Q;}if(H){E.setX(G,H);this._cache.left=H;}}}if(J){if(!I){O=true;if(this._proxy&&F){if(!this.get("setSize")){O=false;}}if(O){G.style.height=J+"px";}if((this._proxy&&F)||!this._proxy){if(this._wrap!=this.get("element")){this.get("element").style.height=J+"px";}}}this._cache.height=J;}if(P){this._cache.width=P;if(!I){O=true;if(this._proxy&&F){if(!this.get("setSize")){O=false;}}if(O){G.style.width=P+"px";}if((this._proxy&&F)||!this._proxy){if(this._wrap!=this.get("element")){this.get("element").style.width=P+"px";}}}}if(I){if(YAHOO.util.Anim){var D=new YAHOO.util.Anim(G,{height:{to:this._cache.height},width:{to:this._cache.width}},this.get("animateDuration"),this.get("animateEasing"));if(this._positioned){if(Q){D.attributes.top={to:parseInt(Q,10)};}if(H){D.attributes.left={to:parseInt(H,10)};}}if(this._wrap!=this.get("element")){D.onTween.subscribe(function(){this.get("element").style.height=G.style.height;this.get("element").style.width=G.style.width;},this,true);}D.onComplete.subscribe(function(){this.set("height",J);this.set("width",P);this.fireEvent("resize",{ev:"resize",target:this,height:J,width:P,top:Q,left:H});},this,true);D.animate();}}else{if(this._proxy&&!F){this.fireEvent("proxyResize",{ev:"proxyresize",target:this,height:J,width:P,top:Q,left:H});}else{this.fireEvent("resize",{ev:"resize",target:this,height:J,width:P,top:Q,left:H});}}return this;},_handle_for_br:function(F){var G=this._setWidth(F.e);var D=this._setHeight(F.e);this.resize(F.e,D,G,0,0);},_handle_for_bl:function(G){var H=this._setWidth(G.e,true);var F=this._setHeight(G.e);var D=(H-this._cache.width);this.resize(G.e,F,H,0,D);},_handle_for_tl:function(G){var I=this._setWidth(G.e,true);var F=this._setHeight(G.e,true);var H=(F-this._cache.height);var D=(I-this._cache.width);this.resize(G.e,F,I,H,D);},_handle_for_tr:function(F){var H=this._setWidth(F.e);var D=this._setHeight(F.e,true);var G=(D-this._cache.height);this.resize(F.e,D,H,G,0);},_handle_for_r:function(D){this._dds.r.setYConstraint(0,0);var F=this._setWidth(D.e);this.resize(D.e,0,F,0,0);},_handle_for_l:function(F){this._dds.l.setYConstraint(0,0);var G=this._setWidth(F.e,true);var D=(G-this._cache.width);this.resize(F.e,0,G,0,D);},_handle_for_b:function(F){this._dds.b.setXConstraint(0,0);var D=this._setHeight(F.e);this.resize(F.e,D,0,0,0);},_handle_for_t:function(F){this._dds.t.setXConstraint(0,0);var D=this._setHeight(F.e,true);var G=(D-this._cache.height);this.resize(F.e,D,0,G,0);},_setWidth:function(H,J){var I=this._cache.xy[0],G=this._cache.width,D=A.getPageX(H),F=(D-I);if(J){F=(I-D)+parseInt(this.get("width"),10);}F=this._snapTick(F,this.get("xTicks"));F=this._checkWidth(F);return F;},_checkWidth:function(D){if(this.get("minWidth")){if(D<=this.get("minWidth")){D=this.get("minWidth");}}if(this.get("maxWidth")){if(D>=this.get("maxWidth")){D=this.get("maxWidth");}}return D;},_checkHeight:function(D){if(this.get("minHeight")){if(D<=this.get("minHeight")){D=this.get("minHeight");}}if(this.get("maxHeight")){if(D>=this.get("maxHeight")){D=this.get("maxHeight");}}return D;},_setHeight:function(G,I){var H=this._cache.xy[1],F=this._cache.height,J=A.getPageY(G),D=(J-H);if(I){D=(H-J)+parseInt(this.get("height"),10);}D=this._snapTick(D,this.get("yTicks"));D=this._checkHeight(D);return D;},_snapTick:function(G,F){if(!G||!F){return G;}var H=G;var D=G%F;if(D>0){if(D>(F/2)){H=G+(F-D);}else{H=G-D;}}return H;},init:function(H,F){this._locked=false;this._cache={xy:[],height:0,width:0,top:0,left:0,offsetHeight:0,offsetWidth:0,start:{height:0,width:0,top:0,left:0}};B.superclass.init.call(this,H,F);this.set("setSize",this.get("setSize"));if(F.height){this.set("height",parseInt(F.height,10));}else{var G=this.getStyle("height");if(G=="auto"){this.set("height",parseInt(this.get("element").offsetHeight,10));}}if(F.width){this.set("width",parseInt(F.width,10));}else{var D=this.getStyle("width");if(D=="auto"){this.set("width",parseInt(this.get("element").offsetWidth,10));}}var I=H;if(!C.isString(I)){I=E.generateId(I);}B._instances[I]=this;this._active=false;this._createWrap();this._createProxy();this._createHandles();},getProxyEl:function(){return this._proxy;},getWrapEl:function(){return this._wrap;},getStatusEl:function(){return this._status;},getActiveHandleEl:function(){return this._handles[this._currentHandle];},isActive:function(){return((this._active)?true:false);},initAttributes:function(D){B.superclass.initAttributes.call(this,D);this.setAttributeConfig("useShim",{value:((D.useShim===true)?true:false),validator:YAHOO.lang.isBoolean,method:function(F){for(var G in this._dds){if(C.hasOwnProperty(this._dds,G)){this._dds[G].useShim=F;}}if(this.dd){this.dd.useShim=F;}}});this.setAttributeConfig("setSize",{value:((D.setSize===false)?false:true),validator:YAHOO.lang.isBoolean});this.setAttributeConfig("wrap",{writeOnce:true,validator:YAHOO.lang.isBoolean,value:D.wrap||false});this.setAttributeConfig("handles",{writeOnce:true,value:D.handles||["r","b","br"],validator:function(F){if(C.isString(F)&&F.toLowerCase()=="all"){F=["t","b","r","l","bl","br","tl","tr"];}if(!C.isArray(F)){F=F.replace(/, /g,",");F=F.split(",");}this._configs.handles.value=F;}});this.setAttributeConfig("width",{value:D.width||parseInt(this.getStyle("width"),10),validator:YAHOO.lang.isNumber,method:function(F){F=parseInt(F,10);if(F>0){if(this.get("setSize")){this.setStyle("width",F+"px");}this._cache.width=F;this._configs.width.value=F;}}});this.setAttributeConfig("height",{value:D.height||parseInt(this.getStyle("height"),10),validator:YAHOO.lang.isNumber,method:function(F){F=parseInt(F,10);if(F>0){if(this.get("setSize")){this.setStyle("height",F+"px");}this._cache.height=F;this._configs.height.value=F;
}}});this.setAttributeConfig("minWidth",{value:D.minWidth||15,validator:YAHOO.lang.isNumber});this.setAttributeConfig("minHeight",{value:D.minHeight||15,validator:YAHOO.lang.isNumber});this.setAttributeConfig("maxWidth",{value:D.maxWidth||10000,validator:YAHOO.lang.isNumber});this.setAttributeConfig("maxHeight",{value:D.maxHeight||10000,validator:YAHOO.lang.isNumber});this.setAttributeConfig("minY",{value:D.minY||false});this.setAttributeConfig("minX",{value:D.minX||false});this.setAttributeConfig("maxY",{value:D.maxY||false});this.setAttributeConfig("maxX",{value:D.maxX||false});this.setAttributeConfig("animate",{value:D.animate||false,validator:function(G){var F=true;if(!YAHOO.util.Anim){F=false;}return F;}});this.setAttributeConfig("animateEasing",{value:D.animateEasing||function(){var F=false;if(YAHOO.util.Easing&&YAHOO.util.Easing.easeOut){F=YAHOO.util.Easing.easeOut;}return F;}()});this.setAttributeConfig("animateDuration",{value:D.animateDuration||0.5});this.setAttributeConfig("proxy",{value:D.proxy||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("ratio",{value:D.ratio||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("ghost",{value:D.ghost||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("draggable",{value:D.draggable||false,validator:YAHOO.lang.isBoolean,method:function(F){if(F&&this._wrap){this._setupDragDrop();}else{if(this.dd){E.removeClass(this._wrap,this.CSS_DRAG);this.dd.unreg();}}}});this.setAttributeConfig("hover",{value:D.hover||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("hiddenHandles",{value:D.hiddenHandles||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("knobHandles",{value:D.knobHandles||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("xTicks",{value:D.xTicks||false});this.setAttributeConfig("yTicks",{value:D.yTicks||false});this.setAttributeConfig("status",{value:D.status||false,validator:YAHOO.lang.isBoolean});this.setAttributeConfig("autoRatio",{value:D.autoRatio||false,validator:YAHOO.lang.isBoolean});},destroy:function(){for(var F in this._handles){if(C.hasOwnProperty(this._handles,F)){A.purgeElement(this._handles[F]);this._handles[F].parentNode.removeChild(this._handles[F]);}}if(this._proxy){this._proxy.parentNode.removeChild(this._proxy);}if(this._status){this._status.parentNode.removeChild(this._status);}if(this.dd){this.dd.unreg();E.removeClass(this._wrap,this.CSS_DRAG);}if(this._wrap!=this.get("element")){this.setStyle("position","");this.setStyle("top","");this.setStyle("left","");this._wrap.parentNode.replaceChild(this.get("element"),this._wrap);}this.removeClass(this.CSS_RESIZE);delete YAHOO.util.Resize._instances[this.get("id")];for(var D in this){if(C.hasOwnProperty(this,D)){this[D]=null;delete this[D];}}},toString:function(){if(this.get){return"Resize (#"+this.get("id")+")";}return"Resize Utility";}});YAHOO.util.Resize=B;})();YAHOO.register("resize",YAHOO.util.Resize,{version:"2.7.0",build:"1796"});/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
(function(){var C=YAHOO.util.Dom,A=YAHOO.util.Event,D=YAHOO.lang;var B=function(F,E){var G={element:F,attributes:E||{}};B.superclass.constructor.call(this,G.element,G.attributes);};B._instances={};B.getCropperById=function(E){if(B._instances[E]){return B._instances[E];}return false;};YAHOO.extend(B,YAHOO.util.Element,{CSS_MAIN:"yui-crop",CSS_MASK:"yui-crop-mask",CSS_RESIZE_MASK:"yui-crop-resize-mask",_image:null,_active:null,_resize:null,_resizeEl:null,_resizeMaskEl:null,_wrap:null,_mask:null,_createWrap:function(){this._wrap=document.createElement("div");this._wrap.id=this.get("element").id+"_wrap";this._wrap.className=this.CSS_MAIN;var F=this.get("element");this._wrap.style.width=F.width?F.width+"px":C.getStyle(F,"width");this._wrap.style.height=F.height?F.height+"px":C.getStyle(F,"height");var E=this.get("element").parentNode;E.replaceChild(this._wrap,this.get("element"));this._wrap.appendChild(this.get("element"));A.on(this._wrap,"mouseover",this._handleMouseOver,this,true);A.on(this._wrap,"mouseout",this._handleMouseOut,this,true);A.on(this._wrap,"click",function(G){A.stopEvent(G);},this,true);},_createMask:function(){this._mask=document.createElement("div");this._mask.className=this.CSS_MASK;this._wrap.appendChild(this._mask);},_createResize:function(){this._resizeEl=document.createElement("div");this._resizeEl.className=YAHOO.util.Resize.prototype.CSS_RESIZE;this._resizeEl.style.position="absolute";this._resizeEl.innerHTML='<div class="'+this.CSS_RESIZE_MASK+'"></div>';this._resizeMaskEl=this._resizeEl.firstChild;this._wrap.appendChild(this._resizeEl);this._resizeEl.style.top=this.get("initialXY")[1]+"px";this._resizeEl.style.left=this.get("initialXY")[0]+"px";this._resizeMaskEl.style.height=Math.floor(this.get("initHeight"))+"px";this._resizeMaskEl.style.width=Math.floor(this.get("initWidth"))+"px";this._resize=new YAHOO.util.Resize(this._resizeEl,{knobHandles:true,handles:"all",draggable:true,status:this.get("status"),minWidth:this.get("minWidth"),minHeight:this.get("minHeight"),ratio:this.get("ratio"),autoRatio:this.get("autoRatio"),height:this.get("initHeight"),width:this.get("initWidth")});this._setBackgroundImage(this.get("element").getAttribute("src",2));this._setBackgroundPosition(-(this.get("initialXY")[0]),-(this.get("initialXY")[1]));this._resize.on("startResize",this._handleStartResizeEvent,this,true);this._resize.on("endResize",this._handleEndResizeEvent,this,true);this._resize.on("dragEvent",this._handleDragEvent,this,true);this._resize.on("beforeResize",this._handleBeforeResizeEvent,this,true);this._resize.on("resize",this._handleResizeEvent,this,true);this._resize.dd.on("b4StartDragEvent",this._handleB4DragEvent,this,true);},_handleMouseOver:function(F){var E="keydown";if(YAHOO.env.ua.gecko||YAHOO.env.ua.opera){E="keypress";}if(!this._active){this._active=true;if(this.get("useKeys")){A.on(document,E,this._handleKeyPress,this,true);}}},_handleMouseOut:function(F){var E="keydown";if(YAHOO.env.ua.gecko||YAHOO.env.ua.opera){E="keypress";}this._active=false;if(this.get("useKeys")){A.removeListener(document,E,this._handleKeyPress);}},_moveEl:function(G,J){var H=0,E=0,I=this._setConstraints(),F=true;switch(G){case"down":H=-(J);if((I.bottom-J)<0){F=false;this._resizeEl.style.top=(I.top+I.bottom)+"px";}break;case"up":H=(J);if((I.top-J)<0){F=false;this._resizeEl.style.top="0px";}break;case"right":E=-(J);if((I.right-J)<0){F=false;this._resizeEl.style.left=(I.left+I.right)+"px";}break;case"left":E=J;if((I.left-J)<0){F=false;this._resizeEl.style.left="0px";}break;}if(F){this._resizeEl.style.left=(parseInt(this._resizeEl.style.left,10)-E)+"px";this._resizeEl.style.top=(parseInt(this._resizeEl.style.top,10)-H)+"px";this.fireEvent("moveEvent",{target:"keypress"});}else{this._setConstraints();}this._syncBackgroundPosition();},_handleKeyPress:function(G){var E=A.getCharCode(G),F=false,H=((G.shiftKey)?this.get("shiftKeyTick"):this.get("keyTick"));switch(E){case 37:this._moveEl("left",H);F=true;break;case 38:this._moveEl("up",H);F=true;break;case 39:this._moveEl("right",H);F=true;break;case 40:this._moveEl("down",H);F=true;break;default:}if(F){A.preventDefault(G);}},_handleB4DragEvent:function(){this._setConstraints();},_handleDragEvent:function(){this._syncBackgroundPosition();this.fireEvent("dragEvent",arguments);this.fireEvent("moveEvent",{target:"dragevent"});},_handleBeforeResizeEvent:function(F){var I=C.getRegion(this.get("element")),J=this._resize._cache,H=this._resize._currentHandle,G=0,E=0;if(F.top&&(F.top<I.top)){G=(J.height+J.top)-I.top;C.setY(this._resize.getWrapEl(),I.top);this._resize.getWrapEl().style.height=G+"px";this._resize._cache.height=G;this._resize._cache.top=I.top;this._syncBackgroundPosition();return false;}if(F.left&&(F.left<I.left)){E=(J.width+J.left)-I.left;C.setX(this._resize.getWrapEl(),I.left);this._resize._cache.left=I.left;this._resize.getWrapEl().style.width=E+"px";this._resize._cache.width=E;this._syncBackgroundPosition();return false;}if(H!="tl"&&H!="l"&&H!="bl"){if(J.left&&F.width&&((J.left+F.width)>I.right)){E=(I.right-J.left);C.setX(this._resize.getWrapEl(),(I.right-E));this._resize.getWrapEl().style.width=E+"px";this._resize._cache.left=(I.right-E);this._resize._cache.width=E;this._syncBackgroundPosition();return false;}}if(H!="t"&&H!="tr"&&H!="tl"){if(J.top&&F.height&&((J.top+F.height)>I.bottom)){G=(I.bottom-J.top);C.setY(this._resize.getWrapEl(),(I.bottom-G));this._resize.getWrapEl().style.height=G+"px";this._resize._cache.height=G;this._resize._cache.top=(I.bottom-G);this._syncBackgroundPosition();return false;}}},_handleResizeMaskEl:function(){var E=this._resize._cache;this._resizeMaskEl.style.height=Math.floor(E.height)+"px";this._resizeMaskEl.style.width=Math.floor(E.width)+"px";},_handleResizeEvent:function(E){this._setConstraints(true);this._syncBackgroundPosition();this.fireEvent("resizeEvent",arguments);this.fireEvent("moveEvent",{target:"resizeevent"});},_syncBackgroundPosition:function(){this._handleResizeMaskEl();this._setBackgroundPosition(-(parseInt(this._resizeEl.style.left,10)),-(parseInt(this._resizeEl.style.top,10)));
},_setBackgroundPosition:function(F,H){var J=parseInt(C.getStyle(this._resize.get("element"),"borderLeftWidth"),10);var G=parseInt(C.getStyle(this._resize.get("element"),"borderTopWidth"),10);if(isNaN(J)){J=0;}if(isNaN(G)){G=0;}var E=this._resize.getWrapEl().firstChild;var I=(F-J)+"px "+(H-G)+"px";this._resizeMaskEl.style.backgroundPosition=I;},_setBackgroundImage:function(F){var E=this._resize.getWrapEl().firstChild;this._image=F;E.style.backgroundImage="url("+F+"#)";},_handleEndResizeEvent:function(){this._setConstraints(true);},_handleStartResizeEvent:function(){this._setConstraints(true);var I=this._resize._cache.height,F=this._resize._cache.width,H=parseInt(this._resize.getWrapEl().style.top,10),E=parseInt(this._resize.getWrapEl().style.left,10),G=0,J=0;switch(this._resize._currentHandle){case"b":G=(I+this._resize.dd.bottomConstraint);break;case"l":J=(F+this._resize.dd.leftConstraint);break;case"r":G=(I+H);J=(F+this._resize.dd.rightConstraint);break;case"br":G=(I+this._resize.dd.bottomConstraint);J=(F+this._resize.dd.rightConstraint);break;case"tr":G=(I+H);J=(F+this._resize.dd.rightConstraint);break;}if(G){}if(J){}this.fireEvent("startResizeEvent",arguments);},_setConstraints:function(J){var H=this._resize;H.dd.resetConstraints();var N=parseInt(H.get("height"),10),F=parseInt(H.get("width"),10);if(J){N=H._cache.height;F=H._cache.width;}var L=C.getRegion(this.get("element"));var G=H.getWrapEl();var O=C.getXY(G);var I=O[0]-L.left;var M=L.right-O[0]-F;var K=O[1]-L.top;var E=L.bottom-O[1]-N;if(K<0){K=0;}H.dd.setXConstraint(I,M);H.dd.setYConstraint(K,E);return{top:K,right:M,bottom:E,left:I};},getCropCoords:function(){var E={top:parseInt(this._resize.getWrapEl().style.top,10),left:parseInt(this._resize.getWrapEl().style.left,10),height:this._resize._cache.height,width:this._resize._cache.width,image:this._image};return E;},reset:function(){this._resize.resize(null,this.get("initHeight"),this.get("initWidth"),0,0,true);this._resizeEl.style.top=this.get("initialXY")[1]+"px";this._resizeEl.style.left=this.get("initialXY")[0]+"px";this._syncBackgroundPosition();return this;},getEl:function(){return this.get("element");},getResizeEl:function(){return this._resizeEl;},getWrapEl:function(){return this._wrap;},getMaskEl:function(){return this._mask;},getResizeMaskEl:function(){return this._resizeMaskEl;},getResizeObject:function(){return this._resize;},init:function(G,E){B.superclass.init.call(this,G,E);var H=G;if(!D.isString(H)){if(H.tagName&&(H.tagName.toLowerCase()=="img")){H=C.generateId(H);}else{return false;}}else{var F=C.get(H);if(F.tagName&&F.tagName.toLowerCase()=="img"){}else{return false;}}B._instances[H]=this;this._createWrap();this._createMask();this._createResize();this._setConstraints();},initAttributes:function(E){B.superclass.initAttributes.call(this,E);this.setAttributeConfig("initialXY",{writeOnce:true,validator:YAHOO.lang.isArray,value:E.initialXY||[10,10]});this.setAttributeConfig("keyTick",{validator:YAHOO.lang.isNumber,value:E.keyTick||1});this.setAttributeConfig("shiftKeyTick",{validator:YAHOO.lang.isNumber,value:E.shiftKeyTick||10});this.setAttributeConfig("useKeys",{validator:YAHOO.lang.isBoolean,value:((E.useKeys===false)?false:true)});this.setAttributeConfig("status",{validator:YAHOO.lang.isBoolean,value:((E.status===false)?false:true),method:function(F){if(this._resize){this._resize.set("status",F);}}});this.setAttributeConfig("minHeight",{validator:YAHOO.lang.isNumber,value:E.minHeight||50,method:function(F){if(this._resize){this._resize.set("minHeight",F);}}});this.setAttributeConfig("minWidth",{validator:YAHOO.lang.isNumber,value:E.minWidth||50,method:function(F){if(this._resize){this._resize.set("minWidth",F);}}});this.setAttributeConfig("ratio",{validator:YAHOO.lang.isBoolean,value:E.ratio||false,method:function(F){if(this._resize){this._resize.set("ratio",F);}}});this.setAttributeConfig("autoRatio",{validator:YAHOO.lang.isBoolean,value:((E.autoRatio===false)?false:true),method:function(F){if(this._resize){this._resize.set("autoRatio",F);}}});this.setAttributeConfig("initHeight",{writeOnce:true,validator:YAHOO.lang.isNumber,value:E.initHeight||(this.get("element").height/4)});this.setAttributeConfig("initWidth",{validator:YAHOO.lang.isNumber,writeOnce:true,value:E.initWidth||(this.get("element").width/4)});},destroy:function(){this._resize.destroy();this._resizeEl.parentNode.removeChild(this._resizeEl);this._mask.parentNode.removeChild(this._mask);A.purgeElement(this._wrap);this._wrap.parentNode.replaceChild(this.get("element"),this._wrap);for(var E in this){if(D.hasOwnProperty(this,E)){this[E]=null;}}},toString:function(){if(this.get){return"ImageCropper (#"+this.get("id")+")";}return"Image Cropper";}});YAHOO.widget.ImageCropper=B;})();YAHOO.register("imagecropper",YAHOO.widget.ImageCropper,{version:"2.7.0",build:"1796"});/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
(function(){var B=YAHOO.util;var A=function(D,C,E,F){if(!D){}this.init(D,C,E,F);};A.NAME="Anim";A.prototype={toString:function(){var C=this.getEl()||{};var D=C.id||C.tagName;return(this.constructor.NAME+": "+D);},patterns:{noNegatives:/width|height|opacity|padding/i,offsetAttribute:/^((width|height)|(top|left))$/,defaultUnit:/width|height|top$|bottom$|left$|right$/i,offsetUnit:/\d+(em|%|en|ex|pt|in|cm|mm|pc)$/i},doMethod:function(C,E,D){return this.method(this.currentFrame,E,D-E,this.totalFrames);},setAttribute:function(C,F,E){var D=this.getEl();if(this.patterns.noNegatives.test(C)){F=(F>0)?F:0;}if("style" in D){B.Dom.setStyle(D,C,F+E);}else{if(C in D){D[C]=F;}}},getAttribute:function(C){var E=this.getEl();var G=B.Dom.getStyle(E,C);if(G!=="auto"&&!this.patterns.offsetUnit.test(G)){return parseFloat(G);}var D=this.patterns.offsetAttribute.exec(C)||[];var H=!!(D[3]);var F=!!(D[2]);if("style" in E){if(F||(B.Dom.getStyle(E,"position")=="absolute"&&H)){G=E["offset"+D[0].charAt(0).toUpperCase()+D[0].substr(1)];}else{G=0;}}else{if(C in E){G=E[C];}}return G;},getDefaultUnit:function(C){if(this.patterns.defaultUnit.test(C)){return"px";}return"";},setRuntimeAttribute:function(D){var I;var E;var F=this.attributes;this.runtimeAttributes[D]={};var H=function(J){return(typeof J!=="undefined");};if(!H(F[D]["to"])&&!H(F[D]["by"])){return false;}I=(H(F[D]["from"]))?F[D]["from"]:this.getAttribute(D);if(H(F[D]["to"])){E=F[D]["to"];}else{if(H(F[D]["by"])){if(I.constructor==Array){E=[];for(var G=0,C=I.length;G<C;++G){E[G]=I[G]+F[D]["by"][G]*1;}}else{E=I+F[D]["by"]*1;}}}this.runtimeAttributes[D].start=I;this.runtimeAttributes[D].end=E;this.runtimeAttributes[D].unit=(H(F[D].unit))?F[D]["unit"]:this.getDefaultUnit(D);return true;},init:function(E,J,I,C){var D=false;var F=null;var H=0;E=B.Dom.get(E);this.attributes=J||{};this.duration=!YAHOO.lang.isUndefined(I)?I:1;this.method=C||B.Easing.easeNone;this.useSeconds=true;this.currentFrame=0;this.totalFrames=B.AnimMgr.fps;this.setEl=function(M){E=B.Dom.get(M);};this.getEl=function(){return E;};this.isAnimated=function(){return D;};this.getStartTime=function(){return F;};this.runtimeAttributes={};this.animate=function(){if(this.isAnimated()){return false;}this.currentFrame=0;this.totalFrames=(this.useSeconds)?Math.ceil(B.AnimMgr.fps*this.duration):this.duration;if(this.duration===0&&this.useSeconds){this.totalFrames=1;}B.AnimMgr.registerElement(this);return true;};this.stop=function(M){if(!this.isAnimated()){return false;}if(M){this.currentFrame=this.totalFrames;this._onTween.fire();}B.AnimMgr.stop(this);};var L=function(){this.onStart.fire();this.runtimeAttributes={};for(var M in this.attributes){this.setRuntimeAttribute(M);}D=true;H=0;F=new Date();};var K=function(){var O={duration:new Date()-this.getStartTime(),currentFrame:this.currentFrame};O.toString=function(){return("duration: "+O.duration+", currentFrame: "+O.currentFrame);};this.onTween.fire(O);var N=this.runtimeAttributes;for(var M in N){this.setAttribute(M,this.doMethod(M,N[M].start,N[M].end),N[M].unit);}H+=1;};var G=function(){var M=(new Date()-F)/1000;var N={duration:M,frames:H,fps:H/M};N.toString=function(){return("duration: "+N.duration+", frames: "+N.frames+", fps: "+N.fps);};D=false;H=0;this.onComplete.fire(N);};this._onStart=new B.CustomEvent("_start",this,true);this.onStart=new B.CustomEvent("start",this);this.onTween=new B.CustomEvent("tween",this);this._onTween=new B.CustomEvent("_tween",this,true);this.onComplete=new B.CustomEvent("complete",this);this._onComplete=new B.CustomEvent("_complete",this,true);this._onStart.subscribe(L);this._onTween.subscribe(K);this._onComplete.subscribe(G);}};B.Anim=A;})();YAHOO.util.AnimMgr=new function(){var C=null;var B=[];var A=0;this.fps=1000;this.delay=1;this.registerElement=function(F){B[B.length]=F;A+=1;F._onStart.fire();this.start();};this.unRegister=function(G,F){F=F||E(G);if(!G.isAnimated()||F==-1){return false;}G._onComplete.fire();B.splice(F,1);A-=1;if(A<=0){this.stop();}return true;};this.start=function(){if(C===null){C=setInterval(this.run,this.delay);}};this.stop=function(H){if(!H){clearInterval(C);for(var G=0,F=B.length;G<F;++G){this.unRegister(B[0],0);}B=[];C=null;A=0;}else{this.unRegister(H);}};this.run=function(){for(var H=0,F=B.length;H<F;++H){var G=B[H];if(!G||!G.isAnimated()){continue;}if(G.currentFrame<G.totalFrames||G.totalFrames===null){G.currentFrame+=1;if(G.useSeconds){D(G);}G._onTween.fire();}else{YAHOO.util.AnimMgr.stop(G,H);}}};var E=function(H){for(var G=0,F=B.length;G<F;++G){if(B[G]==H){return G;}}return -1;};var D=function(G){var J=G.totalFrames;var I=G.currentFrame;var H=(G.currentFrame*G.duration*1000/G.totalFrames);var F=(new Date()-G.getStartTime());var K=0;if(F<G.duration*1000){K=Math.round((F/H-1)*G.currentFrame);}else{K=J-(I+1);}if(K>0&&isFinite(K)){if(G.currentFrame+K>=J){K=J-(I+1);}G.currentFrame+=K;}};};YAHOO.util.Bezier=new function(){this.getPosition=function(E,D){var F=E.length;var C=[];for(var B=0;B<F;++B){C[B]=[E[B][0],E[B][1]];}for(var A=1;A<F;++A){for(B=0;B<F-A;++B){C[B][0]=(1-D)*C[B][0]+D*C[parseInt(B+1,10)][0];C[B][1]=(1-D)*C[B][1]+D*C[parseInt(B+1,10)][1];}}return[C[0][0],C[0][1]];};};(function(){var A=function(F,E,G,H){A.superclass.constructor.call(this,F,E,G,H);};A.NAME="ColorAnim";A.DEFAULT_BGCOLOR="#fff";var C=YAHOO.util;YAHOO.extend(A,C.Anim);var D=A.superclass;var B=A.prototype;B.patterns.color=/color$/i;B.patterns.rgb=/^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i;B.patterns.hex=/^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i;B.patterns.hex3=/^#?([0-9A-F]{1})([0-9A-F]{1})([0-9A-F]{1})$/i;B.patterns.transparent=/^transparent|rgba\(0, 0, 0, 0\)$/;B.parseColor=function(E){if(E.length==3){return E;}var F=this.patterns.hex.exec(E);if(F&&F.length==4){return[parseInt(F[1],16),parseInt(F[2],16),parseInt(F[3],16)];}F=this.patterns.rgb.exec(E);if(F&&F.length==4){return[parseInt(F[1],10),parseInt(F[2],10),parseInt(F[3],10)];}F=this.patterns.hex3.exec(E);if(F&&F.length==4){return[parseInt(F[1]+F[1],16),parseInt(F[2]+F[2],16),parseInt(F[3]+F[3],16)];
}return null;};B.getAttribute=function(E){var G=this.getEl();if(this.patterns.color.test(E)){var I=YAHOO.util.Dom.getStyle(G,E);var H=this;if(this.patterns.transparent.test(I)){var F=YAHOO.util.Dom.getAncestorBy(G,function(J){return !H.patterns.transparent.test(I);});if(F){I=C.Dom.getStyle(F,E);}else{I=A.DEFAULT_BGCOLOR;}}}else{I=D.getAttribute.call(this,E);}return I;};B.doMethod=function(F,J,G){var I;if(this.patterns.color.test(F)){I=[];for(var H=0,E=J.length;H<E;++H){I[H]=D.doMethod.call(this,F,J[H],G[H]);}I="rgb("+Math.floor(I[0])+","+Math.floor(I[1])+","+Math.floor(I[2])+")";}else{I=D.doMethod.call(this,F,J,G);}return I;};B.setRuntimeAttribute=function(F){D.setRuntimeAttribute.call(this,F);if(this.patterns.color.test(F)){var H=this.attributes;var J=this.parseColor(this.runtimeAttributes[F].start);var G=this.parseColor(this.runtimeAttributes[F].end);if(typeof H[F]["to"]==="undefined"&&typeof H[F]["by"]!=="undefined"){G=this.parseColor(H[F].by);for(var I=0,E=J.length;I<E;++I){G[I]=J[I]+G[I];}}this.runtimeAttributes[F].start=J;this.runtimeAttributes[F].end=G;}};C.ColorAnim=A;})();
/*
TERMS OF USE - EASING EQUATIONS
Open source under the BSD License.
Copyright 2001 Robert Penner All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the author nor the names of contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
YAHOO.util.Easing={easeNone:function(B,A,D,C){return D*B/C+A;},easeIn:function(B,A,D,C){return D*(B/=C)*B+A;},easeOut:function(B,A,D,C){return -D*(B/=C)*(B-2)+A;},easeBoth:function(B,A,D,C){if((B/=C/2)<1){return D/2*B*B+A;}return -D/2*((--B)*(B-2)-1)+A;},easeInStrong:function(B,A,D,C){return D*(B/=C)*B*B*B+A;},easeOutStrong:function(B,A,D,C){return -D*((B=B/C-1)*B*B*B-1)+A;},easeBothStrong:function(B,A,D,C){if((B/=C/2)<1){return D/2*B*B*B*B+A;}return -D/2*((B-=2)*B*B*B-2)+A;},elasticIn:function(C,A,G,F,B,E){if(C==0){return A;}if((C/=F)==1){return A+G;}if(!E){E=F*0.3;}if(!B||B<Math.abs(G)){B=G;var D=E/4;}else{var D=E/(2*Math.PI)*Math.asin(G/B);}return -(B*Math.pow(2,10*(C-=1))*Math.sin((C*F-D)*(2*Math.PI)/E))+A;},elasticOut:function(C,A,G,F,B,E){if(C==0){return A;}if((C/=F)==1){return A+G;}if(!E){E=F*0.3;}if(!B||B<Math.abs(G)){B=G;var D=E/4;}else{var D=E/(2*Math.PI)*Math.asin(G/B);}return B*Math.pow(2,-10*C)*Math.sin((C*F-D)*(2*Math.PI)/E)+G+A;},elasticBoth:function(C,A,G,F,B,E){if(C==0){return A;}if((C/=F/2)==2){return A+G;}if(!E){E=F*(0.3*1.5);}if(!B||B<Math.abs(G)){B=G;var D=E/4;}else{var D=E/(2*Math.PI)*Math.asin(G/B);}if(C<1){return -0.5*(B*Math.pow(2,10*(C-=1))*Math.sin((C*F-D)*(2*Math.PI)/E))+A;}return B*Math.pow(2,-10*(C-=1))*Math.sin((C*F-D)*(2*Math.PI)/E)*0.5+G+A;},backIn:function(B,A,E,D,C){if(typeof C=="undefined"){C=1.70158;}return E*(B/=D)*B*((C+1)*B-C)+A;},backOut:function(B,A,E,D,C){if(typeof C=="undefined"){C=1.70158;}return E*((B=B/D-1)*B*((C+1)*B+C)+1)+A;},backBoth:function(B,A,E,D,C){if(typeof C=="undefined"){C=1.70158;}if((B/=D/2)<1){return E/2*(B*B*(((C*=(1.525))+1)*B-C))+A;}return E/2*((B-=2)*B*(((C*=(1.525))+1)*B+C)+2)+A;},bounceIn:function(B,A,D,C){return D-YAHOO.util.Easing.bounceOut(C-B,0,D,C)+A;},bounceOut:function(B,A,D,C){if((B/=C)<(1/2.75)){return D*(7.5625*B*B)+A;}else{if(B<(2/2.75)){return D*(7.5625*(B-=(1.5/2.75))*B+0.75)+A;}else{if(B<(2.5/2.75)){return D*(7.5625*(B-=(2.25/2.75))*B+0.9375)+A;}}}return D*(7.5625*(B-=(2.625/2.75))*B+0.984375)+A;},bounceBoth:function(B,A,D,C){if(B<C/2){return YAHOO.util.Easing.bounceIn(B*2,0,D,C)*0.5+A;}return YAHOO.util.Easing.bounceOut(B*2-C,0,D,C)*0.5+D*0.5+A;}};(function(){var A=function(H,G,I,J){if(H){A.superclass.constructor.call(this,H,G,I,J);}};A.NAME="Motion";var E=YAHOO.util;YAHOO.extend(A,E.ColorAnim);var F=A.superclass;var C=A.prototype;C.patterns.points=/^points$/i;C.setAttribute=function(G,I,H){if(this.patterns.points.test(G)){H=H||"px";F.setAttribute.call(this,"left",I[0],H);F.setAttribute.call(this,"top",I[1],H);}else{F.setAttribute.call(this,G,I,H);}};C.getAttribute=function(G){if(this.patterns.points.test(G)){var H=[F.getAttribute.call(this,"left"),F.getAttribute.call(this,"top")];}else{H=F.getAttribute.call(this,G);}return H;};C.doMethod=function(G,K,H){var J=null;if(this.patterns.points.test(G)){var I=this.method(this.currentFrame,0,100,this.totalFrames)/100;J=E.Bezier.getPosition(this.runtimeAttributes[G],I);}else{J=F.doMethod.call(this,G,K,H);}return J;};C.setRuntimeAttribute=function(P){if(this.patterns.points.test(P)){var H=this.getEl();var J=this.attributes;var G;var L=J["points"]["control"]||[];var I;var M,O;if(L.length>0&&!(L[0] instanceof Array)){L=[L];}else{var K=[];for(M=0,O=L.length;M<O;++M){K[M]=L[M];}L=K;}if(E.Dom.getStyle(H,"position")=="static"){E.Dom.setStyle(H,"position","relative");}if(D(J["points"]["from"])){E.Dom.setXY(H,J["points"]["from"]);
}else{E.Dom.setXY(H,E.Dom.getXY(H));}G=this.getAttribute("points");if(D(J["points"]["to"])){I=B.call(this,J["points"]["to"],G);var N=E.Dom.getXY(this.getEl());for(M=0,O=L.length;M<O;++M){L[M]=B.call(this,L[M],G);}}else{if(D(J["points"]["by"])){I=[G[0]+J["points"]["by"][0],G[1]+J["points"]["by"][1]];for(M=0,O=L.length;M<O;++M){L[M]=[G[0]+L[M][0],G[1]+L[M][1]];}}}this.runtimeAttributes[P]=[G];if(L.length>0){this.runtimeAttributes[P]=this.runtimeAttributes[P].concat(L);}this.runtimeAttributes[P][this.runtimeAttributes[P].length]=I;}else{F.setRuntimeAttribute.call(this,P);}};var B=function(G,I){var H=E.Dom.getXY(this.getEl());G=[G[0]-H[0]+I[0],G[1]-H[1]+I[1]];return G;};var D=function(G){return(typeof G!=="undefined");};E.Motion=A;})();(function(){var D=function(F,E,G,H){if(F){D.superclass.constructor.call(this,F,E,G,H);}};D.NAME="Scroll";var B=YAHOO.util;YAHOO.extend(D,B.ColorAnim);var C=D.superclass;var A=D.prototype;A.doMethod=function(E,H,F){var G=null;if(E=="scroll"){G=[this.method(this.currentFrame,H[0],F[0]-H[0],this.totalFrames),this.method(this.currentFrame,H[1],F[1]-H[1],this.totalFrames)];}else{G=C.doMethod.call(this,E,H,F);}return G;};A.getAttribute=function(E){var G=null;var F=this.getEl();if(E=="scroll"){G=[F.scrollLeft,F.scrollTop];}else{G=C.getAttribute.call(this,E);}return G;};A.setAttribute=function(E,H,G){var F=this.getEl();if(E=="scroll"){F.scrollLeft=H[0];F.scrollTop=H[1];}else{C.setAttribute.call(this,E,H,G);}};B.Scroll=D;})();YAHOO.register("animation",YAHOO.util.Anim,{version:"2.7.0",build:"1796"});/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.7.0
*/
(function(){var M;YAHOO.widget.Carousel=function(n,m){YAHOO.widget.Carousel.superclass.constructor.call(this,n,m);};var Q=YAHOO.widget.Carousel,a=YAHOO.util.Dom,Y=YAHOO.util.Event,k=YAHOO.lang;M="Carousel";var P={},F="afterScroll",b="allItemsRemoved",X="beforeHide",I="beforePageChange",e="beforeScroll",U="beforeShow",B="blur",T="focus",W="hide",O="itemAdded",j="itemRemoved",C="itemSelected",K="loadItems",H="navigationStateChange",c="pageChange",G="render",R="show",V="startAutoPlay",l="stopAutoPlay",J="uiUpdate";function S(n,m){var o=document.createElement(n);m=m||{};if(m.className){a.addClass(o,m.className);}if(m.parent){m.parent.appendChild(o);}if(m.id){o.setAttribute("id",m.id);}if(m.content){if(m.content.nodeName){o.appendChild(m.content);}else{o.innerHTML=m.content;}}return o;}function Z(o,n,m){var q;if(!o){return 0;}function p(t,s){var u;if(s=="marginRight"&&YAHOO.env.ua.webkit){u=parseInt(a.getStyle(t,"marginLeft"),10);}else{u=parseInt(a.getStyle(t,s),10);}return k.isNumber(u)?u:0;}function r(t,s){var u;if(s=="marginRight"&&YAHOO.env.ua.webkit){u=parseFloat(a.getStyle(t,"marginLeft"));}else{u=parseFloat(a.getStyle(t,s));}return k.isNumber(u)?u:0;}if(typeof m=="undefined"){m="int";}switch(n){case"height":q=o.offsetHeight;if(q>0){q+=p(o,"marginTop")+p(o,"marginBottom");}else{q=r(o,"height")+p(o,"marginTop")+p(o,"marginBottom")+p(o,"borderTopWidth")+p(o,"borderBottomWidth")+p(o,"paddingTop")+p(o,"paddingBottom");}break;case"width":q=o.offsetWidth;if(q>0){q+=p(o,"marginLeft")+p(o,"marginRight");}else{q=r(o,"width")+p(o,"marginLeft")+p(o,"marginRight")+p(o,"borderLeftWidth")+p(o,"borderRightWidth")+p(o,"paddingLeft")+p(o,"paddingRight");}break;default:if(m=="int"){q=p(o,n);}else{if(m=="float"){q=r(o,n);}else{q=a.getStyle(o,n);}}break;}return q;}function L(p){var o=this,q,n=0,m=false;if(o._itemsTable.numItems===0){return 0;}if(typeof p=="undefined"){if(o._itemsTable.size>0){return o._itemsTable.size;}}if(k.isUndefined(o._itemsTable.items[0])){return 0;}q=a.get(o._itemsTable.items[0].id);if(typeof p=="undefined"){m=o.get("isVertical");}else{m=p=="height";}if(m){n=Z(q,"height");}else{n=Z(q,"width");}if(typeof p=="undefined"){o._itemsTable.size=n;}return n;}function D(n){var m=this.get("numVisible");return Math.floor(n/m)*m;}function f(o){var n=0,m=0;n=L.call(this);m=n*o;if(this.get("isVertical")){m-=o;}return m;}function d(m,n){n.scrollPageBackward();Y.preventDefault(m);}function g(m,n){n.scrollPageForward();Y.preventDefault(m);}function i(r,n){var v=this,w=v.CLASSES,m,t=v._firstItem,o=v.get("isCircular"),s=v.get("numItems"),u=v.get("numVisible"),q=n,p=t+u-1;if(q>=0&&q<s){if(!k.isUndefined(v._itemsTable.items[q])){m=a.get(v._itemsTable.items[q].id);if(m){a.removeClass(m,w.SELECTED_ITEM);}}}if(k.isNumber(r)){r=parseInt(r,10);r=k.isNumber(r)?r:0;}else{r=t;}if(k.isUndefined(v._itemsTable.items[r])){r=D.call(v,r);v.scrollTo(r);}if(!k.isUndefined(v._itemsTable.items[r])){m=a.get(v._itemsTable.items[r].id);if(m){a.addClass(m,w.SELECTED_ITEM);}}if(r<t||r>p){r=D.call(v,r);v.scrollTo(r);}}function h(){var o=false,r=this,n=r.CLASSES,q,m,p;if(!r._hasRendered){return;}m=r.get("navigation");p=r._firstItem+r.get("numVisible");if(m.prev){if(r.get("numItems")===0||r._firstItem===0){if(r.get("numItems")===0||!r.get("isCircular")){Y.removeListener(m.prev,"click",d);a.addClass(m.prev,n.FIRST_NAV_DISABLED);for(q=0;q<r._navBtns.prev.length;q++){r._navBtns.prev[q].setAttribute("disabled","true");}r._prevEnabled=false;}else{o=!r._prevEnabled;}}else{o=!r._prevEnabled;}if(o){Y.on(m.prev,"click",d,r);a.removeClass(m.prev,n.FIRST_NAV_DISABLED);for(q=0;q<r._navBtns.prev.length;q++){r._navBtns.prev[q].removeAttribute("disabled");}r._prevEnabled=true;}}o=false;if(m.next){if(p>=r.get("numItems")){if(!r.get("isCircular")){Y.removeListener(m.next,"click",g);a.addClass(m.next,n.DISABLED);for(q=0;q<r._navBtns.next.length;q++){r._navBtns.next[q].setAttribute("disabled","true");}r._nextEnabled=false;}else{o=!r._nextEnabled;}}else{o=!r._nextEnabled;}if(o){Y.on(m.next,"click",g,r);a.removeClass(m.next,n.DISABLED);for(q=0;q<r._navBtns.next.length;q++){r._navBtns.next[q].removeAttribute("disabled");}r._nextEnabled=true;}}r.fireEvent(H,{next:r._nextEnabled,prev:r._prevEnabled});}function N(o){var p=this,m,n;if(!p._hasRendered){return;}n=p.get("numVisible");if(!k.isNumber(o)){o=Math.ceil(p.get("selectedItem")/n);}m=Math.ceil(p.get("numItems")/n);p._pages.num=m;p._pages.cur=o;if(m>p.CONFIG.MAX_PAGER_BUTTONS){p._updatePagerMenu();}else{p._updatePagerButtons();}}function A(n){var m=this;if(!k.isObject(n)){return;}switch(n.ev){case O:m._syncUiForItemAdd(n);break;case j:m._syncUiForItemRemove(n);break;case K:m._syncUiForLazyLoading(n);break;}m.fireEvent(J);}function E(p,n){var r=this,q=r.get("currentPage"),o,m=r.get("numVisible");o=parseInt(r._firstItem/m,10);if(o!=q){r.setAttributeConfig("currentPage",{value:o});r.fireEvent(c,o);}if(r.get("selectOnScroll")){if(r.get("selectedItem")!=r._selectedItem){r.set("selectedItem",r._selectedItem);}}clearTimeout(r._autoPlayTimer);delete r._autoPlayTimer;if(r.isAutoPlayOn()){r.startAutoPlay();}r.fireEvent(F,{first:r._firstItem,last:n},r);}Q.getById=function(m){return P[m]?P[m].object:false;};YAHOO.extend(Q,YAHOO.util.Element,{_animObj:null,_carouselEl:null,_clipEl:null,_firstItem:0,_hasFocus:false,_hasRendered:false,_isAnimationInProgress:false,_isAutoPlayInProgress:false,_itemsTable:null,_navBtns:null,_navEl:null,_nextEnabled:true,_pages:null,_prevEnabled:true,_recomputeSize:true,CLASSES:{BUTTON:"yui-carousel-button",CAROUSEL:"yui-carousel",CAROUSEL_EL:"yui-carousel-element",CONTAINER:"yui-carousel-container",CONTENT:"yui-carousel-content",DISABLED:"yui-carousel-button-disabled",FIRST_NAV:" yui-carousel-first-button",FIRST_NAV_DISABLED:"yui-carousel-first-button-disabled",FIRST_PAGE:"yui-carousel-nav-first-page",FOCUSSED_BUTTON:"yui-carousel-button-focus",HORIZONTAL:"yui-carousel-horizontal",ITEM_LOADING:"yui-carousel-item-loading",MIN_WIDTH:"yui-carousel-min-width",NAVIGATION:"yui-carousel-nav",NEXT_NAV:" yui-carousel-next-button",NEXT_PAGE:"yui-carousel-next",NAV_CONTAINER:"yui-carousel-buttons",PAGE_FOCUS:"yui-carousel-nav-page-focus",PREV_PAGE:"yui-carousel-prev",SELECTED_ITEM:"yui-carousel-item-selected",SELECTED_NAV:"yui-carousel-nav-page-selected",VERTICAL:"yui-carousel-vertical",VERTICAL_CONTAINER:"yui-carousel-vertical-container",VISIBLE:"yui-carousel-visible"},CONFIG:{FIRST_VISIBLE:0,HORZ_MIN_WIDTH:180,MAX_PAGER_BUTTONS:5,VERT_MIN_WIDTH:99,NUM_VISIBLE:3},STRINGS:{ITEM_LOADING_CONTENT:"Loading",NEXT_BUTTON_TEXT:"Next Page",PAGER_PREFIX_TEXT:"Go to page ",PREVIOUS_BUTTON_TEXT:"Previous Page"},addItem:function(r,n){var s=this,p,q,m,o=s.get("numItems");
if(!r){return false;}if(k.isString(r)||r.nodeName){q=r.nodeName?r.innerHTML:r;}else{if(k.isObject(r)){q=r.content;}else{return false;}}p=r.className||"";m=r.id?r.id:a.generateId();if(k.isUndefined(n)){s._itemsTable.items.push({item:q,className:p,id:m});}else{if(n<0||n>=o){return false;}s._itemsTable.items.splice(n,0,{item:q,className:p,id:m});}s._itemsTable.numItems++;if(o<s._itemsTable.items.length){s.set("numItems",s._itemsTable.items.length);}s.fireEvent(O,{pos:n,ev:O});return true;},addItems:function(m){var o,q,p=true;if(!k.isArray(m)){return false;}for(o=0,q=m.length;o<q;o++){if(this.addItem(m[o][0],m[o][1])===false){p=false;}}return p;},blur:function(){this._carouselEl.blur();this.fireEvent(B);},clearItems:function(){var m=this,o=m.get("numItems");while(o>0){if(!m.removeItem(0)){}if(m._itemsTable.numItems===0){m.set("numItems",0);break;}o--;}m.fireEvent(b);},focus:function(){var v=this,q,r,s,p,u,w,n,o,m;if(!v._hasRendered){return;}if(v.isAnimating()){return;}m=v.get("selectedItem");w=v.get("numVisible");n=v.get("selectOnScroll");o=(m>=0)?v.getItem(m):null;q=v.get("firstVisible");u=q+w-1;s=(m<q||m>u);r=(o&&o.id)?a.get(o.id):null;p=v._itemsTable;if(!n&&s){r=(p&&p.items&&p.items[q])?a.get(p.items[q].id):null;}if(r){try{r.focus();}catch(t){}}v.fireEvent(T);},hide:function(){var m=this;if(m.fireEvent(X)!==false){m.removeClass(m.CLASSES.VISIBLE);m.fireEvent(W);}},init:function(o,n){var p=this,m=o,q=false;if(!o){return;}p._hasRendered=false;p._navBtns={prev:[],next:[]};p._pages={el:null,num:0,cur:0};p._itemsTable={loading:{},numItems:0,items:[],size:0};if(k.isString(o)){o=a.get(o);}else{if(!o.nodeName){return;}}Q.superclass.init.call(p,o,n);if(o){if(!o.id){o.setAttribute("id",a.generateId());}q=p._parseCarousel(o);if(!q){p._createCarousel(m);}}else{o=p._createCarousel(m);}m=o.id;p.initEvents();if(q){p._parseCarouselItems();}if(!n||typeof n.isVertical=="undefined"){p.set("isVertical",false);}p._parseCarouselNavigation(o);p._navEl=p._setupCarouselNavigation();P[m]={object:p};p._loadItems();},initAttributes:function(m){var n=this;m=m||{};Q.superclass.initAttributes.call(n,m);n.setAttributeConfig("carouselEl",{validator:k.isString,value:m.carouselEl||"OL"});n.setAttributeConfig("carouselItemEl",{validator:k.isString,value:m.carouselItemEl||"LI"});n.setAttributeConfig("currentPage",{readOnly:true,value:0});n.setAttributeConfig("firstVisible",{method:n._setFirstVisible,validator:n._validateFirstVisible,value:m.firstVisible||n.CONFIG.FIRST_VISIBLE});n.setAttributeConfig("selectOnScroll",{validator:k.isBoolean,value:m.selectOnScroll||true});n.setAttributeConfig("numVisible",{method:n._setNumVisible,validator:n._validateNumVisible,value:m.numVisible||n.CONFIG.NUM_VISIBLE});n.setAttributeConfig("numItems",{method:n._setNumItems,validator:n._validateNumItems,value:n._itemsTable.numItems});n.setAttributeConfig("scrollIncrement",{validator:n._validateScrollIncrement,value:m.scrollIncrement||1});n.setAttributeConfig("selectedItem",{method:n._setSelectedItem,validator:k.isNumber,value:-1});n.setAttributeConfig("revealAmount",{method:n._setRevealAmount,validator:n._validateRevealAmount,value:m.revealAmount||0});n.setAttributeConfig("isCircular",{validator:k.isBoolean,value:m.isCircular||false});n.setAttributeConfig("isVertical",{method:n._setOrientation,validator:k.isBoolean,value:m.isVertical||false});n.setAttributeConfig("navigation",{method:n._setNavigation,validator:n._validateNavigation,value:m.navigation||{prev:null,next:null,page:null}});n.setAttributeConfig("animation",{validator:n._validateAnimation,value:m.animation||{speed:0,effect:null}});n.setAttributeConfig("autoPlay",{validator:k.isNumber,value:m.autoPlay||0});n.setAttributeConfig("autoPlayInterval",{validator:k.isNumber,value:m.autoPlayInterval||0});},initEvents:function(){var o=this,n=o.CLASSES,m;o.on("keydown",o._keyboardEventHandler);o.on(F,h);o.on(O,A);o.on(j,A);o.on(C,function(){if(o._hasFocus){o.focus();}});o.on(K,A);o.on(b,function(p){o.scrollTo(0);h.call(o);N.call(o);});o.on(c,N,o);o.on(G,function(p){o.set("selectedItem",o.get("firstVisible"));h.call(o,p);N.call(o,p);o._setClipContainerSize();});o.on("selectedItemChange",function(p){i.call(o,p.newValue,p.prevValue);if(p.newValue>=0){o._updateTabIndex(o.getElementForItem(p.newValue));}o.fireEvent(C,p.newValue);});o.on(J,function(p){h.call(o,p);N.call(o,p);});o.on("firstVisibleChange",function(p){if(!o.get("selectOnScroll")){if(p.newValue>=0){o._updateTabIndex(o.getElementForItem(p.newValue));}}});o.on("click",function(p){if(o.isAutoPlayOn()){o.stopAutoPlay();}o._itemClickHandler(p);o._pagerClickHandler(p);});Y.onFocus(o.get("element"),function(p,r){var q=Y.getTarget(p);if(q&&q.nodeName.toUpperCase()=="A"&&a.getAncestorByClassName(q,n.NAVIGATION)){if(m){a.removeClass(m,n.PAGE_FOCUS);}m=q.parentNode;a.addClass(m,n.PAGE_FOCUS);}else{if(m){a.removeClass(m,n.PAGE_FOCUS);}}r._hasFocus=true;r._updateNavButtons(Y.getTarget(p),true);},o);Y.onBlur(o.get("element"),function(p,q){q._hasFocus=false;q._updateNavButtons(Y.getTarget(p),false);},o);},isAnimating:function(){return this._isAnimationInProgress;},isAutoPlayOn:function(){return this._isAutoPlayInProgress;},getElementForItem:function(m){var n=this;if(m<0||m>=n.get("numItems")){return null;}if(n._itemsTable.numItems>m){if(!k.isUndefined(n._itemsTable.items[m])){return a.get(n._itemsTable.items[m].id);}}return null;},getElementForItems:function(){var o=this,n=[],m;for(m=0;m<o._itemsTable.numItems;m++){n.push(o.getElementForItem(m));}return n;},getItem:function(m){var n=this;if(m<0||m>=n.get("numItems")){return null;}if(n._itemsTable.numItems>m){if(!k.isUndefined(n._itemsTable.items[m])){return n._itemsTable.items[m];}}return null;},getItems:function(m){return this._itemsTable.items;},getItemPositionById:function(q){var o=this,m=0,p=o._itemsTable.numItems;while(m<p){if(!k.isUndefined(o._itemsTable.items[m])){if(o._itemsTable.items[m].id==q){return m;}}m++;}return -1;},getVisibleItems:function(){var p=this,m=p.get("firstVisible"),q=m+p.get("numVisible"),o=[];
while(m<q){o.push(p.getElementForItem(m));m++;}return o;},removeItem:function(n){var p=this,o,m=p.get("numItems");if(n<0||n>=m){return false;}o=p._itemsTable.items.splice(n,1);if(o&&o.length==1){p._itemsTable.numItems--;p.set("numItems",m-1);p.fireEvent(j,{item:o[0],pos:n,ev:j});return true;}return false;},render:function(n){var o=this,m=o.CLASSES;o.addClass(m.CAROUSEL);if(!o._clipEl){o._clipEl=o._createCarouselClip();o._clipEl.appendChild(o._carouselEl);}if(n){o.appendChild(o._clipEl);o.appendTo(n);}else{if(!a.inDocument(o.get("element"))){return false;}o.appendChild(o._clipEl);}if(o.get("isVertical")){o.addClass(m.VERTICAL);}else{o.addClass(m.HORIZONTAL);}if(o.get("numItems")<1){return false;}o._refreshUi();return true;},scrollBackward:function(){var m=this;m.scrollTo(m._firstItem-m.get("scrollIncrement"));},scrollForward:function(){var m=this;m.scrollTo(m._firstItem+m.get("scrollIncrement"));},scrollPageBackward:function(){var n=this,m=n._firstItem-n.get("numVisible");if(n.get("selectOnScroll")){n._selectedItem=n._getSelectedItem(m);}else{m=n._getValidIndex(m);}n.scrollTo(m);},scrollPageForward:function(){var n=this,m=n._firstItem+n.get("numVisible");if(n.get("selectOnScroll")){n._selectedItem=n._getSelectedItem(m);}else{m=n._getValidIndex(m);}n.scrollTo(m);},scrollTo:function(AB,n){var AA=this,m,r,p,z,x,w,u,v,q,t,o,s,y;if(k.isUndefined(AB)||AB==AA._firstItem||AA.isAnimating()){return;}r=AA.get("animation");p=AA.get("isCircular");w=AA._firstItem;u=AA.get("numItems");v=AA.get("numVisible");t=AA.get("currentPage");y=function(){if(AA.isAutoPlayOn()){AA.stopAutoPlay();}};if(AB<0){if(p){AB=u+AB;}else{y.call(AA);return;}}else{if(u>0&&AB>u-1){if(AA.get("isCircular")){AB=u-AB;}else{y.call(AA);return;}}}x=(AA._firstItem>AB)?"backward":"forward";s=w+v;s=(s>u-1)?u-1:s;o=AA.fireEvent(e,{dir:x,first:w,last:s});if(o===false){return;}AA.fireEvent(I,{page:t});z=w-AB;AA._firstItem=AB;AA.set("firstVisible",AB);AA._loadItems();s=AB+v;s=(s>u-1)?u-1:s;q=f.call(AA,z);m=r.speed>0;if(m){AA._animateAndSetCarouselOffset(q,AB,s,n);}else{AA._setCarouselOffset(q);E.call(AA,AB,s);}},selectPreviousItem:function(){var o=this,n=0,m=o.get("selectedItem");if(m==this._firstItem){n=m-o.get("numVisible");o._selectedItem=o._getSelectedItem(m-1);o.scrollTo(n);}else{n=o.get("selectedItem")-o.get("scrollIncrement");o.set("selectedItem",o._getSelectedItem(n));}},selectNextItem:function(){var n=this,m=0;m=n.get("selectedItem")+n.get("scrollIncrement");n.set("selectedItem",n._getSelectedItem(m));},show:function(){var n=this,m=n.CLASSES;if(n.fireEvent(U)!==false){n.addClass(m.VISIBLE);n.fireEvent(R);}},startAutoPlay:function(){var m=this,n;if(k.isUndefined(m._autoPlayTimer)){n=m.get("autoPlayInterval");if(n<=0){return;}m._isAutoPlayInProgress=true;m.fireEvent(V);m._autoPlayTimer=setTimeout(function(){m._autoScroll();},n);}},stopAutoPlay:function(){var m=this;if(!k.isUndefined(m._autoPlayTimer)){clearTimeout(m._autoPlayTimer);delete m._autoPlayTimer;m._isAutoPlayInProgress=false;m.fireEvent(l);}},toString:function(){return M+(this.get?" (#"+this.get("id")+")":"");},_animateAndSetCarouselOffset:function(r,p,n){var q=this,o=q.get("animation"),m=null;if(q.get("isVertical")){m=new YAHOO.util.Motion(q._carouselEl,{points:{by:[0,r]}},o.speed,o.effect);}else{m=new YAHOO.util.Motion(q._carouselEl,{points:{by:[r,0]}},o.speed,o.effect);}q._isAnimationInProgress=true;m.onComplete.subscribe(q._animationCompleteHandler,{scope:q,item:p,last:n});m.animate();},_animationCompleteHandler:function(m,n,q){q.scope._isAnimationInProgress=false;E.call(q.scope,q.item,q.last);},_autoScroll:function(){var n=this,o=n._firstItem,m;if(o>=n.get("numItems")-1){if(n.get("isCircular")){m=0;}else{n.stopAutoPlay();}}else{m=o+n.get("numVisible");}n._selectedItem=n._getSelectedItem(m);n.scrollTo.call(n,m);},_createCarousel:function(n){var p=this,m=p.CLASSES,o=a.get(n);if(!o){o=S("DIV",{className:m.CAROUSEL,id:n});}if(!p._carouselEl){p._carouselEl=S(p.get("carouselEl"),{className:m.CAROUSEL_EL});}return o;},_createCarouselClip:function(){return S("DIV",{className:this.CLASSES.CONTENT});},_createCarouselItem:function(m){return S(this.get("carouselItemEl"),{className:m.className,content:m.content,id:m.id});},_getValidIndex:function(o){var q=this,m=q.get("isCircular"),p=q.get("numItems"),n=p-1;if(o<0){o=m?p+o:0;}else{if(o>n){o=m?o-p:n;}}return o;},_getSelectedItem:function(q){var p=this,m=p.get("isCircular"),o=p.get("numItems"),n=o-1;if(q<0){if(m){q=o+q;}else{q=p.get("selectedItem");}}else{if(q>n){if(m){q=q-o;}else{q=p.get("selectedItem");}}}return q;},_itemClickHandler:function(p){var r=this,m=r.get("element"),n,o,q=YAHOO.util.Event.getTarget(p);while(q&&q!=m&&q.id!=r._carouselEl){n=q.nodeName;if(n.toUpperCase()==r.get("carouselItemEl")){break;}q=q.parentNode;}if((o=r.getItemPositionById(q.id))>=0){r.set("selectedItem",r._getSelectedItem(o));r.focus();}},_keyboardEventHandler:function(o){var p=this,n=Y.getCharCode(o),m=false;if(p.isAnimating()){return;}switch(n){case 37:case 38:p.selectPreviousItem();m=true;break;case 39:case 40:p.selectNextItem();m=true;break;case 33:p.scrollPageBackward();m=true;break;case 34:p.scrollPageForward();m=true;break;}if(m){if(p.isAutoPlayOn()){p.stopAutoPlay();}Y.preventDefault(o);}},_loadItems:function(){var q=this,r=q.get("firstVisible"),n=0,m=q.get("numItems"),o=q.get("numVisible"),p=q.get("revealAmount");n=r+o-1+(p?1:0);n=n>m-1?m-1:n;if(!q.getItem(r)||!q.getItem(n)){q.fireEvent(K,{ev:K,first:r,last:n,num:n-r});}},_pagerClickHandler:function(n){var p=this,r,o=Y.getTarget(n),q;function m(t){var s=p.get("carouselItemEl");if(t.nodeName.toUpperCase()==s.toUpperCase()){t=a.getChildrenBy(t,function(u){return u.href||u.value;});if(t&&t[0]){return t[0];}}else{if(t.href||t.value){return t;}}return null;}if(o){o=m(o);if(!o){return;}q=o.href||o.value;if(k.isString(q)&&q){r=q.lastIndexOf("#");if(r!=-1){q=p.getItemPositionById(q.substring(r+1));p._selectedItem=q;p.scrollTo(q);if(!o.value){p.focus();}Y.preventDefault(n);}}}},_parseCarousel:function(o){var r=this,s,m,n,q,p;
m=r.CLASSES;n=r.get("carouselEl");q=false;for(s=o.firstChild;s;s=s.nextSibling){if(s.nodeType==1){p=s.nodeName;if(p.toUpperCase()==n){r._carouselEl=s;a.addClass(r._carouselEl,r.CLASSES.CAROUSEL_EL);q=true;}}}return q;},_parseCarouselItems:function(){var q=this,r,m,n,p,o=q._carouselEl;m=q.get("carouselItemEl");for(r=o.firstChild;r;r=r.nextSibling){if(r.nodeType==1){p=r.nodeName;if(p.toUpperCase()==m){if(r.id){n=r.id;}else{n=a.generateId();r.setAttribute("id",n);}q.addItem(r);}}}},_parseCarouselNavigation:function(s){var t=this,r,u=t.CLASSES,n,q,p,m,o=false;m=a.getElementsByClassName(u.PREV_PAGE,"*",s);if(m.length>0){for(q in m){if(m.hasOwnProperty(q)){n=m[q];if(n.nodeName=="INPUT"||n.nodeName=="BUTTON"){t._navBtns.prev.push(n);}else{p=n.getElementsByTagName("INPUT");if(k.isArray(p)&&p.length>0){t._navBtns.prev.push(p[0]);}else{p=n.getElementsByTagName("BUTTON");if(k.isArray(p)&&p.length>0){t._navBtns.prev.push(p[0]);}}}}}r={prev:m};}m=a.getElementsByClassName(u.NEXT_PAGE,"*",s);if(m.length>0){for(q in m){if(m.hasOwnProperty(q)){n=m[q];if(n.nodeName=="INPUT"||n.nodeName=="BUTTON"){t._navBtns.next.push(n);}else{p=n.getElementsByTagName("INPUT");if(k.isArray(p)&&p.length>0){t._navBtns.next.push(p[0]);}else{p=n.getElementsByTagName("BUTTON");if(k.isArray(p)&&p.length>0){t._navBtns.next.push(p[0]);}}}}}if(r){r.next=m;}else{r={next:m};}}if(r){t.set("navigation",r);o=true;}return o;},_refreshUi:function(){var m=this;m._hasRendered=true;m.fireEvent(G);},_setCarouselOffset:function(o){var m=this,n;n=m.get("isVertical")?"top":"left";o+=o!==0?Z(m._carouselEl,n):0;a.setStyle(m._carouselEl,n,o+"px");},_setupCarouselNavigation:function(){var r=this,p,n,m,t,q,s,o;m=r.CLASSES;q=a.getElementsByClassName(m.NAVIGATION,"DIV",r.get("element"));if(q.length===0){q=S("DIV",{className:m.NAVIGATION});r.insertBefore(q,a.getFirstChild(r.get("element")));}else{q=q[0];}r._pages.el=S("UL");q.appendChild(r._pages.el);t=r.get("navigation");if(k.isString(t.prev)||k.isArray(t.prev)){if(k.isString(t.prev)){t.prev=[t.prev];}for(p in t.prev){if(t.prev.hasOwnProperty(p)){r._navBtns.prev.push(a.get(t.prev[p]));}}}else{o=S("SPAN",{className:m.BUTTON+m.FIRST_NAV});a.setStyle(o,"visibility","visible");p=a.generateId();o.innerHTML='<button type="button" '+'id="'+p+'" name="'+r.STRINGS.PREVIOUS_BUTTON_TEXT+'">'+r.STRINGS.PREVIOUS_BUTTON_TEXT+"</button>";q.appendChild(o);p=a.get(p);r._navBtns.prev=[p];n={prev:[o]};}if(k.isString(t.next)||k.isArray(t.next)){if(k.isString(t.next)){t.next=[t.next];}for(p in t.next){if(t.next.hasOwnProperty(p)){r._navBtns.next.push(a.get(t.next[p]));}}}else{s=S("SPAN",{className:m.BUTTON+m.NEXT_NAV});a.setStyle(s,"visibility","visible");p=a.generateId();s.innerHTML='<button type="button" '+'id="'+p+'" name="'+r.STRINGS.NEXT_BUTTON_TEXT+'">'+r.STRINGS.NEXT_BUTTON_TEXT+"</button>";q.appendChild(s);p=a.get(p);r._navBtns.next=[p];if(n){n.next=[s];}else{n={next:[s]};}}if(n){r.set("navigation",n);}return q;},_setClipContainerSize:function(n,p){var u=this,q,m,r,s,t,v,o;r=u.get("isVertical");t=u.get("revealAmount");o=r?"height":"width";q=r?"top":"left";n=n||u._clipEl;if(!n){return;}p=p||u.get("numVisible");s=L.call(u,o);v=s*p;u._recomputeSize=(v===0);if(u._recomputeSize){u._hasRendered=false;return;}if(t>0){t=s*(t/100)*2;v+=t;m=parseFloat(a.getStyle(u._carouselEl,q));m=k.isNumber(m)?m:0;a.setStyle(u._carouselEl,q,m+(t/2)+"px");}if(r){v+=Z(u._carouselEl,"marginTop")+Z(u._carouselEl,"marginBottom")+Z(u._carouselEl,"paddingTop")+Z(u._carouselEl,"paddingBottom")+Z(u._carouselEl,"borderTopWidth")+Z(u._carouselEl,"borderBottomWidth");a.setStyle(n,o,(v-(p-1))+"px");}else{v+=Z(u._carouselEl,"marginLeft")+Z(u._carouselEl,"marginRight")+Z(u._carouselEl,"paddingLeft")+Z(u._carouselEl,"paddingRight")+Z(u._carouselEl,"borderLeftWidth")+Z(u._carouselEl,"borderRightWidth");a.setStyle(n,o,v+"px");}u._setContainerSize(n);},_setContainerSize:function(q,m){var r=this,o=r.CONFIG,n=r.CLASSES,s,p;s=r.get("isVertical");q=q||r._clipEl;m=m||(s?"height":"width");p=parseFloat(a.getStyle(q,m),10);p=k.isNumber(p)?p:0;if(s){p+=Z(r._carouselEl,"marginTop")+Z(r._carouselEl,"marginBottom")+Z(r._carouselEl,"paddingTop")+Z(r._carouselEl,"paddingBottom")+Z(r._carouselEl,"borderTopWidth")+Z(r._carouselEl,"borderBottomWidth")+Z(r._navEl,"height");}else{p+=Z(q,"marginLeft")+Z(q,"marginRight")+Z(q,"paddingLeft")+Z(q,"paddingRight")+Z(q,"borderLeftWidth")+Z(q,"borderRightWidth");}if(!s){if(p<o.HORZ_MIN_WIDTH){p=o.HORZ_MIN_WIDTH;r.addClass(n.MIN_WIDTH);}}r.setStyle(m,p+"px");if(s){p=L.call(r,"width");if(p<o.VERT_MIN_WIDTH){p=o.VERT_MIN_WIDTH;r.addClass(n.MIN_WIDTH);}r.setStyle("width",p+"px");}},_setFirstVisible:function(n){var m=this;if(n>=0&&n<m.get("numItems")){m.scrollTo(n);}else{n=m.get("firstVisible");}return n;},_setNavigation:function(m){var n=this;if(m.prev){Y.on(m.prev,"click",d,n);}if(m.next){Y.on(m.next,"click",g,n);}},_setNumVisible:function(n){var m=this;m._setClipContainerSize(m._clipEl,n);},_setNumItems:function(o){var n=this,m=n._itemsTable.numItems;if(k.isArray(n._itemsTable.items)){if(n._itemsTable.items.length!=m){m=n._itemsTable.items.length;n._itemsTable.numItems=m;}}if(o<m){while(m>o){n.removeItem(m-1);m--;}}return o;},_setOrientation:function(o){var n=this,m=n.CLASSES;if(o){n.replaceClass(m.HORIZONTAL,m.VERTICAL);}else{n.replaceClass(m.VERTICAL,m.HORIZONTAL);}n._itemsTable.size=0;return o;},_setRevealAmount:function(n){var m=this;if(n>=0&&n<=100){n=parseInt(n,10);n=k.isNumber(n)?n:0;m._setClipContainerSize();}else{n=m.get("revealAmount");}return n;},_setSelectedItem:function(m){this._selectedItem=m;},_syncUiForItemAdd:function(p){var t=this,r=t._carouselEl,m,u,o=t._itemsTable,n,q,s;q=k.isUndefined(p.pos)?o.numItems-1:p.pos;if(!k.isUndefined(o.items[q])){u=o.items[q];if(u&&!k.isUndefined(u.id)){n=a.get(u.id);}}if(!n){m=t._createCarouselItem({className:u.className,content:u.item,id:u.id});if(k.isUndefined(p.pos)){if(!k.isUndefined(o.loading[q])){n=o.loading[q];}if(n){r.replaceChild(m,n);delete o.loading[q];}else{r.appendChild(m);}}else{if(!k.isUndefined(o.items[p.pos+1])){s=a.get(o.items[p.pos+1].id);
}if(s){r.insertBefore(m,s);}else{}}}else{if(k.isUndefined(p.pos)){if(!a.isAncestor(t._carouselEl,n)){r.appendChild(n);}}else{if(!a.isAncestor(r,n)){if(!k.isUndefined(o.items[p.pos+1])){r.insertBefore(n,a.get(o.items[p.pos+1].id));}}}}if(!t._hasRendered){t._refreshUi();}if(t.get("selectedItem")<0){t.set("selectedItem",t.get("firstVisible"));}},_syncUiForItemRemove:function(r){var q=this,m=q._carouselEl,o,p,n,s;n=q.get("numItems");p=r.item;s=r.pos;if(p&&(o=a.get(p.id))){if(o&&a.isAncestor(m,o)){Y.purgeElement(o,true);m.removeChild(o);}if(q.get("selectedItem")==s){s=s>=n?n-1:s;q.set("selectedItem",s);}}else{}},_syncUiForLazyLoading:function(s){var r=this,n=r._carouselEl,q,o,m=r._itemsTable,p;for(o=s.first;o<=s.last;o++){q=r._createCarouselItem({className:r.CLASSES.ITEM_LOADING,content:r.STRINGS.ITEM_LOADING_CONTENT,id:a.generateId()});if(q){if(!k.isUndefined(m.items[s.last+1])){p=a.get(m.items[s.last+1].id);if(p){n.insertBefore(q,p);}else{}}else{n.appendChild(q);}}m.loading[o]=q;}},_updateNavButtons:function(q,n){var o,m=this.CLASSES,r,p=q.parentNode;if(!p){return;}r=p.parentNode;if(q.nodeName.toUpperCase()=="BUTTON"&&a.hasClass(p,m.BUTTON)){if(n){if(r){o=a.getChildren(r);if(o){a.removeClass(o,m.FOCUSSED_BUTTON);}}a.addClass(p,m.FOCUSSED_BUTTON);}else{a.removeClass(p,m.FOCUSSED_BUTTON);}}},_updatePagerButtons:function(){var v=this,t=v.CLASSES,u=v._pages.cur,m,s,q,w,o=v.get("numVisible"),r=v._pages.num,p=v._pages.el;if(r===0||!p){return;}a.setStyle(p,"visibility","hidden");while(p.firstChild){p.removeChild(p.firstChild);}for(q=0;q<r;q++){if(k.isUndefined(v._itemsTable.items[q*o])){a.setStyle(p,"visibility","visible");break;}w=v._itemsTable.items[q*o].id;m=document.createElement("LI");if(!m){a.setStyle(p,"visibility","visible");break;}if(q===0){a.addClass(m,t.FIRST_PAGE);}if(q==u){a.addClass(m,t.SELECTED_NAV);}s='<a href="#'+w+'" tabindex="0"><em>'+v.STRINGS.PAGER_PREFIX_TEXT+" "+(q+1)+"</em></a>";m.innerHTML=s;p.appendChild(m);}a.setStyle(p,"visibility","visible");},_updatePagerMenu:function(){var u=this,t=u._pages.cur,o,r,v,p=u.get("numVisible"),s=u._pages.num,q=u._pages.el,m;if(s===0){return;}m=document.createElement("SELECT");if(!m){return;}a.setStyle(q,"visibility","hidden");while(q.firstChild){q.removeChild(q.firstChild);}for(r=0;r<s;r++){if(k.isUndefined(u._itemsTable.items[r*p])){a.setStyle(q,"visibility","visible");break;}v=u._itemsTable.items[r*p].id;o=document.createElement("OPTION");if(!o){a.setStyle(q,"visibility","visible");break;}o.value="#"+v;o.innerHTML=u.STRINGS.PAGER_PREFIX_TEXT+" "+(r+1);if(r==t){o.setAttribute("selected","selected");}m.appendChild(o);}o=document.createElement("FORM");if(!o){}else{o.appendChild(m);q.appendChild(o);}a.setStyle(q,"visibility","visible");},_updateTabIndex:function(m){var n=this;if(m){if(n._focusableItemEl){n._focusableItemEl.tabIndex=-1;}n._focusableItemEl=m;m.tabIndex=0;}},_validateAnimation:function(m){var n=true;if(k.isObject(m)){if(m.speed){n=n&&k.isNumber(m.speed);}if(m.effect){n=n&&k.isFunction(m.effect);}else{if(!k.isUndefined(YAHOO.util.Easing)){m.effect=YAHOO.util.Easing.easeOut;}}}else{n=false;}return n;},_validateFirstVisible:function(o){var n=this,m=n.get("numItems");if(k.isNumber(o)){if(m===0&&o==m){return true;}else{return(o>=0&&o<m);}}return false;},_validateNavigation:function(m){var n;if(!k.isObject(m)){return false;}if(m.prev){if(!k.isArray(m.prev)){return false;}for(n in m.prev){if(m.prev.hasOwnProperty(n)){if(!k.isString(m.prev[n].nodeName)){return false;}}}}if(m.next){if(!k.isArray(m.next)){return false;}for(n in m.next){if(m.next.hasOwnProperty(n)){if(!k.isString(m.next[n].nodeName)){return false;}}}}return true;},_validateNumItems:function(m){return k.isNumber(m)&&(m>=0);},_validateNumVisible:function(m){var n=false;if(k.isNumber(m)){n=m>0&&m<=this.get("numItems");}return n;},_validateRevealAmount:function(m){var n=false;if(k.isNumber(m)){n=m>=0&&m<100;}return n;},_validateScrollIncrement:function(m){var n=false;if(k.isNumber(m)){n=(m>0&&m<this.get("numItems"));}return n;}});})();YAHOO.register("carousel",YAHOO.widget.Carousel,{version:"2.7.0",build:"1796"});/**
 * These constants are used to access things like the title
 */

gadgets.IfrGadget.prototype.GADGET_IFRAME_PREFIX_ = 'remote_iframe_';

gadgets.IfrGadget.prototype.CONTAINER = 'default';
gadgets.IfrGadget.prototype.cssClassGadget = 'gadgets-gadget';
gadgets.IfrGadget.prototype.cssClassTitleBar = 'gadget-zone-chrome-title-bar';
gadgets.IfrGadget.prototype.cssClassTitle = 'gadget-zone-chrome-title-bar-title-button';

gadgets.IfrGadget.prototype.cssClassTitleButtonBar =
    'gadgets-gadget-title-button-bar';
gadgets.IfrGadget.prototype.cssClassGadgetUserPrefsDialog =
    'gadgets-gadget-user-prefs-dialog';
gadgets.IfrGadget.prototype.cssClassGadgetUserPrefsDialogActionBar =
    'gadgets-gadget-user-prefs-dialog-action-bar';
gadgets.IfrGadget.prototype.cssClassTitleButton = 'gadgets-gadget-title-button';
gadgets.IfrGadget.prototype.cssClassGadgetContent = 'gadgets-gadget-content';


/*
 * This overrides the creation of the title bar method of the gadgets.js.
 * This has been replaced with our own GWT method to create the title bar 
 * we use the same name convention to link up the correct titlebar to the correct gadget
 * 
 */
gadgets.IfrGadget.prototype.getTitleBarContent = function(continuation) {
	continuation('');
};


gadgets.Container.prototype.addGadgetWithId = function(gadget, id) {
	  gadget.id = id;
	  gadget.setUserPrefs(this.userPrefStore.getPrefs(gadget));
	  this.gadgets_[this.getGadgetKey_(gadget.id)] = gadget;
};



gadgets.StaticLayoutManager.prototype.addGadgetChromeId = 
	function(gadgetChromeId) {
    if (this.gadgetChromeIds_ ) {
            this.gadgetChromeIds_.push(gadgetChromeId);  
    }
    else {
            this.gadgetChromeIds_ = [gadgetChromeId];
    }
 };
 

gadgets.StaticLayoutManager.prototype.getGadgetChrome = function(gadget) {
	//TODO I hate this for loop.  We need to totally rewrite the gadget.js file to get rid of the need to do this. I SO HATE THIS
	var chromeIndex=null;
	var inc=0
	  for (var key in gadgets.container.gadgets_) {
		  	if (key=="gadget_"+gadget.id)
		  	{
		  		chromeIndex=inc;	
		  	}
		  	inc++;
	  }
	var chromeId = this.gadgetChromeIds_[chromeIndex];
return chromeId ? document.getElementById(chromeId) : null;
};




