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
    representation.selectedNum = 0;
    memo[ representation._id ] = representation;
    return memo;
  }, {} );

  _.forEach( comparisons, function( comparison ){
    var selectedId = _.get( comparison, [ "data", "selection" ], false );
    var representationAId = _.get( comparison, [ "representations", "a" ], false );
    var representationBId = _.get( comparison, [ "representations", "b" ], false );
    if( selectedId ){
      allRepresentationsById[ selectedId ].selectedNum = _.get( allRepresentationsById, [
          selectedId, 'selectedNum'
        ], 0 ) + 1;
      allRepresentationsById[ representationAId ].comparedNum = _.get( allRepresentationsById, [
            representationAId, 'comparedNum'
          ], 0 ) + 1;
      allRepresentationsById[ representationBId ].comparedNum = _.get( allRepresentationsById, [
            representationBId, 'comparedNum'
          ], 0 ) + 1;
    }
  } );

  _.forEach( filteredRepresentationsById, function( representation ){
    var interm = representation.comparedNum - 2*0.3;
    interm = interm * representation.selectedNum / representation.comparedNum;
    representation.selectedNum = 0.3 + interm
  } );
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