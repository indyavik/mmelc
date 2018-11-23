/*
All javascript to python bindings go here. 

*/

function JSCallback(arg1) {
//get the current size of the disk
    var size_mb = arg1.split(':')[1]; 
    size_mb = Number(size_mb)/(1024*1024) ; 
	//return size_mb; 
	//alert('Size in MB is:' + size_mb);
	alert(size_mb);
    

} //call back get the size of cache from python using jsavascript binding 

function JSCallback2(arg1) {
//get the current size of the disk
	//var test = String(arg1).split(':');
    //var size_mb = arg1.split(':')[1]; 
    //size_mb = Number(size_mb)/(1024*1024) ; 
	//return size_mb; 
	//localStorage.setItem("cache8", size_mb);
	
	//alert(arg1 + "python_bind.js, JSCallback2");
    
}