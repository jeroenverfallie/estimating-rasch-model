var _ = require( 'lodash' );
var math = require( 'math' );
var Stats = require( './raschStats' );

function restructure( data ){
    // as argument we get an array of comparison objects of the following form (only relevant attributes)
    //      .A: containing ._id of representation A (mostly left)
    //      .B: containing ._id of representation B (mostly right)
    //      .selected= containing _.id of selected representation

    // as output we need an array of objects with following attributes (array has length data.length())
    //      array[i].A: representation A
    //      array[i].B: representation B
    //      array[i].score: 1 if data.selected=A , 0 if data.selected=B

    var reData = [];

    _.forEach( data, function( D ){       // for each object in data
        if( _.get( D, 'data.selection', undefined ) !== undefined ){
            reData.push( {            //     add a new object at the end of the array restrData.push({
                A: D.representations.a,
                B: D.representations.b,
                score: (D.data.selection == D.representations.a)
                    ? 1
                    : 0      // if selected=A then 1 else (if selected=B) 0
            } );//end .push

        }
    } ); //end .forEach

    return reData;// return the array
}

var estimateCJ = function( comparison,
                           representation ){
    // initially set estimates of representation "to rank" to 0
    _.forEach( representation, function( item ){     //loop through representation
        if( item.rankType == "to rank" ){       //only the representation "to rank" need to be estimated
            item.ability.value = 0;
            item.ability.se = 0;
        }//end if
    } );//end .forEach

    // restructure the data
    var Data = restructure( comparison );

    //loop 4 times (+1) through the estimation
    for( var i = 4; i >= 0; i-- ){
        CML( Data, representation, _.cloneDeep(representation), i );    //representation.slice(0) because we need to acces the ability estimates from the
        //  previous iteration. Without this we would increasingly use the currently
        //  estimated abilities, eventually leading to wrong estimates and unbound
        //  likelihoods!
    }
};

var CML = function( myData,
                    myItems,
                    myTrueItems,
                    counter ){
    // when all the items are to rank, there is need for a reference category. So we should set the first item to ranked
    var refCatSet = false;
    var ranked = [];
    for( var k = 0; k < myItems.length; k++ ){
        if( myItems[ k ].rankType == "ranked" ){
            ranked.push( myItems[ k ] )
        }
    }
    if( ranked.length <= 0 ){
        myItems[ 0 ].rankType = "ranked";
        refCatSet = true;
    }
    for( var j = 0; j < myItems.length; j++ ){//for1   //loop through the items
        if( myItems[ j ].rankType == "to rank" ){ //if1          //only the item "to rank" should be estimated (This is generic because if you don't have a previous ranking, all items will be "to rank"
            var selected = myItems[ j ];                    //save the current representation
            var oppos = selected.compared;           //save the opponent id's
            //calculate the observed score=sum off all wins
            //var obsScore=0;

            var tempScoreA = _.sum( myData, function( aData ){
                if( aData.A == selected._id ){
                    return aData.score
                }
            } );
            var tempScoreB = _.sum( myData, function( aData ){
                if( aData.B == selected._id ){
                    return math.abs( aData.score - 1 )
                }
            } );
            var obsScore = tempScoreA + tempScoreB;

            if( selected.compared.length > 0 ){//if4     //if selected has already been compared
                var opponents = _.map( oppos, function( id ){//map1    //find the structure for which the ._id attribute is in oppos
                    return _.find( myTrueItems, function( itm ){//find1
                        return (itm._id == id);
                    } );//end find1
                } );//end map1

                var expectScore = _.reduce( opponents, function( memo,
                                                                 num ){//reduce1   //calculate expected score=sum of rasch probabilities a=selected b=opponent score
                    return memo + Stats.raschProb( myTrueItems[ j ].ability.value, num.ability.value );
                }, 0 );//end reduce1
                //Calculate info
                var info = _.reduce( opponents, function( memo,
                                                          num ){//reduce2
                    var fi = Stats.fischerI( myTrueItems[ j ].ability.value, num.ability.value )
                    return memo + fi;
                }, 0 );//end reduce2

                if( counter > 0 ){//if5    //as long as all estimation iteration aren't over
                    var value = myItems[ j ].ability.value + ((obsScore - expectScore) / info);
                    if( counter === 1 ){
                         if( value < -10 ){
                         value = -10;
                         } else if( value > 10 ){
                         value = 10;
                         }
                    }
                    myItems[ j ].ability.value = value; //estimate ability
                } else {//end if5    //otherwise
                    var se = 1 / Math.sqrt( info );
                    if( !_.isFinite( se ) || _.isNaN( se ) ){
                        se = 200;
                    }
                    myItems[ j ].ability.se = se    //estimate ability se
                }//end else
            }//end if4
        }//end if1
    }//end for1
    //if we have set the first representation as a reference category, we should set it back to to rank
    if( refCatSet ){
        myItems[ 1 ].rankType = "to rank";
    }
};

module.exports = {
    estimateCJ: estimateCJ,
    CML: CML
};