setwd("C:/Users/SVerhavert/Desktop/Simulation")

### source functions ###
source("iterativeML.R") # source the functions. make shure they are in the wd

### set up ###
Script_scores <- read.table(" ranking_estimates_A1_rand.txt", 
                            header=T, sep="\t", dec=".")

Script_scores$representation <- as.character(Script_scores$representation)

refcate <- Script_scores$representation[which(Script_scores$ability==0)]

nscripts=length(Script_scores$representation)

Data <- read.table("Data.csv",
                   header=T, row.names=1, sep=",", quote="\"", dec=".",
                   encoding="latin1")

# put in correct format
Score <- numeric(0)

for(i in 1: length(Data$selected.position))
{
  if(Data$selected.position[i]=="left")
  {
    Score <- append(Score,1)
  } else
  {
    Score <- append(Score,0)
  }
}

rm(i)

Data <- data.frame(Script1=Data$left.representation, 
                   Script2=Data$right.representation,
                   Score=Score)
rm(Score)

Data$Script1 <- as.character(Data$Script1)
Data$Script2 <- as.character(Data$Script2)

# make script list
Scripts <- list()
for(i in 1:nscripts)
{
  Scripts[[i]] <- list(script=Script_scores$representation[i],
                       opponents=NULL)
}
rm(i)

# fill script list
for(i in 1:length(Data$Script1))
{
  for(j in 1:nscripts)
  {
    if(Scripts[[j]]$script==Data$Script1[i])
    {
      Scripts[[j]]$opponents <- append(Scripts[[j]]$opponents,Data$Script2[i])
    }
    
    if(Scripts[[j]]$script==Data$Script2[i])
    {
      Scripts[[j]]$opponents <- append(Scripts[[j]]$opponents,Data$Script1[i])
    }
  }
}
rm(i,j)

# catch df for results
Ability <- data.frame(Script=Script_scores$representation,
                      trueScore=numeric(nscripts), seTrueScore=numeric(nscripts))

# do estimation
estimateAbility(Scripts, nscripts, Data, refcate, Ability, "Ability", 7)


# sort
colnames(Ability)<-c("representation","ability","s.e.")

# sort ability scores 
sortvector<-order(Ability[,2],Ability[,2]) # make a vector of the rownumbers
# of the sorted ability scores 
Ability<-Ability[sortvector,] # sort data accordingly

Script_scores[,1] <- as.factor(Script_scores[,1])

# compare is objects are near equal
all.equal(Script_scores,Ability)

#spearman rank order corr
all_score <- merge(Script_scores[,1:2],Ability[,1:2], by="representation")
cor(all_score[,2], all_score[,3], method="spearman")

deviance <- all_score[,2]-all_score[,3]
SDdeviance <- sd(deviance)

plot(all_score[,2],all_score[,3], xlab="true ability scores", ylab="estimated ability scores")

#### clear all ####
rm(list=ls())
cat("\014")

