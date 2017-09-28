'use strict';
const Benchmark = require( 'benchmark' );
const fixtures = require( '../tests/fixtures' );
const subject = require( '../lib/estimation' );
const suite = new Benchmark.Suite;
const moment = require('moment');

console.log(`Benchmarked on ${moment()} for ${process.env.COMMIT}`);

suite.add( 'estimate', function(){
    subject.estimate( fixtures.realComparisons, fixtures.realRepresentations);
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
