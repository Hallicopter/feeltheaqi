const express = require('express');
const path = require('path');
const app = express();

// Serve static files from root directory
app.use(express.static(__dirname));

// Serve node_modules directory
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
