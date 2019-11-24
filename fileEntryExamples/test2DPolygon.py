'''
Created on Jan 24, 2019

@author: micou
'''
import zmq
import json
import time
import io

def fileData(fileName):
	with open(fileName, "r") as f:
		return f.read()

context = zmq.Context() # The exactly one context in one process
                        # context is the container for all sockets in a single process


socket = context.socket(zmq.REQ) # use context to create socket. define socket type here. Use REQ socket to send data to server

socket.connect("tcp://127.0.0.1:8081") # find out server's address and port for file entry

# Prepare data to send, turn it to byte string.
# Data we send out should be byte string, which is wrapped in json
#
polygon = {"geometryType": "polygon", \
		   "geometryName": "2D-polygon", \
		   # Contour should follow clockwise or counter-clockwise order
		   "geometryData": [[0, 1], [1, 1], [1, 0], [0, 0] ], \
		   # color can be single value, e.g. 0xff5500
		   "color": [0x55ff00, 0x00ff00, 0xff0000, 0x0000ff], \
		   "opacity": 0.9, \
		   "username": "admin", \
		   "password": "admin"}

dataString = json.dumps([polygon], sort_keys=True)
dataBinaryString = dataString.encode(encoding='utf_8', errors='strict')
while True:
    t1 = time.time()
    socket.send(dataBinaryString)
    message = socket.recv()  # Remember to recv result from server. Otherwise socket cannot send out next data
    t2 = time.time()
    if message != b"OK":
        # If server process all data correctly, it will return "OK". Otherwise it will give you error reason
        print(message)
    else:
        print(message, " Take about "+str(t2-t1)+" seconds in sending data");
    break;