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
point_dict = {"geometryType": "point", \
					 "geometryName": "point", \
					 "geometryData": [7, 3, -5],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point_line = {"geometryType": "lineSegments", \
					 "geometryName": "point_line", \
					 "geometryData": [[7, 3, -5], [7, 3, 0]],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point2_dict = {"geometryType": "point", \
					 "geometryName": "point", \
					 "geometryData": [0, 10, -8],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point2_line = {"geometryType": "lineSegments", \
					 "geometryName": "point_line", \
					 "geometryData": [[0, 10, -8], [5, 5, 0]],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point3_dict = {"geometryType": "point", \
					 "geometryName": "point", \
					 "geometryData": [-2, 8, 8],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point3_line = {"geometryType": "lineSegments", \
					 "geometryName": "point_line", \
					 "geometryData": [[-2, 8, 8], [3, 3, 8]],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point3_line_perpendicular = {"geometryType": "lines", \
					 "geometryName": "point_line", \
					 "geometryData": [[0, 0, 8], [10, 10, 8], [10, 0, 8], [0, 0, 8]],\
					 "color": 0xff0000, \
					 "username": "admin", \
					 "password": "admin"}
point3_line_perpendicular_triangle = {"geometryType": "triangles", \
					 "geometryName": "point_line", \
					 "geometryData": [[0, 0, 8], [10, 10, 8], [10, 0, 8]],\
					 "color": 0xffffff, \
					 "username": "admin", \
					 "password": "admin"}
front_face = {"geometryType": "triangles", \
			  "geometryData": [[0, 0, 0],[10, 10, 0],[10, 0, 0]], \
			  "color": 0x5500ff, \
			  "username": "admin", \
			  "password": "admin"}
triangle_mesh = {"geometryType": "triangles", \
					 "geometryName": "Triangle Prism", \
					 "geometryData": [[0, 0, 0],[0, 0, 20], [10, 0, 0], \
									  [0, 0, 20], [10, 0, 0], [10, 0, 20], \
									  [10, 0, 20], [10, 0, 0], [10, 10, 0], \
									  [10, 10, 0], [10, 0, 20], [10, 10, 20], \
									  [0, 0, 0], [0, 0, 20], [10, 10, 0], \
									  [10, 10, 0], [0, 0, 20], [10, 10, 20]],
					 "color": 0x5500ff, \
					 "opacity": 0.95, \
					 "username": "admin", \
					 "password": "admin"}
transparent_mesh = {"geometryType": "triangles", \
					 "geometryName": "Triangle Prism", \
					 "geometryData": [[0, 0, 0],[0, 0, -20], [10, 0, 0], \
									  [0, 0, -20], [10, 0, 0], [10, 0, -20], \
									  [10, 0, -20], [10, 0, 0], [10, 10, 0], \
									  [10, 10, -20], [10, 10, 0], [10, 0, -20], \
									  [0, 0, 0], [0, 0, -20], [10, 10, 0], \
									  [10, 10, 0], [0, 0, -20], [10, 10, -20]],
					 "color": 0x888888, \
					 "opacity": 0.6, \
					 "username": "admin", \
					 "password": "admin"}
half_space_plane = {"geometryType": "triangles", \
					 "geometryName": "half space", \
					 "geometryData": [[-100, -100, -0.01],[100, 100, -0.01], [-100, 100, -0.01], \
									  [100, -100, -0.01], [100, 100, -0.01], [-100, -100, -0.01]],
					 "color": 0xffff00, \
					 "opacity": 0.4, \
					 "username": "admin", \
					 "password": "admin"}

dataString = json.dumps([triangle_mesh, \
						 front_face, \
						 point_dict, \
						 point_line, \
						 point2_dict, \
						 point2_line, \
						 point3_dict, \
						 point3_line, \
						 point3_line_perpendicular, \
						 point3_line_perpendicular_triangle, \
						 half_space_plane, \
						 transparent_mesh], sort_keys=True)
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