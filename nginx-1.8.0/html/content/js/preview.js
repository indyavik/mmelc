function ifpreview() {
    // a set of helper functions to run on any page for preview version. 
    //include on any page where these are required (home.html, home_pxl.html )

    /* if preview change background */

    var type = localStorage.getItem('type')


    if (type === 'preview') {
        //document.getElementById('preview').innerHTML = 'Course Preview:'
        document.getElementById('heading_text').style.backgroundColor = 'white'

        return;
    }
}