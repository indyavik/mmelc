//globals 

var CERTCONF = 'certification.conf'
var CERTKEYNAME = 'certification_conf'
var LOADMODULEKEY = 'loaded_module'
var SHUFFLEDKEY ='shuffled_sequence'

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

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

  return array;
}

function get_page_from_jquery(page_to_get){

    jQuery.ajaxSetup({async:false}); 

    var certpage =  $.get(page_to_get);

      if (certpage.status != 404) {

        //$("#content-inner").html(certpage.responseText);

        return certpage.responseText

      }

      else {
        alert('page_not_found')
        return false    
      }

}//function get page from jquery.

function load_conf_and_suffle() {
            /*
    first script to run on every page. 
    -loads the certfication conf if not found 
    -shuffles the page_sequence array 

    */

        var cert_config = JSON.parse(localStorage.getItem(CERTKEYNAME));

        //load from file. 

        if (!cert_config) {

            jQuery.ajaxSetup({
                async: false
            }); //required to avoind async status code check issues 

            var jq = $.get(CERTCONF); //alert(jq.status);

            if (jq.status == 200) {

                var config_data  = jq.responseText;

                localStorage.setItem(CERTKEYNAME, config_data);

                alert('found the certification file. ');

                //pick up a random module and randomize the sequence from the module and load. 

                var config = JSON.parse(localStorage.getItem(CERTKEYNAME)) ;

                console.log(config)

                var modules = Object.keys(config.mods) //
                alert('modules')
                alert(modules)

                //pick a random module.

                var load_module = modules[Math.floor(Math.random() * modules.length)];//'Module-8'
                localStorage.setItem(LOADMODULEKEY, load_module)

                //shuffle. 

                var page_sequence = config.mods[load_module].conf[0].page_sequence

                var shuffled_sequence = shuffle(page_sequence)

                localStorage.setItem(SHUFFLEDKEY, JSON.stringify(shuffled_sequence))

                var current_question = load_module + '.html' //Module-8.html

                localStorage.setItem('current_question', current_question)

                //set current page. 

                load_certification_page()



            } else {
                alert("configuration file not found. please contact the administrator");
                return;

            }

        }

    } //

function load_certification_page(signal) {
        /*
	goes through the page_sequence_suffled array and finds the next or previous page to load. 
    passes the page to appropriate URL to load.  
	*/

        //current_page --> 8_0_slide14_pxl_posttestq1.html
        var current_module = localStorage.getItem(LOADMODULEKEY)
        var shuffled_sequence = JSON.parse(localStorage.getItem(SHUFFLEDKEY))
        var current_question = localStorage.getItem('current_question')
        var current_index  =  shuffled_sequence.indexOf(current_question)
        var next_question;

        alert(current_index)


        if (current_index < 0) {
            next_question = shuffled_sequence[0]
        }
        else if (current_index == (shuffled_sequence.length -1 )) {
            next_question = current_question
        }

        else {
            next_question = shuffled_sequence[current_index + 1]
        }

        alert('next_question is' + next_question)



        if(!signal) {
            //load the main page of the module. 

            current_question = current_module + ".html"
            alert('current_q' + current_question)

            var page_data = get_page_from_jquery(current_module + '/' + current_question)

            if (page_data) $("#content-inner").html(page_data)

        }

        if(signal == 'next') {

            var page = current_module + '/0/' + next_question

            //var page_data = get_page_from_jquery(current_module + '/0/' + next_question)

            //if (page_data) $("#content-inner").html(page_data)

            window.location.href = window.location.origin + "/content/certification/home_certification.html?loadPage=" + page;


        }



        //get the page and load. 


    } //