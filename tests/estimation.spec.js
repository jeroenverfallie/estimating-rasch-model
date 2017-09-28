'use strict';

const expect = require('must');
const subject = require('../lib/estimation');
const _ = require('lodash');
const {
  mixedRankedComparisons,
  mixedRankedRepresentations,
  mixedRankedResults,
  noRankedComparisons,
  noRankedRepresentations,
  noRankedResults,
  realComparisons,
  realRepresentations,
  realResults
} = require('./fixtures');

/**
 *
 * @param {Object[]} representations
 * @param {string} representations[]._id - id of the item
 * @param {string} representations[].ranktype - ["ranked", "to rank", "benchmark"]
 * @param {Object} [representations[].ability]
 * @param {number} [representations[].ability.value] - the ability
 * @param {number} [representations[].ability.se] - the standard error
 */
function convertRepresentations(representations) {
  return representations.map((representation) => {
    return {
      id: representation._id,
      ability: _.get(representation, ["ability", "value"], null),
      se: _.get(representation, ["ability", "se"], null),
      ranked: (representation.rankType !== "to rank")
    };
  });
}

/**
 *
 * @param {Object[]} comparisons
 * @param {Object} comparisons[].data
 * @param {string} comparisons[].data.selection - ID of the selected item
 * @param {Object} comparisons[].representations
 * @param {string} comparisons[].representations.a - ID for the "A" item
 * @param {string} comparisons[].representations.b - ID for the "B" item
 */
function convertComparisons(comparisons) {
  return comparisons.map((comparison) => {
    return {
      selected: _.get(comparison, ["data", "selection"], null),
      itemA: comparison.representations.a,
      itemB: comparison.representations.b
    };
  });
}

function mapToLookupHash(memo, r) {
  memo[r.id] = r;
  return memo;
}

function prepResult(o) {
  o.ability = _.round(o.ability, 4);
  o.se = _.round(o.se, 4);
  return {
    id: o.id,
    ability: o.ability,
    se: o.se,
    ranked: o.ranked
  };
}


describe.only('estimating rasch model', function () {
  describe("spec file", function () {
    it("must be found", function () {
      expect(true).to.be.true();
    });
  });

  describe('the estimation results', function () {
    describe('if not all representations are to rank', function () {

      const expected = convertRepresentations(mixedRankedResults.filter((r) => r.rankType === "to rank"))
          .reduce(mapToLookupHash, {});
      const representations = convertRepresentations(mixedRankedRepresentations);
      const comparisons = convertComparisons(mixedRankedComparisons);


      it('should equal R generated results if all data are provided at once', function () {
        const actual = subject.estimate(comparisons, representations)
            .map(prepResult)
            .reduce(mapToLookupHash, {});
        expect(actual).to.eql(expected);

      });

      it('should equal R generated results if estimates were first based on a part of the data', function () {

        const firstComparisons = _.sampleSize(comparisons, comparisons.length / 2);
        subject.estimate(firstComparisons, representations);
        const actual = subject.estimate(comparisons, representations)
            .map(prepResult)
            .reduce(mapToLookupHash, {});
        expect(actual).to.eql(expected);

      });
    });

    describe('if all representations are to rank', function () {
      const expected = convertRepresentations(noRankedResults).reduce(mapToLookupHash, {});
      const representations = convertRepresentations(noRankedRepresentations);
      const comparisons = convertComparisons(noRankedComparisons);

      it('should equal R generated results if all data are provided at once', function () {
        const actual = subject.estimate(comparisons, representations)
            .map(prepResult)
            .reduce(mapToLookupHash, {});
        expect(actual).to.eql(expected);
      });

      it('should equal R generated results if estimates were first based on a part of the data', function () {
        const firstComparisons = _.sampleSize(comparisons, comparisons.length / 2);
        subject.estimate(firstComparisons, representations);
        const actual = subject.estimate(comparisons, representations)
            .map(prepResult)
            .reduce(mapToLookupHash, {});
        expect(actual).to.eql(expected);
      });
    });
    describe('real data', function () {
      const expected = convertRepresentations(realResults).reduce(mapToLookupHash, {});
      const representations = convertRepresentations(realRepresentations);
      const comparisons = convertComparisons(realComparisons);
      it('should equal R generated results', function () {
        const actual = subject.estimate(comparisons, representations)
            .map(prepResult)
            .reduce(mapToLookupHash, {});
        expect(actual).to.eql(expected);
      });
    });
  });
});
