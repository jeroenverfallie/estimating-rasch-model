var _ = require( 'lodash' );
var Stats = require( './raschStats' );

function capToRange( num,
                     floor,
                     ceil ){
  if( num < floor ){
    return floor;
  }
  if( num > ceil ){
    return ceil;
  }
  return num;
}

var estimateCJ = function( comparisons,
                           representations ){
  var representationsByType = _.groupBy( representations, 'rankType' );
  var filteredRepresentationsById = _.reduce( representationsByType[ 'to rank' ], function( memo,
                                                                                            representation ){
    if( _.get( representation, [ "compared", "length" ], 0 ) > 0 ){
      representation.ability = {
        value: 0,
        se: 0
      };
      memo[ representation._id ] = representation;
    }
    return memo;
  }, {} );

  var allRepresentationsById = _.reduce( representations, function( memo,
                                                                    representation ){
    memo[ representation._id ] = representation;
    return memo;
  }, {} );

  var selectedIdCatch = []; // needed to catch a bug
  // If the abilities are estimated a first time, i.e. before the end of the assessment,
  // and after more comparisons the abilities are estimated again (happens in benchmark CJ)
  // then the .selectedNum of the selected representaion (selectedId) needs to be set to 0 again
  // if this does not happen the proportion correct is higher and thus the estimates are wrong

  _.forEach( comparisons, function( comparison ){
    var selectedId = _.get( comparison, [ "data", "selection" ], false );
    if( selectedId ){
      if( !(_.includes( selectedIdCatch, selectedId ) ) ){
        selectedIdCatch.push( selectedId );
        allRepresentationsById[ selectedId ].selectedNum = 0
      }
      allRepresentationsById[ selectedId ].selectedNum = _.get( allRepresentationsById, [
          selectedId, 'selectedNum'
        ], 0 ) + 1;
    }
  } );

  //console.log( allRepresentationsById );

  //loop 4 times (+1) through the estimation
  for( var i = 4; i >= 0; i-- ){
    CML( filteredRepresentationsById, _.cloneDeep( allRepresentationsById ), i );
  }
};

//conditional maximum likelihood
var CML = function( representationsToRankById,
                    representationsFromPreviousIterationById,
                    iteration ){
  _.forEach( representationsToRankById, function( currentRepresentation ){
    var representationFromPreviousIteration = representationsFromPreviousIterationById[ currentRepresentation._id ];

    var expected = _.reduce( currentRepresentation.compared, function( memo,
                                                                       opponentId ){
      var opponent = representationsFromPreviousIterationById[ opponentId ];
      memo.value += Stats.raschProb( representationFromPreviousIteration.ability.value, opponent.ability.value );
      memo.info += Stats.fischerI( representationFromPreviousIteration.ability.value, opponent.ability.value );
      return memo;
    }, {
      value: 0,
      info: 0
    } );
    if( iteration > 0 ){
      var selectedNum = currentRepresentation.selectedNum || 0;
      var value = currentRepresentation.ability.value + (( selectedNum - expected.value) / expected.info);
      currentRepresentation.ability.value = capToRange( value, -10, 10 );
    } else {
      var se = 1 / Math.sqrt( expected.info );
      if( !_.isFinite( se ) || _.isNaN( se ) ){
        se = 200;
      }
      currentRepresentation.ability.se = se;
    }
  } );
};

module.exports = {
  estimateCJ: estimateCJ,
  CML: CML
};