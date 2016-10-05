'use strict';
var Benchmark = require( 'benchmark' );
var fixtures = require( '../tests/fixtures' );
var subject = require( '../lib/estimation' );
var suite = new Benchmark.Suite;

suite.add( 'estimateCJ', function(){
    subject.estimateCJ( fixtures.comparisons, fixtures.representations );
  } )
  .on( 'error', function( event ){
    console.log( 'ERROR', event.target.error );
  } )
  .on( 'cycle', function( event ){
    console.log( String( event.target ) );
  } )
  // add listeners
  .on( 'complete', function( event ){
    console.log( String( event.target ) );
  } )
  // run async
  .run( { 'async': true } );