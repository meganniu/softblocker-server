const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const app = express();

// body parse middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cors middleware
const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

app.use("/api/profiles", require("./routes/api/profiles"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
