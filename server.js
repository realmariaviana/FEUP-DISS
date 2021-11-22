const express = require('express');
const app = express();


const dbFunc = require('./dbFunc.js');
let db = require("./database.js");
const queries = require('./queries.js');
const dummy = require('./dummyData.js');

const TITLE = 'Mestrado em Tecnologias e Sistemas Informáticos Web';

app.set('view engine', 'pug');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  let promises = [];
  promises.push(queries.get_activities_from_all_students());
  promises.push(queries.get_evaluations());
  promises.push(queries.get_lastAccess());
  promises.push(queries.get_activities_from_courses());
  promises.push(queries.get_activities_by_week_by_course());
  promises.push(queries.get_P_aggregate_activities());
  promises.push(queries.get_P_aggregate_grades());
  Promise.all(promises).then((values) => {
    res.render('index', {
      title: TITLE,
      histogram_data: values[0],
      box_data: values[1],
      last_access: values[2],
      participation_by_course: values[3],
      weekly_percentage: values[4],
      aggregate_Acts: values[5],
      aggregate_Grades: values[6]
    });
  });

});
app.get('/student', (req, res) => {
  let promises = [];
  if (req.query.id == null) {
    res.status(404).render('student404', { title: TITLE });
  }
  let student_id = Number(req.query.id);
  promises.push(queries.get_student(student_id));
  promises.push(queries.get_percentages(student_id));
  promises.push(queries.get_evaluations(student_id));
  promises.push(queries.get_courses(student_id));
  promises.push(queries.get_activities_in_time(student_id));
  promises.push(queries.get_indicators(student_id));
  promises.push(queries.get_timeline_of_activities_done(student_id));
  promises.push(queries.get_S_activities_in_timeline(student_id));
  Promise.all(promises).then((values) => {
    if (values[0] == undefined) {
      res.status(404).render('student404', { title: TITLE });
    }
    res.render('student', {
      title: TITLE,
      student: values[0],
      percentages_data: values[1],
      grades_data: values[2],
      students_courses: values[3],
      weekly_activities: values[4],
      indicators: values[5],
      timeline_info: values[6],
      proposed_act: values[7]
    });
  });
});

app.get('/course', async(req, res) => {
  let promises = [];
  let course_id = 0;
  if (req.query.code != null) {
    rows = await queries.get_course_id(req.query.code);
    course_id = Number(rows[0].id);
    
  }
  else if (req.query.id != null){
    course_id = Number(req.query.id);
  }
  else{
    res.status(404).render('course404', { title: TITLE });
  }
  promises.push(queries.get_course_info(course_id));
  promises.push(queries.get_participation_on_course(course_id));
  promises.push(queries.get_timeline_info_on_course(course_id));
  promises.push(queries.get_C_evaluations_from_course(course_id));
  promises.push(queries.get_activities_by_week_by_course());
  promises.push(queries.get_C_boxplot_of_activities(course_id));
  Promise.all(promises).then((values) => {
    if (values[0] == undefined) {
      res.status(404).render('course404', { title: TITLE });
    }
    res.render('course', {
      title: TITLE,
      course: values[0],
      participation_info: values[1],
      timeline_info: values[2],
      grades_info: values[3],
      week_info: values[4],
      box_plot_info: values[5],
    });
  });
});
app.get('/reload', (req, res) => {
  dbFunc.routeReload().then((v) => {
    // res.redirect('/');
    res.send('aaaa' + 404);
  })
});
app.get('/dummy', (req, res) => {
  dummy.createDummyData().then((v) => {
    res.redirect('/');
  });
});
//Capture All 404 errors
app.use(function (req, res, next) {
  res.status(404).render('404', { title: TITLE });
});
const server = app.listen(7001, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});