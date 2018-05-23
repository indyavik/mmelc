//Globals for this file. 

var LICENSEDIR = '/data_l/'
var DATADIR = '/data/'


function get_all_users() {

    var all_users = [];

    var lic_users = get_from_disk(LICENSEDIR + 'Users.txt');
    var preview_users = get_from_disk(DATADIR + 'Users.txt');

    if ((!preview_users) || (!lic_users)) {
        alert("Error: some error occurred. Please restart. if problem persists, contact an admin")
        return;
    }

    var parsed_lic_users = JSON.parse(lic_users).Users
    var parsed_preview_users = JSON.parse(preview_users).Users
        //var all_users = parsed_lic_users.concat(parsed_preview_users)

    return { 'license_users': parsed_lic_users, 'preview_users': parsed_preview_users }


} //get_all_users. 

function get_users() {

    var users = get_local_object("Users");

    var data_dir = get_local_object("data_dir");

    console.log('data-dir', data_dir)
    console.log('users_are')
    console.log(users)

    if (!(data_dir)) data_dir = '/data/'; //default to preview mode. 


    if (!users || users == undefined || users == null) {

        var check = get_from_disk(data_dir + 'Users.txt');

        alert("check:" + check);

        if (check == false || !check) {

            var users = ['guest_user'];
            //alert("json user:" + users);
            set_local_object("Users", users);
            return users;

        }

        var parsed_users = JSON.parse(check); //parse string 
        var user_array = parsed_users.Users;
        console.log(typeof(user_array))

        //alert("json user:" + user_array);

        set_local_object("Users", user_array);

        return user_array;
    }

    if (typeof(users == 'string')) return JSON.parse(users);

    return users;


}


function loadInitialUsers() {
    //refactored version of loadInitialUsers 

    var userarr = get_users(); //either guest_user or larger user array would be returned 

    console.log('usearr')
    console.log(userarr)
    console.log(typeof(userarr))

    var last_user = get_local_object("Current_User");

    if (!(get_local_object('data_dir'))) {

        var data_dir = '/data/';
        set_local_object("data_dir", data_dir);

    }


    if (!last_user) last_user = 'guest_user'; // we don't store this in file. 
    //set_local_object("Current_User", last_user);
    localStorage.setItem("Current_User", last_user)

    userarr.reverse();
    console.log(userarr)

    var rows = calculate_r_t(userarr.length)[0];
    var columns = calculate_r_t(userarr.length)[1];

    document.getElementById('tablearea')
        .appendChild(populateUserTable(userarr, null, rows, columns, function(t, r, c) {
            //alert(userarr);
            var p = userarr.pop();
            //if (p) return ' row: ' + r + ', cell: ' + c + ', text: '  + p;
            if (p) return p;

        }));


} //loadInitUsers

function createUser_go(dothis) {

    if (!dothis) {

        var user_input = document.getElementById('input_createUser');
        var user_to_create = user_input.value;

        if (user_to_create.length < 3) {
            alert("Selected Username is too short. Please try again")
            return;
        }

        document.getElementById('reg_survey').style.display = "block"
        return;

    }

    if (dothis == 'skip') {

        document.getElementById('reg_survey').style.display = "none"
        createUser();


    }


} //createUser_go



function createUser() {

    var user_input = document.getElementById('input_createUser');

    var create_user = user_input.value;
    create_user = $.trim(create_user).replace(/ /g, '_'); //trim and add 'underscore'

    var data_dir = localStorage.getItem('data_dir')
    alert('data_dir:createUser():126 ' + data_dir)

    var res = confirm('Are you sure to create user = ' + create_user)

    if (res !== true) {
        alert("cancelling.....")
        document.getElementById('reg_survey').style.display = "none"
        return;
    }


    var users_file = get_from_disk(data_dir + 'Users.txt') // string

    if (users_file) {
        var users = JSON.parse(users_file)

    } else {
        alert("Error: Could not find the file to create users. please contact admin")
    }

    if ($.isArray(users)) {
        var new_users = users

    } else { var new_users = users['Users'] }

    //alert(new_users);

    var user_exists = $.inArray(create_user, new_users); //(value, in_thisarray)

    if (user_exists === -1 && create_user !== "") {

        new_users.push(create_user);

        set_local_object("Users", new_users);

        //alert('updating new user on disk')

        update_on_disk("Users.txt", { "Users": new_users });

        //get skeleton object from the file and load. 

        var data_dir = get_local_object("data_dir");
        if (!(data_dir)) data_dir = '/data/';

        var base = get_from_disk(data_dir + 'base_user_config.txt'); //returns 



        /*
								
        if (!base) var user_data = {'x': 'y'}; 
								
        alert('am here:' + JSON.parse(base));

        var user_data = JSON.parse(base); 

        alert(user_data);
								
        */
        var new_user = JSON.parse(base);


        localStorage.setItem(String(create_user), JSON.stringify(new_user));

        /* write to user file - > nginx/html/data dir  */

        //alert('creating file on disk') ;

        update_on_disk(create_user + '.txt', new_user); //js oject. not string.

        //alert('file created') ;

        logUser(create_user);

        //setTimeout(function(){window.location.href="home.html?user="+create_user} , 500); 

    } else alert("User already exists : please try a new name");

};

function regSurvey() {
    //submit survey and create user.
    //get the server details. 
    try {
        /*
        var reg_name = document.getElementById('reg_name').value;
        var reg_designation = document.getElementById('reg_designation').value;
        var reg_country_work = document.getElementById('reg_country_work').value;
        var reg_email = document.getElementById('reg_email').value;
        var reg_phone = document.getElementById('reg_phone').value;

        //Survey object
        var survey_object = {
            'reg_name': reg_name,
            'reg_designation': reg_designation,
            'reg_country_work': reg_country_work,
            'reg_email': reg_email,
            'reg_phone': reg_phone

        }
        */

        //var user_input = document.getElementById('input_createUser').value;

        //var create_user_name = $.trim(user_input).replace(/ /g, '_'); //trim and add 'underscore'


        var survey_object = {}

        var arr1 = ['reg_name', 'reg_designation', 'reg_country_work', 'reg_email', 'reg_phone']

        var required_fields = ['reg_name', 'reg_email']
        var required_echo = ['Name', 'Email']

        var arr = ['gender', 'refresher', 'certificationlevel', 'accessinternet', 'education', 'workplace']

        for (var i = 0; i < arr1.length; i++) {

            survey_object[arr1[i]] = document.getElementById(arr1[i]).value

        }

        var rtext = ""

        for (var i = 0; i < required_fields.length; i++) {
            var val = survey_object[required_fields[i]]

            if (val == "") {
                rtext += ", "
                rtext += required_echo[i]
            }

        } //


        if (rtext !== "") {
            alert(rtext + " are required fields.")
            return;

        }


        for (var i = 0; i < arr.length; i++) {

            var e = document.getElementById(arr[i]);
            var v = e.options[e.selectedIndex].text;

            console.log(v)
            survey_object[arr[i]] = v

        }

        var user_ob = JSON.parse(localStorage.getItem('new_user_obj'))
        survey_object['license_id'] = user_ob.license_id
        survey_object['usb_id'] = user_ob.create_user

        /*
        //get license user. 
        var license_id = "preview_user"
        var mmelc = JSON.parse(localStorage.getItem('.mmelc'))

        if (mmelc) {
            license_id = mmelc.license['id']
        }

        survey_object['license_id'] = license_id;
        survey_object['usb_id'] = create_user_name;

        //submit survey to the web. 

        */

        console.log(survey_object)

        localStorage.setItem('new_user_survey', JSON.stringify(survey_object))

        submit_data_to_server(survey_object, '/usbuser/register', function(returnValue) {

            console.log(returnValue);
            //write data to file

        }); //submit_data_to server


        //create user

        if (user_ob.license_id != "preview") {

            createUser_new('license');

        } else {
            createUser_new('preview');
        }


    } //try
    catch (error) {
        console.log("Error:<login.js:regSurvey()112> Could not capture the options")

    }





} // reg_survey

function logUserOut() {

    var current_user = localStorage.getItem('logged_in');

    var current_user_data = JSON.parse(localStorage.getItem(JSON.parse(current_user)));

    //alert(('logUserOut:' + current_user_data));

    if (typeof(current_user_data) === 'object' && (current_user_data !== null)) {

        set_local_object('(logged_in', 'nobody');
        /* clear  */

        //localStorage.clear("logged_in", JSON.stringify(user_name));
        localStorage.clear(current_user);
        localStorage.clear('module_config');

        setTimeout(function() { window.location.href = "/content/index.html?logout=nobody" }, 100);

        update_on_disk(JSON.parse(current_user) + '.txt', current_user_data)

    } else {

        set_local_object('logged_in', 'nobody');
        setTimeout(function() { window.location.href = "index.html?logout=nobody" }, 0);
    }


}

function showInput_createUser() {
    document.getElementById("createUser").style.display = 'none';
    document.getElementById("tablearea").style.display = 'none';
    document.getElementById("div_createUser").style.display = 'block';
    //document.getElementById("input_createUser").setAttribute('class', 'showInput');

}

function calculate_r_t(num_users) { //per row 4 accounts 
    var n = num_users;
    var row_column = (n < 4) ? [1, n] : [Math.ceil(n / 4), 4]
    return row_column;

}

function logUser(user_name) {
    //alert('log_user' + user_name);
    //store user name as current user 

    // localStorage.setItem("Current_User", JSON.stringify(user_name));
    localStorage.setItem("logged_in", JSON.stringify(user_name));


    if (!get_local_object(user_name)) {

        var file_name = user_name + ".txt";
        //alert('file:' + file_name);

        var user_obj = GetObject(user_name, file_name); //get from file if missing. 

        //alert('user_obj' + user_obj) 
        localStorage.setItem(user_name, JSON.stringify(user_obj));


    }

    setTimeout(function() { window.location.href = "home.html?user=" + user_name }, 500);



    //check progress should be the last to run.
}



/* On each inner page, on windows logged in. 

		function path_session() {

			var logged_in_user = JSON.parse(localStorage.getItem('logged_in')) ; 
			if(!logged_in_user) return false 
			return logged_in user 
			} 

		function load_progress() {
			
			var user_object = JSON.parse(localStorage.getItem('logged_in')) ; 
		}

}


*/


function loadHistory() {

    //console.log("load event detected!");

    //alert("onload detected") ;
    var local = JSON.parse(localStorage.getItem("trackCompletion"));
    var last = local['trackCompletion'].length;
    var lastModule = local['trackCompletion'][last - 1];


    var str = [">>Module Order:"]
    for (var i = last - 1; i >= 0; i--) {
        //str.push(str[i); 
        str.push(local['trackCompletion'][i]);
    }

    var displayMessage = str.join('>>');
    //alert(displayMessage) ; 

    document.getElementById("3").innerHTML = displayMessage;
    document.getElementById("2").innerHTML = "Current Module: " + local['trackCompletion'][last - 1];
} //function onload 

//window.onload = loadHistory ; 


function populateUserTable(user_array, table, rows, cells, content) {

    var is_func = (typeof content === 'function');
    if (!table) table = document.createElement('table');
    table.setAttribute("class", "login_table");
    for (var i = 0; i < rows; ++i) {
        var row = document.createElement('tr');
        row.setAttribute("class", "test_class");
        for (var j = 0; j < cells; ++j) {
            var new_td = row.appendChild(document.createElement('td'));

            if (j % 2 != 0) new_td.style.backgroundColor = "tomato";
            //new_td.setAttributeNode(att); 

            var text = !is_func ? (content + '') : content(table, i, j);

            if (text) {
                row.cells[j].appendChild(document.createTextNode(text));
                row.cells[j].setAttribute("id", text);
                var id = String(text);

                (function(id) {
                    row.cells[j].addEventListener('click', function() { logUser(id); });
                })(id);
            }
            //else //row.cells[j].style.backgroundColor = "grey";
            else row.cells[j].style.visibility = "hidden";

        } //for loop

        table.appendChild(row);
    }
    return table;
} //function populate table 

function createUser_new(user_type) {
    //user_type is 'license' or 'preview'

    var data_dir = LICENSEDIR

    if (user_type != 'license') {
        user_type = 'preview'
        data_dir = DATADIR
    }


    /* get new user object and survey data from local storage */

    var new_user_obj = JSON.parse(localStorage.getItem('new_user_obj'));
    var new_user_obj_survey = JSON.parse(localStorage.getItem('new_user_survey'));

    var create_user = new_user_obj['username']


    /* update the User.txt object  */

    var users_file = get_from_disk(data_dir + 'Users.txt') // string

    if (users_file) {
        var users = JSON.parse(users_file)

    } else {
        alert("Error: Could not find the file to create users. please contact admin")
    }

    if ($.isArray(users)) {
        var new_users = users

    } else { var new_users = users['Users'] }

    //alert(new_users);

    var user_exists = $.inArray(create_user, new_users); //(value, in_thisarray)

    if (user_exists === -1 && create_user !== "") {

        new_users.push(create_user);

        //get skeleton object from the file and load. 

        var base = get_from_disk(data_dir + 'base_user_config.txt'); //returns 

        var new_user = JSON.parse(base);

        //add new user_objects. 

        new_user['username'] = new_user_obj['username']
        new_user['password'] = new_user_obj['password']
        new_user['recovery_email'] = new_user_obj['recovery_email']
        new_user['license_id'] = new_user_obj['license_id']


        /*


            var new_user_obj = {
                "username": newuser_name,
                "password": newuser_pass,
                "recovery_email": newuser_recovery_email,
                "license_id": newuser_license_id
            }

        */


        /*set new objects in localStorage. */

        localStorage.setItem("Users", JSON.stringify(new_users))
        localStorage.setItem(String(create_user), JSON.stringify(new_user))


        /* write all of the new user objects to the disk. */

        update_on_disk("Users.txt", { "Users": new_users });
        update_on_disk(create_user + '.txt', new_user); //js oject. not string.
        update_on_disk(create_user + '_survey.txt', new_user_obj_survey); //js oject. not string.


        /* clear the local objects that are no longer required */
        localStorage.removeItem('new_user_obj')
        localStorage.removeItem('new_user_survey')


        return;

        //if everything is good. log user in. 


        logUser(create_user);

        //setTimeout(function(){window.location.href="home.html?user="+create_user} , 500); 

    } else {

        alert("User already exists : please try a new name");

    }

}; //createUser_new


function logUser_new(user_name, user_password, user_type) {

    /*@@ user login @@ */

    /* login the user  */
    var data_dir = LICENSEDIR


    if (user_type !== 'license') {
        data_dir = DATADIR
        user_type = "preview"

    }

    if (!user_name || !user_password) {
        alert('Error: Username and Password is required')
        return;
    }

    /* clear existing storage objects */
    localStorage.clear("logged_in")
    localStorage.clear("current_user")
    localStorage.clear("user_type")

    var users_file = get_from_disk(data_dir + 'Users.txt') // string
    var allusers = JSON.parse(users_file).Users

    if (allusers.indexOf(user_name) == -1) {
        alert("Sorry, Username : " + user_name + " is not a valid user")
        return;
    }

    var user_obj = JSON.parse(get_from_disk(data_dir + user_name + '.txt'))

    if (!user_obj || user_obj == undefined) {
        alert("Sorry, Username : " + user_name + " is not a valid user")
        return;

    } else {

        /* verify password and log uer in. */

        var pw = user_obj.password
        console.log(user_obj)
        if (pw != user_password) {
            alert("Sorry, Wrong Passwrod. Please try again")
            return;

        } else {
            /* finally log user in */
            localStorage.setItem("logged_in", JSON.stringify(user_name));
            localStorage.setItem("user_type", user_type); // "license" or "preview"
            localStorage.setItem(user_name, JSON.stringify(user_obj));

            // note that the appropriate module conf get lodaded here. //
            var mod_config = JSON.parse(get_from_disk(data_dir + 'module_conf.json'))
            localStorage.setItem('module_config', JSON.stringify(mod_config));

            setTimeout(function() { window.location.href = "home.html?user=" + user_name + "&type=" + user_type }, 500);

        }



    };

} //loguser new



function getCacheSize(arg1) {

    var size_mb = arg1.split(':')[1];
    size_mb = Math.round(Number(size_mb) / (1024 * 1024));
    //document.getElementById("user_data").textContent = "Cache:" + size_mb + " mb";
    //alert(arg1);
    set_local_object('cache_size', size_mb);
    //document.getElementById("cache").innerHTML = "Cache: " + size_mb ; 

}

external.TestJSCallback(getCacheSize);