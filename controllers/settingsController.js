const db = require('../config/db');  // Assuming you're using the promise-based db module

exports.getSettingsPage = async (req, res) => {
  try {
    // Fetch data from the My_faces table
    const [rows] = await db.query('SELECT * FROM My_faces'); // Destructure to get rows directly
    const myFaces = rows;  // No need to access `result.rows` anymore, just use rows

    // Render the settings page with the data
    res.render('settings', { myFaces: myFaces, user: req.user });
  } catch (error) {
    console.error('Error fetching face data:', error);
    res.status(500).send('Error retrieving data');
  }
};
