//Globals for this file. 

var LICENSEDIR = '/data_l/'
var DATADIR = '/data/'


//functions (associated with index.html)

function verifyLicense_div() {
    //show the verify box. 
    document.getElementById('div_verify').style.display = "block"
    return;

}

//backend python to verify the license. 

function verifyLicense(license) {

    external.verifyLicense(license, verify_license_callback)

}

//call back for verify license. 

function verify_license_callback(response) {
    if (response == 'ok') {
        alert('confirmed. Click ok to proceed')

    }

    if (response == 'connection') {
        alert('Error: Not connected to server. Please try again')
    }

    if (response == 'error') {
        alert('Error: Could not verify license key. please enter again')
    }


} //verify_license_callback



function mainEntry(button_id) {
    /*
    set some default parameters, and redirect to index appropriately.

    */



    function mod_error() {

        alert("Some Error Occurred - please contact an administrator")
            //log console here. 



    } //mod_error 

    var last_type = localStorage.getItem("data_dir")
    var mod_config = localStorage.getItem("module_conf.json")
    var mmelc = JSON.parse(get_from_disk('/data_l/' + '.mmelc'))

    var data_dir;


    if (button_id == 'licence') {
        /*
            check the license is valid. 
            then send. 

        */
        type = 'licence'

        data_dir = LICENSEDIR


        if (last_type != data_dir) {

            localStorage.clear();
            mod_config = get_from_disk(data_dir + 'module_conf.json');
            localStorage.setItem('.mmelc', JSON.stringify(mmelc))

            redirect_location = 'license'

            if (!mod_config) {
                mod_error();
                return;

            }

        }

        //window.location.href = "/content/index.html?type=license"

    } else {

        type = 'preview'

        if (last_type != DATADIR) {
            data_dir = DATADIR
            localStorage.clear();
            mod_config = get_from_disk(data_dir + 'module_conf.json');
            redirect_location = 'preview'
            if (!mod_config) {
                mod_error();
                return;

            }

        }



    }

    localStorage.setItem("data_dir", data_dir);
    localStorage.setItem('module_config', mod_config);
    localStorage.setItem('type', type)
    window.location.href = "/content/index_main.html?type=" + type

} //mainEntry