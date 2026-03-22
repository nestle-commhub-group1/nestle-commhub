require("dotenv").config()
const mongoose = require("mongoose")
const User = require("../models/User")

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const result = await User.deleteMany({
      email: {
        $in: [
          "teststaff@nestle.com",
          "tester002@nestle.com",
          "tester001@test.com",
          "fake@nestle.com"
        ]
      }
    })
    console.log("Deleted:", result.deletedCount, "test accounts")
    mongoose.disconnect()
  })
