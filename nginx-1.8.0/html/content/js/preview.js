function ifpreview() {
    // a set of helper functions to run on any page for preview version. 
    //include on any page where these are required (home.html, home_pxl.html )

    /* if preview change background */

    var user_type = localStorage.getItem('user_type')


    if (user_type === 'preview') {
        //document.getElementById('preview').innerHTML = 'Course Preview:'
        document.getElementById('heading_text').style.backgroundColor = 'white'

        alert('Hola, i am running on preview pages')

        return;
    }
}