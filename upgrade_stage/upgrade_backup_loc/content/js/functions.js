//function to find user's. if no user is found in localStorage (1) check for the data files, if nothing (2) create 
//read the file  
//var get_users = localStorage.getItem("Users"); //should return a json object 

function findInArray(array_in, user_name) {
//iterate and return true false if user_name in the array
for (var i =0; i < array_in.length ; i++) {
	if (array_in[i] == user_name) { 
	return true; 
	}
 }
 return false; 
}
//turn ajax async off - else unpredictable results are obtained // 

function checkFile (file_name) {
	filename = file_name.trim();
	
	var response = jQuery.ajax({
		url: filename,
		type: 'GET',
		async: false
	});	
	
	return (response.status != "200") ? false : response.responseText;
};

function findUsers(file_name){

 var file_name = file_name || "/data/userx2.txt" ; 
 var get_users = JSON.parse(localStorage.getItem("Users")); // json object Users pointing to user array
 
 if (get_users == null || get_users.Users == undefined) { 
	//check the file. 
	var data = checkFile(file_name) ; 
	//alert(file_name);
	if (data) { 
	
		var d = JSON.parse(data) ; 
		if (d.Users == undefined) { 
		return {"Users": false , "Source" : 'none'} ; 
		}
		else {
		
		return {"Users" : d.Users , "Source" : 'file' } ; 
		}

	}
	else {
	return {"Users": false , "Source" : 'none'} ;
	}

 }//get_users == null 
 
 return {"Users": get_users.Users , "Source" : 'storage' } ; 
 
 } // function findUsers 


function JSCallback_save_user(arg1){
	retrun arg1; 

}

function logMeOut(user_name){
//Copy user data to the file system via python bindings
//redirect to the main page. 
//bind this function to the onlick event on the log-out 

	var user = JSON.parse(localStorage.getItem("current_user")); //get the user_name that is currently logged in.
	var user_data = JSON.parse(localStorage.getItem(user));
	//call a python routine---- > lets say SaveUser. pass user_data and javascript call back handler. 
	external.SaveUserInFile(user_data, JSCallback_save_user);

} 

function getCacheItem(item_name){
//how about locking multiple processes ? 
	var user = JSON.parse(localStorage.getItem("current_user")); //get the user_name that is currently logged in.
	var user_data = JSON.parse(localStorage.getItem(user));
	
	switch(item_name) {
	
	case 'current_page':
	//to get the last page user were on 
	var 
		break;
		
	case 'completed_milestones':
		//array of completed units/modules. 
		break;
	
	case 'test_data':
		//array of tests attempted and passed. ??
		break;
	case 'last_module':
		break;
	
	}
	
	//return localStorage.getItem(item_name); //base case. 

}

function setCacheItem(item_name, value){
	localStorage.setItem(item_name, value);
	return true;

}




				
			function loadHistory() {
        		//console.log("load event detected!");

        		//alert("onload detected") ;
        		var local = JSON.parse(localStorage.getItem("trackCompletion"));
        		var last= local['trackCompletion'].length ; 
        		var lastModule = local['trackCompletion'][last -1] ; 


        		var str =[">>Module Order:"]
      			for (var i = last - 1; i >= 0; i--) {
      				//str.push(str[i); 
      				str.push(local['trackCompletion'][i]);
      			}

      			var displayMessage = str.join('>>') ;
      			//alert(displayMessage) ; 

        		document.getElementById("3").innerHTML = displayMessage;
        		document.getElementById("2").innerHTML = "Current Module: "+ local['trackCompletion'][last -1];
      				} //function onload 

      			window.onload = loadHistory ; 
      			



				function populateUserTable(user_array, table, rows, cells,content) {
			
	    			var is_func = (typeof content === 'function');
	    			if (!table) table = document.createElement('table');
	    			table.setAttribute("class", "login_table") ; 
	    			for (var i = 0; i < rows; ++i) {
	        		var row = document.createElement('tr');
	        		row.setAttribute("class", "test_class");
				        for (var j = 0; j < cells; ++j) {
				            var new_td = row.appendChild(document.createElement('td'));

				            if (j%2 !=0) new_td.style.backgroundColor = "tomato";
				            //new_td.setAttributeNode(att); 

				            var text = !is_func ? (content + '') : content(table, i, j);
				            
				            if(text) {
				            	row.cells[j].appendChild(document.createTextNode(text));
				            	row.cells[j].setAttribute("id", text);
				            	var id = String(text);
				            
				            	  (function (id) {
    							row.cells[j].addEventListener('click', function() { logUser(id); });
  								})(id);
				            }
				            else row.cells[j].style.backgroundColor = "grey";
				            //else row.cells[j].style.visibility = "hidden";

        					} //for loop

        table.appendChild(row);
   				   }
    return table;
} //function populate table 
