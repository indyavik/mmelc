
function create_ans_key_to_submit() {

range1 =10;
range2= 5;
var range01 = Array(range1).fill(1).map((x, y) => x + y);
var range02 = Array(range2).fill(1).map((x, y) => x + y);

var qs= [];
var ans =[];



for (var i = 0; i < range01.length; i++) {
      
        //console.log('postMCQ' + range01[i]);
        qs.push('postMCQ' + range01[i])
        
}

for (var i = 0; i < range02.length; i++) {
        qs.push('postq' + range02[i])
        //console.log('postq' + range02[i]);
        
}

//console.log(qs);
console.log(qs.length )
var a;
for (a = 0; a < qs.length; a++) {
  var an = localStorage.getItem(qs[a]);
  ans.push(an);
}

return [qs, ans]
	
}


//ans. key

function generate_long_ans_key(qs, ans) {
	final_ans_key = {}

//npms, Pfe, Pve, Pme, Poe, quantitation] 

for (var i = 0; i < ans.length; i++) {
       var an = ans[i]
       if (an.length == 4) {
         //split and get details. 

                 
         var quantitation = Math.floor(an/10000); //should be between 0 and 999999
         
         an = an - quantitation*10000; //now should be 4 digit number between 0 and 2^13.
      	 userReportBinary = an.toString(2); //Now an up-to-13-digit binary number in string 
      	for (ii=userReportBinary.length; ii<13; ii++) {
      		userReportBinary = '0'+userReportBinary;
      	}
      	
      	//console.log(userReportBinary)
      	
      	var obj  = {} 
    
      	var Pfe = 0;
      	var nmps =0;
      	var Pve=0;
      	var Pme =0;
      	var Poe =0;
      	
      	if (userReportBinary.substring(0,1)=='1') nmps = 1 ; 
      	if (userReportBinary.substring(1,4) != '000') Pfe = 1; 
      	if (userReportBinary.substring(4,7) !='000') Pve = 1; 
      	if (userReportBinary.substring(7,10) !='000') Pme = 1; 
      	if (userReportBinary.substring(10,13) !='000') Poe = 1; 
      
      	
      	obj['nmps'] = nmps, 
      	obj['Pfe'] = Pfe
      	obj['Pve'] = Pve
      	obj['Pme'] = Pme
      	obj['Poe'] = Poe
      	obj['quantitation'] = quantitation
      	
      	
      	//console.log(obj);
      	
      	final_ans_key[qs[i]] = obj
      	
      	//[]

      	
	
         
       }//

       
        
}

return final_ans_key


}//long ans key