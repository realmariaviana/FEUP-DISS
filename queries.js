const { db } = require("./database.js");
const d3 = require('d3');
const percentRank = require('percentile-rank');


function get_activities_by_week_by_course() {
  let sql = queries_sql.get_activities_by_week_by_course;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = []
        rows.forEach(element => {
          if (aux[element.week] == undefined) {
            aux[element.week] = { week: element.week, courses: [] };
          }
          if (aux[element.week].courses[element.course] == undefined) {
            aux[element.week].courses[element.course] = { course: element.course, activities: 0, done_activities: 0 };
          }
          aux[element.week].courses[element.course].activities += element.quizzes + element.forums + element.assigns;
          aux[element.week].courses[element.course].done_activities += element.done_quizzes + element.done_forums + element.done_assigns;
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_activities_from_all_students() {
  let sql = queries_sql.percentage_of_activities_per_opportunities;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = [];
        rows.forEach(element => {
          aux.push([element.name, 100.0 * element.participation / element.opportunities, element.student]);
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_activities_from_courses() {
  let sql = queries_sql.get_activities_from_courses;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let courses = [];
        rows.forEach(element => {
          if (courses[element.course] == null) {
            courses[element.course] = { name: element.code, forums: { data: [], values: [100] }, quizzes: { data: [], values: [100] }, assigns: { data: [], values: [100] }, ontime: { data: [], values: [100] } };
          }
          courses[element.course].forums.data.push(100 * element.post / element.forum);
          courses[element.course].quizzes.data.push(100 * element.attempt / element.quiz);
          courses[element.course].assigns.data.push(100 * element.submission / element.assign);
          courses[element.course].ontime.data.push(100 * element.ontime / element.assign);
        });
        let aux = [];
        courses.forEach(element => {
          if (element != null) {
            aux.push(element);
            element.forums.data.sort(function (a, b) { return a - b });
            element.forums.values.push(d3.quantile(element.forums.data, 0));
            element.forums.values.push(d3.quantile(element.forums.data, 0.25));
            element.forums.values.push(d3.quantile(element.forums.data, 0.5));
            element.forums.values.push(d3.quantile(element.forums.data, 0.75));
            element.forums.values.push(d3.quantile(element.forums.data, 1));

            element.quizzes.data.sort(function (a, b) { return a - b });
            element.quizzes.values.push(d3.quantile(element.quizzes.data, 0));
            element.quizzes.values.push(d3.quantile(element.quizzes.data, 0.25));
            element.quizzes.values.push(d3.quantile(element.quizzes.data, 0.5));
            element.quizzes.values.push(d3.quantile(element.quizzes.data, 0.75));
            element.quizzes.values.push(d3.quantile(element.quizzes.data, 1));

            element.assigns.data.sort(function (a, b) { return a - b });
            element.assigns.values.push(d3.quantile(element.assigns.data, 0));
            element.assigns.values.push(d3.quantile(element.assigns.data, 0.25));
            element.assigns.values.push(d3.quantile(element.assigns.data, 0.5));
            element.assigns.values.push(d3.quantile(element.assigns.data, 0.75));
            element.assigns.values.push(d3.quantile(element.assigns.data, 1));

            element.ontime.data.sort(function (a, b) { return a - b });
            element.ontime.values.push(d3.quantile(element.ontime.data, 0));
            element.ontime.values.push(d3.quantile(element.ontime.data, 0.25));
            element.ontime.values.push(d3.quantile(element.ontime.data, 0.5));
            element.ontime.values.push(d3.quantile(element.ontime.data, 0.75));
            element.ontime.values.push(d3.quantile(element.ontime.data, 1));

          }
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_lastAccess() {
  let sql = queries_sql.get_lastAccess;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let today = new Date(2021, 02, 01); // TODO: Change for TODAY
        let students_ids = [];
        let aux = [];
        rows.forEach(element => {
          let index = students_ids.indexOf(element.student);
          if (index == -1) {
            index = students_ids.push(element.student) - 1;
            aux[index] = {
              student: element.student,
              lastaccess: element.lastaccess,
              per: [],
              week: element.week,
              done_per: 100 * element.done_num / element.act_num
            };
          }
          if (element.lastaccess > aux[index].lastaccess) {
            aux[index].lastaccess = element.lastaccess;
          }
          aux[index].per.push(element.act_num == null ? null : (100 * element.done_num / element.act_num));
          if (element.week > aux[index].week) {
            aux[index].week = element.week;
            aux[index].done_per = 100 * element.done_num / element.act_num;
          }
        });
        let res = [];
        aux.forEach(element => {
          let days = null;
          if (element.lastaccess != null) {
            let last = new Date(element.lastaccess * 1000);
            days = Math.floor((today - last) / (1000 * 60 * 60 * 24));
          }
          res.push({ id: element.student, days: days, avg: d3.mean(element.per), per: element.done_per });
        });

        resolve(res);
      }
    );
  });
  return promise;
}
function get_evaluations(student_id) {
  let sql = queries_sql.grades;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = []
        rows.forEach(element => {
          if (aux[element.course_id] == undefined) {
            aux[element.course_id] = { course: element.course_code, evals: [] };
          }
          if (element.eval_id != null) {
            if (aux[element.course_id].evals[element.eval_id] == undefined) {
              aux[element.course_id].evals[element.eval_id] = { name: element.eval_name, data: [] };
            }
            if (element.value != null) {
              aux[element.course_id].evals[element.eval_id].data.push(element.value);
              if (student_id == element.student) {
                aux[element.course_id].evals[element.eval_id].grade = element.value;
              }
            }
          }
        });
        aux.forEach(course => {
          course.evals.forEach(element => {
            element.data.sort(function (a, b) { return a - b });
            element.min = d3.quantile(element.data, 0);
            element.Q1 = d3.quantile(element.data, 0.25);
            element.median = d3.quantile(element.data, 0.5);
            element.Q3 = d3.quantile(element.data, 0.75);
            element.max = d3.quantile(element.data, 1);
            if (element.grade != null) {
              element.percentile = percentRank(element.data, element.grade);
            }
          });
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_percentages(student_id) {
  let sql = queries_sql.percentage_student_view;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let res = [
          ['Participated Forums'],
          ['Attempted Quizzes'],
          ['Submitted Assignments'],
          ['OnTime Submissions']
        ];
        let aux = [[], [], [], []];
        rows.forEach(element => {
          aux[0].push(100.0 * element.participated_forums / element.available_forums);
          aux[1].push(100.0 * element.participated_quizzes / element.available_quizzes);
          aux[2].push(100.0 * element.participated_assigns / element.available_assigns);
          aux[3].push(100.0 * element.ontime_submissions / element.assigns);
          if (element.student == student_id) {
            res[0].push(100.0 * element.participated_forums / element.available_forums);
            res[1].push(100.0 * element.participated_quizzes / element.available_quizzes);
            res[2].push(100.0 * element.participated_assigns / element.available_assigns);
            res[3].push(100.0 * element.ontime_submissions / element.assigns);
          }
        });
        for (let index = 0; index < aux.length; index++) {
          const element = aux[index];
          element.sort(function (a, b) { return a - b });
          res[index].push(d3.quantile(element, 0));
          res[index].push(d3.quantile(element, 0.25));
          res[index].push(d3.quantile(element, 0.5));
          res[index].push(d3.quantile(element, 0.75));
          res[index].push(d3.quantile(element, 1));
          res[index].push(percentRank(element, res[index][1]));
        }
        resolve(res);
      }
    );
  });
  return promise;
}
function get_student(student_id) {
  let sql = queries_sql.get_student;
  let params = [student_id];
  let promise = new Promise((resolve, reject) => {
    db.get(sql, params,
      function (err, row) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        resolve(row);
      }
    );
  });
  return promise;
}
function get_courses(student_id) {
  let sql = queries_sql.get_courses;
  let params = [student_id];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, row) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        resolve(row);
      }
    );
  });
  return promise;
}
function get_activities_in_time(student_id) {
  let sql = queries_sql.get_activities_in_time;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = []
        rows.forEach(element => {
          if (aux[element.week] == undefined) {
            aux[element.week] = { week: element.week, activities: [] };
          }
          aux[element.week].activities.push(element.activities / element.courses);
          if (student_id == element.student) {
            aux[element.week].student = element.activities / element.courses;
          }
        });
        aux.forEach(element => {
          element.average = d3.mean(element.activities);
          element.median = d3.median(element.activities);
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_indicators(student_id) {
  let sql = queries_sql.get_indicators;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let res = [
          ['Attempts per quiz'],
          ['Posts per forum']
        ];
        let aux = [[], []];
        rows.forEach(element => {
          aux[0].push(element.attempts / element.unlimited_quizzes);
          aux[1].push(element.posts / element.forums);
          if (element.student == student_id) {
            res[0].push(element.attempts / element.unlimited_quizzes);
            res[1].push(element.posts / element.forums);
          }
        });
        for (let index = 0; index < aux.length; index++) {
          const element = aux[index];
          res[index].push(d3.mean(element));
        }
        resolve(res);
      }
    );
  });
  return promise;
}
function get_timeline_of_activities_done(student_id) {
  let sql = queries_sql.get_timeline_of_activities_done;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = []
        rows.forEach(element => {
          if (aux[element.week] == undefined) {
            aux[element.week] = { week: element.week, percentages: [], student: {} };
          }
          let open_activities = element.open_quizzes + element.open_forums + element.open_assigns;
          let close_activities = element.closed_quizzes + element.closed_forums + element.closed_assigns;
          let all_activities = open_activities + close_activities;

          let done_activities_on_time = element.done_quizzes_on_time + element.done_forums_on_time + element.done_assigns_on_time;
          let done_activities_late = element.done_quizzes_late + element.done_forums_late + element.done_assigns_late;

          aux[element.week].percentages.push((done_activities_on_time + done_activities_late) / all_activities);
          if (student_id == element.student) {
            aux[element.week].student.all_activities = all_activities;
            aux[element.week].student.done_activities = done_activities_on_time + done_activities_late;
          }
        });
        aux.forEach(element => {
          element.average = d3.mean(element.percentages);
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_course_info(course_id) {
  let sql = queries_sql.get_course_info;
  let params = [course_id];
  let promise = new Promise((resolve, reject) => {
    db.get(sql, params,
      function (err, row) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        resolve(row);
      }
    );
  });
  return promise;
}
function get_participation_on_course(course_id) {
  let sql = queries_sql.get_participation_on_course;
  let params = [course_id];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let res = [];
        rows.forEach(element => {
          res.push([element.student, element.name, 100 * element.participation / element.opportunities]);
        });
        resolve(res);
      }
    );
  });
  return promise;
}
function get_timeline_info_on_course(course_id) {
  let sql = queries_sql.get_timeline_info_on_course;
  let params = [course_id];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        resolve(rows);
      }
    );
  });
  return promise;
}
function get_C_evaluations_from_course(course_id) {
  let sql = queries_sql.get_C_evaluations_from_course;
  let params = [course_id];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = [];
        let students_ids = [];
        let eval_ids = [];
        rows.forEach(element => {
          let index_eval = eval_ids.indexOf(element.eval_id);
          if (index_eval == -1) {
            index_eval = eval_ids.push(element.eval_id) - 1;
          }
          if (aux[index_eval] == undefined) {
            aux[index_eval] = { name: element.eval_name, data: [], students_values: [] };
          }
          let index = students_ids.indexOf(element.student);
          if (index == -1) {
            index = students_ids.push(element.student) - 1;
          }
          aux[index_eval].students_values[index] = element.value;
          if (element.value != null) {
            aux[index_eval].data.push(element.value);
          }
        });
        aux.forEach(element => {
          element.data.sort(function (a, b) { return a - b });
          element.min = d3.quantile(element.data, 0);
          element.Q1 = d3.quantile(element.data, 0.25);
          element.median = d3.quantile(element.data, 0.5);
          element.Q3 = d3.quantile(element.data, 0.75);
          element.max = d3.quantile(element.data, 1);
          element.data = null;
        });
        aux = { students_ids: students_ids, data: aux };
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_S_activities_in_timeline(student_id) {
  let sql = queries_sql.get_S_activities_in_timeline;
  let params = [student_id];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        resolve(rows);
      }
    );
  });
  return promise;
}
function get_P_aggregate_grades() {
  let sql = queries_sql.get_P_aggregate_grades;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = [];
        let courses_ids = [];
        rows.forEach(element => {
          let index = courses_ids.indexOf(element.course);
          if (index == -1) {
            index = courses_ids.push(element.course) - 1;
            aux[index] = { course: element.course, data: [] };
          }
          aux[index].data.push(element.value);
        });
        aux.forEach(element => {
          element.data.sort(function (a, b) { return a - b });
          element.min = d3.quantile(element.data, 0);
          element.Q1 = d3.quantile(element.data, 0.25);
          element.median = d3.quantile(element.data, 0.5);
          element.Q3 = d3.quantile(element.data, 0.75);
          element.max = d3.quantile(element.data, 1);
        });
        resolve(aux);
      });
  });
  return promise;
}
function get_P_aggregate_activities() {
  let sql = queries_sql.get_P_aggregate_activities;
  let params = [];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let aux = [];
        let courses_ids = [];
        rows.forEach(element => {
          let index = courses_ids.indexOf(element.course);
          if (index == -1) {
            index = courses_ids.push(element.course) - 1;
            aux[index] = { course: element.course, data: [] };
          }
          aux[index].data.push(100 * element.done / element.act);
        });
        aux.forEach(element => {
          element.data.sort(function (a, b) { return a - b });
          element.min = d3.quantile(element.data, 0);
          element.Q1 = d3.quantile(element.data, 0.25);
          element.median = d3.quantile(element.data, 0.5);
          element.Q3 = d3.quantile(element.data, 0.75);
          element.max = d3.quantile(element.data, 1);
        });
        resolve(aux);
      }
    );
  });
  return promise;
}
function get_C_boxplot_of_activities(course_id) {
  let sql = queries_sql.get_C_boxplot_of_activities;
  let params = [course_id];
  let promise = new Promise((resolve, reject) => {
    db.all(sql, params,
      function (err, rows) {
        if (err) {
          console.error(err);
          console.trace();
          return err;
        }
        let forums_data = [];
        let quizzes_data = [];
        let assigns_data = [];
        let students_ids = [];
        let res = [
          ['Participated Forums'],
          ['Attempted Quizzes'],
          ['Submitted Assignments']
        ];
        rows.forEach(element => {
          let index = students_ids.indexOf(element.student);
          if (index == -1) {
            index = students_ids.push(element.student) - 1;
          }
          forums_data.push(100 * element.post / element.forum);
          quizzes_data.push(100 * element.attempt / element.quiz);
          assigns_data.push(100 * element.submission / element.assign);
          res[0][index + 1] = 100 * element.post / element.forum;
          res[1][index + 1] = 100 * element.attempt / element.quiz;
          res[2][index + 1] = 100 * element.submission / element.assign;
        });
        forums_data.sort(function (a, b) { return a - b });
        res[0].push(d3.quantile(forums_data, 0));
        res[0].push(d3.quantile(forums_data, 0.25));
        res[0].push(d3.quantile(forums_data, 0.5));
        res[0].push(d3.quantile(forums_data, 0.75));
        res[0].push(d3.quantile(forums_data, 1));
        quizzes_data.sort(function (a, b) { return a - b });
        res[1].push(d3.quantile(quizzes_data, 0));
        res[1].push(d3.quantile(quizzes_data, 0.25));
        res[1].push(d3.quantile(quizzes_data, 0.5));
        res[1].push(d3.quantile(quizzes_data, 0.75));
        res[1].push(d3.quantile(quizzes_data, 1));
        assigns_data.sort(function (a, b) { return a - b });
        res[2].push(d3.quantile(assigns_data, 0));
        res[2].push(d3.quantile(assigns_data, 0.25));
        res[2].push(d3.quantile(assigns_data, 0.5));
        res[2].push(d3.quantile(assigns_data, 0.75));
        res[2].push(d3.quantile(assigns_data, 1));
       

        res = { students_ids: students_ids, data: res };
        resolve(res);
      }
    );
  });
  return promise;
}
module.exports = {
  get_P_aggregate_activities: get_P_aggregate_activities,
  get_P_aggregate_grades: get_P_aggregate_grades,
  get_C_boxplot_of_activities: get_C_boxplot_of_activities,
  get_S_activities_in_timeline: get_S_activities_in_timeline,
  get_course_info: get_course_info,
  get_participation_on_course: get_participation_on_course,
  get_activities_from_all_students: get_activities_from_all_students,
  get_activities_from_courses: get_activities_from_courses,
  get_evaluations: get_evaluations,
  get_percentages: get_percentages,
  get_student: get_student,
  get_courses: get_courses,
  get_activities_in_time: get_activities_in_time,
  get_indicators: get_indicators,
  get_lastAccess: get_lastAccess,
  get_timeline_of_activities_done: get_timeline_of_activities_done,
  get_timeline_info_on_course: get_timeline_info_on_course,
  get_activities_by_week_by_course: get_activities_by_week_by_course,
  get_C_evaluations_from_course: get_C_evaluations_from_course,
};

let queries_sql = {
  get_P_aggregate_activities: "SELECT course,        STUDENT_IN_COURSE.student,        count(id) AS act,        count(done) AS done   FROM (            SELECT id,                   course              FROM QUIZ            UNION ALL            SELECT id,                   course              FROM FORUM            UNION ALL            SELECT id,                   course              FROM ASSIGN        )        AS tab1        JOIN        STUDENT_IN_COURSE USING (            course        )        LEFT JOIN        (            SELECT student,                   forum AS act,                   created AS done              FROM POST            UNION ALL            SELECT student,                   assign AS act,                   created AS done              FROM SUBMISSION            UNION ALL            SELECT student,                   quiz AS act,                   finish AS done              FROM ATTEMPT        )        AS tab2 ON (act = id AND                     STUDENT_IN_COURSE.student = tab2.student)   GROUP BY course,           STUDENT_IN_COURSE.student;",
  get_P_aggregate_grades: "SELECT course,        value   FROM STUDENT_IN_COURSE        LEFT JOIN        EVALUATION USING (            course        )        LEFT JOIN        GRADE ON (GRADE.evaluation = EVALUATION.id AND                   STUDENT_IN_COURSE.student = GRADE.student);",
  get_C_boxplot_of_activities: "SELECT STUDENT_IN_COURSE.student,        course,        count(DISTINCT FORUM.id) AS forum,        count(DISTINCT QUIZ.id) AS quiz,        count(DISTINCT ASSIGN.id) AS assign,        count(DISTINCT POST.forum) AS post,        count(DISTINCT ATTEMPT.quiz) AS attempt,        count(DISTINCT SUBMISSION.assign) AS submission   FROM STUDENT_IN_COURSE        LEFT JOIN        FORUM USING (            course        )        LEFT JOIN        QUIZ USING (            course        )        LEFT JOIN        ASSIGN USING (            course        )        LEFT JOIN        POST ON (STUDENT_IN_COURSE.student = POST.student AND                  FORUM.id = POST.forum)         LEFT JOIN        ATTEMPT ON (STUDENT_IN_COURSE.student = ATTEMPT.student AND                     QUIZ.id = ATTEMPT.quiz)         LEFT JOIN        SUBMISSION ON (STUDENT_IN_COURSE.student = SUBMISSION.student AND                        ASSIGN.id = SUBMISSION.assign)                        WHERE course = ?  GROUP BY course,           STUDENT_IN_COURSE.student;",
  get_S_activities_in_timeline: "SELECT id, course, time_open, time_close,((time_open - 1602284400) / 604800) AS week_start, (( time_close- 1602284400) / 604800) AS week_end, done FROM(  SELECT id, course, time_open, time_close FROM QUIZ UNION ALL SELECT id, course, time_open, time_close FROM FORUM UNION ALL SELECT id, course, time_open, time_close FROM ASSIGN )AS tab1  JOIN STUDENT_IN_COURSE USING (course) LEFT JOIN( SELECT student, forum AS act, created AS done FROM POST UNION ALL SELECT student, assign AS act, created AS done FROM SUBMISSION UNION ALL SELECT student, quiz AS act, finish AS done FROM ATTEMPT )AS tab2 ON (act = id AND STUDENT_IN_COURSE.student = tab2.student) WHERE  STUDENT_IN_COURSE.student = ? ;",
  get_course_info: "SELECT *, count() AS num_students FROM COURSE JOIN STUDENT_IN_COURSE ON (id = course)WHERE id = ?;",
  get_C_evaluations_from_course: "SELECT         STUDENT_IN_COURSE.student AS student,        EVALUATION.id AS eval_id,        EVALUATION.name AS eval_name,        value   FROM STUDENT_IN_COURSE        LEFT JOIN        EVALUATION USING (            course        )        LEFT JOIN        GRADE ON (GRADE.evaluation = EVALUATION.id AND                   STUDENT_IN_COURSE.student = GRADE.student)         JOIN        COURSE ON (STUDENT_IN_COURSE.course = COURSE.id)        WHERE course = ?; ",
  get_activities_by_week_by_course: "SELECT number AS week,        STUDENT_IN_COURSE.course,        STUDENT_IN_COURSE.student,        count(DISTINCT QUIZ.id) AS quizzes,        count(DISTINCT ASSIGN.id) AS assigns,        count(DISTINCT FORUM.id) AS forums,        count(DISTINCT post1.forum) AS done_forums,        count(DISTINCT submission1.assign) AS done_assigns,        count(DISTINCT attempt1.quiz) AS done_quizzes   FROM WEEK        LEFT JOIN        STUDENT_IN_COURSE        LEFT JOIN        QUIZ ON (STUDENT_IN_COURSE.course = QUIZ.course AND                  number >= (QUIZ.time_open - 1602284400) / 604800)         LEFT JOIN        FORUM ON (STUDENT_IN_COURSE.course = FORUM.course AND                   number >= (FORUM.time_open - 1602284400) / 604800)         LEFT JOIN        ASSIGN ON (STUDENT_IN_COURSE.course = ASSIGN.course AND                    number >= (ASSIGN.time_open - 1602284400) / 604800)         LEFT JOIN        ATTEMPT AS attempt1 ON (number >= (attempt1.start - 1602284400) / 604800 AND                                 STUDENT_IN_COURSE.student = attempt1.student AND                                 QUIZ.id = attempt1.quiz)         LEFT JOIN        SUBMISSION AS submission1 ON (number >= (submission1.created - 1602284400) / 604800 AND                                       STUDENT_IN_COURSE.student = submission1.student AND                                       ASSIGN.id = submission1.assign)         LEFT JOIN        POST AS post1 ON (number >= (post1.created - 1602284400) / 604800 AND                           STUDENT_IN_COURSE.student = post1.student AND                           FORUM.id = post1.forum)   GROUP BY number,           STUDENT_IN_COURSE.student,           STUDENT_IN_COURSE.course; ",
  get_activities_from_courses: "SELECT student, course, forum, post, attempt, quiz, submission, assign, ontime, code FROM COURSE JOIN ( SELECT STUDENT_IN_COURSE.student, course, count(DISTINCT POST.forum) AS post, count(DISTINCT FORUM.id) AS forum FROM STUDENT_IN_COURSE LEFT JOIN FORUM USING ( course ) LEFT JOIN POST ON (STUDENT_IN_COURSE.student = POST.student AND FORUM.id = POST.forum) GROUP BY course, STUDENT_IN_COURSE.student ) AS tab1 ON (course = COURSE.id) JOIN ( SELECT STUDENT_IN_COURSE.student, course, count(DISTINCT ATTEMPT.quiz) AS attempt, count(DISTINCT QUIZ.id) AS quiz FROM STUDENT_IN_COURSE LEFT JOIN QUIZ USING ( course ) LEFT JOIN ATTEMPT ON (STUDENT_IN_COURSE.student = ATTEMPT.student AND QUIZ.id = ATTEMPT.quiz) GROUP BY course, STUDENT_IN_COURSE.student ) AS tab2 USING ( student, course ) JOIN ( SELECT STUDENT_IN_COURSE.student, course, count(DISTINCT SUBMISSION.assign) AS submission, count(DISTINCT ASSIGN.id) AS assign FROM STUDENT_IN_COURSE LEFT JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION ON (STUDENT_IN_COURSE.student = SUBMISSION.student AND ASSIGN.id = SUBMISSION.assign) GROUP BY course, STUDENT_IN_COURSE.student ) AS tab3 USING ( student, course ) JOIN ( SELECT STUDENT_IN_COURSE.student, course, count(DISTINCT SUBMISSION.assign) AS ontime, count(DISTINCT ASSIGN.id) AS assign_ FROM STUDENT_IN_COURSE LEFT JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION ON (STUDENT_IN_COURSE.student = SUBMISSION.student AND ASSIGN.id = SUBMISSION.assign AND SUBMISSION.created <= ASSIGN.time_close) GROUP BY course, STUDENT_IN_COURSE.student ) AS tab4 USING ( student, course );",
  get_indicators: "SELECT id AS student, unlimited_quizzes, attempts, forums, posts FROM STUDENT LEFT JOIN ( SELECT STUDENT_IN_COURSE.student AS student, count(DISTINCT QUIZ.id) AS unlimited_quizzes, count(ATTEMPT.quiz) AS attempts FROM STUDENT_IN_COURSE JOIN QUIZ USING ( course ) LEFT JOIN ATTEMPT ON (QUIZ.id = ATTEMPT.quiz AND ATTEMPT.student = STUDENT_IN_COURSE.student) WHERE QUIZ.attempts_permitted IS NULL GROUP BY STUDENT_IN_COURSE.student ) AS tab1 ON (Student.id = tab1.student) LEFT JOIN ( SELECT STUDENT_IN_COURSE.student AS student, count(DISTINCT FORUM.id) AS forums, count(POST.forum) AS posts FROM STUDENT_IN_COURSE JOIN FORUM USING ( course ) LEFT JOIN POST ON (FORUM.id = POST.forum AND POST.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab2 ON (Student.id = tab2.student); ",
  get_activities_in_time: "SELECT number AS week, count(created) AS activities, count(DISTINCT course) AS courses, STUDENT_IN_COURSE.student AS student FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN ( SELECT created, student FROM STUDENT JOIN POST ON (POST.student = STUDENT.id) UNION ALL SELECT start, student FROM STUDENT JOIN ATTEMPT ON (ATTEMPT.student = STUDENT.id) UNION ALL SELECT created, student FROM STUDENT JOIN SUBMISSION ON (SUBMISSION.student = STUDENT.id) ) AS tab1 ON (tab1.student = STUDENT_IN_COURSE.student AND number = ( (created - 1602284400) / 604800) ) GROUP BY number, STUDENT_IN_COURSE.student;",
  get_student: "SELECT * FROM STUDENT WHERE id = ?;",
  get_courses: "SELECT * FROM STUDENT_IN_COURSE WHERE student = ?;",
  percentage_of_activities_per_opportunities: "SELECT student, name, f + q + ag AS opportunities, p + at + s AS participation FROM ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT FORUM.id) AS f, count(DISTINCT POST.forum) AS p FROM STUDENT_IN_COURSE LEFT JOIN FORUM USING ( course ) LEFT JOIN POST ON (FORUM.id = POST.forum AND POST.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab1 JOIN ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT QUIZ.id) AS q, count(DISTINCT ATTEMPT.quiz) AS at FROM STUDENT_IN_COURSE LEFT JOIN QUIZ USING ( course ) LEFT JOIN ATTEMPT ON (QUIZ.id = ATTEMPT.quiz AND ATTEMPT.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab2 USING ( student ) JOIN ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT ASSIGN.id) AS ag, count(DISTINCT SUBMISSION.assign) AS s FROM STUDENT_IN_COURSE LEFT JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION ON (ASSIGN.id = SUBMISSION.assign AND SUBMISSION.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab3 USING ( student ) JOIN STUDENT ON (student = STUDENT.id); ;",
  grades: "SELECT COURSE.code AS course_code, COURSE.id AS course_id, STUDENT_IN_COURSE.student AS student, EVALUATION.id AS eval_id, EVALUATION.name AS eval_name, value FROM STUDENT_IN_COURSE LEFT JOIN EVALUATION USING ( course ) LEFT JOIN GRADE ON (GRADE.evaluation = EVALUATION.id AND STUDENT_IN_COURSE.student = GRADE.student) JOIN COURSE ON (STUDENT_IN_COURSE.course = COURSE.id) ;",
  percentage_student_view: "SELECT student, available_forums, participated_forums, available_quizzes, participated_quizzes, available_assigns, participated_assigns, assigns, ontime_submissions FROM ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT FORUM.id) AS available_forums, count(DISTINCT POST.forum) AS participated_forums FROM STUDENT_IN_COURSE JOIN FORUM USING ( course ) LEFT JOIN POST ON (FORUM.id = POST.forum AND POST.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab1 JOIN ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT QUIZ.id) AS available_quizzes, count(DISTINCT ATTEMPT.quiz) AS participated_quizzes FROM STUDENT_IN_COURSE JOIN QUIZ USING ( course ) LEFT JOIN ATTEMPT ON (QUIZ.id = ATTEMPT.quiz AND ATTEMPT.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab2 USING ( student ) JOIN ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT ASSIGN.id) AS available_assigns, count(DISTINCT SUBMISSION.assign) AS participated_assigns FROM STUDENT_IN_COURSE JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION ON (ASSIGN.id = SUBMISSION.assign AND SUBMISSION.student = STUDENT_IN_COURSE.student) GROUP BY STUDENT_IN_COURSE.student ) AS tab3 USING ( student ) JOIN ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT ASSIGN.id) AS assigns, count(DISTINCT assign) AS ontime_submissions FROM STUDENT_IN_COURSE JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION ON (ASSIGN.id = SUBMISSION.assign AND SUBMISSION.student = STUDENT_IN_COURSE.student AND SUBMISSION.created <= ASSIGN.time_close) GROUP BY STUDENT_IN_COURSE.student ) AS tab4 USING ( student );",
  get_lastAccess: "SELECT number AS week,Student_in_Course.student,  max(lastaccess) AS lastaccess, count(act_id) AS act_num, count(done_id)AS done_num   FROM Week        LEFT JOIN        Student_in_Course        LEFT JOIN        (            SELECT act_id,                   course,                   time_open,                   time_close,                   ( (time_open - 1602284400) / 604800) AS week_start,                   ( (time_close - 1602284400) / 604800) AS week_end              FROM (                       SELECT id AS act_id,                              course,                              time_open,                              time_close                         FROM QUIZ                       UNION ALL                       SELECT id AS act_id,                              course,                              time_open,                              time_close                         FROM FORUM                       UNION ALL                       SELECT id AS act_id,                              course,                              time_open,                              time_close                         FROM ASSIGN                   )        )        AS tab1 ON (number >= week_start AND                     number <= week_end AND                     Student_in_Course.course = tab1.course)         LEFT JOIN        (            SELECT student,                   quiz AS done_id,                   finish AS done              FROM ATTEMPT            UNION ALL            SELECT student,                   forum AS done_id,                   created AS done              FROM POST            UNION ALL            SELECT student,                   assign AS done_id,                   created AS done              FROM SUBMISSION        )        AS tab2 ON (tab2.student = Student_in_Course.student AND         done_id = act_id AND                    ( (done - 1602284400) / 604800) <= number)     GROUP By number, Student_in_Course.student ;",
  get_timeline_of_activities_done: "SELECT week, student, open_quizzes, closed_quizzes, done_quizzes_on_time, done_quizzes_late, open_assigns, closed_assigns, done_assigns_on_time, done_assigns_late, open_forums, closed_forums, done_forums_on_time, done_forums_late FROM ( SELECT week, student, open_quizzes, closed_quizzes, done_quizzes_on_time, done_quizzes_late FROM ( SELECT number AS week, student, count(DISTINCT QUIZ.id) AS open_quizzes FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN QUIZ ON (STUDENT_IN_COURSE.course = QUIZ.course AND number >= (time_open - 1602284400) / 604800 AND number < (time_close - 1602284400) / 604800) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab1 JOIN ( SELECT number AS week, student, count(DISTINCT QUIZ.id) AS closed_quizzes FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN QUIZ ON (STUDENT_IN_COURSE.course = QUIZ.course AND number >= (time_close - 1602284400) / 604800) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab2 USING ( week, student ) JOIN ( SELECT number AS week, STUDENT_IN_COURSE.student, count(DISTINCT attempt1.quiz) AS done_quizzes_on_time, count(DISTINCT attempt2.quiz) AS done_quizzes_late FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN QUIZ USING ( course ) LEFT JOIN ATTEMPT AS attempt1 ON (number >= (attempt1.start - 1602284400) / 604800 AND STUDENT_IN_COURSE.student = attempt1.student AND QUIZ.id = attempt1.quiz AND attempt1.start <= QUIZ.time_close) LEFT JOIN ATTEMPT AS attempt2 ON (number >= (attempt2.start - 1602284400) / 604800 AND STUDENT_IN_COURSE.student = attempt2.student AND QUIZ.id = attempt2.quiz AND attempt2.start > QUIZ.time_close) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab3 USING ( week, student ) ) AS quiz_week JOIN ( SELECT week, student, open_assigns, closed_assigns, done_assigns_on_time, done_assigns_late FROM ( SELECT number AS week, student, count(DISTINCT ASSIGN.id) AS open_assigns FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN ASSIGN ON (STUDENT_IN_COURSE.course = ASSIGN.course AND number >= (time_open - 1602284400) / 604800 AND number < (time_close - 1602284400) / 604800) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab1 JOIN ( SELECT number AS week, student, count(DISTINCT ASSIGN.id) AS closed_assigns FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN ASSIGN ON (STUDENT_IN_COURSE.course = ASSIGN.course AND number >= (time_close - 1602284400) / 604800) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab2 USING ( week, student ) JOIN ( SELECT number AS week, STUDENT_IN_COURSE.student, count(DISTINCT submission1.assign) AS done_assigns_on_time, count(DISTINCT submission2.assign) AS done_assigns_late FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION AS submission1 ON (number >= (submission1.created - 1602284400) / 604800 AND STUDENT_IN_COURSE.student = submission1.student AND ASSIGN.id = submission1.assign AND submission1.created <= ASSIGN.time_close) LEFT JOIN SUBMISSION AS submission2 ON (number >= (submission2.created - 1602284400) / 604800 AND STUDENT_IN_COURSE.student = submission2.student AND ASSIGN.id = submission2.assign AND submission2.created > ASSIGN.time_close) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab3 USING ( week, student ) ) AS assign_week USING ( week, student ) JOIN ( SELECT week, student, open_forums, closed_forums, done_forums_on_time, done_forums_late FROM ( SELECT number AS week, student, count(DISTINCT FORUM.id) AS open_forums FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN FORUM ON (STUDENT_IN_COURSE.course = FORUM.course AND number < (time_close - 1602284400) / 604800) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab1 JOIN ( SELECT number AS week, student, count(DISTINCT FORUM.id) AS closed_forums FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN FORUM ON (STUDENT_IN_COURSE.course = FORUM.course AND number >= (time_close - 1602284400) / 604800) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab2 USING ( week, student ) JOIN ( SELECT number AS week, STUDENT_IN_COURSE.student, count(DISTINCT post1.forum) AS done_forums_on_time, count(DISTINCT post2.forum) AS done_forums_late FROM WEEK JOIN STUDENT_IN_COURSE LEFT JOIN FORUM USING ( course ) LEFT JOIN POST AS post1 ON (number >= (post1.created - 1602284400) / 604800 AND STUDENT_IN_COURSE.student = post1.student AND FORUM.id = post1.forum AND post1.created <= FORUM.time_close) LEFT JOIN POST AS post2 ON (number >= (post2.created - 1602284400) / 604800 AND STUDENT_IN_COURSE.student = post2.student AND FORUM.id = post2.forum AND post2.created > FORUM.time_close) GROUP BY number, STUDENT_IN_COURSE.student ) AS tab3 USING ( week, student ) ) AS forum_week USING ( week, student );",
  get_participation_on_course: "SELECT student, name, f + q + ag AS opportunities, p + at + s AS participation FROM ( SELECT STUDENT_IN_COURSE.student, count(DISTINCT FORUM.id) AS f, count(DISTINCT POST.forum) AS p, count(DISTINCT ASSIGN.id) AS ag, count(DISTINCT SUBMISSION.assign) AS s, count(DISTINCT QUIZ.id) AS q, count(DISTINCT ATTEMPT.quiz) AS at FROM STUDENT_IN_COURSE LEFT JOIN ASSIGN USING ( course ) LEFT JOIN SUBMISSION ON (ASSIGN.id = SUBMISSION.assign AND SUBMISSION.student = STUDENT_IN_COURSE.student) LEFT JOIN FORUM USING ( course ) LEFT JOIN POST ON (FORUM.id = POST.forum AND POST.student = STUDENT_IN_COURSE.student) LEFT JOIN QUIZ USING ( course ) LEFT JOIN ATTEMPT ON (QUIZ.id = ATTEMPT.quiz AND ATTEMPT.student = STUDENT_IN_COURSE.student) WHERE course = ? GROUP BY STUDENT_IN_COURSE.student ) AS tab1 JOIN STUDENT ON (STUDENT.id = tab1.student)",
  get_timeline_info_on_course: "SELECT id, course, time_open, time_close,((time_open - 1602284400) / 604800) AS week_start, (( time_close- 1602284400) / 604800) AS week_end, count() AS done FROM(  SELECT id, course, time_open, time_close FROM QUIZ UNION ALL SELECT id, course, time_open, time_close FROM FORUM UNION ALL SELECT id, course, time_open, time_close FROM ASSIGN )AS tab1 LEFT JOIN( SELECT student, forum AS act, created AS done FROM POST UNION ALL SELECT student, assign AS act, created AS done FROM SUBMISSION UNION ALL SELECT student, quiz AS act, finish AS done FROM ATTEMPT )AS tab2 ON (act = id) WHERE course = ? GROUP BY id;"
};