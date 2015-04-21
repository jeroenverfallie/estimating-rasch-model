var math = require('math');

function raschProb(a, b){   //the Rasch probability or Bradley-Terry-Luce probability
    var expon = math.exp(a - b);
    return expon / (1 + expon);
}

function fischerI(aF, bF){      //the Fischer information
    var rprob = raschProb(aF, bF);
    return rprob * (1 - rprob);
}


module.exports = {
    raschProb:raschProb,
    fischerI:fischerI
};