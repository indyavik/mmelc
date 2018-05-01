var check_store = localStorage.getItem("lastname");
//var check_cache = localStorage.getItem("cache7");



if (check_store) {

    //alert( "main.js:lastname:" + check_store );

} else {

    localStorage.setItem("lastname", "Smith");
    //alert("main.js:localStorageAdded") ; 

}


//Using jquery to dynamically insert header (and perhaps footer) 

function get_local_object(key) {
    var obj = localStorage.getItem(key)
    if (typeof(obj) == 'string') return obj;

    console.log(obj)

    //var obj = localStorage.getItem('logged_in'); //get the current logged in user. 
    if (obj == "" || obj === null) return false;
    return JSON.parse(localStorage.getItem(key));
}



function set_local_object(k, v) {
    var json_object = JSON.stringify(v);
    localStorage.setItem(String(k), json_object);
}

function checkFile(file_name) {
    filename = file_name.trim();

    //alert(filename);

    var response = jQuery.ajax({
        url: filename,
        type: 'GET',
        async: false
    });

    //alert(filename + ' :status: ' + response.status);

    return (response.status != "200") ? false : response.responseText;
};

function get_from_disk(file_name) {

    //filename shold be complete ..with datadir path. user_name.txt, module_config.txt, Users.txt, 
    //returns json object or false. 

    if (file_name === 'Users') var file_name = 'Users.txt';
    if (file_name === 'Modules') var file_name = 'module_config.txt';

    var file_name = file_name;

    var data = checkFile(file_name);
    if (data) return data; // plain string 
    return false;

} //get_from_disk 

function GetObject(obj_identifier, file_on_disk) {
    /* 
        look for an object in the localStorage. if not found look for in file. return object or false. 
        GetObject('main_config', 'main_config.txt') //full name of the file including any extension. default directory to look for is /content/data

    */
    var obj = get_local_object(obj_identifier);

    //alert('functiongetobject' + obj)



    if (obj) {
        return obj;
    }

    var data_path = get_local_object('data_dir') || '/data/'

    var file_name = data_path + file_on_disk;

    var file_string_at_disk = checkFile(file_name);

    if (file_string_at_disk || file_string_at_disk !== '') {
        //file exists. json parse and return 
        return JSON.parse(file_string_at_disk);
    }

    return false;

}

function send_error_reports(userid, email, description) {
    external.send_error_reports(userid, email, description, send_error_reports_callback);
}

function send_error_reports_callback(arg) {
    var response = arg;
    alert(response);
}

function get_updates() {
    external.get_updates(get_updates_callback);
}

function get_updates_callback(arg) {
    var response = arg;
    alert(response);
}

function copy_updates_to_usb() {
    external.copy_updates_to_usb(copy_updates_to_usb_callback);
}

function copy_updates_to_usb_callback(arg) {
    var response = arg;
    alert(response);
}

function update_on_disk(file_name, json_obj) {

    var data_dir = localStorage.getItem('data_dir')
    var file_name = data_dir + file_name;

    if (file_name === 'Users') var file_name = data_dir + 'Users.txt';
    if (file_name === 'Modules') var file_name = data_dir + 'module_config.txt';

    //var data = checkFile(file_name); 
    external.saveFile(file_name, json_obj);


}

function SaveObject(key, js_object, file_name, target_dir) {
    /* given a pure js object, takes a key and saves in local storage

        simultaneously, saves the object in file system. 

        SaveObject('guest_user', someObject, 'guest_user.txt' , '/content/data')

    */





}

/*

function findUsers(file_name){

 var file_name = file_name || "/data/userx2.txt" ; 
 var get_users = JSON.parse(localStorage.getItem("Users")); // json object Users pointing to user array
 
 if (get_users == null || get_users.Users == undefined) { 
    //check the file. 
    var data = checkFile(file_name) ; 
    //alert(file_name);
    if (data) { 
    
        var d = JSON.parse(data) ; 
        if (d.Users == undefined) { 
        return {"Users": false , "Source" : 'none'} ; 
        }
        else {
        
        return {"Users" : d.Users , "Source" : 'file' } ; 
        }

    }
    else {
    return {"Users": false , "Source" : 'none'} ;
    }

 }//get_users == null 
 
 return {"Users": get_users.Users , "Source" : 'storage' } ; 
 
 } // function findUsers 
*/

function logMeOut() {
    set_local_object('logged_in', 'nobody');
    setTimeout(function() { window.location.href = "/content/index.html?logout=nobody" }, 0);

}



/*
function runEverytime(){
var x = findUsers(); 
alert( "Users in file" + x.Users + " Source :" + x.Source );
}

*/


window.onload = function() {
    //get python stuff here. 

    //runEverytime();

    //python 2 way binding has to be the last call. probably something is broken in handling callback. whatever comes from python -- comes in 1 call per page. try using promises
    //external.TestJSCallback(JSCallback2);
    //document.getElementById("myCheck").click(); //this also works. however ..2 way binding is less reliable. 



};

//this hack is for window.onload uncertain behavior. put everything that needs to happen on every page here. 
if (typeof i_ran == 'undefined') {
    // the variable is not defined do this

    //alert("main-head.js:" + 'i am in this page');

    var user = get_local_object('logged_in');
    //document.getElementById("user_welcome_1").innerHTML = "Welcome: " + user ; 

}


function check_progress(user_name) {

    //read user's milestones 

    var file_name = user_name + ".txt";

    var user_obj = GetObject(user_name, file_name); //check in file if user_name array is not there. 




    var milestones_config = GetObject('milestones_config', 'milestones_config.txt')
    var main_config = GetObject('main_config', 'main_config.txt')
    var tests_config = GetObject('tests_config', 'tests_config.txt')

    if (!user_obj) alert("Error: check_progress(main.js): user data is not set for user = " + user_name);
    if (!milestones_config) alert("Error: check_progress (main.js) : milestones not found. ");
    if (!main_config) alert("Error: check_progress (main.js) : main config not found. ");
    if (!tests_config) alert("Error: check_progress (main.js): tests config not found. ");


    var user_milestones = user_obj.milestones_completed;
    var milestones = milestones_config.milestones; //just the way the file is set up.
    var main = main_config.main_config; //just the way the file is set up.
    var tests = tests_config.tests_config;

    //alert(milestones_config);

    for (var m in milestones) {
        //m = keys (module '1', module '2' etc.)
        var module = milestones[m]; //returns an array
        for (var i in module) {
            //i =0,1,2, etc...arrays 

            page = module[i];
            page_id = main[page]['page_id'];
            next_page = main[page]['next_page']

            var x = $.inArray(page, user_milestones[m]);

            if (x !== -1) {

                //alert(page_id);
                var elem = document.getElementById(page_id);
                //alert(elem);
                //elem.style.backgroundColor = "green";
                elem.style.background = "url('/images/checkmark.gif') no-repeat";

                elem.style.paddingLeft = "20px";


            }




        }

    }


} //function check progress. 

function MarkComplete(module_id, section_url, next_page) {
    //on click get the unit number and add to the completed array.
    //usage -->MarkComplete('1', '/content/module1/m1u1.html', '/content/module1/m1u2.html')
    //section_url : URL of the section/topic/module that needs to be marked complete 
    //nextPage: optional redirect to this 

    // alert('start');

    var module_id = String(module_id);
    var section_url = String(section_url);
    if (!section_url) alert('url is required');
    if (next_page) var next_page = next_page || '';



    var user_name = get_local_object('logged_in');
    var file_name = user_name + ".txt";

    try {

        var user_obj = GetObject(user_name, file_name);
        var main_config_object = GetObject('main_config', 'main_config.txt');
        var milestones_object = GetObject('milestones_config', 'milestones_config.txt');

    } catch (err) {
        //alert(err + ': markComplete') ;  // change later to write to some error file. 
    }
    //check in file if user_name array is not there. 


    if (main_config_object && milestones_object) {

        var user_milestones = user_obj.milestones_completed;
        var page_id = main_config_object.main_config[section_url].page_id;

        //update user_obj 

        user_milestones[module_id].push(section_url);

        //save user_object

        set_local_object(user_name, user_obj);

        alert('done :markComplete()');


        //save on disk 
        //update_on_disk(file_name, user_obj );

        //if there's next page redirect. 

        if (next_page) window.location.href = next_page;

    }





} //markComplete





function zipCallBack(arg) {
    //callback function for createZip()
    //alert(arg) ; 

    alert(arg);

    var res = arg;

    if (res === 'error') {
        //display the file container
        document.getElementById("downloadShare").style.display = 'block';
        document.getElementById("zipform").style.display = 'none';
        document.getElementById("loadingImage").style.display = 'none';


    } else {
        //display the thank you div
        document.getElementById("thankYou").style.display = "block";
        document.getElementById("zipform").style.display = 'none';
        document.getElementById("loadingImage").style.display = 'none';

    }
}

function shareData() {

    //function to create a zip file containing application data and send 
    var org = document.getElementById('organization').value;
    var location = document.getElementById('location').value;

    //alert(org);

    external.createZip(zipCallBack, org, location);
}



//delay function to show loader image on shareData call.  this function to be included directly in the page = sendData.html as well.

$('#submitFormSendZip').click(function() {
    $('#loadingImage').show();
    $('#zipform').hide();

    setTimeout(function() {

        shareData();

        // $('#loadingImage').hide();

    }, 100);
});