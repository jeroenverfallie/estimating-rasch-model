'use strict';
const Benchmark = require( 'benchmark' );
const fixtures = require( '../test/fixtures' );
const subject = require( '../lib/estimation' );
const suite = new Benchmark.Suite;
const moment = require('moment');

console.log(`Benchmarked on ${moment()} for ${process.env.COMMIT}`);

suite.add( 'estimate', function(){
    subject.estimate( {comparisons:fixtures.realComparisons, items:fixtures.realRepresentations});
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
