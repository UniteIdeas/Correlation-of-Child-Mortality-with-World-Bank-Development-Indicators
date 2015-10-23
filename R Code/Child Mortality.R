# Created by Sherif on Sept 15th, 2015
# This code reads the Development Indicators (World Bank Data) and correlates them with Chile Mortality (UN Data)

# Set working directory and load data
setwd("~/Google Drive/Shero/Work/DimensionV/Analysis/Data/UN Competition")
indicators <- read.csv("World Indicators (2013).csv")

install.packages("ggplot2")
library(ggplot2)

# Refine the data
list1 <- c(colnames(indicators))

refined<- indicators[,-which(names(indicators)=="Country.Codes")]
refined<- refined[,-which(names(refined)=="Child.Mortality")]

# Compute correlations
cor1<-cor(indicators["Child.Mortality"], refined , use="pairwise.complete.obs", method="pearson")
cor1

# Write correlations to CSV
write.csv(cor1, file="Correlations.csv" )
