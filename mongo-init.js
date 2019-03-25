db.auth('shapelabAdmin', 'shapelabPassword')

db.createUser(
	{
		user:"shapelab",
		pwd:"shapelab",
		roles: [{role:"readWrite",db: "shapelab"}, {role:"readWrite", db: "admin"}],
		passwordDigestor:"server"
	}
);
db.auth("shapelab", "shapelab");
db = db.getSiblingDB('shapelab');
db.createCollection("userList");
db.userList.insert({"username":"admin", "password":"admin", "role":"admin"});
