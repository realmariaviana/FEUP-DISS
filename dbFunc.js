const fetch = require('node-fetch');

const { db, delete_all_records_from_db } = require("./database.js");


const SQLITE_LIMIT_VARIABLE_NUMBER = 999;
const url = new URL('http://localhost:8888/moodle40/webservice/rest/server.php');
const params_base = [
    ['wstoken', 'ab6ce586c89762e7a376ba8f5d3bc71e'],
    ['moodlewsrestformat', 'json']
];
var userid;
const STUDENT_ROLE_ID = 5;
function load_database() {
    delete_all_records_from_db();
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'core_webservice_get_site_info');
    url.search = params;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            userid = data.userid;
            fetch_courses(userid);
        });
}

function fetch_courses(userid) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'core_enrol_get_users_courses');
    params.set('userid', userid);
    url.search = params;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            params.delete('userid');
            let courses = parse_list_of_courses(data);
            load_courses_to_db(courses);
            fetch_students(courses);
        });
}
function fetch_students(courses) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'core_enrol_get_enrolled_users');
    let promises = [];
    let students_all = [];
    courses.forEach(element => {
        params.set('courseid', element['id']);
        url.search = params;
        promises.push(fetch(url)
            .then(response => response.json())
            .then(data => {
                let students = parse_list_of_students(data);
                load_students_to_db(students, element);
                students_all = students_all.concat(students);
            }));
    });
    Promise.all(promises).then(data => {
        students_all = students_all.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        fetch_quizzes(students_all);
        fetch_assigns(students_all);
        fetch_evaluations(courses);
        fetch_forums();
    });
}
function fetch_evaluations(courses) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'gradereport_user_get_grade_items');
    courses.forEach(element => {
        params.set('courseid', element['id']);
        url.search = params;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                let res = parse_list_of_evaluations(data);
                
                load_evaluations_to_db(res);
            });
    });
}
function fetch_quizzes(students_all) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_quiz_get_quizzes_by_courses');
    params.delete('courseid');
    url.search = params;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            let quizzes = parse_list_of_quizzes(data);
            load_quizzes_to_db(quizzes);
            fetch_attempts(quizzes, students_all);
        });
}
function fetch_assigns(students_all) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_assign_get_assignments');
    params.delete('courseid');
    url.search = params;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            let assigns = parse_list_of_assigns(data);
            load_assigns_to_db(assigns);
            fetch_submissions(assigns);
        });
}
function fetch_forums() {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_forum_get_forums_by_courses');
    url.search = params;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            let forums = parse_list_of_forums(data);
            load_forums_to_db(forums);
            fetch_discussions(forums)
        });
}
function fetch_posts(discussions, forum) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_forum_get_discussion_posts');
    url.search = params;
    discussions.forEach(element => {
        params.set('discussionid', element['discussion_id']);
        url.search = params;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                let posts = parse_list_of_posts(data, forum);
                load_posts_to_db(posts);
            });
    });
}
function fetch_discussions(forums) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_forum_get_forum_discussions');
    let promises = [];
    forums.forEach(element => {
        params.set('forumid', element['id']);
        url.search = params;
        promises.push(fetch(url)
            .then(response => response.json())
            .then(data => {
                let discussions = parse_list_of_discussions(data);
                fetch_posts(discussions, element['id']);
            }));
    });
}
function fetch_submissions(assigns) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_assign_get_submissions');
    for (let index = 0; index < assigns.length; index++) {
        const element = assigns[index];
        params.set('assignmentids[' + index + ']', element.id);
    }
    url.search = params;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            let submissions = parse_list_of_submissions(data);
            load_submissions_to_db(submissions);
        });
}
function space_out_requestes(params, quizzes, index, students_all) {
    if (index < quizzes.length) {
        let quiz = quizzes[index];
        params.set('quizid', quiz.id);
        let promises = [];
        students_all.forEach(student => {
            params.set('userid', student.id);
            url.search = params;
            promises.push(fetch(url)
                .then(response => response.json())
                .then(data => {
                    let attempts = parse_list_of_attempts(data);
                    load_attempts_to_db(attempts);
                }));
        });
        Promise.all(promises).then(data => {
            index = index + 1;
            space_out_requestes(params, quizzes, index, students_all);
        });
    }
}
function fetch_attempts(quizzes, students_all) {
    let params = new URLSearchParams(params_base);
    params.set('wsfunction', 'mod_quiz_get_user_attempts');
    params.delete('courseid');
    params.set('status', 'all');
    let index = 0;
    return space_out_requestes(params, quizzes, index, students_all);
}
function load_courses_to_db(courses) {
    console.log(courses);
    let sql = 'INSERT INTO Course (id, name, code) VALUES ' + courses.map((x) => '(?,?,?)').join(',') + ';';
    let params = [].concat.apply([], courses.map((x) => [x['id'], x['name'], x.code]));
    db.run(sql, params,
        function (err, result) {
            if (err) {
                console.error(err);
                console.trace();
                return err;
            }
        }
    );
}
function load_students_to_db(students, course) {
    if (students.length > 0) {
        let sql = 'INSERT OR IGNORE INTO Student (id, name, courseEdition, enrollmentRegime) VALUES ' + students.map((x) => '(?,?,?,?)').join(',') + ';';
        let params = [].concat.apply([], students.map((x) => [x['id'], x['name'], x['courseEdition'], x['enrollmentRegime']]));
        db.run(sql, params,
            function (err, result) {
                if (err) {
                    console.error(sql);
                    console.error(err);
                    console.trace();
                    return err;
                }
            }
        );

        sql = 'INSERT INTO Student_in_Course (student, course, lastaccess) VALUES ' + students.map((x) => '(?,?,?)').join(',') + ';';
        params = [].concat.apply([], students.map((x) => [x['id'], course['id'], x['lastaccess']]));
        db.run(sql, params,
            function (err, result) {
                if (err) {
                    console.error(sql);
                    console.error(err);
                    console.trace();
                    return err;
                }
            }
        );
    }
}
function load_evaluations_to_db(res) {
    if (res.evaluations.length > 0) {
        let aux = res.evaluations;
        for (let index = 0; index < aux.length; index = index + Math.trunc(SQLITE_LIMIT_VARIABLE_NUMBER / 7)) {
            let eval_aux = aux.slice(index, index + Math.trunc(SQLITE_LIMIT_VARIABLE_NUMBER / 7));
            let sql = 'INSERT INTO Evaluation (id, name, course, type_id) VALUES ' + eval_aux.map((x) => '(?,?,?,?)').join(',') + ';';
            let params = [].concat.apply([], eval_aux.map((x) => [x['id'], x['name'], x['course'], x['type_id']]));
            db.run(sql, params,
                function (err, result) {
                    if (err) {
                        console.error(sql);
                        console.error(err);
                        console.trace();
                        return err;
                    }
                }
            );

        }
        aux = res.grades;
        for (let index = 0; index < aux.length; index = index + Math.trunc(SQLITE_LIMIT_VARIABLE_NUMBER / 7)) {
            let eval_aux = aux.slice(index, index + Math.trunc(SQLITE_LIMIT_VARIABLE_NUMBER / 7));
            sql = 'INSERT INTO Grade (student, value, evaluation) VALUES ' + eval_aux.map((x) => '(?,?,?)').join(',') + ';';
            let params = [].concat.apply([], eval_aux.map((x) => [x['student'], x['value'], x['evaluation']]));
            db.run(sql, params,
                function (err, result) {
                    if (err) {
                        console.error(sql);
                        console.error(err);
                        console.trace();
                        return err;
                    }
                }

            );
        }
    }
}
function load_quizzes_to_db(quizzes) {
    let sql = 'INSERT INTO Quiz (id, name, course, attempts_permitted,time_open,time_close) VALUES ' + quizzes.map((x) => '(?,?,?,?,?,?)').join(',') + ';';
    let params = [].concat.apply([], quizzes.map((x) => [x['id'], x['name'], x['course'], x['attempts'], x['time_open'], x['time_close']]));
    db.run(sql, params,
        function (err, result) {
            if (err) {
                console.error(err);
                console.trace();
                return err;
            }
        }
    );
}
function load_forums_to_db(forums) {
    let sql = 'INSERT INTO Forum (id, name, course, time_close) VALUES ' + forums.map((x) => '(?,?,?, ?)').join(',') + ';';
    let params = [].concat.apply([], forums.map((x) => [x['id'], x['name'], x['course'], x['time_close']]));
    db.run(sql, params,
        function (err, result) {
            if (err) {
                console.error(err);
                console.trace();
                return err;
            }
        }
    );
}
function load_attempts_to_db(attempts) {
    if (attempts.length > 0) {
        let sql = 'INSERT INTO Attempt (student, quiz, start, finish) VALUES ' + attempts.map((x) => '(?,?,?,?)').join(',') + ';';
        let params = [].concat.apply([], attempts.map((x) => [x['student'], x['quiz'], x['start'], x['finish']]));
        db.run(sql, params,
            function (err, result) {
                if (err) {
                    console.error(err);
                    console.trace();
                    return err;
                }
            }
        );
    }
}
function load_posts_to_db(posts) {
    if (posts.length > 0) {
        let sql = 'INSERT INTO Post (student, forum, created, type) VALUES ' + posts.map((x) => '(?,?,?,?)').join(',') + ';';
        let params = [].concat.apply([], posts.map((x) => [x['student'], x['forum'], x['created'], x['type']]));
        db.run(sql, params,
            function (err, result) {
                if (err) {
                    console.error(err);
                    console.trace();
                    return err;
                }
            }
        );
    }
}
function load_submissions_to_db(submissions) {
    if (submissions.length > 0) {
        let sql = 'INSERT INTO Submission (student, assign, created) VALUES ' + submissions.map((x) => '(?,?,?)').join(',') + ';';
        let params = [].concat.apply([], submissions.map((x) => [x['student'], x['assign'], x['created']]));
        db.run(sql, params,
            function (err, result) {
                if (err) {
                    console.error(err);
                    console.trace();
                    return err;
                }
            }
        );
    }
}
function load_assigns_to_db(assigns) {
    if (assigns.length > 0) {
        let sql = 'INSERT INTO Assign (id, name, course, time_open, time_close) VALUES ' + assigns.map((x) => '(?,?,?,?,?)').join(',') + ';';
        let params = [].concat.apply([], assigns.map((x) => [x['id'], x['name'], x['course'], x['time_open'], x['duedate']]));
        db.run(sql, params,
            function (err, result) {
                if (err) {
                    console.error(err);
                    console.trace();
                    return err;
                }
            }
        );
    }
}
function parse_list_of_attempts(data) {
    let attempts = [];
    data.attempts.forEach(element => {
        let quiz = { 'id': element.id, 'quiz': element.quiz, 'student': element.userid, 'start': element.timestart == 0 ? null : element.timestart, 'finish': element.timefinish == 0 ? null : element.timefinish };
        attempts.push(quiz);
    });
    return attempts;
}
function parse_list_of_evaluations(data) {
    let evaluations = [];
    let grades = [];
    data.usergrades.forEach(elem => {
        let course_id = elem.courseid;
        let student = elem.userid;
        elem.gradeitems.forEach(element => {
            let eval = { 'id': element.id, 'name': element.itemname, 'type_id': element.itemtype, 'course': course_id };
            let value = Number(element.percentageformatted.replace('%', ''));
            let grade = { 'student': student, 'value': value, 'evaluation': element.id };
            evaluations.push(eval);
            grades.push(grade);
        });
    });
    evaluations = evaluations.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    return { 'evaluations': evaluations, 'grades': grades };
}
function parse_list_of_submissions(data) {
    let submissions = [];
    data.assignments.forEach(elem => {
        let assign_id = elem.assignmentid;
        elem.submissions.forEach(element => {
            let submission = { 'student': element.userid, 'assign': assign_id, 'created': element.timecreated };
            submissions.push(submission);
        });
    });
    return submissions;
}
function parse_list_of_quizzes(data) {
    let quizzes = [];
    data.quizzes.forEach(element => {
        let quiz = { 'id': element.id, 'name':element.name, 'course': element.course, 'attempts': element.attempts == 0 ? null : element.attempts, 'time_open': element.timeopen, 'time_close': element.timeclose };
        quizzes.push(quiz);
    });
    return quizzes;
}
function parse_list_of_forums(data) {
    let forums = [];
    data.forEach(element => {
        let forum = { 'id': element.id, 'name': element.name, 'course': element.course, 'time_close': element.duedate };
        forums.push(forum);
    });
    return forums;
}
function parse_list_of_discussions(data) {
    let discussions = [];
    data.discussions.forEach(element => {
        let discussion = { 'id': element.id, 'discussion_id': element.discussion };
        discussions.push(discussion);
    });
    return discussions;
}
function parse_list_of_posts(data, forum) {
    let posts = [];
    data.posts.forEach(element => {
        let post = { 'student': element.author.id, 'created': element.timecreated, 'forum': forum, 'type': element.hasparent ? 1 : 0 };
        posts.push(post);
    });
    return posts;
}
function parse_list_of_assigns(data) {
    let assigns = [];
    data.courses.forEach(elem => {
        elem.assignments.forEach(element => {
            let assign = { 'id': element.id, 'name': element.name, 'course': element.course, 'time_open': element.allowsubmissionsfromdate == 0 ? null : element.allowsubmissionsfromdate, 'duedate': element.duedate == 0 ? null : element.duedate };
            assigns.push(assign);
        });
    });
    return assigns;
}
function parse_list_of_courses(data) {
    let courses = [];
    data.forEach(element => {
        let course = { 'id': element.id, 'name': element.fullname, code: element.shortname };
        courses.push(course);
    });
    return courses;
}
function parse_list_of_students(data) {
    let students = [];
    data.forEach(element => {
        let student = { 'id': element.id, 'name': element.fullname, 'courseEdition': element.courseEdition, 'enrollmentRegime': element.enrollmentRegime, 'lastaccess': element.lastcourseaccess == 0 ? null : element.lastcourseaccess };
        if (undefined != element['roles'].find(el => el['roleid'] == STUDENT_ROLE_ID)) {
            students.push(student);
        }
    });
    return students;
}
module.exports = {
    routeReload: load_database
};
