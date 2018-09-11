/*
*This file defines functions that are needed to -
* 1) save test answers
* 2) modify test answers 
* 3) submit the test answers to a remote server

*/

//global.

LICENSEDIR='/data_l/'

function saveCertAnswer(slideId, chkVal) {

    //questionId = 'C_1_slide02'
    //chkVal = function to get radio buttons. 
    //saveCertAnswer('C_1_slide02',$('[name=radioBtn]:checked').each(function () {return this.id;}))

    var e = slideId.split('_')

    var questionId = e[1] + e[2].split('slide')[1] // 102 => three digit 1: for unit 1, slide 02

    console.log(questionId)

    var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));

    var usrAns = chkVal[0].id;

    var usrAns = usrAns[1]; //Second part (answer id is r1, r2, r3, r4; just want number)

    var cert_scores = user_conf['cert_scores']

    //cert_scores[JSON.stringify(questionId)] = usrAns

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


} //saveCertAnswer(questionId, chkVal)



function compileMCQ(MCQidArray) {
    //Turn array of MCQ answers (1,2,3,4) into a short string OR 10 digit number (to be converted to code)
}

function get_mcq_ans_key(MCQanswers) {

    //var MCQanswers = "1234432123";

    var text = "";

    //replace each digit with itself minus 1 (so 0 to 3 instead of 1 to 4)

    for (var i = 0; i < MCQanswers.length; i++) {
        text += (parseInt(MCQanswers[i]) - 1).toString();
    }
    var MCQanswersBase10 = parseInt(text, 4);
    return MCQanswersBase10;

} //get MCQ answer key

function get_final_ans_key_updated() {

    /*

        "cert_scores": {
        "101": "2",
        "110": "2",
        "201": "3",
        "311": "2",
        "408": "3",
        "C_pxl_assessmentq1": 19731161
     }

    */

    var MCQanswers = ""; //string
    var MCQquestions = ""; //
	var PXLanswers = []; //array 

    //var ans_object = JSON.parse(localStorage.getItem(USERCONFKEY))
    var ans_object = JSON.parse(localStorage.getItem('cert_user_conf'))

    var usb_user = ans_object.usb_user
    var username = ans_object.cert_user_name
    var user_type = ans_object.usb_user_type

    var question_keys = Object.keys(ans_object.cert_scores) // ["101", "110", "201", "311", "408", "C_pxl_assessmentq1"]
	//alert(question_keys);
    for (var i in question_keys) {
        if (question_keys[i].length < 4) {
            //MCQquestions += question_keys[i]
			MCQquestions += parseInt(question_keys[i].substring(1,3)).toString(32) //Each question is now one character in this string, in base 32.  Ignore the first character, assuming same number of questions in each module.
			// e.g. 101 -> 1, 104 -> 4, 110 -> a, 204 -> 4, 211 -> b
            MCQanswers += ans_object.cert_scores[question_keys[i]]
        } else {
            PXLanswers.push(ans_object.cert_scores[question_keys[i]])

        }

    }

    /*

    MCQanswers => "22323", MCQquestions => "101110201311408" , PXLanswers => [19731161]

    */

    /* call the earlier function to create appropriate keys */

    //get_final_ans_key([10,34500,2700,25050,400,10000,125], 'abc' , '1234432123' )
    var final_ans_key = get_final_ans_key(PXLanswers, username, MCQanswers)

    var final_questions_key = MCQquestions

    console.log(final_ans_key)
    console.log(final_questions_key)

    return { 'final_ans_key': final_ans_key, 'final_questions_key': final_questions_key }

} //get_final_ans_key_updated. 

function get_final_ans_key(ans_array, username, mcqstring) {


    //ans_array = [1004616, 8004161, 199004104, 12004100, 12002100 ]
    //user_name = 'cert-user1'
    //get_final_ans_key([10,34500,2700,25050,400,10000,125], 'abc' , '1234432123' )

    var ans_key = get_mcq_ans_key(mcqstring)

    var updated_username = username

    if (username.length > ans_array.length) {
        updated_username = username.slice(0, ans_array.length)

    } else {

        var diff = ans_array.length - username.length;

        updated_username = username + username.slice(0, diff);

        if (diff > username.length) {

            var diff2 = diff - username.length

            updated_username = updated_username + username.slice(0, diff2);

        } else {

            updated_username = username + username.slice(0, diff);

        }

    }



    /*
    while (i > 0) {

        console.log(diff)
        ascii_string = username + username.slice(0, diff);
        console.log('new length of ascii ')
        console.log(ascii_string.lenth)

        if (ascii_string.length == ans_array.length) {
            i = 1;
        } else {
            diff = ans_array.length - ascii_string.length;
            console.log('new diff')
            console.log(diff)
        }

    }

    */

    console.log('ascii_ready_string is: ' + updated_username)

    //get ascii value for each. 

    var ascii_values_array = []
    for (var i = 0; i < updated_username.length; i++) {
        var s = updated_username.charAt(i);
        var ascii_code = s.toUpperCase().charCodeAt(0);
        if (ascii_code > 99) ascii_code = 99

        ascii_values_array.push(ascii_code.toString())

    }

    for (var j = 0; j < ascii_values_array.length; j++) {

        var new_string = ascii_values_array[j] + ans_array[j]
        ans_key += '-' + parseInt(new_string).toString(32)

    }

    //write user object to the disk.

    console.log(ans_key)
    return ans_key

} //get_pxl_ans_key(ans_array, username, mcqstring)


function create_final_cert_ans_key() {

    var mcq = ""
    var q = []

    var user_name = localStorage.getItem(CURRENTUSERKEY);
    var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));

    if (!user_conf) {
        alert('Could not capture results : please contact an admin');
        return;
    }

    var results = user_conf['cert_scores']
    var kv = []

    for (r in results) {

        kv.push([r, results[r]])

    }

    kv.sort(); // now we have sorted questions (from 1 ..n )

    for (var i = 0; i < kv.length; i++) {
        if (kv[i][0].indexOf('MCQ') > -1) {
            //mcq.push(kv[i][1])
            mcq += kv[i][1]

        } else {
            //q += kv[i][1]
            q.push(kv[i][1])
        }
    }

    console.log("multiple choice string: " + mcq);
    console.log("pxl ans array: " + q);
    console.log("username: " + user_name);

    var final_key = get_final_ans_key(q, user_name, mcq);

    console.log("final_key: " + final_key);

    //update the file on disk.
    var filename = user_name + '_certify_conf.txt';
    cert_update_on_disk(filename, user_conf);

    return final_key


} // create_cert_ans

function TEST_submit_cert_ans_to_server(payload, endpoint, method_type) {

    //TEST_submit_cert_ans_to_server(payload, 'submitcert', 'POST')

    if (!method_type) method_type = 'POST';
    urlendpoint = 'http://localhost:8081/'

    $.ajax({
        type: method_type,
        //url: POSTURLENDPOINT + 'submitcert',
        url: urlendpoint + endpoint,
        data: { 'payload': JSON.stringify(payload) },
        success: function(json) {
            // var result = json.user.login 
            //alert("live results from server:" + json.status + ':' + json.result);
            var res = JSON.parse(json)
            var to_show = 'Successfully submitted'
            if (res.response !== 'success') to_show = res.details
            alert(to_show)
            return;

        },
        error: function() {
            alert('Error: Could not submit results to server. Please record the keys displayed and submit via email.')
            return;
        }
    });


} //function to test things during development 

function submit_cert_ans_to_server(cert_results) {

    var to_submit = {}
    var ans_object = JSON.parse(localStorage.getItem('cert_user_conf'))
    to_submit['cert_scores'] = ans_object.cert_scores
    to_submit['cert_user_name'] = ans_object.cert_user_name
    to_submit['usb_user_name'] = ans_object.usb_user
    to_submit['usb_user_type'] = ans_object.usb_user_type
    to_submit['cert_test_answer_key'] = cert_results['final_ans_key']
    to_submit['cert_test_question_key'] = cert_results['final_questions_key']

    //localStorage.setItem('payload', JSON.stringify(to_submit))


    $.ajax({
        type: 'POST',

        //url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds',
        //url: 'http://mmelc.vestigesystems.com/submitcert', 

        url: POSTURLENDPOINT + 'submitcert',
        data: { 'payload': JSON.stringify(to_submit) },

        success: function(json) {
            // var result = json.user.login 
            //alert("live results from server:" + json.status + ':' + json.result);

            var res = JSON.parse(json)
            var to_show = 'Your results have been successfully submitted. You will now be logged out. '
            if (res.response !== 'success') to_show = res.details

            alert(to_show)

            //save user's record for future. 

            var user_obj = JSON.parse(get_from_disk(LICENSEDIR + ans_object.usb_user + '.txt'))

            /*add usb_id */

            var usb_id = JSON.parse(get_from_disk(LICENSEDIR + 'usb_id.json')).usb_id

            if (!usb_id || usb_id ==undefined){
                usb_id = 'NO-USB-ID'
            }

            if (user_obj) {
                user_obj['cert_results'] = cert_results
                user_obj['cert_user_name'] = to_submit['cert_user_name']
                user_obj['usb_id'] = usb_id

               // external.saveFile('/data_l/' + ans_object.usb_user + '.txt', user_obj)
               external.saveFile(LICENSEDIR + ans_object.usb_user + '.txt', user_obj)

                log_out_cert_user()



            }

        },

        error: function() {

            //window.location.href = "/content/posttest_protected/results.html"; 

            alert('Error: Could not submit results to server. Please record the keys displayed in this page and submit via email.')


        }

    });

} //  submit_cert to server


//function submit_cert_pxl_ans(q_number) {

function saveCertAnswerPxl(slide_id) {
    //This calculates the answer to submit.  It checks for no answer and too high of quantitation,
    //but does not check for other errors (e.g. if NMPS is checked, but so are species/stages or quantitation)
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

            if (useranswer.length < 1) {
                alert('please answer atleast 1 question')
            }

            //alert(useranswer)


            //document.getElementById("answerFeedback").innerHTML = useranswer;

            var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));
            var cert_scores = user_conf['cert_scores']
                //alert(questionnum);
                //cert_scores[JSON.stringify(slide_id)] = useranswer
            cert_scores[slide_id] = useranswer
            var completed_question = localStorage.getItem('current_question')

            //save user ans
            update_cert_user_conf('cert_scores', cert_scores);
            update_cert_user_conf('last_completed_question_url', completed_question);

            load_certification_page('next');


        }
    }
} //submit_cert_pxl_ans

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