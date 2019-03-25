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

If you want to send data to server, first you need to initialize a ZMQ REQ socket, then send your model through stringified json format. Here is the format for the json:

```json
[{
    "username": "<YOUR_USERNAME>",
    "password": "<YOUR_PASSWORD>",
    "fileName": "<YOUR_FILENAME>.<CORRECT_3D_OBJECT_SUFFIX>",
    "fileData": "<YOUR_FILE_DATA_STRING_IN_UTF8_ENCODING>",
    "fileConfiguration": [<TRANFORMATION_DICT>]
},
...
]
```

And TRANFORMATION_DICT can be

```json
{"translate": [REAL_NUMBER, REAL_NUMBER, REAL_NUMBER]}
{"rotateX": REAL_NUMBER}
{"rotateY": REAL_NUMBER}
{"rotateZ": REAL_NUMBER}
```

Transformation_dict in "fileConfiguration" will be applied to that object in order.

You can have multiple objects in one json object, then all objects will show on screen at the same time.
