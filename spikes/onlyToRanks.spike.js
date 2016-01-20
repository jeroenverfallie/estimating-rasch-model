'use strict';
const _ = require( 'lodash' );
const fixtures = require( './fixtures' );
const estimation = require( '../lib/estimation' );

const comparisons = _.cloneDeep( fixtures.comparisons );
const representations = _.cloneDeep( fixtures[ 'representations-only-to-ranks' ] );
estimation.estimateCJ( comparisons, representations );
console.log( representations );