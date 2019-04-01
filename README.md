# ShapelabDisplay

Share your 3D models with others and you can lively update your model.

## Installation

### Docker
You can run it by using docker compose.

`docker-compose up`

### Manual

Or to install it by yourself, but you need to set up database by yourself.

```console
mongod --dbpath=./db
```

And insert following information to your shapelab database:

```console
foo@bar~$: mongo
> use shapelab
> db.createUser({
    user:"shapelab",
    pwd:"shapelab",
    roles: [{role:"readWrite", db:"shapelab"}],
    passwordDigestor:"server"
  });
> use shapelab
> db.createCollection("userList")
> db.userList.insert({"username":"admin", "password":"admin", "role":"admin"});
```

Then you can start your website now

```console
npm start
```

## Live Update
By default, server will use port 8081 to accept data. All authenticated data accepted through that port will broadcast to all corresponding user. We are using [ZMQ](http://zeromq.org/) protocol to receive data.

If you want to send data to server, first you need to initialize a ZMQ REQ socket, then send your model through stringified json object.

### JSON Object format
In this json object, you can insert multiple objects dictionary, but each of them should follow either MODELFILE\_DICT or GEOMETRY\_DICT format.

Definition of json object: An array(list) contain MODELFILE\_DICT or GEOMETRY\_DICT or mix of these two.
```
[
MODELFILE_DICT,
MODELFILE_DICT,
GEOMETRY_DICT,
...
]
```
#### MODELFILE_DICT format
MODELFILE_DICT must have fields "fileName", "fileData", "username", "password". It is optional to have "color" and "configuration" fields.
```
{
    "fileName": "<MODEL_NAME>.<CORRECT_MODEL_SUFFIX>",
    "fileData": "<FILE_DATA_STRING>",
    "username": "<SHAPELAB_DISPLAY_USERNAME>",
    "password": "<SHAPELAB_DISPLAY_PASSWORD>",
    (Optional) "color": 0xff0000(Color RGB hex here),
    (Optional) "configuration": <TRANSOFORMATION_ARRAY>  
}
```

#### GEOMETRY_DICT format
And GEOMETRY_DICT must have fields "geometryType", "geometryData", "username", "password". It is optinal to have "geometryName", "color" and "configuration" fields.
```
{
    "geometryTypes": "<GEOMETRY_TYPE_STRING>"(Check all support type string below),
    "geometryData": "<GEOMETRY_TYPE_CORRESPONDING_DATA>",
    "username": "<SHAPELAB_DISPLAY_USERNAME>",
    "password": "<SHAPELAB_DISPLAY_PASSWORD>",
    (Optional) "geometryName": "<NAME_OF_GEOMETRY_OBJECT>"(If this field missing, use geometryTypes as geometryName),
    (Optional) "color": 0xff0000(Color RGB hex here),
    (Optional) "configuration": <TRANSOFORMATION_ARRAY>  

}
```
Now GEOMETRY_TYPE_STRING can be "lines", "lineSegments", "lineSegmentPairs".

If is "lines", then in geometryData user should provide an array of 3D vertices. A line will draw between consecutive pair of vertices. etc. [[0, 0, 0], [1, 0, 0], [0, 1, 0]] will draw following lines: [0, 0, 0] => [1, 0, 0], [1, 0, 0] => [0, 1, 0]

If is "lineSegments", then in geometryData user should provide an array of 3D vertices. A line will draw between each pair of vertices. etc. [[0, 0, 0], [1, 0, 0], [0, 1, 0], [2, 0, 0]] will draw following lines: [0, 0, 0] => [1, 0, 0], [0, 1, 0] => [2, 0, 0]

If is "lineSegmentPairs", then in geometryData user should provide an array of line segment, in which start and end point should be 3D vertices. etc. [[[0, 0, 0], [1, 0, 0]], [[0, 1, 0], [2, 0, 0]]] will draw following lines: [0, 0, 0] => [1, 0, 0], [0, 1, 0] => [2, 0, 0]

#### TRANSFORMATION_ARRAY
TRANSOFORMATION_ARRAY is an array contains TRANFORMATION_DICT. Transformation will be applied in order.
```
[TRANSFORMATION_DICT, ...]
```

TRANSFORMATION_DICT options
```
{"translate": [REAL_NUMBER, REAL_NUMBER, REAL_NUMBER]}
{"rotateX": REAL_NUMBER}
{"rotateY": REAL_NUMBER}
{"rotateZ": REAL_NUMBER}
```

#### Advanced color setting
If you are using GEOMETRY_DICT, you can use advanced color settings for lines. But for different GEOMETRY_TYPE_STRING, they will accept different color setting.

For "lines", you can give it a hex number. you can give starting point and ending point color in a list. Or color for every vertex in list.

For "lineSegments", you can give it a hex number. you can give starting point and ending point color for each segment. Or color for every vertex in list.

For "lineSegmentPairs", you can give it a hex number. you can give starting point and ending point color for each segment. Or color for every vertex in list, or you can group every two vertices color in one list just like you did for vertices. 

# Reference and acknowledge

This project is based on [Three.js](https://github.com/mrdoob/three.js/) [editor](https://github.com/mrdoob/three.js/tree/master/editor).
