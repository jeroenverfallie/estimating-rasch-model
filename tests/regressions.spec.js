/**
 * Created by creynder on 10/10/16.
 */
'use strict';

const expect = require('must');
const subject = require('../lib/estimation');
const _ = require('lodash');
const fixtures = require('./fixtures');


describe('regresessions', function () {
    describe("spec file", function () {
        it("must be found", function () {
            expect(true).to.be.true();
        });
    });

    describe('invalid recalculation', function () {
        it('should not calculate representation "0607" incorrectly', function () {
            const fx = _.cloneDeep(fixtures.invalidCalculation);
            subject.estimateCJ(fx.comparisons, fx.representations);
            const rep = _.find(fx.representations, function (r) {
                return r._id === '0607'
            });
            expect({
                ability: rep.ability.value.toFixed(3),
                se: rep.ability.se.toFixed(3)
            }).to.eql({
                ability: "-0.960",
                se: "2.182"
            });
        });
        it('should not recalculate representation "0607"', function () {
            const fx = _.cloneDeep(fixtures.invalidRecalculation);
            subject.estimateCJ(fx.comparisons, fx.representations);
            const rep = _.find(fx.representations, function (r) {
                return r._id === '0607'
            });
            expect(rep.ability.value.toFixed(3)).to.equal("-0.960");
            expect(rep.ability.se.toFixed(3)).to.equal("2.182");
        });
    });
});