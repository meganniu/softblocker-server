const express = require("express");

const PORT = process.env.PORT || 5000;

const app = express();

// body parse middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/profiles", require("./routes/api/profiles"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
