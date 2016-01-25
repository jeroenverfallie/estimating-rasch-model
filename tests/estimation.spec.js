'use strict';

var expect = require('must');
var subject = require('../lib/estimation');
var _ = require('lodash');
var fixtures = require('./fixtures');


describe('estimating rasch model', function () {
    describe("spec file", function () {
        it("must be found", function () {
            expect(true).to.be.true();
        });
    });

    describe('the estimation results', function () {
        describe('if not all representations are to rank', function () {

            var ResultsValue = _.map(fixtures.resultsPartRanked, function (resultRepr) {
                return _.get(resultRepr.ability, "value")
            });


            var ResultsSe = _.map(fixtures.resultsPartRanked, function (resultRepr) {
                return _.get(resultRepr.ability, "se")
            });

            var estRepresentations = fixtures.representationsPartRanked;

            beforeEach( function(){
                _.forEach( estRepresentations, function( repr ){
                    if( _.get( repr, "type" ) == "to rank")
                        repr.ability = {
                            "value": 0,
                            "se": 0
                        }
                })
            });

            it('should equal R generated results if all data are provided at once', function () {
                expect(estRepresentations).to.not.eql(fixtures.resultsPartRanked);

                subject.estimateCJ(fixtures.comparisonsPartRanked, estRepresentations);


                var groups = _.groupBy(estRepresentations, '_id');

                var estimatesValue = _.map(fixtures.resultsPartRanked, function (i) {
                    var temp = _.get( groups, i._id );
                    return  _.round( _.get(temp, [ "0", "ability", "value" ] ), 4 );
                });

                var estimatesSe = _.map(fixtures.resultsPartRanked, function (i) {
                    var temp = _.get( groups, i._id );
                    return  _.round( _.get(temp, [ "0", "ability", "se" ] ), 4 );
                });

                expect(estimatesValue).to.eql(ResultsValue);
                expect(estimatesSe).to.eql(ResultsSe);
            });

            it('should equal R generated results if estimates were first based on a part of the data', function () {
                expect(estRepresentations).to.not.eql(fixtures.resultsPartRanked);

                var Ncomparisons = fixtures.comparisonsPartRanked.length;
                var NcomparisonsSplit = Ncomparisons / 2;

                var comparisonsA = fixtures.comparisonsPartRanked.slice( 0,NcomparisonsSplit );

                subject.estimateCJ(comparisonsA, estRepresentations);
                subject.estimateCJ(fixtures.comparisonsPartRanked, estRepresentations);

                var groups = _.groupBy(estRepresentations, '_id');

                var estimatesValue = _.map(fixtures.resultsPartRanked, function (i) {
                    var temp = _.get( groups, i._id );
                    return  _.round( _.get(temp, [ "0", "ability", "value" ] ), 4 );
                });

                var estimatesSe = _.map(fixtures.resultsPartRanked, function (i) {
                    var temp = _.get( groups, i._id );
                    return  _.round( _.get(temp, [ "0", "ability", "se" ] ), 4 );
                });

                expect(estimatesValue).to.eql(ResultsValue);
                expect(estimatesSe).to.eql(ResultsSe);
            });
        });

    });
});