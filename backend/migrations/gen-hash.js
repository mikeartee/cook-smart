const bcrypt = require('bcrypt');
bcrypt.hash('CookSmart2024!', 10).then(hash => console.log(hash));
