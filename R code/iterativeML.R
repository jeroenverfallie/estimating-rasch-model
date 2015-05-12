################################################################################
#   Programmed By: San Verhavert                                               #
#                                                                              #
#   Details:
#     estimateAbility and iterativeML estimate the abilities from the BTL model#
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
#       abilVarName or abilVariabName = a character string containing the name of the  #
#                                 ability dataframe in the main environment    #
#       counter = the number of the estimation iteration                       #
#                                                                              #
################################################################################

RaschProb <- function(a, b) #a=ability, b=difficulty
{
  exp(a-b)/(1+exp(a-b))
}

iterativeML <- function(scripts, thedata, abilit, origAbilit,
                        abilVariabName, counter)
{
  # if all representations are to rank we need a refrence cathegory
  ranked_scripts <- character(0)
  for(j in 1:length(abilit$Script))
  {
    if(abilit$State_of_Script[j]=="ranked")
    {
      ranked_scripts <- append(ranked_scripts, abilit$Script[j])
    }
  }
  rm(j)
  
  refcatSet <- F
  
  if(length(ranked_scripts)<=0)
  {
    abilit$State_of_Script[1] <-"ranked"
    refcatSet <- T
  }
  
  rm(ranked_scripts)
  
  # only the "to rank" should be estimated
  
  for(j in 1:length(scripts))
  {
    if(abilit$State_of_Script[scripts[[j]]$script==abilit$Script]=="to rank")
    {
      script <- scripts[[j]] # save script to estimate ability score for
      opponents <- script$opponents # save opponents
      
      scriptTrueScore <- origAbilit$trueScore[script$script==origAbilit$Script] # save score of script estimated in previous iteration
      # calculate observed score:  sum of all comparisons contaning this script
      tempScoreA <- 0
      # sum of wins of left where left is script
      for(k in 1:length(thedata$Script1))
      {
        if(thedata$Script1[k]==script$script)
        {
          tempScoreA <- tempScoreA + thedata$score[k]
        }
      }
      rm(k)
      
      # Wins of right when right is script= absolute value of (left wins-1)
      tempScoreB <- 0
      
      for(k in 1:length(thedata$Script2))
      {
        if(thedata$Script2[k]==script$script)
        {
          tempScoreB <- tempScoreB + ( abs( thedata$score[k]-1 ) )
        }
      }
      rm(k)
      
      ObsevedScore <- tempScoreA+tempScoreB
      rm(tempScoreA, tempScoreB)
      
      ExpectedScore <- 0
      info <- 0
      
      if(length(opponents)>0)
      {
        for(k in 1:length(opponents)) # loop through opponents
        {
          oppoTrueScore <- origAbilit$trueScore[ origAbilit$Script==opponents[k] ] # save score of opponent script estimated in previous iteration
          
          ExpectedScore <-ExpectedScore + RaschProb(scriptTrueScore, 
                                                oppoTrueScore) # calculate the expected score = sum(rasch(a,b))
          info <- info + ( RaschProb(scriptTrueScore, oppoTrueScore)*
                                   (1-(RaschProb(scriptTrueScore, oppoTrueScore)))) # calculate fischer information = sum(p*(1-p))
          rm(oppoTrueScore)
        }
        rm(k)
      }
      rm(scriptTrueScore)
      
      if(counter != 0) # as long last iteration has not been completed
      {
        # calculate the estimated score in this iteration= old score+( (observed score-expected score) / info )
        abilit$trueScore[scripts[[j]]$script==abilit$Script] <- 
          abilit$trueScore[scripts[[j]]$script==abilit$Script] + (
            (ObsevedScore-ExpectedScore)/info )
        rm(ObsevedScore, ExpectedScore, info)
        
      } else
      {
        abilit$seTrueScore[scripts[[j]]$script==abilit$Script] <- 
          1/sqrt(info) # calculate se
        rm(info)
      }
    }
    
  }
  rm(j)
  
  if(refcatSet)
  {
    abilit$State_of_Script[1] <-"to rank"
  }
  
  assign(abilVariabName, abilit, envir=.GlobalEnv) #store new estimates in original data frame
  return(abilit) #return estimates for further use
  
}

estimateAbility <- function(script_list, data, abil, abilVarName, iters)
{
  # before first iteration set estimated score and se of to rank to 0 if not 0
  for(i in 1:length(abil$Script))
  {
    if(abil$State_of_Script[i]=="to rank")
    {
      abil$trueScore[i]=0
      abil$seTrueScore[i]=0
    }
  }
  rm(i)
  
  assign(abilVarName, abil, envir=.GlobalEnv)
  
  for(i in iters:0) # do estimates "iters" times
  {
    cat(i, "\n")
    abil <- iterativeML(scripts=script_list, thedata=data, abilit=abil,
                        origAbilit=abil, abilVariabName=abilVarName,
                        counter=i)
  }
  rm(i)
}
