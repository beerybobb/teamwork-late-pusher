//set your stuff here
var creds = {
    company: "COMPANY NAME",
    token: "TOKEN"
}




//Teamwork needs the date to be in a specific format. the below gets them. 
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1;
if (mm < 10) { mm = '0' + mm }
var yyyy = today.getFullYear();
if (dd < 10) { dd = '0' + dd }
var todaysDate = yyyy.toString() + mm.toString() + dd.toString();

//get tomorrows date and format it
var tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
var ddt = tomorrow.getDate();
var mmt = tomorrow.getMonth() + 1;
if (mmt < 10) { mmt = '0' + mmt }
var yyyyt = tomorrow.getFullYear();
if (ddt < 10) { ddt = '0' + ddt }
var tomorrowsDate = yyyyt.toString() + mmt.toString() + ddt.toString();

//function to convert TeamWork's weird format to a USA readable format
function yyyymmddConvert(theDate) {
    return theDate.replace(/(\d\d\d\d)(\d\d)(\d\d)/g, '$2/$3/$1');
}

//declare vars
var tasks;
var dueDate;
var responsible;
var responsibleId;
var person;
var lateIds = [];

function lateCheck() {
    $.ajax({
            type: "GET",
            url: "https://"+ creds.company +".teamwork.com/tasks.json",
            headers: { "Authorization": "Basic " + btoa(creds.token + ':fakepass') },
            success: function(res) {
                console.log('got json task list');
                tasks = res;
                console.log(tasks)

            },
            complete: function() {

                    //process each item
                    for (var i = 0; i < tasks['todo-items'].length; i++) {
                        (function(i) {
                            //figure out if current task is late PLUS is not the root cause of lateness(is not a dependant task)
                            if (tasks['todo-items'][i]['due-date'] < todaysDate && tasks['todo-items'][i]['has-predecessors'] == 0 ) {
                                //push the late tasks into a list. may use this in the future
                                lateIds.push(tasks['todo-items'][i]['id'])
                                    //set var for current iterations due date
                                dueDate = tasks['todo-items'][i]['due-date']
                                    //find out who the offending party is. probably wont need this in the fucute
                                if (tasks['todo-items'][i]['responsible-party-firstname'] == null) {
                                    responsible = tasks['todo-items'][i]['creator-firstname'];
                                    responsibleId = tasks['todo-items'][i]['creator-id']
                                } else {
                                    responsible = tasks['todo-items'][i]['responsible-party-firstname'];
                                    responsibleId = tasks['todo-items'][i]['responsible-party-id']
                                }


                                //write template to page
                                document.getElementById('lateTask').innerHTML += '<div class="demo-card-square mdl-card mdl-shadow--2dp containerNum' + i + '"><div class="mdl-card__title mdl-card--expand"><h4 class="mdl-card__title-text">' + tasks['todo-items'][i].content + '</h4></div><div class="mdl-card__supporting-text"><div class="offender" style="text-align:center"><img alt="' + responsibleId + '" src="" /><br><span>Offender: ' + responsible + '</span></div><div class="due" alt="' + dueDate + '">Due date: ' + yyyymmddConvert(dueDate) + '</div></div><div class="mdl-card__actions mdl-card--border" style="text-align: center;"><a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect push-task taskNum' + i + '" href="javascript:void(0)">Push Task</a></div></div>'


                                //get offending parties pic. probably wont need this either
                                $.ajax({
                                    type: "GET",
                                    url: "https://"+ creds.company +".teamwork.com/people/" + responsibleId + ".json",
                                    headers: { "Authorization": "Basic " + btoa(creds.token +':fakepass') },
                                    success: function(res) {
                                        person = res;
                                    }
                                }).then(function() {
                                    //add Offender Image
                                    $('.offender img:eq(' + i + ')').attr('src', person.person['avatar-url']);
                                }).then(function() {
                                    //add event handeler to preform date push and comment on click.
                                    $('.taskNum' + i).on('click', function() {
                                            $.ajax({
                                                type: "PUT",
                                                url: "https://"+ creds.company +".teamwork.com/tasks/" + tasks['todo-items'][i]['id'] + ".json",
                                                headers: { "Authorization": "Basic " + btoa(creds.token + ':fakepass') },
                                                contentType: "application/json; charset=UTF-8",
                                                data: JSON.stringify({ "todo-item": { "due-date": tomorrowsDate } }),
                                                success: function(mess) { console.log('success' + JSON.stringify(mess)) },
                                            }).then(function() {
                                                $.ajax({
                                                    type: "POST",
                                                    url: "https://"+ creds.company +".teamwork.com/tasks/" + tasks['todo-items'][i]['id'] + "/comments.json",
                                                    headers: { "Authorization": "Basic " + btoa(creds.token +':fakepass') },
                                                    contentType: "application/json; charset=UTF-8",
                                                    data: JSON.stringify({ "comment": { "body": "This task was found to be past due and was moved to tomorrow. Please re-estimate the task's due date when you have a chance. I also think you're awesome :)", "content-type": "TEXT" } }),
                                                    success: function(mess) { console.log('success' + JSON.stringify(mess)) },
                                                });
                                            }).then(function() {
                                            	//remove this card when done
                                                $('.containerNum' + i).fadeOut(function() { $('.containerNum' + i).remove();
                                                    update() });
                                            })
                                        })
                                })
                            } //late tasks
                        })(i); //iffy
                    } //for loop
                } //complete function
        }) //initial ajax call

} //lateCheck function

//update - clear and fade - refresh
function update() {
    $("#lateTask").fadeOut(function() {
        $("#lateTask").empty();
        $("#lateTask").fadeIn();
        lateCheck()
    });
};

//start
lateCheck()
