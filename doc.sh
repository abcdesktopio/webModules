#!/bin/ksh
file="./js/doclist.txt"
while IFS= read line
do
        # display $line or do somthing with $line
	jsdoc2md "./js/$line" > "./doc/$line.md"

	echo "$line"
done <"$file"

