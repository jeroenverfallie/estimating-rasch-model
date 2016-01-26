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

            var ResultsValue = _.map(fixtures.resultsPartRanked, "ability.value");
            var ResultsSe = _.map(fixtures.resultsPartRanked, "ability.se");
            var estRepresentations;

            beforeEach(function () {
                estRepresentations = _.cloneDeep(fixtures.repsPartRanked);
            });

            it('should equal R generated results if all data are provided at once', function () {
                expect(estRepresentations).to.not.eql(fixtures.resultsPartRanked);

                subject.estimateCJ(fixtures.comparisonsPartRanked, estRepresentations);

                var estimatesValue = [];
                var estimatesSe = [];
                _.each(estRepresentations, function (representation) {
                    estimatesValue.push(_.round(representation.ability.value, 4));
                    estimatesSe.push(_.round(representation.ability.se, 4));
                });

                expect(estimatesValue).to.eql(ResultsValue);
                expect(estimatesSe).to.eql(ResultsSe);
            });

            it('should equal R generated results if estimates were first based on a part of the data', function () {
                expect(estRepresentations).to.not.eql(fixtures.resultsPartRanked);

                var Ncomparisons = fixtures.comparisonsPartRanked.length;
                var NcomparisonsSplit = Ncomparisons / 2;

                var comparisonsA = fixtures.comparisonsPartRanked.slice(0, NcomparisonsSplit);

                subject.estimateCJ(comparisonsA, estRepresentations);
                subject.estimateCJ(fixtures.comparisonsPartRanked, estRepresentations);

                var estimatesValue = [];
                var estimatesSe = [];
                _.each(estRepresentations, function (representation) {
                    estimatesValue.push(_.round(representation.ability.value, 4));
                    estimatesSe.push(_.round(representation.ability.se, 4));
                });

                expect(estimatesValue).to.eql(ResultsValue);
                expect(estimatesSe).to.eql(ResultsSe);
            });
        });

        describe('if all representations are to rank', function () {

            var ResultsValue = _.map(fixtures.resultsNoneRanked, "ability.value");
            var ResultsSe = _.map(fixtures.resultsNoneRanked, "ability.se");
            var estRepresentations;

            beforeEach(function () {
                estRepresentations = _.cloneDeep(fixtures.repsNoneRanked);
            });

            it('should equal R generated results if all data are provided at once', function () {
                expect(estRepresentations).to.not.eql(fixtures.resultsNoneRanked);

                subject.estimateCJ(fixtures.comparisonsNoneRanked, estRepresentations);

                var estimatesValue = [];
                var estimatesSe = [];
                _.each(estRepresentations, function (representation) {
                    estimatesValue.push(_.round(representation.ability.value, 4));
                    estimatesSe.push(_.round(representation.ability.se, 4));
                });

                expect(estimatesValue).to.eql(ResultsValue);
                expect(estimatesSe).to.eql(ResultsSe);
            });

            it('should equal R generated results if estimates were first based on a part of the data', function () {
                expect(estRepresentations).to.not.eql(fixtures.resultsNoneRanked);

                var Ncomparisons = fixtures.comparisonsNoneRanked.length;
                var NcomparisonsSplit = Ncomparisons / 2;

                var comparisonsA = fixtures.comparisonsNoneRanked.slice(0, NcomparisonsSplit);

                subject.estimateCJ(comparisonsA, estRepresentations);
                subject.estimateCJ(fixtures.comparisonsNoneRanked, estRepresentations);

                var estimatesValue = [];
                var estimatesSe = [];
                _.each(estRepresentations, function (representation) {
                    estimatesValue.push(_.round(representation.ability.value, 4));
                    estimatesSe.push(_.round(representation.ability.se, 4));
                });

                expect(estimatesValue).to.eql(ResultsValue);
                expect(estimatesSe).to.eql(ResultsSe);
            });
        });
    });
});
