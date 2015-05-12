
# function takes a list with script id, opponents, opponentNum
# and a data frame with the ability estimates, the se,
#       a variable with value "benchmark", "ranked" or "to rank"
#       and a variable closeTo containing the benchmark id
# also a character vector specifying the stopping criterion
# optional: an integer specifying the stopping boundary(ies)

BenchmarkAlg <- function(script_list, abil, selectCrit="max fisher",
                         selectBound= .21, stopping="Ncomp",
                         stoppingBound=10, phase=1,phaseName="Phase")
{
  ### source functions----------------------------------------------------------
  source("C:\\Users\\SVerhavert\\Documents\\R\\functions\\isNaturalNumber.R")
  
  ### require libraries---------------------------------------------------------
  
  ### Determine benchmarks and to ranks ----------------------------------------
  # store Benchmark id's and objects of scripts that are to rank
  Benchmarks <- character(0)
  scripts_to_rank <- list(0)
  counter <- 0
  benchNum <- 0
  
  for(i in 1:length(abil$State_of_Script))
  {
   if(abil$State_of_Script[i] == "benchmark")
   {
     Benchmarks <- append(Benchmarks, abil$Script[i])
     benchNum <- benchNum+1
   }
   if(abil$State_of_Script[i] == "to rank")
   {
     counter <- counter+1
     scripts_to_rank[[counter]] <- script_list[[i]]
   }
  }
  rm(i)
  
  ### switch for stopping rule and selection criteria --------------------------
  if(stopping=="Ncomp")
  {
    if(length(stoppingBound)>1)
    {
      stop("stoppingBound should not be a vector")
      
    }else if(!is.naturalnumber(stoppingBound))
    {
      stop("stoppingBound should be a natural number and >0")
    }
    
    #are there scripts to rank with less than stoppingBound comparisons
    temp <- list()
    counter <- 0
    
    for(i in 1:length(scripts_to_rank))
    {
      if(scripts_to_rank[[i]]$opponentNum < stoppingBound)
      {
        counter <- counter+1
        temp[[counter]] <- scripts_to_rank[[i]]
      }
    }
    rm(i, counter)
    
    scripts_to_rank <- temp
       
    rm(temp)
    
    if(length(scripts_to_rank)<=0) #if script list is empty
    {
      return(0)
    }
  } else  if(stopping=="SPRT")
  {
    warning("The algorithm does not yet support SPRT. Continuing with number of comparisons with default value 10")
    if(!(length(stoppingBound)>1)) # further refine
    {
      stop("SPRT takes X boundaries")
    }
    
    stopping=="Ncomp"
    stoppingBound=10
    
  } else
  {
    stop("this function only implements the following stopping rules:
         1. Number of comparisons (\"Ncomp\")
         2. SPRT")
  }

  if(selectCrit=="max fischer")
  {
    if(selectBound>.25)
    {
      stop("Maximum Fischer information has a maximum of .25")
    }
    nfo = "fischer"
  } else if(selectCrit=="max KL")
  {
    warning("The algorithm does not yet support maximum Kulbach-Leibler information. Continuing with maximum Fisher information with default boundary=.25")
    selectBound=.21
    nfo = "fischer"
    
  } else
  {
    stop("this function only implements the following stopping rules:
          1. Maximum Fisher information (\"max fisher\")
          2. Maximum Kulbach-Leibler information (\"max KL\")")
  }
  
  ### Start Algorithm ----------------------------------------------------------
  if (phase==1)
  {
    selected <- scriptLeastComp(scripts_to_rank)
    selected <- selected[[1]]
    
    if( length(selected$opponents)==0 )    # if opponents empty
    {
      bench <- sample( Benchmarks, size=1, replace=F )    # randomly select benchmark
      candidateOppos <- subset(abil$Script, abil$closeTo==bench)
      opponent <- sample(candidateOppos, size=1, replace=F)  # randomy select a benchmark area script
      
    } else if( length(selected$opponents)<benchNum-1 ) # if opponent contains at least 1 but not more than number of benchmarks-1
    {
      # select other benchmarks
      candidateBench <- Benchmarks
      
      for(i in 1:length(selected$opponents))
      {
        oppoIdx <-which(abil$Script==selected$opponents[i])
        oppoBench <- abil$closeTo[oppoIdx] # determine to which benchmark selected$opponents is close
        #remove this benchmark from the list with candidate benchmarks (you keep a list NOT containin oppoBench)
        candidateBench <- candidateBench[which(candidateBench!=oppoBench)]
      }
      rm(i, oppoIdx, oppoBench)
      
      bench <- sample(candidateBench, size=1, replace=F)
      
      candidateOppos <- subset(abil$Script, abil$closeTo==bench)      
      
      opponent <- sample(candidateOppos, size=1, replace=F)  # randomy select a benchmark area script
      
    } else if(length(selected$opponents)<benchNum)  # if opponent contains all but one benchmark
    {
      # select other benchmarks
      candidateBench <- Benchmarks
      
      for(i in 1:length(selected$opponents))
      {
        oppoIdx <-which(abil$Script==selected$opponents[i])
        oppoBench <- abil$closeTo[oppoIdx] # determine to which benchmark selected$opponents is close
        #remove this benchmark from the list with candidate benchmarks (you keep a list NOT containin oppoBench)
        candidateBench <- candidateBench[which(candidateBench!=oppoBench)]
      }
      rm(i, oppoIdx, oppoBench)
      
      
      bench <- sample(candidateBench, size=1, replace=F)
      
      candidateOppos <- subset(abil$Script, abil$closeTo==bench)      
      
      opponent <- sample(candidateOppos, size=1, replace=F)  # randomy select a benchmark area script
      
    } else # compared to all benchmarks
    {
      assign(phaseName, 2, envir=.GlobalEnv)
      return(1)
    }
      
  } else
  {
    selected <- scriptLeastComp(scripts_to_rank)
    selected <- selected[[1]]
    
    # store ability estimate of selected script
    selectIdx <- which(abil$Script==selected$script)
    
    selectAbil <- abil$trueScore[selectIdx]
    
    # determine nearest cuttingpoint FUNCTION
    CP <- nearestCuttingPoint(selectAbil, Benchmarks, abil)
    
    # determine scripts closest to cuttingpoint with lowest number of
    #   comparisons with selected script
    candidateOppos <- list(0)
    counter <- 0
    for(i in 1:length(script_list))
    {
      scrIdx <- which( abil$Script == script_list[[i]]$script )  #determine place of script i in abil
      if( !is.na(abil$closeTo[scrIdx]) &&
            abil$closeTo[scrIdx] == CP )  #if abil$State_of_Script of script i ==ranked of benchmark
      {
        counter <- counter+1
        candidateOppos[[counter]] <- script_list[[i]]  #store script i in candidateOppos
      }
    }
    rm(i, scrIdx)
    
    candidateOppos <- scriptLeastComp(candidateOppos, selected$script)
    
    CPIdx <- which(abil$Script == CP)
    CPabil <- abil$trueScore[CPIdx]
    InfoDF <- calcInfo(candidateOppos, abil, CPabil, type=nfo)# calculate information for candidate opponents (way to adaptively select correct FUNCTION)

    # select opponent with highest information value but not bigger then selectBound
    #shuffle scripts
    OppoShuffled <- sample(InfoDF$Script, size=length(InfoDF$Script))
    InfoDF <- InfoDF[ match( OppoShuffled, InfoDF$Script ), ]

    rm(OppoShuffled)
    
    InfoDForder <- order(InfoDF[,2], decreasing=T)
    InfoDF <- InfoDF[InfoDForder, ]
    
    for(i in 1:length(InfoDF$info))
    {
      if(InfoDF$info[i]<=selectBound)
      {
        opponent <- InfoDF$Script[i]
      }
    }
    rm(i)
    
    if(!exists("opponent"))
    {
      opponent <- sample(InfoDF$Script, size=1)
    }
  }
  
  return(c(selected$script,opponent))
}

# determine scripts with lowest number of comparisons with selected script FUNCTION
scriptLeastComp <- function(scripts, reference=NULL)
{
  
  source("C:\\Users\\SVerhavert\\Documents\\R\\functions\\sortListBy.R")
  
  if(!is.null(reference))
  {
    for(i in 1: length(scripts))
    {
      counting <- 0
      
      if(scripts[[i]]$opponentNum>0) # the commands in the forloop will only work if there are opponents
      {
        for(j in 1:length(scripts[[i]]$opponents))  #run through opponents of script i
        {
          if(scripts[[i]]$opponents[j] == reference)  #if script has been compared to reference
          {
            counting <- counting+1
          }
        }
        rm(j) 
      }      
      scripts[[i]]$opponentNum <- counting
    }
    rm(i)
  }
  
  #shuffle scripts
  scriptNames <- sapply(scripts, function(x) x$script)
  scriptShuffled <- sample(scriptNames, size=length(scriptNames))
  scripts <- scripts[ match( scriptShuffled, scriptNames ) ]
  
  rm(scriptNames,scriptShuffled)
  
  #sort scripts ascending based on the number of comparisons/number of compared
  scripts <- sort_list_by(scripts, by="opponentNum", decreasing=F, silence=T)
  
  scripts
}

nearestCuttingPoint <- function(myAbil, myBench, abilit)
{  
  ## shuffle benchmark scripts
  myBench <- sample(myBench, size=length(myBench), replace=F)
  
  ## sort ascending on distance to cutting point
  # make myBench into a df with Script and Distance to cutting point (DCP)
  options(stringsAsFactors=F)
  myBench <- data.frame(Script=myBench, DCP=numeric(length(myBench)))
  options(stringsAsFactors=T)
  
  # calculate distance to cutting point for eacht cutting point
  for(i in 1:length(myBench$Script))
  {
    benchIdx <- which(abilit$Script==myBench$Script[i])
    myBench$DCP[i] <- abs(abilit$trueScore[benchIdx]-myAbil)
  }
  rm(i)
  
  # sort df
  sortedIdx <- order(myBench$DCP)
  myBench <- myBench[sortedIdx,]
  
  ## cut first element from benchmark Scripts
  myBench$Script[1]
}



# calculate information for candidate opponents (way to adaptively select correct FUNCTION)
calcInfo <- function(scripts, abilit, refAbility, type)
{
  infoFtie <- get(type)
  options(stringsAsFactors=F)
  NFODF <- data.frame(Script=character(0), info=numeric(0))
  
  for(i in 1:length(scripts))
  {
    scrIdx <- which( abilit$Script == scripts[[i]]$script)
    tempInfo <- infoFtie(refAbility, abilit$trueScore[scrIdx])
    tempLine <- data.frame(Script=scripts[[i]]$script, info=tempInfo)
    NFODF <- rbind(NFODF, tempLine)
  }
  rm(i)
  
  options(stringsAsFactors=T)
  
  NFODF
}

# Fisher information
fischer <- function(a, b)
{
  prob <- exp(a-b)/(1+exp(a-b))
  prob*(1-prob)
}