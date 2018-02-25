//globals 

/*
inherits following functions from main.js
get_from_disk(filename);
update_on_disk(filename, jsonobject) //save user data on disk for re-login. 


*/

var COURSEHOMEPAGE = '../index.html'
var DATADIR = 'data/'
var CONFDIR = 'conf/'
var CERTCONF = 'conf/certification.conf'
var CERTKEYNAME = 'certification_conf'
var LOADMODULEKEY = 'loaded_module'
var SHUFFLEDKEY = 'shuffled_sequence'
var BASEUSERCONF = 'conf/base_certify_user_config.txt'
var USERCONFKEY = 'cert_user_conf' // points to current user config 
var CURRENTUSERKEY = 'current_cert_user' //points to the user_name of current_user. 
var POSTURLENDPOINT = 'http://mmelc.vestigesystems.com/deviceData'


function update_cert_user_conf(datakey, datavalue, ondisk) {
    //usually to update userconf with whatever. usually to complete the tests. 
    //datakey = string, datavalue -> object. ()
    //ifondisk -->write to the disk as well. 

    var cert_conf = JSON.parse(localStorage.getItem(USERCONFKEY));
    cert_conf[datakey] = datavalue

    localStorage.setItem(USERCONFKEY, JSON.stringify(cert_conf))
    console.log('updated cert conf for : ' + datakey)

} //update_cert_conf. 

function cert_update_on_disk(file_name, json_obj) {

    var file_name = file_name;

    //var data = checkFile(file_name); 
    external.saveFile(file_name, json_obj);

} //cert_update_on_disk

function cert_get_from_disk(file_name) {

    filename = file_name.trim();
    //alert(filename);

    var response = jQuery.ajax({
        url: filename,
        type: 'GET',
        async: false
    });

    //alert(filename + ' :status: ' + response.status);

    return (response.status != "200") ? false : response.responseText;

} //cert_get_from_disk.



function log_out_cert_user() {

    /*
    //logs out the current logged in cert user.
    //save the existing user object to disk.
    //delete the local storage 

    */

    var current_cert_user = localStorage.getItem(CURRENTUSERKEY);
    var userconf_json = JSON.parse(localStorage.getItem(current_cert_user));
    var filename = current_cert_user + '_certify_conf.txt';
    cert_update_on_disk(filename, userconf_json);
    localStorage.clear(); //check this works ?
}

function login_cert_user(username) {
    /*
    //use it at the call back. loads the conf for the user. 
    //sets up the other variables. 

    //check if eaerlier data existed. 

    */

    var user_file_name = username + '_certify_conf.txt';
    var user_file_path = DATADIR + user_file_name;
    var user_conf = cert_get_from_disk(user_file_path);
    var base = cert_get_from_disk(BASEUSERCONF); //returns base config. 

    if (!user_conf) {
        //its a new user. 
        var new_user_conf = JSON.parse(base);
        new_user_conf['cert_user_name'] = username;
        localStorage.setItem(USERCONFKEY, JSON.stringify(new_user_conf));
        localStorage.setItem(CURRENTUSERKEY, username);
        load_conf_and_suffle();

    } else {
        alert('New Certification Test or Load the old one')
        var answer = confirm("Restart again with a new test?")

        if (answer) {
            //restart the test 
            var new_user_conf = JSON.parse(base);
            localStorage.setItem(USERCONFKEY, JSON.stringify(new_user_conf));
            localStorage.setItem(CURRENTUSERKEY, username);
            load_conf_and_suffle();


        } else {
            localStorage.setItem(USERCONFKEY, JSON.stringify(user_conf)); //loaded the existing user. 
            //load the previously saved shuffled sequence. 
            var shuffled_sequence = user_conf['last_shuffled_sequence']
            localStorage.setItem(SHUFFLEDKEY, JSON.stringify(shuffled_sequence))
            ocalStorage.setItem(CURRENTUSERKEY, username);

            //update the current question. 
            var last_q = user_conf['last_completed_question_url']
            var current_question = localStorage.setItem('current_question', last_q)

            //send to next page.

            load_certification_page('next');

        }


    }

    //update_on_disk(create_user +'.txt', new_user); //js oject. not string.

} //login cert user. 

function init_cert_page() {
    /*
    //Runs on every page load. 
    //MAKE SURE ONLY THE LOGGED IN USERS ARE ALLOWED.
    //run on everytime page loads. 
    //check CURRENTUSERKEY exists. if not give error. cert_user_login must set the CURRENTUSERKEY in local storage. 
    //check SHUFFLEDKEY exits. else throw error. 
    //check USERCONFKEY is set. else throw error. 

    //load the page by parsing the URL variable. 

    //update the current_page variable in the USERCONF 

    */

    var error = "";
    var shuffled_sequence = JSON.parse(localStorage.getItem(SHUFFLEDKEY));
    var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));
    var current_cert_user = localStorage.getItem(CURRENTUSERKEY);

    if (!user_conf) error += "user conf is not loaded ";
    if (!shuffled_sequence) error += "no page sequence found to be loaded ";
    if (!current_cert_user) error += "could not determine current user. ";

    //alert(error);

    //alert(window.location.href.indexOf('?loadPage='));

    if (window.location.href.indexOf('?loadPage=') > 0) {

        var loc = window.location.href.split("?")[1].split("=")[1]

        alert(loc)
        var certpage = get_page_from_jquery(loc)
            //alert(certpage)

        if (certpage) {

            if (loc.indexOf('_pxl') == -1) {

                alert('i am here')

                //normal page is being loaded. 

                $("#content-inner").html(certpage);

            } else {

                //load pxl slide

                $("#content-right").html(certpage);

                document.getElementById('nextPageButton').style.display = 'none';
                document.getElementById('previousPageButton').style.display = 'none';

                $("#pxl_left").appendTo("#content-left");

                //hide the nav button. 







            }



        } else {
            alert('page' + loc + 'not found')
        }


    }


} //init cert page




function shuffle(array) {
    /* do not shuffle 1st page, or last 2 pages */
    var firstelement = array[0]
    var last = array[array.length - 1]
    var secondlast = array[array.length - 2]

    var array = array.slice(1, array.length - 2);

    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    array.push(secondlast)
    array.push(last)
    array.unshift(firstelement)

    return array;
}

function get_page_from_jquery(page_to_get) {

    jQuery.ajaxSetup({ async: false });

    var certpage = $.get(page_to_get);

    if (certpage.status != 404) {

        //$("#content-inner").html(certpage.responseText);

        return certpage.responseText

    } else {
        alert('page_not_found')
        return false
    }

} //function get page from jquery.



function load_conf_and_suffle() {
    /*
    first script to run on every page. 
    -loads the certfication conf if not found 
    -shuffles the page_sequence array 

    */

    var cert_config = JSON.parse(localStorage.getItem(CERTKEYNAME));
    var user_conf = JSON.parse(localStorage.getItem(USERCONFKEY));

    //load from file. 

    if (!cert_config) {

        jQuery.ajaxSetup({
            async: false
        }); //required to avoind async status code check issues 

        var jq = $.get(CERTCONF); //alert(jq.status);

        if (jq.status == 200) {

            var config_data = jq.responseText;

            localStorage.setItem(CERTKEYNAME, config_data);

            alert('found the certification file. ');

            //pick up a random module and randomize the sequence from the module and load. 

            var config = JSON.parse(localStorage.getItem(CERTKEYNAME));

            console.log(config)

            var modules = Object.keys(config.mods) //
            alert('modules')
            alert(modules)

            //pick a random module.

            var load_module = modules[Math.floor(Math.random() * modules.length)]; //'Module-8'
            localStorage.setItem(LOADMODULEKEY, load_module)

            //shuffle. 

            var page_sequence = config.mods[load_module].conf[0].page_sequence

            var shuffled_sequence = shuffle(page_sequence)

            localStorage.setItem(SHUFFLEDKEY, JSON.stringify(shuffled_sequence))

            var current_question = load_module + '.html' //Module-8.html

            localStorage.setItem('current_question', current_question)

            //add the shuffled sequence to the current_user object. 

            update_cert_user_conf('last_shuffled_sequence', shuffled_sequence);

            //set current page. 

            load_certification_page();



        } else {
            alert("configuration file not found. please contact the administrator");
            return;

        }

    }

} //load_conf_and_shuffle. 

function load_certification_page(signal) {
    /*
	goes through the page_sequence_suffled array and finds the next or previous page to load. 
    passes the page to appropriate URL to load.  
	*/
    //current_page --> 8_0_slide14_pxl_posttestq1.html

    var current_module = localStorage.getItem(LOADMODULEKEY)
    var shuffled_sequence = JSON.parse(localStorage.getItem(SHUFFLEDKEY))
    var current_question = localStorage.getItem('current_question')
    var current_index = shuffled_sequence.indexOf(current_question)
    var next_question;



    if (current_index < 0) {
        next_question = shuffled_sequence[0]

    } else if (current_index == (shuffled_sequence.length - 1)) {
        next_question = current_question
    } else {
        next_question = shuffled_sequence[current_index + 1]
    }



    if (!signal) {
        //load the main page of the module. 

        current_question = current_module + ".html"
        alert('current_q' + current_question)

        var page_data = get_page_from_jquery(current_module + '/' + current_question)

        if (page_data) $("#content-inner").html(page_data)

    }

    if (signal == 'next') {

        var page = current_module + '/0/' + next_question
        localStorage.setItem('current_question', next_question) // change to the next. 

        //var page_data = get_page_from_jquery(current_module + '/0/' + next_question)

        //if (page_data) $("#content-inner").html(page_data)

        if (page.indexOf("_pxl") == -1) {

            window.location.href = window.location.origin + "/content/certification/home_certification.html?loadPage=" + page;

        } else {

            window.location.href = window.location.origin + "/content/certification/home_pxl_certification.html?loadPage=" + page;

        }

    }


    //get the page and load. 


} //load certification page.


function grey_back_button() {

    document.getElementById('back-button').onclick = function() { console.log('no action'); };
    document.getElementById('back-button').src = "images/back-grey.png";

}

function grey_forward_button() {

    document.getElementById('forward-button').onclick = function() { console.log('no action'); };
    document.getElementById('forward-button').src = "images/forward-grey.png";

}