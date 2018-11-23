function clickCall(){
  var id = 'myCheck';
  //document.getElementById(id).click();   //this will work by simulating the click
  external.TestJSCallback(JSCallback2); //this will work as it gets triggered on document on load. 
  //alert(id);

}

function func1() {
document.getElementById('myCheck').click();
alert("function 1");
}
function func2(){
alert("this is func2");
$.get(header_file, function(data) {
	$("#aside").html(data); 
	
	//alert("inserted header");
	});
}

function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    }
  }
}

addLoadEvent(func1);
addLoadEvent(func2);
