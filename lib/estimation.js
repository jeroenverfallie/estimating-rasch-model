const {clamp, cloneDeep, without} = require('lodash');
const pm = require('d-pac.functions').pm;

/**
 * retrieve a VO from the cache lookup, or create one and store it
 * @param cache
 * @param id
 * @returns {*}
 */
function getOrCreate(cache, id) {

  let obj = cache.objById[id];
  if (obj) {
    return obj;
  }

  const item = cache.itemsById[id];

  //initialize our VO
  obj = {
    selectedNum: 0,
    comparedNum: 0,
    ability: item.ability,
    se: item.se,
    ranked: item.ranked,
    id: item.id
  };
  cache.objById[id] = obj;
  return obj;
}

/**
 * - increments the `comparedNum`
 * - if it's the first comparison for an unranked item also initialize its abilities
 * - and store it in the unranked lookup hash
 *
 * @param cache
 * @param id
 */
function prepValuesOnFirstComparison(cache, id) {
  const obj = getOrCreate(cache, id);
  obj.comparedNum++;
  if (obj.comparedNum === 1 && !obj.ranked) {
    obj.ability = 0;
    obj.se = 0;
    cache.unrankedById[id] = obj;
  }
}

//conditional maximum likelihood
function CML(cache,
             comparisons,
             iteration) {
  //we need the values from the previous iteration
  const previousUnranked = cloneDeep(cache.unrankedById);

  Object.keys(cache.unrankedById)
      .forEach((id) => {
        const current = cache.objById[id];
        const prev = previousUnranked[id];

        //let's calculate the fisher information and rasch
        //by comparing the (previous values of the) item to all of its opponents
        const expected = comparisons.reduce((memo, comparison) => {
          const ids = without([comparison.itemA, comparison.itemB], id);
          if (comparison.selected && ids.length === 1) {
            const opponent = previousUnranked[ids[0]] || cache.objById[ids[0]];
            memo.value += pm.rasch(prev.ability, opponent.ability);
            memo.info += pm.fisher(prev.ability, opponent.ability);
          }
          return memo;
        }, {
          value: 0,
          info: 0
        });

        //let's calculate the ability on the first 4 passes
        if (iteration > 0) {
          current.ability = clamp(current.ability + ((current.selectedNum - expected.value) / expected.info), -10, 10);
        } else { // on the last pass we can calculate the standard error
          current.se = clamp(1 / Math.sqrt(expected.info), 200);
        }
      });

}

module.exports = {
  estimate: function estimate(comparisons,
                              items) {

    const cache = {itemsById: {}, objById: {}, unrankedById: {}};

    //map items by id in lookup hash
    items.forEach((item) => cache.itemsById[item.id] = item);

    //we need to tally some stuff:
    //- which item has been selected
    //- which items have been compared
    comparisons.forEach((comparison) => {
      if (comparison.selected) { // we only want to take "finished" comparisons into account

        getOrCreate(cache, comparison.selected).selectedNum++;
        prepValuesOnFirstComparison(cache, comparison.itemA);
        prepValuesOnFirstComparison(cache, comparison.itemB);
      }
    });

    Object.keys(cache.unrankedById)
        .forEach((id) => {
          //correction to avoid Infinity values later on
          const obj = cache.unrankedById[id];
          let interm = obj.comparedNum - 2 * 0.003;
          interm = interm * obj.selectedNum / obj.comparedNum;
          obj.selectedNum = 0.003 + interm;
        });


    //loop 4 times (+1) through the estimation
    for (let i = 4; i >= 0; i--) {
      CML(cache, comparisons, i);
    }

    return Object.values(cache.unrankedById);
  }
};