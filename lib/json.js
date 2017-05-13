/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * JSON helpers
 * @module skyring/lib/json
 * @author Eric Satterwhite
 * @since 1.0.0
 */

/**
 * Composite JSON ojbect
 * @typedef {Object} Result
 * @property {?Error} [error=null] An error if json parsing faile
 * @property {Object} value the result of Json parsing
 **/

/**
 * Wrpper around try/catch of JSON parsing
 * @method module:skyring/lib/json
 * @param {String} json A JSON string to parse
 * @return {module:skyring/lib/json~Result}
 **/
exports.parse = function parse(json) {
  if (!json) return {error: null, value: {}};
  try {
    return { error: null, value: JSON.parse(json) };
  } catch( e ) {
    return {error: e, value: null};
  }
};

