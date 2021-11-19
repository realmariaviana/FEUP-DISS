const height = 275;
const width = 550;

// Load the Visualization API and the corechart package.
google.charts.load('current', { 'packages': ['corechart', 'table', 'timeline'] });

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawALL);
function changecursorPOINTER(e) {
    document.body.style.cursor = 'pointer';
}
function changecursorDEFAULT(e) {
    document.body.style.cursor = 'default';
}

function draw_C_participation_on_course() {
    let data = new google.visualization.DataTable();

    data.addColumn({ id: 'Student', type: 'string' });
    data.addColumn('number', 'Percentage of participation');

    let aux = [];
    participation_info.forEach(element => {
        aux.push([element[1], element[2]]);
    });
    // Add data.
    data.addRows(aux);
    var options = {
        title: 'Distribution of the students by the percentage of participated activities on this course',
        legend: { position: 'none' },
        hAxis: {
            title: 'Percentage of participated activities',
            viewWindowMode: 'maximized',
            viewWindow: { max: 100 }
        },
        allowHtml: true,
        height: height,
        width: width,
        vAxis: {
            title: 'Number of students'
        }
    };

    let chart = new google.visualization.Histogram(document.getElementById('participation_on_course_plot'));

    // The select handler. Call the chart's getSelection() method
    function selectHandler(e) {
        var selectedItem = chart.getSelection()[0];
        if (selectedItem) {
            window.location.href = "/student?id=" + participation_info[selectedItem.row][0];
        }
    }
    google.visualization.events.addListener(chart, 'select', selectHandler);

    google.visualization.events.addListener(chart, 'onmouseover', changecursorPOINTER);
    google.visualization.events.addListener(chart, 'onmouseout', changecursorDEFAULT);

    chart.draw(data, options);
}
function draw_C_timeline_on_course() {
    let data = new google.visualization.DataTable();

    data.addColumn('string', 'Row');
    data.addColumn('string', 'Bar');
    data.addColumn({ type: 'string', role: 'tooltip' });

    data.addColumn('datetime', 'Start');
    data.addColumn('datetime', 'End');

    let aux = [];
    timeline_info.forEach(element => {
        let tooltip = '<p>' + element.done + ' of ' + course.num_students + ' have done this activity<br>' +
            new Date(element.time_open * 1000).toDateString() + ' to ' + new Date(element.time_close * 1000).toDateString() + '<br>Week ' +
            element.week_start + ' to ' + element.week_end + '</p>';
        aux.push(
            [
                'n',
                element.done + ' of ' + course.num_students,
                tooltip,
                new Date(element.time_open * 1000),
                new Date(element.time_close * 1000)
            ]
        );
    });
    // Add data.
    data.addRows(aux);
    var options = {
        title: '',
        timeline: { showRowLabels: false },
        allowHtml: true,
        height: height,
        width: width
    };

    let chart = new google.visualization.Timeline(document.getElementById('timeline_on_course_plot'));

    chart.draw(data, options);
}
function draw_C_weekly_percentage() {
    let data_p = [];
    let data = new google.visualization.DataTable();
    // Declare columns
    data.addColumn('number', 'Week');
    data.addColumn('number', course.name);
    data.addColumn('number', 'Average Course');

    let columns = [];
    week_info[0].courses.forEach(element => {
        if (element != null) {
            columns.push(element.course);
        }
    });
    week_info.forEach(element => {
        let data_point = [];
        data_point.push(element.week);
        let done_activities = 0;
        let activities = 0;
        columns.forEach(elem => {
            done_activities += element.courses[elem].done_activities;
            activities += element.courses[elem].activities;
            if (elem == course.id) {
                data_point.push(100 * element.courses[elem].done_activities / element.courses[elem].activities);
            }
        });
        data_point.push(100 * done_activities / activities);
        data_p.push(data_point);
    });
    // Add data.
    data.addRows(data_p);
    let options = {
        title: "Percentage of activities done(posts, quizzes attempts and submissions) until week",
        vAxis: {
            title: 'Percentage of activities',
            maxValue: 100
        },
        height: height,
        width: width,
        hAxis: {
            title: 'Week of the semester'
        },
        focusTarget: 'category',
        legend: {
            position: 'top'
        },
    };
    let chart = new google.visualization.LineChart(document.getElementById('weekly_plot'));
    chart.draw(data, options);
}
function draw_C_evaluations() {
    let data_p = [];
    grades_info.data.forEach(element => {
        let eval_row = [];
        eval_row.push(element.name);
        eval_row = eval_row.concat(element.students_values);
        eval_row.push(element.min, element.Q1, element.median, element.Q3, element.max);
        data_p.push(eval_row);
    });

    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Evaluation');
    for (let index = 0; index < grades_info.students_ids.length; index++) {
        let name = participation_info[participation_info.findIndex((x) => { return x[0] == grades_info.students_ids[index] })][1];
        data.addColumn('number', name);
    }
    data.addColumn({ id: 'min', type: 'number', role: 'interval' });
    data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'median', type: 'number', role: 'interval' });
    data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'max', type: 'number', role: 'interval' });
    data.addRows(data_p);
    let options = {
        title: "Distribution of the students' grades in each evaluation activity",
        vAxis: {
            title: 'Grades'
        },
        height: height,
        width: width,
        legend: { position: 'none' },
        tooltip: { isHtml: true },
        lineWidth: 0,
        pointSize: 3,
        intervals: {
            barWidth: 1,
            boxWidth: 1,
            lineWidth: 1,
            style: 'boxes'
        },
        focusTarget: 'category',
        crosshair: { trigger: 'selection' },
        interval: {
            max: {
                style: 'bars'
            },
            min: {
                style: 'bars'
            }
        },
    };
    let chart = new google.visualization.LineChart(document.getElementById('evaluations_plot'));

    chart.draw(data, options);
   // google.visualization.events.addListener(chart, 'fff', () => {console.log("AAAAAAA");});

}
function draw_C_activities_dist() {

    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Type');
    for (let index = 0; index < box_plot_info.students_ids.length; index++) {
        let name = participation_info[participation_info.findIndex((x) => { return x[0] == grades_info.students_ids[index] })][1];
        data.addColumn('number', name);
    }
    data.addColumn({ id: 'min', type: 'number', role: 'interval' });
    data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'median', type: 'number', role: 'interval' });
    data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'max', type: 'number', role: 'interval' });
    data.addRows(box_plot_info.data);
    let options = {
        title: "Distribution of participation in each activity type",
        vAxis: {
            title: 'Percentages'
        },
        height: height,
        width: width,
        legend: { position: 'none' },
        tooltip: { isHtml: true },
        lineWidth: 0,
        pointSize: 3,
        intervals: {
            barWidth: 1,
            boxWidth: 1,
            lineWidth: 1,
            style: 'boxes'
        },
        focusTarget: 'category',
        interval: {
            max: {
                style: 'bars'
            },
            min: {
                style: 'bars'
            }
        },
    };
    let chart = new google.visualization.LineChart(document.getElementById('type_plot'));
    chart.draw(data, options);
    C={ chart: chart, op:options, data:data};
}
function draw_S_activities_in_timeline() {
    let data = new google.visualization.DataTable();

    data.addColumn('string', 'Row');
    data.addColumn('string', 'Bar');
    data.addColumn({ type: 'string', role: 'tooltip' });

    data.addColumn('datetime', 'Start');
    data.addColumn('datetime', 'End');

    let aux = [];
    proposed_act.forEach(element => {
        let tooltip = (element.done != null ? ('<p> Done on ' + new Date(element.done * 1000).toDateString()) : "<p> Not Done")+ '<br>' + new Date(element.time_open * 1000).toDateString() + ' to ' + new Date(element.time_close * 1000).toDateString() + '<br>Week ' + element.week_start + ' to ' + element.week_end + '</p>';
        aux.push(
            [
                element.course + '',
                element.done != null ? (element.done > element.time_close ? "Late" : "Done") : "Missing",
                tooltip,
                new Date(element.time_open * 1000),
                new Date(element.time_close * 1000)
            ]
        );
    });
    // Add data.
    data.addRows(aux);
    var options = {
        title: '',
        timeline: { showRowLabels: true },
        allowHtml: true,
        height: height,
        width: width
    };

    let chart = new google.visualization.Timeline(document.getElementById('act_plot'));

    function clickHandler() {
        window.location.href = "/course?id=" + this.innerHTML;
    }

    chart.draw(data, options);
    d3.selectAll('#act_plot > div > div:nth-child(1) > div > div > svg > g:nth-child(2) > text').style('cursor', 'pointer').on('click', clickHandler);

}
function draw_S_GradesTable() {
    let data_p = [];
    students_courses.forEach(element => {
        let course = grades_data[element.course];
        if (course != null) {
            if (course.evals.length == 0) {
                data_p.push([course.course, null, null, null]);
            }
            course.evals.forEach(element => {
                if (element != null) {
                    data_p.push([course.course, element.name, element.grade, Number(element.percentile.toFixed(2))]);
                }
            });
        }
    });
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Course');
    data.addColumn('string', 'Evaluation');
    data.addColumn('number', 'Grade');
    data.addColumn('number', 'Percentile');
    data.addRows(data_p);

    let colors = ['#3366cc ', '#dc3912 ', '#ff9900 ', '#109618 ', '#990099 ', '#0099c6 ', '#dd4477 ', '#66aa00 ', '#b82e2e ', '#316395 ', '#994499 ', '#22aa99 ', '#aaaa11 ', '#6633cc ', '#e67300 ', '#8b0707 ', '#651067 ', '#329262 ', '#5574a6 ', '#3b3eac ', '#b77322 ', '#16d620 ', '#b91383 ', '#f4359e ', '#9c5935 ', '#a9c413 ', '#2a778d ', '#668d1c ', '#bea413 ', '#0c5922 ', '#743411'];
    let color_id = -1;
    let course_name = "";
    for (let index = 0; index < data_p.length; index++) {
        if (course_name != data_p[index][0]) {
            color_id = (color_id + 1) % colors.length;
            course_name = data_p[index][0];
        }
        data.setProperty(index, 0, 'style', 'background-color: ' + colors[color_id] + ';');
        data.setProperty(index, 1, 'style', 'background-color: ' + colors[color_id] + ';');
        data.setProperty(index, 2, 'style', 'background-color: ' + colors[color_id] + ';');
        data.setProperty(index, 3, 'style', 'background-color: ' + colors[color_id] + ';');
    }

    let options = {
        title: "Grades",
        height: height,
        width: width,
        alternatingRowStyle: false,
        allowHtml: true,
        sortColumn: 0,
        cssClassNames: { headerCell: 'googleHeaderCell' }
    }

    let formatter = new google.visualization.ColorFormat();
    formatter.addGradientRange(0, .5, 'black', 'red', 'yellow');
    formatter.addGradientRange(0.5, 1.01, 'black', 'yellow', 'green');
    formatter.format(data, 3);

    let formatter1 = new google.visualization.ColorFormat();
    formatter1.addGradientRange(0, 75, 'black', 'red', 'yellow');
    formatter1.addGradientRange(75, 101, 'black', 'yellow', 'green');
    formatter1.format(data, 2);
    let table = new google.visualization.Table(document.getElementById('grades_plot'));

    google.visualization.events.addListener(table, 'select', selectHandler);
    function selectHandler() {
        var selectedItem = table.getSelection()[0];
        if (selectedItem) {
            var value = data.getValue(selectedItem.row, 0);
            window.location.href = "/course?id=" + value;
        }
    }
    table.draw(data, options);
    d3.selectAll('#grades_plot').selectAll('table').style('cursor', 'pointer');
}
function draw_S_Weekly() {
    let data_p = [];
    weekly_activities.forEach(element => {
        data_p.push([element.week, element.student, element.average]);
    });

    let data = new google.visualization.DataTable();
    // Declare columns
    data.addColumn('number', 'Week');
    data.addColumn('number', student.name);
    data.addColumn('number', 'Average Student');
    // Add data.
    data.addRows(data_p);
    let options = {
        title: "Number of activities(posts, quizzes attempst and submissions) per week per course",
        vAxis: {
            title: 'Number of activities'
        },
        height: height,
        width: width,
        hAxis: {
            title: 'Week of the semester'
        },
        legend: {
            position: 'top'
        }
    };
    let chart = new google.visualization.LineChart(document.getElementById('week_plot'));
    chart.draw(data, options);
}
function draw_S_Percentages() {
    percentages_data.forEach(element => {
        element[7] = student.name + " -> " + element[1].toFixed(2) + "%\n They are on the " + element[7].toFixed(2) + " percentile";
    });
    let data = new google.visualization.DataTable();

    // Declare columns
    data.addColumn('string', 'Percentage');
    data.addColumn('number', 'Value');
    data.addColumn({ id: 'min', type: 'number', role: 'interval' });
    data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'median', type: 'number', role: 'interval' });
    data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'max', type: 'number', role: 'interval' });
    data.addColumn({ type: 'string', role: 'tooltip' });
    // Add data.
    data.addRows(percentages_data);
    let options = {
        title: 'Situate ' + student.name + ' in the distribution of students on the following indicators',
        vAxis: {
            title: 'Percentage'
        },
        height: height,
        width: width,
        tooltip: { isHtml: true },
        legend: { position: 'none' },
        lineWidth: 0,
        pointSize: 10,
        colors: ['blue'],
        pointShape: 'diamond',
        intervals: {
            color: 'red',
            barWidth: 1,
            boxWidth: 1,
            lineWidth: 1,
            style: 'boxes'
        },
        interval: {
            max: {
                style: 'bars',
                fillOpacity: 1,
            },
            min: {
                style: 'bars',
                fillOpacity: 1,
            }
        }
    };
    let chart = new google.visualization.LineChart(document.getElementById('percentages_plot'));
    chart.draw(data, options);
}
function draw_P_CoursesDisplay() {
    let data = new google.visualization.DataTable();
    let res = [
        ['Participated Forums'],
        ['Attempted Quizzes'],
        ['Submitted Assignments'],
        ['OnTime Submissions']
    ];
    // Declare columns
    data.addColumn('string', 'Indicator');
    participation_by_course.forEach(element => {
        data.addColumn('number', element.name);
        data.addColumn({ id: 'min', type: 'number', role: 'interval' });
        data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
        data.addColumn({ id: 'median', type: 'number', role: 'interval' });
        data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
        data.addColumn({ id: 'max', type: 'number', role: 'interval' });

        data.addColumn({ type: 'string', role: 'tooltip' })
    });
    participation_by_course.forEach(element => {
        if (element.forums.values[1] == null) {
            res[0].push(null, null, null, null, null, null, "No forums currently available!")

        } else {
            res[0].push(element.forums.values[0], element.forums.values[1], element.forums.values[2], element.forums.values[3], element.forums.values[4], element.forums.values[5], element.name + ":\n\tMax: " + element.forums.values[5].toFixed(1) + "\n\tQ3: " + element.forums.values[4].toFixed(1) + "\n\tMedian: " + element.forums.values[3].toFixed(1) + "\n\tQ1: " + element.forums.values[2].toFixed(1) + "\n\tMin: " + element.forums.values[1].toFixed(1));
        } if (element.quizzes.values[1] == null) {
            res[1].push(null, null, null, null, null, null, "No quizzes currently available!")

        } else {
            res[1].push(element.quizzes.values[0], element.quizzes.values[1], element.quizzes.values[2], element.quizzes.values[3], element.quizzes.values[4], element.quizzes.values[5], element.name + ":\n\tMax: " + element.quizzes.values[5].toFixed(1) + "\n\tQ3: " + element.quizzes.values[4].toFixed(1) + "\n\tMedian: " + element.quizzes.values[3].toFixed(1) + "\n\tQ1: " + element.quizzes.values[2].toFixed(1) + "\n\tMin: " + element.quizzes.values[1].toFixed(1));
        } if (element.assigns.values[1] == null) {
            res[2].push(null, null, null, null, null, null, "No assignments currently available!")

        } else {
            res[2].push(element.assigns.values[0], element.assigns.values[1], element.assigns.values[2], element.assigns.values[3], element.assigns.values[4], element.assigns.values[5], element.name + ":\n\tMax: " + element.assigns.values[5].toFixed(1) + "\n\tQ3: " + element.assigns.values[4].toFixed(1) + "\n\tMedian: " + element.assigns.values[3].toFixed(1) + "\n\tQ1: " + element.assigns.values[2].toFixed(1) + "\n\tMin: " + element.assigns.values[1].toFixed(1));
        } if (element.ontime.values[1] == null) {
            res[3].push(null, null, null, null, null, null, "No assignments currently available!")
        } else {
            res[3].push(element.ontime.values[0], element.ontime.values[1], element.ontime.values[2], element.ontime.values[3], element.ontime.values[4], element.ontime.values[5], element.name + ":\n\tMax: " + element.ontime.values[5].toFixed(1) + "\n\tQ3: " + element.ontime.values[4].toFixed(1) + "\n\tMedian: " + element.ontime.values[3].toFixed(1) + "\n\tQ1: " + element.ontime.values[2].toFixed(1) + "\n\tMin: " + element.ontime.values[1].toFixed(1));
        }
    });
    // Add data.
    data.addRows(res);
    let options = {
        title: "Compare the courses by the percentages of participation",
        vAxis: {
            title: 'Percentages'
        },
        height: height,
        width: width,
        hAxis: {
            title: 'Indicators',
        },
        legend: { position: 'rigth' },
        dataOpacity: 0,
        tooltip: { isHtml: true },
        intervals: {
            barWidth: 1,
            boxWidth: 1,
            lineWidth: 1,
            style: 'boxes'
        },
        interval: {
            max: {
                style: 'bars',
                fillOpacity: 1,
            },
            min: {
                style: 'bars',
                fillOpacity: 1,
            }
        }
    };
    let chart = new google.visualization.ColumnChart(document.getElementById('courses_plot'));
    // The select handler. Call the chart's getSelection() method
    function selectHandler() {
        var selectedItem = chart.getSelection()[0];
        if (selectedItem) {
            window.location.href = "/course?id=" + data.getColumnLabel(selectedItem.column);
        }
    }
    google.visualization.events.addListener(chart, 'select', selectHandler);

    google.visualization.events.addListener(chart, 'onmouseover', changecursorPOINTER);
    google.visualization.events.addListener(chart, 'onmouseout', changecursorDEFAULT);
    chart.draw(data, options);
    d3.selectAll('#courses_plot').selectAll('g[clip-path] > g:nth-child(2)').raise();
}
function draw_P_LastDays() {
    let data_p = [];
    let data = new google.visualization.DataTable();
    data.addColumn('number', 'ID');
    data.addColumn('string', 'Student');
    data.addColumn('number', 'Days since last access');
    data.addColumn('number', 'Mean of the Percentage of open activities done');
    data.addColumn('number', 'Percentage of open activities done');

    last_access.forEach(element => {
        let name = histogram_data[histogram_data.findIndex((x) => { return x[2] == element.id })][0];
        data_p.push([element.id, name, element.days, element.avg, element.per]);
    });

    data.addRows(data_p);

    let options = {
        alternatingRowStyle: false,
        allowHtml: true,
        height: height,
        width: width,
        sortColumn: 0,
        cssClassNames: { headerCell: 'googleHeaderCell' },
        sort: 'event'
    }

    let formatter = new google.visualization.ColorFormat();
    formatter.addGradientRange(0, 7, 'black', 'green', 'yellow');
    formatter.addGradientRange(7, 15, 'black', 'yellow', 'red');
    formatter.addRange(null, null, 'black', 'red');
    formatter.format(data, 2);

    let table = new google.visualization.Table(document.getElementById('lastaccess_plot'));

    function selectHandler() {
        var selectedItem = table.getSelection()[0];
        if (selectedItem) {
            var value = data.getValue(selectedItem.row, 0);
            window.location.href = "/student?id=" + value;
        }
    }

    function sortHandler(e) {
        if (e.column == 0) {
            var sortValues = [];
            var sortRows = [];
            var sortDirection = (e.ascending) ? 1 : -1;
            for (var i = 0; i < data.getNumberOfRows(); i++) {
                sortValues.push(
                    data.getValue(i, e.column + 1)
                );
            }
            sortValues.sort(
                function (row1, row2) {
                    return row1.localeCompare(row2) * sortDirection;
                }
            );

            sortValues.forEach(function (sortValue) {
                sortRows.push(data.getFilteredRows([{ column: e.column + 1, value: sortValue }])[0]);
            });

            let rows = [];
            sortRows.forEach(element => {
                let row = [];
                for (let index = 0; index < data.getNumberOfColumns(); index++) {
                    row.push(data.getValue(element, index));
                }
                rows.push(row);
            });

            data.removeRows(0, data.getNumberOfRows());
            data.addRows(rows);
            formatter.format(data, 2);
            options.sortColumn = e.column;
            options.sortAscending = e.ascending;
            table.draw(view, options);

        } else {
            data.sort({ column: e.column + 1, desc: e.ascending });
            options.sortColumn = e.column;
            options.sortAscending = e.ascending;
            table.draw(view, options);
        }
        d3.selectAll('#lastaccess_plot').selectAll('table').style('cursor', 'pointer');

    }

    google.visualization.events.addListener(table, 'select', selectHandler);
    google.visualization.events.addListener(table, 'sort', sortHandler);


    let view = new google.visualization.DataView(data);

    view.setColumns([1, 2, 3, 4]);
    table.draw(view, options);

    d3.selectAll('#lastaccess_plot').selectAll('table').style('cursor', 'pointer');
}
function draw_P_Grades() {
    let data_p = [];
    let max_number_of_evals = 0;
    box_data.forEach(course => {
        if (course != null) {
            let course_row = [];
            course_row.push(course.course);
            let number_of_evals = 0;
            course.evals.forEach(element => {
                if (element != null) {
                    number_of_evals++;
                    course_row.push(100, element.min, element.Q1, element.median, element.Q3, element.max, element.name + ":\n\tMax: " + element.max + "\n\tQ3: " + element.Q3 + "\n\tMedian: " + element.median + "\n\tQ1: " + element.Q1 + "\n\tMin: " + element.min);
                }
            });
            if (number_of_evals > max_number_of_evals) {
                max_number_of_evals = number_of_evals;
            }
            data_p.push(course_row);
        }
    });

    data_p.forEach(element => {
        while (element.length < 1 + max_number_of_evals * 7) {
            element.push(undefined);
        }
    });

    let data = new google.visualization.DataTable();

    // Declare columns
    data.addColumn('string', 'Course');
    for (let index = 0; index < max_number_of_evals; index++) {
        data.addColumn('number', 'Eval');
        data.addColumn({ id: 'min', type: 'number', role: 'interval' });
        data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
        data.addColumn({ id: 'median', type: 'number', role: 'interval' });
        data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
        data.addColumn({ id: 'max', type: 'number', role: 'interval' });
        data.addColumn({ type: 'string', role: 'tooltip' })
    }
    // Add data.
    data.addRows(data_p);
    let options = {
        title: "Distribution of the students' grades in each evaluation activity",
        vAxis: {
            title: 'Grades'
        },
        height: height,
        width: width,
        legend: { position: 'none' },
        tooltip: { isHtml: true },
        intervals: {
            barWidth: 1,
            boxWidth: 1,
            lineWidth: 1,
            style: 'boxes'
        },
        interval: {
            max: {
                style: 'bars'
            },
            min: {
                style: 'bars'
            }
        },

        dataOpacity: 0

    };
    let chart = new google.visualization.ColumnChart(document.getElementById('box_plot'));

    chart.draw(data, options);

    d3.selectAll('#box_plot').selectAll('g[clip-path] > g:nth-child(2)').raise();
    d3.selectAll('#box_plot > div > div:nth-child(1) > div > svg > g:nth-child(4) > g:nth-child(4) text[text-anchor="middle"]').on('click', clickHandler).style('cursor', 'pointer');

    function clickHandler() {
        window.location.href = "/course?id=" + this.innerHTML;
    }

}
function draw_P_aggregated() {
    let data = new google.visualization.DataTable();

    // Declare columns
    data.addColumn('string', 'Course');
    data.addColumn('number', 'Grades');
    data.addColumn({ id: 'min', type: 'number', role: 'interval' });
    data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'median', type: 'number', role: 'interval' });
    data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'max', type: 'number', role: 'interval' });

    data.addColumn({ type: 'string', role: 'tooltip' })
    data.addColumn('number', 'Participation');
    data.addColumn({ id: 'min', type: 'number', role: 'interval' });
    data.addColumn({ id: 'firstQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'median', type: 'number', role: 'interval' });
    data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'max', type: 'number', role: 'interval' });

    data.addColumn({ type: 'string', role: 'tooltip' })
    let data_p = [];
    aggregate_Grades.forEach(element => {
        let aux = [element.course + "", 100, element.min, element.Q1, element.median, element.Q3, element.max,
        "Grades in course " + element.course + ":\n\tMax: " + element.max + "\n\tQ3: " + element.Q3 + "\n\tMedian: " + element.median + "\n\tQ1: " + element.Q1 + "\n\tMin: " + element.min];
        let index = aggregate_Acts.findIndex((e) => e.course == element.course);
        let v = aggregate_Acts[index];
        if (v == null) {
            v = {};
            v.min = null;
            v.Q1 = null;
            v.median = null;
            v.Q3 = null;
            v.max = null;
        }
        aux = aux.concat([100, v.min, v.Q1, v.median, v.Q3, v.max,
            "Participation in course " + element.course + ":\n\tMax: " + v.max + "\n\tQ3: " + v.Q3 + "\n\tMedian: " + v.median + "\n\tQ1: " + v.Q1 + "\n\tMin: " + v.min
        ]);
        data_p.push(aux);
    });
    // Add data.
    data.addRows(data_p);
    let options = {
        title: "Distribution of the students' grades and participation in each course",
        vAxis: {
            title: 'Percentage'
        },
        height: height,
        width: width,
        legend: { position: 'top' },
        tooltip: { isHtml: true },
        intervals: {
            barWidth: 1,
            boxWidth: 1,
            lineWidth: 1,
            style: 'boxes'
        },
        interval: {
            max: {
                style: 'bars'
            },
            min: {
                style: 'bars'
            }
        },

        dataOpacity: 0

    };
    let chart = new google.visualization.ColumnChart(document.getElementById('agg_plot'));

    chart.draw(data, options);

    d3.selectAll('#agg_plot').selectAll('g[clip-path] > g:nth-child(2)').raise();
    d3.selectAll('#agg_plot > div > div:nth-child(1) > div > svg > g:nth-child(5) > g:nth-child(4) > g text[text-anchor="middle"]').on('click', clickHandler).style('cursor', 'pointer');

    function clickHandler() {
        window.location.href = "/course?id=" + this.innerHTML;
    }

}
function drawHistogram() {
    let data = new google.visualization.DataTable();

    // Declare columns


    data.addColumn({ id: 'Student', type: 'string' });
    data.addColumn('number', 'Percentage of participation');

    let aux = [];
    histogram_data.forEach(element => {
        aux.push([element[0], element[1]]);
    });
    // Add data.
    data.addRows(aux);
    var options = {
        title: 'Distribution of the students by the percentage of participated activities',
        legend: { position: 'none' },
        hAxis: {
            title: 'Percentage of participated activities',
            viewWindowMode: 'maximized',
            viewWindow: { max: 100 }
        },
        allowHtml: true,
        height: height,
        width: width,
        vAxis: {
            title: 'Number of students'
        }
    };

    let chart = new google.visualization.Histogram(document.getElementById('histogram'));

    // The select handler. Call the chart's getSelection() method
    function selectHandler() {
        var selectedItem = chart.getSelection()[0];
        if (selectedItem) {
            window.location.href = "/student?id=" + histogram_data[selectedItem.row][2];
        }
    }

    google.visualization.events.addListener(chart, 'select', selectHandler);
    google.visualization.events.addListener(chart, 'onmouseover', changecursorPOINTER);
    google.visualization.events.addListener(chart, 'onmouseout', changecursorDEFAULT);

    chart.draw(data, options);
}
function drawTimelineDisplay() {
    let data_p = [];
    timeline_info.forEach(element => {
        data_p.push(
            [
                element.week,
                100 * element.student.done_activities / element.student.all_activities,
                100 * element.average,

            ]
        );
    });
    let data = new google.visualization.DataTable();
    // Declare columns
    data.addColumn('number', 'Week');
    data.addColumn('number', student.name);
    data.addColumn('number', 'Average Student');

    // Add data.
    data.addRows(data_p);
    let options = {
        title: "Percentage of activities done(posts, quizzes attempts and submissions) until week",
        vAxis: {
            title: 'Percentage of activities',
            maxValue: 100
        },
        height: height,
        width: width,
        hAxis: {
            title: 'Week of the semester'
        },
        legend: {
            position: 'top'
        },
    };
    let chart = new google.visualization.LineChart(document.getElementById('timeline_plot'));
    chart.draw(data, options);
}
function draw_weekly_percentage() {
    let data_p = [];
    let data = new google.visualization.DataTable();
    // Declare columns
    data.addColumn('number', 'Week');
    let columns = [];
    weekly_percentage[0].courses.forEach(element => {
        if (element != null) {
            data.addColumn('number', element.course);
            columns.push(element.course);
        }
    });
    weekly_percentage.forEach(element => {
        let data_point = [];

        data_point.push(element.week);
        columns.forEach(elem => {
            data_point.push(100 * element.courses[elem].done_activities / element.courses[elem].activities);
        });
        data_p.push(data_point);
    });
    // Add data.
    data.addRows(data_p);
    let options = {
        title: "Percentage of activities done(posts, quizzes attempts and submissions) until week",
        vAxis: {
            title: 'Percentage of activities',
            maxValue: 100
        },
        height: height,
        width: width,
        hAxis: {
            title: 'Week of the semester'
        },
        focusTarget: 'category',
        legend: {
            position: 'top'
        },
    };
    let chart = new google.visualization.LineChart(document.getElementById('weekly_percentage'));
    chart.draw(data, options);
}

