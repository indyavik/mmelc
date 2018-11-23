// 
//purpose: to autoload javascript or css files to every page this script is included/called from. 
//only this file is required to be included in each HTML page. Serve as a controller for future js/css/json fetches as needed.
//note: file pathname is relative to root URL where the html file is 

/*
*Purpose: To autoload other external resources (primarily javascript or css files). eliminates the need for manually including/writing/editing/maintaining 
resources directly on individual pages. 
*Usage: autoload('path_of_file_relative_to_server_root', 'type_of_file') ; 
**file path entered as normal NIX system style. 
**Notes: Use the path of the file relative to server root. Embedded application runs from C:\pathxl\nginx-1.8.0\html\ as server root. 
***So a if file path is C:\pathxl\nginx-1.8.0\html\js\myjs.js -> usage: autoload("/js/myjs.js", 'js"); 

*/
/*


*/

function autoload(filename, filetype){
    if (filetype=="js"){ //if filename is a external JavaScript file

        var fileref=document.createElement('script')
        fileref.setAttribute("type","text/javascript")
        fileref.setAttribute("src", filename)
		
    }

    else if (filetype=="css"){ //if filename is an external CSS file
        var fileref=document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }

    if (typeof fileref!="undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref);
	
}
/*
Add additional autoloads below. 
*/
autoload("/content/css/login.css", "css");
autoload("/content/js/main.js", "js"); 
autoload("/content/js/python_bind.js", "js");
//autoload("/content/js/functions.js", "js");


$(document).ready(function(){

//external.storageSize(); //call a one way python function to create a file with key system info. 


var which_module = location.pathname.split("/")[2] ; //["", "content", "module1", "m3intro.html"]

//alert(which_module);

//put the logic to select correct header file (by modules at this time) 
 var header_file ="";
 var footer_file="";
switch(which_module) {
	
	case 'index.html':
	case 'sendData.html' : 
		var aside_file = "/content/include_templates/aside_index.html" // path to the header file to be included. same for module 1 and 2.
		//var header_file ="" // path for any header file to be included 
		//var footer_file ="" // path for any footer file to be included 
		break;
		
	case 'home.html':
		var aside_file = "/content/include_templates/aside_home.html" // path to the header file to be included. same for module 1 and 2.
		//var header_file ="" // path for any header file to be included 
		//var footer_file ="" // path for any footer file to be included 
		break;
		
	case 'module1':
		var aside_file = "/content/include_templates/aside_module1.html" // path to the header file to be included 
		//var header_file ="" // path for any header file to be included 
		//var footer_file ="" // path for any footer file to be included 
		break;
	
	
	case 'module2':
		var aside_file = "/content/include_templates/aside_module1.html" // path to the header file to be included. same for module 1 and 2.
		//var header_file ="" // path for any header file to be included 
		//var footer_file ="" // path for any footer file to be included 
		break;

	case 'module3':
		var aside_file = "/content/include_templates/aside_module3.html" 
		//var header_file ="" // path for any header file to be included 
		//var footer_file ="" // path for any footer file to be included 
		break;

		
	/*
	//define addional cases as needed here. 
	case 'module5':
		var aside_file= "/content/include_templates/aside_moudle1.html" // path to the header file to be included. same for module 1 and 2.
		var header_file ="" // path for any header file to be included 
		var footer_file ="" // path for any footer file to be included 
		break;
	*/

}

//special cases for pages = index, home pages etc. etc. 
if (which_module.search('test.html') !== -1) {
	aside_file = "/content/include_templates/aside_module1.html" ; 

}

if (which_module.search('certify.html') !== -1 ) {
	aside_file = "/content/include_templates/aside_index.html" ; 

}


//lets insert the header html on to the page dynamically.
/* //Not used anymore, as of March 2017
if (aside_file) { 
$.get(aside_file, function(data) {
	$("#aside").html(data); 
	});
	alert(aside_file)
}

if (header_file) { 
$.get(header_file, function(data) {
	$("#header_fixed").html(data); 
	});
	alert(header_file)
}

if (footer_file) { 
$.get(footer_file, function(data) {
	$("#footer").html(data); 
	});
	alert(footer_file)
}
*/
//$("myCheck").click();
	
});


