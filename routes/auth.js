const router = require("express").Router();
const { getDb } = require("../db/index");
const jwt = require('jsonwebtoken')

router.post("/login", async (req, res) => {
    const { username } = req.body;  
    const usersCollection = getDb().collection("users");
    const user = await usersCollection.findOne({ username });
    if(user){
      const storesCollection = getDb().collection("stores");
      const stores = await storesCollection.find({storeManager: user._id}).map(store=>store.storeId).toArray()
      console.log(process.env.TOKEN_SECRET);
      const token = getSignedJwtToken({id: user._id, role: user.role})
      res.json({success: true, token});
    }else {
      res.json({success: false});
    }
    

  
  });

  getSignedJwtToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    })
  }
  
  module.exports = router;



