'use strict';

var expect = require( 'must' );
var subject = require( '../lib/estimation' );
var fixtures = require( './fixtures' );

describe( 'estimating rasch model', function(){
  describe( 'the estimation results', function(){
    it( 'should equal R generated results', function(){
      expect( fixtures.representations ).to.not.eql( fixtures.results );
      subject.estimateCJ( fixtures.comparisons, fixtures.representations );
      expect( fixtures.representations ).to.eql( fixtures.results );
    } );
  } );
} );