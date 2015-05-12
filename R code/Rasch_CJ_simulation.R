# Rasch probability
RaschProb <- function(a, b) #a=ability, b=difficulty
{
  exp(a-b)/(1+exp(a-b))
}

# paired comparisons
paired_comparison <- function(Sa, Sb)
{
  Pcorr <- RaschProb(Sa, Sb)
  
  rand <- runif(1) # generate random number between 0 and 1
  
  decision <- ifelse(Pcorr > rand, 1, 0)
  
  return(decision)
}

# paired comparisons with random probability correct
paired_comparison_rand <- function(Sa, Sb)
{
  Pcorr <- RaschProb(0, 0)
  
  rand <- runif(1) # generate random number between 0 and 1
  
  decision <- ifelse(Pcorr > rand, 1, 0)
  
  return(decision)
}

