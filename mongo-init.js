db.auth('shapelabAdmin', 'shapelabPassword')

db = db.getSiblingDB('shapelab');

db.createUser(
	{
		user:"shapelab",
		pwd:"shapelab",
		roles: [{role:"readWrite",db: "shapelab"}],
		passwordDigestor:"server"
	}
);
db.auth("shapelab", "shapelab");
db.createCollection("userList");
db.userList.insert({"username":"admin", "password":"admin", "role":"admin"});
