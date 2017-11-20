function submit_data_to_server(data_type, data_object){

  //data_type = 'user_data' , 'feedback_survey' , 'certification_test' , pre_test, post_data

  //data_object - > a JSON object containing the data load that needs to be set to the serve. 

  if(data_object == null || typeof data_object !== 'object') {
    //alert('Error: Please submit valid JSON object');
	if(data_type == "survey_response"){alert('An error occurred - please save the result file to your computer and send via email later.');};
    return;
  }

  data_object = JSON.stringify(data_object);
alert(data_object);
  var endpoint = data_type; 
  var current_user = localStorage.getItem('logged_in')
  var now = new Date();
  //var url_endpoint = 'http://vestigesystems.com:5000/deviceData' 

  var url_endpoint = 'http://vestigesystems.com:5000/deviceData'  ;

  var load = {'user' : JSON.parse(current_user), 'data_load' : data_object, 'data_type' : data_type }

//alert(JSON.stringify(load));
 
    $.ajax({
 
    type: 'GET',
 
    url: url_endpoint, 
    //url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds', //bad ur for tets 

    dataType: 'jsonp',
    data: load, 

    success: function(data) {
		//alert(JSON.stringify(data));
		
		//var current_user = localStorage.getItem('logged_in');
		update_on_disk('sentdata/' + now.valueOf(), load);
      console.log("success: " + JSON.stringify(load))
		if(data_type == "survey_response"){alert('Thank you, your feedback has been received!');};
      //alert('sucess' + data);
      //alert('success');

    },
 
    error: function(data){

		update_on_disk('unreceivedData/' + now.valueOf(), load);
		console.log("error: " + JSON.stringify(load))
		if(data_type == "survey_response"){alert('An error occurred - please save the result file to your computer and send via email later.');};


    }
 
 
 
});
 
 
}//submit survey_generic function. 

function submit_unreceived_data_to_server(){
	/*
	//get unreceived data:
	var data_dir = get_local_object("data_dir"); 
	//alert(data_dir)
	if(!(data_dir)) data_dir = '/data/' ; 
	var check = get_from_disk(data_dir + 'unreceivedData');
	if(check == false || !check ) {

		var old_data = ['guest_user'];
		//alert("json user:" + users);
		set_local_object("Users", users);
		return users;

	}
	*/
	// try similar to "createUser()":
	var old_data = GetObject("unreceivedData", "unreceivedData");
	//alert(JSON.stringify(old_data));
	if($.isArray(old_data)) {
		var new_data = old_data		
		}
		else { var new_data = old_data['unreceivedData']}
		//alert('line 94 new_data:' + new_data);
	//var data_to_send = ({'unreceivedData': new_data});
	//alert('line96 new_data:' + data_to_send)
	
	
	//clear this data from disk (it will be re-written shortly if fails again)
	var cleared_data = {'unreceivedData': {'blank_unreceived_data':[]}};
	cleared_data = JSON.stringify(cleared_data);
	//alert('line116' + cleared_data);
	cleared_data = JSON.parse(cleared_data);
	//alert(cleared_data);
	update_on_disk("unreceivedData", cleared_data);
	//alert(JSON.stringify(old_data));
	//alert('pause here to look at file');
	//Try to submit old_data
	
	submit_data_to_server('previously_failed_to_receive_data', new_data);
	//alert('submitted line 125');
}