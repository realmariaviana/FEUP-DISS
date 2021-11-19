var sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "NEW.db";
//const DBSOURCE = "DISS.db";

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message)
    throw err
  }
});

function delete_all_records_from_db() {
  let tables = ['Grade', 'Evaluation', 'Submission', 'Assign', 'Post', 'Forum', 'Attempt', 'Quiz', 'Student_in_Course', 'Student', 'Course'];
  let sql = 'DELETE FROM ';
  tables.forEach(element => {
    let sql_cmd = sql + element + ';';
    db.run(sql_cmd, [],
      function (err, result) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
      }
    );
  });
}

module.exports = {
  db: db,
  delete_all_records_from_db: delete_all_records_from_db
};
