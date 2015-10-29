'use strict';
var Benchmark = require( 'benchmark' );
var fs = require( 'fs' );
var path = require( 'path' );

var comparisons = JSON.parse( fs.readFileSync( path.resolve( __dirname, '../testing/Comparison_scenario2.JSON' ), 'utf8' ) );
var representations = JSON.parse( fs.readFileSync( path.resolve( __dirname, '../testing/Representation_scenario2.JSON' ), 'utf8' ) );
var subject = require( '../lib/estimation' );
var suite = new Benchmark.Suite;

suite.add( 'estimateCJ', function(){
    subject.estimateCJ( comparisons, representations );
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