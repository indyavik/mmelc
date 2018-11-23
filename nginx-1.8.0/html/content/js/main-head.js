function get_local_object(key) {
	var obj = localStorage.getItem('logged_in') ; 
	if (obj == "" || !obj) return false; 
	return JSON.parse(localStorage.getItem(key)) ;
			}

function set_local_object(k, v) {
	var json_object = JSON.stringify(v) ;
	localStorage.setItem(String(k), json_object) ;
			}
			
function logMeOut(){
	set_local_object('logged_in', 'nobody'); 
	setTimeout(function(){window.location.href="/content/index.html?logout=nobody"}, 0);

}


function check_user_session(){
var user = get_local_object('logged_in');

if(!user || user == 'nobody') {
	alert('Please Select a User First:'); 
	window.location.href="/content/index.html?message="+"please log in first"; 

}

};//check user session

check_user_session(); 

window.onload = function(){

var i_ran = 'yes'; 
var user = get_local_object('logged_in');
var cache_size = get_local_object('cache_size');  
//var cache_z = get_local_object('cache_size');
document.getElementById("user_welcome_1").innerHTML = "Welcome: " + user ; 
alert("main-head.js:" + user);
document.getElementById("cache").innerHTML = "Cache: " + cache_size +" MB" ; 


}



/*
window.onload = function() {
 user_session();
 var user = get_local_object('logged_in');
 
 setTimeout(function() { 
 document.getElementById("user_welcome").innerHTML = "Welcome: " + user ; 
 //document.getElementById("user_data").textContent = "Cache: " + cache_size + " mb";

 }, 1000);
 //var cache_size = external.TestJSCallback(getCacheSize);
 //document.getElementById("user_data").textContent = "Cache:" + cache_size + " mb";
  var cache_size = external.TestJSCallback(getCacheSize);

 //alert(user);
}
*/
