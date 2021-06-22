const router = require("express").Router();
const { getDb } = require("../db/index");

// const usersCollection = client.db('hannah').collection('users')

router.get("/login", async (req, res) => {
  const db = getDb();
  const usersCollection = db.collection("users");
  const users = await usersCollection.find({}).toArray();
  console.log(users);

  // console.log("fungujeme auth")
  // const users = await usersCollection.find({}).toArray()
  // console.log(users);
  // res.json("fungujeme auth")
});

router.post("/login", async (req, res) => {
  const { username } = req.body;
  console.log(username);
  const usersCollection = getDb().collection("users");
  const user = await usersCollection.findOne({ username });
  if(user){
    const storesCollection = getDb().collection("stores");
    const stores = await storesCollection.find({storeManager: user._id}).map(store=>store.storeId).toArray()
    res.json(stores);
  }

});

module.exports = router;
