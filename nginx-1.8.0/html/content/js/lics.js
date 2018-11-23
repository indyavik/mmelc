//Globals for this file. 

var LICENSEDIR = '/data_l/'
var DATADIR = '/data/'

function get_available_licences() {

    /* returns the id of liceses available (verified and seats > available) 
    :retruns: Array []
    
    */

    var mmelc = JSON.parse(get_from_disk(LICENSEDIR + '.mmelc'))

    var available_lic = []

    if (mmelc) {

        var lic = mmelc.license

        for (var i = 0; i < lic.length; i++) {

            if (lic[i].seats > lic[i].used) {

                available_lic.push(lic[i].id)

            }

        }


    }

    return available_lic;


} //get available liceses. 

//functions (associated with index.html)

function verifyLicense_div() {
    //show the verify box. 
    document.getElementById('div_verify').style.display = "block"
    return;

}


function verifyLicense() {

    var license_key_to_verify = document.getElementById("license_key_to_verify").value

    /*
    verify key and write data. 
    */

    var mmelc = JSON.parse(get_from_disk(LICENSEDIR + '.mmelc'))

    for (var i = 0; i < mmelc.license.length; i++) {
        console.log(mmelc.license[i].id)
        if (license_key_to_verify == mmelc.license[i].id) {
            alert("Key already verified")
            return;
        }
    }
//alert('got to line 66 lics.js');
    if (license_key_to_verify) {
        var submit_object = { "license_id": license_key_to_verify }
    }

    submit_data_to_server(submit_object, '/license/check', function(returnValue) {


        if (returnValue) {
			if (returnValue.response == 'error') { //this happens if offline.  JSON.parse(returnValue) fails when offline.
				var evaluate_response = 'error';
				
			}
			else{
				var res = JSON.parse(returnValue);
				var evaluate_response = res.response
			}
        }

        else{
            var evaluate_response = 'error'; //this shouldn't happen, but is a catch-all.
        }
         

        if (evaluate_response == 'error') {

            alert('Licence key could not be verified at this time. Please ensure you have entered the correct key and are online. If the problem persists, please contact MalariaMicroscopyCourse@amref.org.')
            return;

        } else {

            //write data to file

            var update_obj = {}
            update_obj['id'] = license_key_to_verify
            update_obj['seats'] = evaluate_response['seats']
            update_obj['used'] = evaluate_response['used']

            mmelc['license'].push(update_obj)

            external.saveFile('/data_l/.mmelc', mmelc)

            //alert('updating .mmelc')
            document.getElementById('verify_license_response').innerHTML = 'Licence Key is verified'
     


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
        alert('Error: Could not verify licence key. please enter again')
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
            check the licence is valid. 
            then send. 

        */
        type = 'licence'

        data_dir = LICENSEDIR
            //mod_config = get_from_disk(data_dir + 'module_conf.json');

        mod_config = get_from_disk('js/module_conf.json');


        if (last_type != data_dir) {

            localStorage.clear();
            //mod_config = get_from_disk(data_dir + 'module_conf.json');
            mod_config = get_from_disk('js/module_conf.json');
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
            //mod_config = get_from_disk(data_dir + 'module_conf.json');
        mod_config = get_from_disk('js/module_conf.json');

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