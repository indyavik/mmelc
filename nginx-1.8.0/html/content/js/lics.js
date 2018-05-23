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

function verifyLicense() {

    var license_key_to_verify = document.getElementById("license_key_to_verify").value

    /*
    verify key and write data. 
    */

    if (license_key_to_verify) {
        var submit_object = { "license_id": license_key_to_verify }
    }

    submit_data_to_server(submit_object, '/license/check', function(returnValue) {

        returnValue = JSON.parse(returnValue)

        if (returnValue.response == 'error') {

            alert('Sorry, license could not be verified. please try again')


        } else {

            //write data to file
            alert('updating .mmelc')
            var mmelc = JSON.parse(get_from_disk('/data_l/' + '.mmelc'))
            var update_obj = {}
            update_obj['id'] = license_key_to_verify
            update_obj['seats'] = returnValue.response['seats']
            update_obj['used'] = returnValue.response['used']

            mmelc['license'].push(update_obj)

            external.saveFile('/data_l/.mmelc', mmelc)

            // external.verifyLicense(license, verify_license_callback)

        }





    }); //submit_data_to server




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
        //var mod_config = localStorage.getItem("module_conf.json")
    var mmelc = JSON.parse(get_from_disk('/data_l/' + '.mmelc'))

    var data_dir;

    if (button_id == 'licence') {
        /*
            check the license is valid. 
            then send. 

        */
        type = 'licence'

        data_dir = LICENSEDIR
        mod_config = get_from_disk(data_dir + 'module_conf.json');


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
        data_dir = DATADIR
        mod_config = get_from_disk(data_dir + 'module_conf.json');

        if (last_type != DATADIR) {
            localStorage.clear();
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