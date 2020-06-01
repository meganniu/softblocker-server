const express = require("express");
const Profile = require("../../profile");

const router = express.Router();

router.get("/:id", async (req, res) => {
  const profile = new Profile({ id: req.params.id });
  profile
    .getCreationPromise()
    .then(() => {
      console.log(profile.getInfo());
      res.json(profile.getInfo());
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({
        msg: `Unable to get profile with ID ${req.params.id}`,
      });
    });
});

module.exports = router;
