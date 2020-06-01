const express = require("express");

const PORT = process.env.PORT || 5000;

const app = express();

app.use("/api/profiles", require("./routes/api/profiles"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
