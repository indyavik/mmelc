function ifpreview() {

    // a set of helper functions to run on any page for preview version. 
    //include on any page where these are required (home.html, home_pxl.html )

    /* if preview change background */

    var user_type = localStorage.getItem('user_type')

    if (user_type === 'preview') {
        document.getElementById('heading_text').style.backgroundColor = 'white'
            //document.getElementById('preview').innerHTML = 'Course Preview:'

        var current_location = localStorage.getItem('current_location') //1_0_slide02.html
        var num = parseInt(current_location.split('.')[0].split('slide')[1])

        /* example - run this on alternate pages */

        if (num % 2 == 0) {

            alert('Hope you are enjoying the course. Please sign up for full licensed version')

        }



        return;
    }
} //if preview