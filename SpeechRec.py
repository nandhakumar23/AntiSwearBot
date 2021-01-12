import speech_recognition as sr
from os import path
import sys
import soundfile as sf
import pyloudnorm as pyln
import json
from better_profanity import profanity

def use_spinx():
    try:
        text = Object_data['Sphinx']
        IsProfanity = profanity.contains_profanity(text)
        Object_data['Profanity'] = IsProfanity
        Object_data['silence'] = "false"
    except:
        Object_data['silence']="true"



THRESHOLD = -46
Object_data = {}
Object_data['silence'] = "true"
AUDIO_FILE = path.join(path.dirname(path.realpath(__file__)), sys.argv[1])

r = sr.Recognizer()
with sr.AudioFile(AUDIO_FILE) as source:
    audio = r.record(source)  # read the entire audio file

data, rate = sf.read(sys.argv[1]) # load audio

meter = pyln.Meter(rate) # create BS.1770 meter
try:
    loudness = meter.integrated_loudness(data)
    #print("Loudness: ", loudness)
    if(loudness < THRESHOLD):
        #print("Volume too low or silence, Skipping!")
        Object_data['silence'] = "true"
        nothing_happened = json.dumps(Object_data)
        print("{}")
        exit()
except ValueError:
    #print("Volume too low or silence, Skipping! (In this case file was too small)")
    exit()


f = open("wit_api.txt", "r")
WIT_AI_KEY = f.read()

try:
    Wit_Output = r.recognize_wit(audio, key=WIT_AI_KEY)
    #print("Wit.ai thinks you said " + Wit_Output)

    if(Wit_Output!=""):
        Object_data['silence'] = "false"
        Object_data['Wit']= Wit_Output
    else:
        Object_data['silence'] = "true"
        Object_data['Wit'] = "placeholder"

except sr.UnknownValueError:
    Wit_Output = "Wit.ai could not understand audio"
    #print(Wit_Output)
    Object_data['silence'] = "true"
    Object_data['Wit'] = Wit_Output
except sr.RequestError as e:
    Wit_Output = "Could not request results from Wit.ai service"
    Object_data['silence'] = "true"
    #print(Wit_Output)
    Object_data['Wit'] = Wit_Output


# recognize speech using Sphinx
try:
    Sphinx_Output = r.recognize_sphinx(audio)
    #print("Sphinx thinks you said " + Sphinx_Output)

    if (Sphinx_Output != ""):
        Object_data['silence'] = "false"
        Object_data['Sphinx'] = Sphinx_Output
    else:
        Object_data['silence'] = "true"
        Object_data['Sphinx'] = "placeholder"

except sr.UnknownValueError:
    Sphinx_Output = "Sphinx could not understand audio"
    #print(Sphinx_Output)
    Object_data['Sphinx'] = Sphinx_Output
    Object_data['silence'] = "true"
except sr.RequestError as e:
    Sphinx_Output = "Sphinx Error"
    #print(Sphinx_Output)
    Object_data['Sphinx'] = Sphinx_Output
    Object_data['silence'] = "true"

try:
    if Object_data['silence']=="false":
        text = Object_data['Wit']
        IsProfanity = profanity.contains_profanity(text)
        Object_data['Profanity'] = IsProfanity
except:
    use_spinx()

if(Object_data['silence']!="true"):
    final_json=json.dumps(Object_data)
    print(final_json)
else:
    print("{}")



