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

    var completed_question = localStorage.getItem('current_question')

    //save user ans
    update_cert_user_conf('cert_scores', cert_scores);
    update_cert_user_conf('last_completed_question_url', completed_question);

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


function submit_cert_pxl_ans(q_number) {
    //This calculates the answer to submit.  It checks for no answer and too high of quantitation,
    //but does not check for other errors (e.g. if NMPS is checked, but so are species/stages or quantitation)
    if (q_number) var questionnum = q_number;

    var TFanswers = 'fffffffffffff'; //each checkbox answer; not needed in the end but useful for error checking.
    var species = 'fvmo'; //falciparum, vivax, malariae, ovale
    var stage = 'tsg'; //troph, schizont, gametocyte
    var ansId = 'P'; //this is the start of the checkbox ids

    var numericalBinaryAnswer = 0; //this will be the TF answers converted to base 10
    var quantitation = 0;
    var useranswer = 0; // this is the answer saved and submitted after encryption (in base 10).  Includes binary answers and quantitation.
    var PS = document.getElementById("PS").checked;
    var NMPS = document.getElementById("NMPS").checked;
    //document.getElementById("answerFeedback").innerHTML =species[1];
    if (!PS && !NMPS) { //User didn't select an answer
        document.getElementById("answerFeedback").innerHTML = "Please enter whether parasites are seen or not!";
    } else {
        if (PS) {
            TFanswers = 'tffffffffffff';
            numericalBinaryAnswer = numericalBinaryAnswer + 4096;
        }
        for (i = 0; i < 4; i++) {
            ansId2 = ansId.concat(species[i]); //i.e. Pf, Pv, Po, Pm
            //document.getElementById("answerFeedback").innerHTML =ansId2;
            for (j = 0; j < 3; j++) {
                ansIdFull = ansId2.concat(stage[j]); //e.g. Pft, Pfg, Pfs, Pvt, etc.
                //document.getElementById("answerFeedback2").innerHTML = ansIdFull;

                if (document.getElementById(ansIdFull).checked) {
                    //TFanswers[i*4+j] = 't'; //this doesn't work

                    thisIndex = i * 3 + j + 1; //+1 is to offset (first value is MPS vs NMPS)
                    TFanswers = TFanswers.substr(0, thisIndex) + 't' + TFanswers.substr(thisIndex + 1);
                    numericalBinaryAnswer = numericalBinaryAnswer + Math.pow(2, 12 - thisIndex);

                }
            }
        }
        //document.getElementById("answerFeedback").innerHTML =TFanswers;
        //document.getElementById("answerFeedback2").innerHTML =numericalBinaryAnswer;
        quantitation = document.getElementById("quantitation").value;
        if (quantitation == '') {
            quantitation = 0;
        } else {
            quantitation = quantitation * 1;
        }
        //document.getElementById("answerFeedback2").innerHTML =quantitation;
        if (quantitation > 999999) {
            document.getElementById("answerFeedback").innerHTML = 'Enter a quantitation value less than 1,000,000';
        } else {
            quantitation = quantitation * 10000; //to produce a single number
            useranswer = quantitation + numericalBinaryAnswer;
            //document.getElementById("answerFeedback").innerHTML = useranswer;

            var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));
            var cert_scores = user_conf['cert_scores']
            cert_scores[virtualslidePrefix + questionnum] = useranswer

            var completed_question = localStorage.getItem('current_question')

            //save user ans
            update_cert_user_conf('cert_scores', cert_scores);
            update_cert_user_conf('last_completed_question_url', completed_question);

            load_certification_page('next');

            /*
            localStorage.setItem(virtualslidePrefix + questionnum, useranswer);
            //alert(virtualslidePrefix+questionnum);
            //alert(useranswer.toString());
            var pagetemplate = 'home.html';
            if (nextslide.indexOf("_pxl_") > -1) {

                pagetemplate = 'home_pxl_certification.html';
                nextslide = pagetemplate + '?loadPage=' + nextslide;
                window.location = nextslide;

            } else {

                //
                //nextslide = nextslide.replace('.html','');
                //alert('nextslide = ' + nextslide + ' pagetemplate = ' + pagetemplate);
                load_page(nextslide, pagetemplate);
            }
            //turn on "next" button in case it got turned off:
            //document.getElementById('nextPageButton').style.display = 'initial';


            */

        }
    }
}

function showthick() {
    document.getElementById('pathXLviewer').src = '../../../standalone.html?slide=images/' + virtualslideDirectory + '/' + virtualslidePrefix + questionnum + 'thick.svs';

}

function showthick2() {
    document.getElementById('pathXLviewer').src = '../../../standalone.html?slide=images/' + virtualslideDirectory + '/' + virtualslidePrefix + questionnum + 'thick2.svs';

}

function showthin() {
    document.getElementById('pathXLviewer').src = '../../standalone.html?slide=images/' + virtualslideDirectory + '/' + virtualslidePrefix + questionnum + 'thin.svs';
}

function showthin2() {
    document.getElementById('pathXLviewer').src = '../../standalone.html?slide=images/' + virtualslideDirectory + '/' + virtualslidePrefix + questionnum + 'thin2.svs';
}