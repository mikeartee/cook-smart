const bcrypt = require('bcrypt');
bcrypt.hash('MidgettRoad', 10).then(hash => console.log(hash));
