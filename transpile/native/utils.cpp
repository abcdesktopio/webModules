#include <iostream>
#include <string>

void findAndReplaceAll(std::string & data, std::string toSearch, std::string replaceStr) {
    size_t pos = data.find(toSearch);
    while (pos != std::string::npos) {
        data.replace(pos, toSearch.size(), replaceStr);
        pos =data.find(toSearch, pos + replaceStr.size());
    }
}
