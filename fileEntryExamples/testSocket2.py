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
block_dict = {"fileName": "blocks.obj", \
			  "fileData": fileData("./blocks.obj"), \
			  "configuration": [{"rotateX": 1}, {"rotateY": 1}, {"rotateZ": 1}, {"translate": [1, 1, 1]}],\
			  "color": 0x0055ff, \
			  "username": "admin", \
			  "password": "admin"}
lines_dict = {"geometryType": "lines", \
			  "geometryName": "lines", \
			  "geometryData": [[0, 0, 2],[10, 10, 2],[10, 0, 2]],\
			  "color": 0x0000ff, \
			  "username": "admin", \
			  "password": "admin"}
linesegs_dict = {"geometryType": "lineSegments", \
				 "geometryName": "lines", \
				 "geometryData": [[0, 0, 1],[10, 10, 1],[10, 0, 1], [0, 10, 1]],\
				 "configuration": [{"rotateX": 1}, {"rotateY": 1}, {"rotateZ": 1}, {"translate": [0, 0, 0]}],\
				 "username": "admin", \
				 "password": "admin"}
linesegpairs_dict = {"geometryType": "lineSegmentPairs", \
					 "geometryName": "lines", \
					 "geometryData": [[[0, 0, 0],[10, 10]],[[10, 0, 0], [0, -10, 0]]],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
line_fading_color = {"geometryType": "lineSegmentPairs", \
					 "geometryName": "lines", \
					 "geometryData": [[[0, 0, 4],[10, 10, 4]],[[10, 0, 4], [0, -10, 4]]],\
					 "color": [0xff0000, 0x00ff00], \
					 "username": "admin", \
					 "password": "admin"}
line_fading_color2 = {"geometryType": "lineSegments", \
					 "geometryName": "lines", \
					 "geometryData": [[0, 0, 5],[10, 10, 5],[10, 0, 5], [0, 10, 5]],\
					 "color": [0xff0000, 0x00ff00], \
					 "username": "admin", \
					 "password": "admin"}
line_fading_color3 = {"geometryType": "lines", \
					 "geometryName": "lines", \
					 "geometryData": [[0, 0, 6],[10, 10, 6],[10, 0, 6], [0, 10, 6]],\
					 "color": [0xff0000, 0x00ff00], \
					 "username": "admin", \
					 "password": "admin"}

dataString = json.dumps([block_dict, \
						 lines_dict, \
						 linesegs_dict, \
						 linesegpairs_dict, \
						 line_fading_color, \
						 line_fading_color2, \
						 line_fading_color3], sort_keys=True)
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