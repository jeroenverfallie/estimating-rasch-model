
#install.packages("rjson")
library(rjson)

options(stringsAsFactors=F)

### source functions ###
source("Benchmark_selection_algorithm.R") # source the functions. make shure they are in the wd
source("Rasch_CJ_simulation.R")
source("iterativeML.R")

### set up ###
Script_scores <- read.table("ranking_estimates_A1.txt", 
                            header=T, sep="\t", dec=".")
trueAbility <- Script_scores

Script_scores$representation <- as.character(Script_scores$representation)
trueAbility$representation <- as.character(trueAbility$representation)

refcate <- Script_scores$representation[which(Script_scores$ability==0)]

nscripts=length(Script_scores$representation)

# add variable with values benchmark, ranked and to rank
refIdx <- which(Script_scores$representation==refcate)
SecondBench <- refIdx-1

set.seed(1234)

Scripts_toRank <- sample(1:nscripts, size=10)   # select the scripts that will be ranked
FirstBench <- sample(1:SecondBench, size=1)

Script_scores <- data.frame(Script_scores, State_of_Script=rep("ranked", times=nscripts),
                      stringsAsFactors = F)

# a script that is the reference category or benchmark cannot be to rank
marker <- 0

for(i in 1:10)
{
  if(Scripts_toRank[i] == refIdx)
  {
    
    adder <- 1
    
    while( ( Scripts_toRank[i]+adder ) == Scripts_toRank[i+adder] ) # we cannot have 2 times the same number
    {
      adder <- adder+1
    }
    
    Scripts_toRank[i] <- Scripts_toRank[i]+adder
    
    marker <- marker+1
  }else if(Scripts_toRank[i] == FirstBench)
  {
    adderB <- 1
    
    while( ( Scripts_toRank[i]+adderB ) == Scripts_toRank[i+adderB] ) # we cannot have 2 times the same number
    {
      adderB <- adderB+1
    }
    
    Scripts_toRank[i] <- Scripts_toRank[i]+adderB
    
    marker <- marker+1
  } else if(Scripts_toRank[i] == SecondBench)
  {
    adderC <- 1
    
    while( ( Scripts_toRank[i]+adderC ) == Scripts_toRank[i+adderC] ) # we cannot have 2 times the same number
    {
      adderC <- adderC+1
    }
    
    Scripts_toRank[i] <- Scripts_toRank[i]+adderC
  }
  
  if(marker >= 3) break
}
rm(i, adder, adderB, adderC, marker)

for(i in 1:10)
{
  for(j in 1:nscripts)
  {
    if(Scripts_toRank[i]==j)
    {
      Script_scores$State_of_Script[j]="to rank"
      
    }else if(j==SecondBench)
    {
      Script_scores$State_of_Script[j]="benchmark"
      
    }else if(j==FirstBench)
    {
      Script_scores$State_of_Script[j]="benchmark"
      
    }
  }
}
rm(i,j)

## determine the values statistically indistinguishable from the benchmark
# calculate lower and upper bound of 40%-CI of benchmarks
lower1 <- Script_scores$ability[FirstBench] - (0.5244 * Script_scores$s.e.[FirstBench])
upper1 <- Script_scores$ability[FirstBench] + (0.5244 * Script_scores$s.e.[FirstBench])

lower2 <- Script_scores$ability[SecondBench] - (0.5244 * Script_scores$s.e.[SecondBench])
upper2 <- Script_scores$ability[SecondBench] + (0.5244 * Script_scores$s.e.[SecondBench])

# add var to Ability
Script_scores <- data.frame(Script_scores, closeTo=rep(NA, times=nscripts),
                      stringsAsFactors = F)

# determine scripts whos ability is inbside 40%-CI of benchmarks ==> 9 to 14 scripts
for(i in 1:nscripts)
{
  if(Script_scores$State_of_Script[i]=="ranked")
  {
    if( Script_scores$ability[i]>=lower1 && Script_scores$ability[i]<=upper1 )
    {
      Script_scores$closeTo[i] <- Script_scores$representation[FirstBench]
      
    } else if( Script_scores$ability[i]>=lower2 && Script_scores$ability[i]<=upper2 )
    {
      Script_scores$closeTo[i] <- Script_scores$representation[SecondBench]
      
    }
  }
}
rm(i)

#change names in Ability
names(Script_scores)[1:3] <- c("Script", "trueScore", "seTrueScore")

# make a copy for true abilities
trueAbility <- Script_scores

#set Abilities to rank to 0
for(i in 1:length(Script_scores$State_of_Script))
{
  if(Script_scores$State_of_Script[i]=="to rank")
  {
    Script_scores$trueScore[i] <- 0
    Script_scores$seTrueScore[i] <- 0
  }
}

# make catch for data
Data <- data.frame(Script1=character(0), Script2=character(0), score=numeric(0),
                   stringsAsFactors = F)

# make script list
Scripts <- list()
for(i in 1:nscripts)
{
  Scripts[[i]] <- list(script=Script_scores$Script[i],
                       opponents=NULL, opponentNum=0)
}
rm(i)

## set ver for assessment phase
Phase <- 1

### Cleanup ###
rm(FirstBench, SecondBench, Scripts_toRank, lower1, lower2, upper1, upper2, refIdx)
cat("\014")

### Simulation ###

## item selection
previous <- 0
pair <- c(1,1)
counter <- 0
while(pair[1]!=0)
{
  
  pair <- BenchmarkAlg(script_list=Scripts, abil=Script_scores, selectCrit="max fischer",
                       selectBound=.21, stopping="Ncomp", stoppingBound=10, 
                       phase=Phase, phaseName="Phase")
  
  if(pair[1]!=0 && pair[1]!=1)
  {   # store comparison
    
    counter <- counter+1
    cat(counter, "\n")
    for(i in 1:nscripts)
    {
      if(pair[1]==Scripts[[i]]$script)
      {
        Scripts[[i]]$opponents <- append(Scripts[[i]]$opponents, pair[2])
        Scripts[[i]]$opponentNum <- Scripts[[i]]$opponentNum + 1
      }
      if(pair[2]==Scripts[[i]]$script)
      {
        Scripts[[i]]$opponents <- append(Scripts[[i]]$opponents, pair[1])
        Scripts[[i]]$opponentNum <- Scripts[[i]]$opponentNum + 1
      }
    }
    
    # make descision
    Scr1Idx <- which(trueAbility$Script == pair[1])
    Scr2Idx <- which(trueAbility$Script == pair[2])
    score <- paired_comparison(trueAbility$trueScore[Scr1Idx],
                               trueAbility$trueScore[Scr2Idx])
    rm(Scr1Idx, Scr2Idx)
    
    # store Data
    tempRow <- data.frame(Script1=pair[1], Script2=pair[2], score=score)
    Data <- rbind(Data, tempRow)
    rm(tempRow)
    
    # when enough comparisons, do estimate
    if(Phase==2)
    {
      #estimateAbility(Scripts, nscripts, Data, Script_scores, "Script_scores", 4)
      estimateAbility(script_list=Scripts, data=Data, abil=Script_scores,
                      abilVarName="Script_scores", iters=4)
    }
  }
}


# make script list
Representation <- list()

for(i in 1:nscripts)
{
  scrIdx <- which(Scripts[[i]]$script == Script_scores$Script)
  Representation[[i]] <- list(id=Scripts[[i]]$script,
                       rankType=Script_scores$State_of_Script[scrIdx],
                       ability= list(
                         value=Script_scores$trueScore[scrIdx],
                         se= Script_scores$seTrueScore[scrIdx]),
                       compared=Scripts[[i]]$opponents)
}
rm(i)

# fill script list
Comparison <- list()
for(i in 1:length(Data$Script1))
{
  if(Data$score[i]==1)
  {
    selected = Data$Script1[i]
  } else
  {
    selected = Data$Script2[i]
  }
    Comparison[[i]] <- list(id=paste0(i, "something"),
                          representations= list(
                            a=Data$Script1[i],
                            b=Data$Script2[i]),
                          data= list(
                            selection=selected,
                            passfail=list(
                              a="something",
                              b="somethingelse")
                            )
                          )
}
rm(i)

# create JSON file of lists
RepresCode <- toJSON(Representation)
CompCode <- toJSON(Comparison)

write(RepresCode, file="Representation_scenario2.JSON", sep="")
write(CompCode, file="Comparison_scenario2.JSON",sep="")

rm(CompCode, Comparison, RepresCode, Representation)
################################################################################

## Do the estimation in JS

################################################################################

## read in JSON file
EstString <- readLines("Estimates_scenario2.JSON")
Estimates <- fromJSON(EstString)

## restructure into data frame
options(stringsAsFactors=F)
Abil <- data.frame(representation = character(0), ability= numeric(0),s.e. = numeric(0))

for(i in 1:length(Estimates))
{
  tempRow <- data.frame(representation = Estimates[[i]]$id, 
                        ability= Estimates[[i]]$ability$value,
                        s.e. = Estimates[[i]]$ability$se)
  Abil <- rbind(Abil, tempRow)
}
rm(i)

# sort estimates 
sortvector<-order(Abil[,2],Abil[,2]) # make a vector of the rownumbers
# of the sorted ability scores 
Abil<-Abil[sortvector,] # sort data accordingly

################################################################################

## do the fitting in R

# do estimation
estimateAbility(script_list=Scripts, data=Data, abil=Script_scores,
                abilVarName="Script_scores", iters=4)


# sort
colnames(Script_scores)[1:3]<-c("representation","ability","s.e.")

# sort ability scores 
sortvector<-order(Script_scores[,2],Script_scores[,2]) # make a vector of the rownumbers
# of the sorted ability scores 
Script_scores<-Script_scores[sortvector,] # sort data accordingly


################################################################################

## Do the check

# compare is objects are near equal
all.equal(Script_scores, Abil)

#spearman rank order corr
all_score <- merge(Script_scores[,1:2], Abil[,1:2], by="representation")
cor(all_score[,2], all_score[,3], method="spearman")

plot(1:nscripts, all_score[,2])
points(1:nscripts, all_score[,3], col="red")

colnames(trueAbility)[1:3]<-c("representation","ability","s.e.")
all_score <- merge(Script_scores[,1:2], trueAbility[,1:2], by="representation")
plot(1:nscripts, all_score[,2])
points(1:nscripts, all_score[,3], col="red")

#### clear all ####
rm(list=ls())
cat("\014")