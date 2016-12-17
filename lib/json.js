'use strict';

exports.parse = function parse(json) {
  if (!json) return {error: null, value: {}}
  try {
    return { error: null, value: JSON.parse(json) }
  } catch( e ) {
    return {error: e, value: null}
  }
}

