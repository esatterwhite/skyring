'use strict';

exports.parse = function parse(json) {
	try {
		return { error: null, value: JSON.parse(json) }
	} catch( e ) {
		return {error: e, value: null}
	}
}

