import json
import re
import urllib.request
import ssl
from bs4 import BeautifulSoup
import heapq


classes = ["tree", "windmill", "skyscraper", "house"]

# Activating this will allow for users to specify unknown website types.
ASK_FOR_USER_INPUT = True


def get_type(url_full, url):

    k = 50

    try:
        content = urllib.request.urlopen(url_full, context=ssl.SSLContext()).read()
    except:
        try:
            content = urllib.request.urlopen(url, context=ssl.SSLContext()).read()
        except:
            content = ""

    soup = BeautifulSoup(content)

    # kill all script and style elements
    for script in soup(["script", "style"]):
        script.extract()

    # get text
    text = soup.get_text()
    text = re.sub(' +', ' ', text)

    words = text.split()

    
    word_freq = {}

    for word in words:
        if word not in word_freq:
            word_freq[word] = 1
        else:
            word_freq[word] += 1

    k_largest = heapq.nlargest(k, word_freq, key=word_freq.get)


    # find a matching in pre-defined key sites list
    with open('keysites.json') as json_file:
        keywords = json.load(json_file)

        for c in classes:
            sites = keywords[c]

            for s in sites:
                if s in url_full:
                    return c


    # find a matching in pre-decined synonyms list
    with open('keywords.json') as json_file:
        keywords = json.load(json_file)

        for c in classes:
            synonyms = keywords[c]

            for k_large in k_largest:
                if (k_large in synonyms):
                    return c
    
    if ASK_FOR_USER_INPUT:
    
        class_label = input(url + " not found in inventory. Please select a label from the following classes (or enter to skip):\n" + str(classes) + "\n>>") 
        while (class_label not in classes) and (class_label != ""):
            print(class_label + " is not a valid class. Please input a valid class.")
            class_label = input(url + " not found in inventory. Please select a label from the following classes (or enter to skip):\n" + str(classes) + "\n>>") 

        return class_label

    return ""



frequency = {}

with open('../data/chrome_history.json') as json_file:
    data = json.load(json_file)
    for i in range(len(data)):

        d = data[i]

        url_full = d['url']
        indices = [m.start() for m in re.finditer(r"/",url_full)]
        if(len(indices) > 2):
            url = url_full[:indices[2]+1]

        if url not in frequency:

            obj = {}
            obj["frq"] = 1
            obj["typ"] = get_type(url_full, url)
            frequency[url] = obj

            print(str(i) + " | " + str(len(data)) + " | new -> " + frequency[url]["typ"])

        else:

            frequency[url]["frq"] += 1

            print(str(i) + " | " + str(len(data)) + " | repeat -> " + frequency[url]["typ"])



with open('../data/history_frequency.json', 'w') as outfile:
    json.dump(frequency, outfile, indent=4, sort_keys=True)