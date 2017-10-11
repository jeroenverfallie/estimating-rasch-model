const {
  clamp,
  cloneDeep,
  without,
  values,
  isArray
} = require('lodash');
const pm = require('d-pac.functions').pm;

/**
 * @typedef {Object} Item
 * @property {string} id - ID of the item
 * @property {boolean} ranked - whether or not the item is ranked. Only unranked items (i.e. ranked: `false`) are estimated
 * @property {number} ability - the ability
 * @property {number} se - standard error
 */

/**
 * @typedef {Object} Comparison
 * @property {string} a - the ID of the "A" item
 * @property {string} b - the ID of the "B" item
 * @property {?string} [selected] - the ID of the selected item
 */

/**
 * @typedef {Object} ValueObject
 * @property {string} id - the ID of the corresponding item
 * @property {number} selectedNum - the number of times the item has been selected
 * @property {number} comparisonNum - the number of times the item has been compared
 * @property {boolean} ranked - whether or not the item is ranked. Only unranked items (i.e. ranked: `false`) are estimated
 * @property {?number} [ability] - the ability
 * @property {?number} [se] - standard error
 */

/**
 * @private
 * @typedef {Object} Lookup
 * @property {Object} itemsById - map of {@link Item}
 * @property {object} objById - map of {@link ValueObject}
 * @property {object} unrankedById - map of {@link ValueObject}
 */

/**
 * retrieve a {@link ValueObject} from the lookup map, or create one and store it
 * @private
 * @param {Lookup} lookup
 * @param {string} id
 * @returns {ValueObject}
 */
function getOrCreate(lookup, id) {

  let obj = lookup.objById[id];
  if (obj) {
    return obj;
  }

  const item = lookup.itemsById[id];

  //initialize our VO
  obj = {
    selectedNum: 0,
    comparedNum: 0,
    ability: item.ability,
    se: item.se,
    ranked: item.ranked,
    id: item.id
  };
  lookup.objById[id] = obj;
  return obj;
}

/**
 * - increments the `comparedNum`
 * - if it's the first comparison for an unranked item also initialize its abilities
 * - and store it in the unranked lookup hash
 *
 * @private
 * @param {Lookup} lookup
 * @param {string} id
 */
function prepValuesOnFirstComparison(lookup, id) {
  const obj = getOrCreate(lookup, id);
  obj.comparedNum++;
  if (obj.comparedNum === 1 && !obj.ranked) {
    obj.ability = 0;
    obj.se = 0;
    lookup.unrankedById[id] = obj;
  }
}


/**
 * conditional maximum likelihood
 * @private
 * @param {Lookup} lookup
 * @param {Comparison[]} comparisons
 * @param {number} iteration
 * @function
 *
 */
function CML(lookup,
             comparisons,
             iteration) {
  //we need the values from the previous iteration
  const previousUnranked = cloneDeep(lookup.unrankedById);

  Object.keys(lookup.unrankedById)
      .forEach((id) => {
        const current = lookup.objById[id];
        const prev = previousUnranked[id];

        //let's calculate the fisher information and rasch
        //by comparing the (previous values of the) item to all of its opponents
        const expected = comparisons.reduce((memo, comparison) => {
          const ids = without([comparison.a, comparison.b], id);
          if (comparison.selected && ids.length === 1) {
            const opponent = previousUnranked[ids[0]] || lookup.objById[ids[0]];
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
  /**
   * Estimates the items featured in comparisons
   * @param {Comparison[]} comparisons
   * @param {Item[]|{}} items - An Array or a map of {@link Item}
   * @returns {ValueObject[]|{}} An Array or a map of {@link Item} (reflects the type of parameter `items`)
   */
  estimate: function estimate(comparisons,
                              items) {

    const lookup = {itemsById: {}, objById: {}, unrankedById: {}};

    if (isArray(items)) {
      //map items by id in lookup hash
      items.forEach((item) => lookup.itemsById[item.id] = item);
    } else {
      lookup.itemsById = items;
    }

    //we need to tally some stuff:
    //- which item has been selected
    //- which items have been compared
    comparisons.forEach((comparison) => {
      if (comparison.selected) { // we only want to take "finished" comparisons into account

        getOrCreate(lookup, comparison.selected).selectedNum++;
        prepValuesOnFirstComparison(lookup, comparison.a);
        prepValuesOnFirstComparison(lookup, comparison.b);
      }
    });

    Object.keys(lookup.unrankedById)
        .forEach((id) => {
          //correction to avoid Infinity values later on
          const obj = lookup.unrankedById[id];
          let interm = obj.comparedNum - 2 * 0.003;
          interm = interm * obj.selectedNum / obj.comparedNum;
          obj.selectedNum = 0.003 + interm;
        });


    //loop 4 times (+1) through the estimation
    for (let i = 4; i >= 0; i--) {
      CML(lookup, comparisons, i);
    }

    return (isArray(items))
        ? values(lookup.unrankedById)
        : lookup.unrankedById;
  }
};