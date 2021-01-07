#!/bin/bash

extenssion=$2
list="*.$extenssion"

for  file in ${list[*]}
do 
  if [ -f "$file" ] && [ "$file" != ".." ] && [ "$file" != "." ];then
	  res=$(grep -n $1 < "$file")
	  if [ "$res" == "" ];then
		  continue
	  else
	    printf "\n$file > \n$res\n"
	  fi
  fi
done
