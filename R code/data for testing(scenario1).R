#install.packages("rjson")
library(rjson)

options(stringsAsFactors=F)

### set up ###
Script_scores <- read.table("ranking_estimates_A1.txt", 
                            header=T, sep="\t", dec=".")

Script_scores$representation <- as.character(Script_scores$representation)

refcate <- Script_scores$representation[which(Script_scores$ability==0)]

nscripts=length(Script_scores$representation)

Data <- read.table("Data.csv",
                   header=T, sep=",", quote="\"", dec=".",
                   encoding="latin1")

# make script list
Representation <- list()

for(i in 1:nscripts)
{
  Representation[[i]] <- list(id=Script_scores$representation[i],
                       type="to rank",
                       ability= list(
                         value=0,
                         se= 0),
                       compared=NULL,
                       comparedNum=0)
}
rm(i)

# fill script list
Comparison <- list()
for(i in 1:length(Data$left.representation))
{
  for(j in 1:nscripts)
  {
    if(Representation[[j]]$id==Data$left.representation[i])
    {
      Representation[[j]]$compared <- append(Representation[[j]]$compared,
                                             Data$right.representation[i])
      Representation[[j]]$comparedNum <- Representation[[j]]$comparedNum +1
    }
    
    if(Representation[[j]]$id==Data$right.representation[i])
    {
      Representation[[j]]$compared <- append(Representation[[j]]$compared,
                                             Data$left.representation[i])
      Representation[[j]]$comparedNum <- Representation[[j]]$comparedNum +1
    }
  }
  
  Comparison[[i]] <- list(id=paste0(i, "something"),
                          representations= list(
                            a=Data$left.representation[i],
                            b=Data$right.representation[i]),
                          data= list(
                            selection=Data$selected.representation[i],
                            passfail=list(
                              a="something",
                              b="somethingelse")
                            )
                          )
}
rm(i,j)

# create JSON file of lists
RepresCode <- toJSON(Representation)
CompCode <- toJSON(Comparison)

write(RepresCode, file="Representation.JSON", sep="")
write(CompCode, file="Comparison.JSON",sep="")

rm(CompCode, Comparison, RepresCode, Representation)
################################################################################

## Do the estimation in JS

################################################################################

## read in JSON file
EstString <- readLines("Estimates.JSON")
Estimates <- fromJSON(EstString)

## restructure into data frame
Abil <- data.frame(representation = character(0), ability= numeric(0),s.e. = numeric(0))

for(i in 1:length(Estimates))
{
  tempRow <- data.frame(representation = Estimates[[i]]$id, 
                        ability= Estimates[[i]]$ability$value,
                        s.e. = Estimates[[i]]$ability$se)
  Abil <- rbind(Abil, tempRow)
}

# sort estimates 
sortvector<-order(Abil[,2],Abil[,2]) # make a vector of the rownumbers
# of the sorted ability scores 
Abil<-Abil[sortvector,] # sort data accordingly

################################################################################

source("iterativeML.R")

## do the fitting in R
Data <- read.table("DV1.csv",
                   header=T, row.names=1, sep=",", quote="\"", dec=".",
                   encoding="latin1")

## make separate dataset for taak1
Data <- subset(Data,(Data$completed==1 & Data$assessment==
                       "Schrijfopdracht 1: Kinderen") )

Data$assessment<-factor(Data$assessment) #reset factor assessment

## select columns that are neccesary
# selected position (6), left representation (7), right representation(9)
Data <-Data[,c(6:7,9)]

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
estimateAbility(Scripts, nscripts, Data, refCat=NA, Ability, "Ability", 4)


# sort
colnames(Ability)<-c("representation","ability","s.e.")

# sort ability scores 
sortvector<-order(Ability[,2],Ability[,2]) # make a vector of the rownumbers
# of the sorted ability scores 
Ability<-Ability[sortvector,] # sort data accordingly


################################################################################

## Do the check

# compare is objects are near equal
all.equal(Ability, Abil)

#spearman rank order corr
all_score <- merge(Ability[,1:2], Abil[,1:2], by="representation")
cor(all_score[,2], all_score[,3], method="spearman")

#### clear all ####
rm(list=ls())
cat("\014")
