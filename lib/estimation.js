var _ = require('lodash');
var math = require('math');
var Stats = require('./raschStats');

function restructure(data){
    // as argument we get an array of comparison objects of the following form (only relevant attributes)
    //      .A: containing ._id of representation A (mostly left)
    //      .B: containing ._id of representation B (mostly right)
    //      .selected= containing _.id of selected representation

    // as output we need an array of objects with following attributes (array has length data.length())
    //      array[i].A: representation A
    //      array[i].B: representation B
    //      array[i].score: 1 if data.selected=A , 0 if data.selected=B

    var reData = [];

    _.forEach(data, function(D){       // for each object in data
        reData.push({            //     add a new object at the end of the array restrData.push({
            A:D.representations.a,
            B:D.representations.b,
            score:(D.data.selection==D.representations.a)?1:0      // if selected=A then 1 else (if selected=B) 0
        }); //end .push
    }); //end .forEach

    return reData;// return the array
}

var estimateCJ = function (comparison, representation) {
    // initially set estimates of representation "to rank" to 0
    _.forEach(representation, function (item) {     //loop through representation
        if(item.type=="to rank"){       //only the representation "to rank" need to be estimated
            item.ability.value = 0;
            item.ability.se = 0;
        }//end if

    });//end .forEach

    // restructure the data
    var Data = restructure(comparison);

    //loop 4 times (+1) through the estimation
    for (var i = 4; i >= 0; i--) {
        CML(Data, representation, representation.slice(0), i);    //representation.slice(0) because we need to acces the ability estimates from the
                                                //  previous iteration. Without this we would increasingly use the currently
                                                //  estimated abilities, eventually leading to wrong estimates and unbound
                                                //  likelihoods!
    }
};

var CML = function (myData, myItems,myTrueItems, counter) {
    // when all the items are to rank, there is need for a reference category. So we should set the first item to ranked
    var refCatSet = false;
    var ranked = _.find(myItems, function(itm){
        return itm.type == "ranked";
    }) || []; // if _.find returns undefined store empty array
    if(ranked.length <= 0){
        myItems[0].type = "ranked";
        refCatSet = true;
    }
    for (var i = 0; i < myItems.length; i++) {//for1   //loop through the items
        if(myItems[i].type == "to rank") { //if1          //only the item "to rank" should be estimated (This is generic because if you don't have a previous ranking, all items will be "to rank"
            var selected = myItems[i];                    //save the current representation
            var oppos = selected.compared;           //save the opponent id's
            //calculate the observed score=sum off all wins
            var obsScore=0;
            for(var j = 0; j < myData.length; j++){//for2 //loop through the data
                if(myData[j].A == selected._id){//if2    // when selected in position A
                    obsScore += myData[j].score;         //sum the scores
                }else if(myData[j].B == selected._id){  //end if2 //if3     //when selected in position B
                    obsScore += math.abs(myData[j].score-1);        //sum of abs(score-1) (as score=1 if A wins)
                }//end if3
            }   //end for2
            if (selected.comparedNum > 0) {//if4     //if selected has already been compared
                var opponents = _.map(oppos, function (id) {//map1    //find the structure for which the ._id attribute is in oppos
                    return _.find(myTrueItems, function (itm) {//find1
                        return (itm._id == id);
                    });//end find1
                });//end map1
                var expectScore = _.reduce(opponents, function (memo, num) {//reduce1   //calculate expected score=sum of rasch probabilities a=selected b=opponent score
                    return memo + Stats.raschProb(myTrueItems[i].ability.value, num.ability.value);
                }, 0);//end reduce1
                //Calculate info
                var info = _.reduce(opponents, function (memo, num) {//reduce2
                    return memo + Stats.fischerI(myTrueItems[i].ability.value, num.ability.value);
                }, 0);//end reduce2
                if (counter > 0) {//if5    //as long as all estimation iteration aren't over
                    myItems[i].ability.value += ((obsScore - expectScore) / info); //estimate ability
                } else {//end if5    //otherwise
                    myItems[i].ability.se = 1 / Math.sqrt(info);     //estimate ability se
                }//end else
            }//end if4
        }//end if1
    }//end for1
    //if we have set the first representation as a reference category, we should set it back to to rank
    if(refCatSet){
        myItems[1].type = "to rank";
    }
};


module.exports = {
    estimateCJ : estimateCJ,
    CML : CML
    };