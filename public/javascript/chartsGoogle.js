let height;
let width;

if($(window).width() >= 2500){
    height = $(window).height()/4;
    width = $(window).width()/3;
} else {
    height = 275;
    width = 550;
}

// Load the Visualization API and the corechart package.
google.charts.load('current', { 'packages': ['corechart', 'table', 'timeline', 'gantt'] });

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawALL);
function changecursorPOINTER(e) {
    document.body.style.cursor = 'pointer';
}
function changecursorDEFAULT(e) {
    document.body.style.cursor = 'default';
}

function mouseOver(event) {
    d3.select(this).attr('fill', '#3366BB');
    d3.select(this).style("text-decoration","underline");
}
function mouseOut(event) {
    d3.select(this).attr('fill', 'black');
    d3.select(this).style("text-decoration","none");
}

function draw_C_participation_on_course() {
    let data = new google.visualization.DataTable();

    data.addColumn({ id: 'Student', type: 'string' });
    data.addColumn('number', 'Percentage of participation');

    let aux = [];
    participation_info.forEach(element => {
        aux.push([element[1], Math.round(element[2]*10)/10]);
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
        },
        backgroundColor: '#f4f4f4'
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
function drawPieChartCourse() {
    let data = new google.visualization.DataTable();

    data.addColumn('string', 'Interval of percentages');
    data.addColumn('number', 'Percentage of students in the interval');

    let intervals = [[], [], [], [], [], [], [], [], [], []];
    participation_info.forEach(element => {
        let interval = (Math.trunc(element[2]/10));
        intervals[interval].push(element[2]);
       
    });

    for(let i = 0; i < intervals.length; i++){
       let interval_string = "" + i*10 + "-" + (i+1)*10;
        data.addRows([[interval_string,intervals[i].length]])
    }

    var options = {
        title: 'Distribution of the students by the percentage of participated activities',
        pieHole: 0.1,
        width: width-20,
        height: height,
        backgroundColor: '#f4f4f4'
    };

    let chart = new google.visualization.PieChart(document.getElementById('participation_on_course_plot'));

    chart.draw(data, options);
}
 function draw_C_timeline_on_course() {

      var data = new google.visualization.DataTable();
      data.addColumn('string', 'Task ID');
      data.addColumn('string', 'Task Name');
      data.addColumn('string', 'Resource');
      data.addColumn('date', 'Start Date');
      data.addColumn('date', 'End Date');
      data.addColumn('number', 'Duration in days');
      data.addColumn('number', 'Percent Complete');
      data.addColumn('string', 'Dependencies');


    let aux = [];
    timeline_info.forEach(element => {

        let year_open = new Date(Number(element.time_open)*1000).getFullYear();
        let month_open = new Date(Number(element.time_open)*1000).getMonth();
        let day_open = new Date(Number(element.time_open)*1000).getDay();
        let year_close = new Date(Number(element.time_close)*1000).getFullYear();
        let month_close = new Date(Number(element.time_close)*1000).getMonth();
        let day_close = new Date(Number(element.time_close)*1000).getDay();
        let resource ="";
        
        if(element.name.startsWith("Quizz")){
            resource = "quizz"
        } 
        else if(element.name.startsWith("Assignment")){
            resource = "assignment"
        }
        else if(element.name.startsWith("Forum")){
            resource ="forum"
        }

        aux.push(
            [
                String(element.id),
                element.name,
                resource,
                new Date(year_open, month_open, day_open),
                new Date(year_close, month_close, day_close),
                null,
                Math.round((element.done/course.num_students)*100), 
                null
            ]
        );
    });  
    data.addRows(aux);
    let trackHeight = 30;

      var options = {
        title: "Timeline of the course",
        height: data.getNumberOfRows() * trackHeight + 45,
        width: width + 200,
        hAxis: {
            format: 'yyyy-MM-dd',
          },
        gantt: {
            palette: [
                {
                  "color": "#ADC2EB",
                  "dark": "#3366CC",
                  "light": "white"
                }
              ],          
            trackHeight: trackHeight,
          criticalPathEnabled:false,
        },
        backgroundColor: '#f4f4f4'
      };

        var container = document.getElementById('timeline_on_course_plot');
        var chart = new google.visualization.Gantt(container);
        var observer = new MutationObserver(function () {
            $.each($('text'), function (index, label) {
            var rowIndex = data.getFilteredRows([{
                column: 1,
                value: $(label).text()
            }]);
            if (rowIndex.length > 0) {
                $(label).attr('fill', '#000000')
            }
            });
        });
        observer.observe(container, {
            childList: true,
            subtree: true
        });

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
                data_point.push(Math.round((100 * element.courses[elem].done_activities / element.courses[elem].activities)*10)/10);
            }
        });
        data_point.push(Math.round((100 * done_activities / activities)*10)/10);
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
        backgroundColor: '#f4f4f4'
    };
    let chart = new google.visualization.LineChart(document.getElementById('weekly_plot'));
    chart.draw(data, options);
}
function draw_C_evaluations() {
    let data_p = [];
    grades_info.data.forEach(element => {
        let eval_row = [];
        eval_row.push(element.name);
        grades = element.students_values
        grades.forEach(function(part, index, grades) {
            grades[index] = Math.round(grades[index] * 10) / 10;
          });
        eval_row = eval_row.concat(grades);
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
        backgroundColor: '#f4f4f4'
    };
    let chart = new google.visualization.LineChart(document.getElementById('evaluations_plot'));

    chart.draw(data, options);
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

    let foruns = box_plot_info.data[0];
    let quizzes = box_plot_info.data[1];
    let assigns = box_plot_info.data[2];

    foruns.forEach(function(part, index, foruns){
        if(typeof(foruns[index]) == 'number'){
            foruns[index] = Math.round(foruns[index] * 10) / 10;
        }
    });

    quizzes.forEach(function(part, index, quizzes){
        if(typeof(quizzes[index]) == 'number'){
            quizzes[index] = Math.round(quizzes[index] * 10) / 10;
        }
    });

    assigns.forEach(function(part, index, assigns){
        if(typeof(assigns[index]) == 'number'){
            assigns[index] = Math.round(assigns[index] * 10) / 10;
        }
    });

    data.addRows([foruns, quizzes, assigns]);

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
        backgroundColor: '#f4f4f4'
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
    data.addColumn({ type: 'string', role: 'style' });
    data.addColumn('datetime', 'Start');
    data.addColumn('datetime', 'End');   

    let aux = [];
    proposed_act.forEach(element => {
        let tooltip = (element.done != null ? ('<p> ' + element.name + ' done on ' + new Date(element.done * 1000).toDateString()) : "<p>" + element.name + " not done")+ '<br>' + new Date(element.time_open * 1000).toDateString() + ' to ' + new Date(element.time_close * 1000).toDateString() + '<br>Week ' + element.week_start + ' to ' + element.week_end + '</p>';
        aux.push(
            [
                element.code + '',
                element.done != null ? (element.done > element.time_close ? "Late" : "Done") : "Missing",
                tooltip,
                element.done != null ? (element.done > element.time_close ? "#F4D03F" : "#27AE60") : "#E74C3C",
                new Date(element.time_open * 1000),
                new Date(element.time_close * 1000)
            ]
        );
    });

    data.addRows(aux);

    var options = {
        title: 'Activities timeline',
        timeline: { showRowLabels: true,
                    groupByRowLabel: true
        },
        allowHtml: true,
        height: height,
        width: width,
        backgroundColor: '#f4f4f4'
    };

    let chart = new google.visualization.Timeline(document.getElementById('act_plot'));

    var observer = new MutationObserver(setBorderColor);
    google.visualization.events.addListener(chart, 'ready', function () {
        setBorderColor();
        observer.observe(document, {
        childList: true,
        subtree: true
        });
    });

  function setBorderColor() {
    Array.prototype.forEach.call(document.querySelectorAll('#act_plot > div > div > div > div:nth-child(2) > svg > g:nth-child(4) > rect'), function (rect) {
        rect.setAttribute('stroke', "white");
    });

    Array.prototype.forEach.call(document.querySelectorAll('#act_plot > div > div:nth-child(1) > div > svg > g:nth-child(5) > rect'), function (rect) {
        rect.setAttribute('stroke', "white");
    });
  }
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
                    data_p.push([course.course, element.name, Math.round(element.grade * 10) / 10, Number(element.percentile.toFixed(2))]);
                }
            });
        }
    });
    let data = new google.visualization.DataTable();
    data.addColumn('string', 'Course');
    data.addColumn('string', 'Activity');
    data.addColumn('number', 'Grade');
    data.addColumn('number', 'Percentile');
    data.addRows(data_p);

    let colors = ['#ede0d4 ', '#e6ccb2 ', '#ddb892', '#D3A778', '#C78E52'];
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
        width: $(window).width()/2.5,
        height: $(window).height()/3,
        alternatingRowStyle: false,
        allowHtml: true,
        sortColumn: 0,
        cssClassNames: { headerCell: 'googleHeaderCell' },
        backgroundColor: '#f4f4f4'
    }

    let formatter = new google.visualization.ColorFormat();
    formatter.addGradientRange(0, .5, 'black', '#E74C3C', '#F4D03F');
    formatter.addGradientRange(0.5, 1.01, 'black', '#F4D03F', '#27AE60');
    formatter.format(data, 3);

    let formatter1 = new google.visualization.ColorFormat();
    formatter1.addGradientRange(0, 75, 'black', '#E74C3C', '#F4D03F');
    formatter1.addGradientRange(75, 101, 'black', '#F4D03F', '#27AE60');
    formatter1.format(data, 2);
    let table = new google.visualization.Table(document.getElementById('grades_plot'));

    google.visualization.events.addListener(table, 'select', selectHandler);
    function selectHandler() {
        var selectedItem = table.getSelection()[0];
        if (selectedItem) {
            var value = data.getValue(selectedItem.row, 0);
            window.location.href = "/course?code=" + value;
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
        },
        backgroundColor: '#f4f4f4'
    };
    let chart = new google.visualization.LineChart(document.getElementById('week_plot'));
    chart.draw(data, options);
}
function draw_S_Percentages() {
    percentages_data.forEach(element => {
        element[7] = student.name + " -> " + element[1].toFixed(2) + "%\n The student is on the " + element[7].toFixed(2) + " percentile";
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
        height: height-25,
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
        },
        backgroundColor: '#f4f4f4'
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
        },
        backgroundColor: '#f4f4f4'
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
        let average = Math.round(element.avg * 10) / 10;
        let percentage = Math.round(element.per * 10) / 10;
        let name = histogram_data[histogram_data.findIndex((x) => { return x[2] == element.id })][0];
        data_p.push([element.id, name, element.days, average, percentage]);
    });

    data.addRows(data_p);

    let options = {
        alternatingRowStyle: false,
        allowHtml: true,
        height: height,
        width: width,
        sortColumn: 0,
        cssClassNames: { headerCell: 'googleHeaderCell' },
        sort: 'event',
        backgroundColor: '#f4f4f4'
    }

    let formatter = new google.visualization.ColorFormat();
    formatter.addGradientRange(0, 7, 'black', '#27AE60', '#F4D03F');
    formatter.addGradientRange(7, 15, 'black', '#F4D03F', '#E74C3C');
    formatter.addRange(null, null, 'black', '#E74C3C');
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
        dataOpacity: 0,
        backgroundColor: '#f4f4f4'
    };
    let chart = new google.visualization.ColumnChart(document.getElementById('box_plot'));

    chart.draw(data, options);

    d3.selectAll('#box_plot').selectAll('g[clip-path] > g:nth-child(2)').raise();
    d3.selectAll('#box_plot > div > div:nth-child(1) > div > svg > g:nth-child(4) > g:nth-child(4) text[text-anchor="middle"]').on('click', clickHandler).style('cursor', 'pointer');

    // function clickHandler() {
    //     window.location.href = "/course?id=" + this.innerHTML;
    // }

}
function draw_P_aggregated(value) {

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
    data.addColumn({ id: 'median', type : 'number', role: 'interval' });
    data.addColumn({ id: 'thirdQuartile', type: 'number', role: 'interval' });
    data.addColumn({ id: 'max', type: 'number', role: 'interval' });

    data.addColumn({ type: 'string', role: 'tooltip' });

    data.addColumn('number', 'Reference value');

    let data_p = [];
    let codes = [];

    let reference_value = parseInt(value);
    if (reference_value == NaN){
        reference_value = document.getElementById("response").value;
    }
    
    data.addRows([[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,reference_value]]);

    aggregate_Grades.forEach(element => {

        let min = Math.round(element.min * 10) / 10;
        let q1 = Math.round(element.Q1 * 10) / 10;
        let median = Math.round(element.median * 10) / 10;
        let q3 = Math.round(element.Q3 * 10) / 10;
        let max = Math.round(element.max * 10) / 10;

        let aux = [element.code + "", 100, min, q1, median, q3, max,
        "Grades in " + element.name + ":\n\tMax: " + max + "\n\tQ3: " + q3 + "\n\tMedian: " + median + "\n\tQ1: " + q1 + "\n\tMin: " + min];

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

        let vmin = Math.round(v.min * 10) / 10;
        let vq1 = Math.round(v.Q1 * 10) / 10;
        let vmedian = Math.round(v.median * 10) / 10;
        let vq3 = Math.round(v.Q3 * 10) / 10;
        let vmax = Math.round(v.max * 10) / 10;
        codes.push(element.code)
        aux = aux.concat([100, v.min, v.Q1, v.median, v.Q3, v.max,
            "Participation in " + element.name + ":\n\tMax: " + vmax + "\n\tQ3: " + vq3 + "\n\tMedian: " + vmedian + "\n\tQ1: " + vq1 + "\n\tMin: " + vmin, reference_value
        ]);
        data_p.push(aux);
    });
    // Add data.
    data.addRows(data_p);
    data.addRows([[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,reference_value]]);

    let options = {
        title: "Distribution of the students' grades and participation in each course",
        vAxis: {
            title: 'Percentage'
        },
        hAxis: {
            title: 'Course',
        },
        tooltip: { isHtml: true },
        height: height,
        width: width,
        legend: { position: 'top' },
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
        dataOpacity: 0,
        seriesType: 'bars',
        series: {
            2: {type: 'line'}},
        backgroundColor: '#f4f4f4'
    };
    
    let chart = new google.visualization.ComboChart(document.getElementById('agg_plot'));
    chart.draw(data, options);


    d3.selectAll('#agg_plot').selectAll('g[clip-path] > g:nth-child(2)').raise();
    d3.selectAll('#agg_plot > div > div:nth-child(1) > div > svg > g:nth-child(5) > g:nth-child(4) > g text[text-anchor="middle"]').on('click', clickHandler).style('cursor', 'pointer');
    d3.selectAll('#agg_plot > div > div:nth-child(1) > div > svg > g:nth-child(5) > g:nth-child(4) > g text[text-anchor="middle"]').on('mouseover', mouseOver).on('mouseout', mouseOut);

    google.visualization.events.addListener(chart, 'onmouseover', changecursorPOINTER);
    google.visualization.events.addListener(chart, 'onmouseout', changecursorDEFAULT);
    google.visualization.events.addListener(chart, 'select', clickHandlerCode);


    function clickHandler() {
        window.location.href = "/course?code=" + this.innerHTML;
    }

    function clickHandlerCode() {
        let selection = chart.getSelection()[0]
        let code = codes[selection.row];
        window.location.href = "/course?code=" + code ;
    }


}
function drawHistogram() {
    let data = new google.visualization.DataTable();

    // Declare columns

    data.addColumn({ id: 'Student', type: 'string' });
    data.addColumn('number', 'Percentage of participation');

    let aux = [];
    histogram_data.forEach(element => {
        aux.push([element[0], Math.round(element[1]*10)/10]);
        
    });
    // Add data.
 
    data.addRows(aux);
    var options = {
        title: 'Distribution of the students by the percentage of participated activities',
        hAxis: {
            title: 'Percentage of participated activities',
            viewWindowMode: 'maximized',
            viewWindow: { max: 100 },
        },
        legend: { position: 'none' },
        allowHtml: true,
        height: height,
        width: width-20,
        vAxis: {
            title: 'Number of students'
        },
        backgroundColor: '#f4f4f4'
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
function drawPieChart() {
    let data = new google.visualization.DataTable();

    data.addColumn('string', 'Interval of percentages');
    data.addColumn('number', 'Percentage of students in the interval');

    let intervals = [[], [], [], [], [], [], [], [], [], []];
    histogram_data.forEach(element => {
        let interval = (Math.trunc(element[1]/10));
    
        intervals[interval].push(element[1]);
       
    });

    for(let i = 0; i < intervals.length; i++){
       let interval_string = "" + i*10 + "-" + (i+1)*10;
        data.addRows([[interval_string,intervals[i].length]])
    }

    var options = {
        title: 'Distribution of the students by the percentage of participated activities',
        pieHole: 0.1,
        width: width-20,
        height: height,
        backgroundColor: '#f4f4f4'
    };

    let chart = new google.visualization.PieChart(document.getElementById('histogram'));

    chart.draw(data, options);
}
function drawTimelineDisplay() {
    let data_p = [];
    timeline_info.forEach(element => {
        data_p.push(
            [
                element.week,
                Math.round((100 * element.student.done_activities / element.student.all_activities)*10)/10,
                Math.round((100 * element.average)*10)/10,

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
        focusTarget: 'category',
        legend: {
            position: 'top'
        },
        backgroundColor: '#f4f4f4'
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
            data.addColumn({
                type: 'number',
                label: element.code,
                color: 'red',
                disabledColor: '#FFD9D9',
                visible: true
              });
            columns.push(element.course);
        }
    });
    weekly_percentage.forEach(element => {
        let data_point = [];

        data_point.push(element.week);
        columns.forEach(elem => {
            let value = Math.round((100*element.courses[elem].done_activities / element.courses[elem].activities)*10)/10;

            if (value == "Nan"){
                value == parseInt("N/A");
            }

            data_point.push(value);
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
            position: 'right'
        },
        backgroundColor: '#f4f4f4'
    };

    let chart = new google.visualization.LineChart(document.getElementById('weekly_percentage'));
    let columnsToHide = [];
    let dataValues = [];

    for (let i= 0 ; i < data.getNumberOfRows(); i++){
        dataValues[i] = [];
        for (let j=0; j < data.getNumberOfColumns(); j++ ){
            dataValues[i][j] = data.getValue(i,j);
        }
    }

    function selectHandler() {
        let selectedItem = chart.getSelection()[0].column;
        if (selectedItem) {
           if(columnsToHide.includes(selectedItem)){
            let index = columnsToHide.indexOf(selectedItem);
            if (index > -1) {
                columnsToHide.splice(index, 1);
            }
                for (let j=0; j < data.getNumberOfRows() ; j++ ){
                        data.setCell(j,selectedItem, dataValues[j][selectedItem]);
                }
           }
           else {
                columnsToHide.push(selectedItem);
               
                for (let j=0; j < data.getNumberOfRows() ; j++ ){
                        data.setCell(j,selectedItem , 0/0);
                }
                

           }
           chart.draw(data, options);
        }
      }
    
    google.visualization.events.addListener(chart, 'select', selectHandler); 
    google.visualization.events.addListener(chart, 'onmouseover', changecursorPOINTER);
    google.visualization.events.addListener(chart, 'onmouseout', changecursorDEFAULT);
  
    //d3.selectAll('#weekly_percentage > div > div > div > svg > g:nth-child(4) > g text[text-anchor="start"]').on('click', selectHandler).style('cursor', 'pointer');
    //d3.selectAll('#weekly_percentage > div > div > div > svg > g:nth-child(4) > g text[text-anchor="start"]').on('mouseover', mouseOver).on('mouseout', mouseOut);
    chart.draw(data, options);
}
function draw_P_LastDaysExtended() {
    let data_p = [];
    let data = new google.visualization.DataTable();
    data.addColumn('number', 'ID');
    data.addColumn('string', 'Student');
    data.addColumn('number', 'Days since last access');
    data.addColumn('number', 'Mean of the Percentage of open activities done');
    data.addColumn('number', 'Percentage of open activities done');
    data.addColumn('string', 'Course Edition');
    data.addColumn('string', 'Enrollment Regime');

    last_access.forEach(element => {
        let average = Math.round(element.avg * 10) / 10;
        let percentage = Math.round(element.per * 10) / 10;
        let name = histogram_data[histogram_data.findIndex((x) => { return x[2] == element.id })][0];
        let courseEdition = histogram_data[histogram_data.findIndex((x) => { return x[2] == element.id })][3];
        let enrollmentEdition = histogram_data[histogram_data.findIndex((x) => { return x[2] == element.id })][4];
        data_p.push([element.id, name, element.days, average, percentage, courseEdition, enrollmentEdition]);
    });

    data.addRows(data_p);
    let options = {
        alternatingRowStyle: false,
        allowHtml: true,
        sortColumn: 0,
        cssClassNames: { headerCell: 'googleHeaderCell' },
        width: $(window).width()/3.1,
        height: $(window).height(),
        sort: 'event',
        backgroundColor: '#f4f4f4'
    }

    let formatter = new google.visualization.ColorFormat();
    formatter.addGradientRange(0, 7, 'black', '#27AE60', '#F4D03F');
    formatter.addGradientRange(7, 15, 'black', '#F4D03F', '#E74C3C');
    formatter.addRange(null, null, 'black', '#E74C3C');
    formatter.format(data, 2);

    let table = new google.visualization.Table(document.getElementById('table'));

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
        d3.selectAll('#table').selectAll('table').style('cursor', 'pointer');
    }

    google.visualization.events.addListener(table, 'select', selectHandler);
    google.visualization.events.addListener(table, 'sort', sortHandler);

    let view = new google.visualization.DataView(data);

    view.setColumns([1, 2, 3, 4, 5, 6]);
    table.draw(view, options);

    d3.selectAll('#table').selectAll('table').style('cursor', 'pointer');
}

