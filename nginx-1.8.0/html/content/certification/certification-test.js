/*
*This file defines functions that are needed to -
* 1) save test answers
* 2) modify test answers 
* 3) submit the test answers to a remote server

*/

function saveCERTanswer(questionId, chkVal) {
    //capture and save answers to the local storage. 


    var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));

    var usrAns = chkVal[0].id;
    var usrAns = usrAns[1]; //Second part (answer id is r1, r2, r3, r4; just want number)

    var cert_scores = user_conf['cert_scores']
    cert_scores[questionId] = usrAns

    //save user ans
    update_cert_user_conf('cert_scores', cert_scores);

    // localStorage.setItem(current_cert_user, JSON.stringify(user_conf))
    //localStorage.setItem(questionId, usrAns); //questionId is e.g. 
    //Go to next page
    //nav_to('next');
    load_certification_page('next');
}


function compileMCQ(MCQidArray) {
    //Turn array of MCQ answers (1,2,3,4) into a short string OR 10 digit number (to be converted to code)
}


function submit_data_to_server(data_type, data_object) {

    //data_type = 'user_data' , 'feedback_survey' , 'certification_test' , pre_test, post_data

    //data_object - > a JSON object containing the data load that needs to be set to the serve. 

    if (data_object == null || typeof data_object !== 'object') {
        if (data_type == "survey_response") { alert('An error occurred - please save the result file to your computer and send via email later.'); };
        return;
    }

    data_object = JSON.stringify(data_object);

    var endpoint = data_type;
    var current_user = localStorage.getItem('logged_in')
    var now = new Date();

    //alert(current_user);
    //alert(JSON.parse(current_user));

    var url_endpoint = 'http://mmelc.vestigesystems.com/deviceData';

    var load = { 'user': JSON.parse(current_user), 'data_load': data_object, 'data_type': data_type }

    //alert(JSON.stringify(load));

    $.ajax({

        type: 'GET',

        url: url_endpoint,
        //url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds', //bad ur for tets 

        dataType: 'jsonp',
        data: load,

        success: function(data) {
            update_on_disk('sentdata/' + JSON.parse(current_user) + now.valueOf(), load);
            console.log("success: " + JSON.stringify(load))
            if (data_type == "survey_response") { alert('Thank you, your feedback has been received!'); };


        },

        error: function(data) {

            update_on_disk('unreceiveddata/' + JSON.parse(current_user) + now.valueOf(), load);
            console.log("submit_data_error: " + JSON.stringify(load))
            if (data_type == "survey_response") { alert('An error occurred - please save the result file to your computer and send via email later.'); };


        }



    });

} //submit_data_to_server


function create_cert_ans_key_to_submit_2() {

    range1 = 10;
    range2 = 5;

    var range01 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    var range02 = [1, 2, 3, 4, 5]

    var qs = [];
    var ans = [];



    for (var i = 0; i < range01.length; i++) {

        //console.log('postMCQ' + range01[i]);
        qs.push('certMCQ' + range01[i])

    }

    for (var i = 0; i < range02.length; i++) {
        qs.push('certq' + range02[i])
            //console.log('postq' + range02[i]);

    }

    //console.log(qs);
    console.log(qs.length)

    var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));
    var cert_scores = user_conf['cert_scores'];

    for (a = 0; a < qs.length; a++) {
        /*
        var an = localStorage.getItem(qs[a]);
        ans.push(an);
        */

        var an = cert_scores[qs[a]];
        ans.push(an);


    }
    alert(qs);
    alert(qn)
    return [qs, ans];

} // create_cert_ans

function submit_cert_ans_to_server(anskey) {


    $.ajax({
        type: 'GET',
        //url: 'http://githubbadge.appspot.com/badge/torvalds',
        url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds',
        //url: 'http://mmelc.vestigesystems.com/submitcert', 
        dataType: 'jsonp',
        data: anskey,

        success: function(json) {
            // var result = json.user.login 

            //alert("live results from server:" + json.status + ':' + json.result);

            alert("success")

        },

        error: function() {
            //alert('please note down following key to get your results:  ' + 'USER ID:  '+ load.test_taker_user_id
            // + '  Answer Key :' + load.answer_key);

            //window.location.href = "/content/posttest_protected/results.html"; 

            alert('errror')


        }

    });

} //  submit_cert to server