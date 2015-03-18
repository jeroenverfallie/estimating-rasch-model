################################################################################
#   Programmed By: San Verhavert                                               #
#                                                                              #
#   Details:
#     estimateAbility and iterativeML estimate the abilities from the BTL model     #
#         using Newtons method                                                 #
#       script_list or scripts = a list with all scripts in the assessment     #
#                                 and their opponent and has the following     #
#                                 structure                                    #
#           [[i]]$script = script id                                           #
#           [[i]]$opponents = the id's of the scripts                          #
#                               that scripts[[i]]$script has been compared with#
#       totScripts or numScripts = the total number of scripts in the          #
#                                   assessment                                 #
#       data = a dataframe with the judgement data containing the follwing     #
#               variables                                                      #
#           $Script1 = the first script in the comparison                      #
#           $Script2 = the second script in the comparison                     #
#           $Score = the outcome of the judgment, 1 = Script1 wins             #
#       abi or abilit = the dataframe containing the ability estimates from    #
#                         the previous iteration and with the following        #
#                         variables                                            #
#           $Script= the scripts in the assessment                             #
#           $trueScore = the estimated ability from the previous iteration     #
#           $seTrueScore = the se of the ability estimates                     #
#       varName or variabName = a character string containing the name of the  #
#                                 ability dataframe in the main environment    #
#       counter = the number of the estimation iteration                       #
#                                                                              #
################################################################################

RaschProb <- function(a, b) #a=ability, b=difficulty
{
  exp(a-b)/(1+exp(a-b))
}

iterativeML <- function(scripts, numScripts, data, abilit, variabName, counter)
{
  zeroes <- data.frame(Script=0, trueScore=0, seTrueScore=0)
  origAbilit <- abilit # duplicate ability dataframe so we use the estimates from the previous iteration
  
  for(j in 1:nscripts)
  {
    script <- scripts[[j]]$script # save script to estimate ability score for
    opponents <- scripts[[j]]$opponents # save opponents
    
    scriptTrueScore <- origAbilit$trueScore[origAbilit$Script==script] # save score of script estimated in previous iteration
    scriptObsevedScore <- sum(data$Score[data$Script1==script]) # save observed score of script = sum of judgments (1 or 0)
    
    scriptExpectScore=0
    scriptInfo=0
    
    for(k in 1:length(opponents)) # loop through opponents
    {
      oppoTrueScore <- origAbilit$trueScore[ origAbilit$Script==opponents[k] ] # save score of opponent script estimated in previous iteration

      scriptExpectScore <- scriptExpectScore + RaschProb(scriptTrueScore, 
                                                         oppoTrueScore) # calculate the expected score = sum(rasch(a,b))
      scriptInfo <- scriptInfo +  RaschProb(scriptTrueScore, oppoTrueScore)*
                      (1-(RaschProb(scriptTrueScore, oppoTrueScore))) # calculate fischer information = sum(p*(1-p))
    }
    
    if(counter>0) # as long last iteration has not been completed
    {
      # calculate the estimated score in this iteration= old score+( (observed score-expected score) / info )
      tempScore <- (scriptObsevedScore-scriptExpectScore)/scriptInfo 
      scriptTrueScore <- scriptTrueScore + tempScore
      abilit$trueScore[abilit$Script==script] <- scriptTrueScore # save estimate
    } else
    {
      scriptSeScore <- 1/sqrt(scriptInfo) # calculate se
      abilit$seTrueScore[abilit$Script==script] <- scriptSeScore # save se
    }
  }
   
  assign(variabName, abilit, envir=.GlobalEnv) #store new estimates in original data frame
  return(abilit) #return estimates for further use
  
}

estimateAbility <- function(script_list, totScripts, data, abil, varName, iters)
{
  # before first iteration set estimated score and se to 0 if not 0
  for(i in 1:length(abil$trueScore))
  {
    if(abil$trueScore[i]!=0 | is.na(abil$trueScore[i]))
    {
      abil$trueScore[i]=0
    }
    
    if(abil$seTrueScore[i]!=0 | is.na(abil$seTrueScore[i]))
    {
      abil$seTrueScore[i]=0
    }
  }
  
  assign(varName, abil, envir=.GlobalEnv) # store values in original dataframe

  for(i in iters:0) # do estimates for "iters" times
  {
    cat(i, "\n")
    abil <- iternativeML(script_list, totScripts, data, abil, varName, i)
  }
}
