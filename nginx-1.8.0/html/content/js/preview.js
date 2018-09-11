function ifpreview() {

    // a set of helper functions to run on any page for preview version. 
    //include on any page where these are required (home.html, home_pxl.html )

    /* if preview change background */

    var user_type = localStorage.getItem('user_type')
	var load = true;
	
    if (user_type === 'preview') {
        document.getElementById('heading_text').style.backgroundColor = 'white'
            //document.getElementById('preview').innerHTML = 'Course Preview:'

        var cur_loc = localStorage.getItem('current_location') //1_0_slide02.html
        var num = parseInt(cur_loc.split('.')[0].split('slide')[1])
		//var mod = parseInt(current_location);
		//var unit = parseInt(current_location.split('_')[1]);
		//alert('mod ' + mod + ' unit ' + unit + ' num ' + num);
		//alert(cur_loc);

		/* example don't load any of the tests */
		if (cur_loc[0] === '7' || cur_loc.substr(0,3) === '0_2' || cur_loc.substr(0,3) === '1_3' || cur_loc.substr(0,3) === '2_5' || cur_loc.substr(0,3) === '3_8' || cur_loc.substr(0,3) === '4_3' || cur_loc.substr(0,3) === '5_4')
		{ 
			// need to set local storage last_visited_page to previous page, otherwise it 
			
			update_user_object('last_visited_page',cur_loc.substr(0,3) + '_slide02.html'); //Should be beginning of each test.
			//var current_user = localStorage.getItem('logged_in');
			//var user_data = JSON.parse(localStorage.getItem(current_user));
			//	alert(user_data);
			//	var last_visited_page = user_data['last_visited_page'];
			//	alert('last visited page from localStorage: ' + last_visited_page)
			window.location = 'home.html';
			alert('Tests are only available to licensed users of the WELCOMM course! Please consider registering.');
			//var goto_page = 'Module-' + cur_loc[0] + '.html';
			//localStorage.setItem('current_location', goto_page);
			load = false;
			
			
			//load_module_home(goto_page);
		}
		
		/* example - run this on alternate pages */
        if (num % 4 == 0) {

            alert('We hope you are enjoying the course. Please sign up for the full licensed version of the course!')

        }

    }
    return load;
} //if preview