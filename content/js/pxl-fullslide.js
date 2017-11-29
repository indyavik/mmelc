function submitReport() {
//This calculates the answer to submit.  It checks for no answer and too high of quantitation,
//but does not check for other errors (e.g. if NMPS is checked, but so are species/stages or quantitation)

	var TFanswers = 'fffffffffffff'; //each checkbox answer; not needed in the end but useful for error checking.
	var species = 'fvmo'; //falciparum, vivax, malariae, ovale
	var stage = 'tsg'; //troph, schizont, gametocyte
	var ansId = 'P'; //this is the start of the checkbox ids
	
	var numericalBinaryAnswer = 0; //this will be the TF answers converted to base 10
	var quantitation = 0; 
	var useranswer = 0; // this is the answer saved and submitted after encryption (in base 10).  Includes binary answers and quantitation.
	var PS = document.getElementById("PS").checked;
	var NMPS = document.getElementById("NMPS").checked;
	//document.getElementById("answerFeedback").innerHTML =species[1];
	if (!PS && !NMPS) { //User didn't select an answer
		document.getElementById("answerFeedback").innerHTML = "Please enter whether parasites are seen or not!";
	}
	else{
		if(PS){
			TFanswers = 'tffffffffffff';
			numericalBinaryAnswer = numericalBinaryAnswer + 4096;
			}
		for (i=0; i<4; i++) {
			ansId2 = ansId.concat(species[i]); //i.e. Pf, Pv, Po, Pm
				//document.getElementById("answerFeedback").innerHTML =ansId2;
			for (j=0; j<3; j++) {
				ansIdFull = ansId2.concat(stage[j]); //e.g. Pft, Pfg, Pfs, Pvt, etc.
				//document.getElementById("answerFeedback2").innerHTML = ansIdFull;
				
				if(document.getElementById(ansIdFull).checked) {
					//TFanswers[i*4+j] = 't'; //this doesn't work
					
					thisIndex = i*3+j+1; //+1 is to offset (first value is MPS vs NMPS)
					TFanswers = TFanswers.substr(0,thisIndex) + 't' + TFanswers.substr(thisIndex+1);
					numericalBinaryAnswer = numericalBinaryAnswer + Math.pow(2,12-thisIndex);
					
				}
			}
		}
		//document.getElementById("answerFeedback").innerHTML =TFanswers;
		//document.getElementById("answerFeedback2").innerHTML =numericalBinaryAnswer;
		quantitation = document.getElementById("quantitation").value;
		if(quantitation==''){
			quantitation=0;
		}
		else {
		quantitation = quantitation*1;
		}
		//document.getElementById("answerFeedback2").innerHTML =quantitation;
		if(quantitation > 999999){
			document.getElementById("answerFeedback").innerHTML = 'Enter a quantitation value less than 1,000,000';
		}
		else
		{
			quantitation = quantitation * 10000; //to produce a single number
			useranswer = quantitation + numericalBinaryAnswer;
			//document.getElementById("answerFeedback").innerHTML = useranswer;
			localStorage.setItem(virtualslidePrefix+questionnum,useranswer);
			//alert(virtualslidePrefix+questionnum);
			//alert(useranswer.toString());
			var pagetemplate = 'home.html';
			if(nextslide.indexOf("_pxl_") > -1 ) {
				pagetemplate = 'home_pxl.html';
				nextslide = pagetemplate+'?loadPage='+nextslide;	
				window.location = nextslide;
			}
			else 
			{
				
			//
			//nextslide = nextslide.replace('.html','');
			//alert('nextslide = ' + nextslide + ' pagetemplate = ' + pagetemplate);
			load_page(nextslide,pagetemplate);
			} 
			//turn on "next" button in case it got turned off:
			//document.getElementById('nextPageButton').style.display = 'initial';
		}
	}
}

function showthick() {
document.getElementById('pathXLviewer').src = '../../standalone.html?slide=images/'+virtualslideDirectory+'/'+virtualslidePrefix+questionnum+'thick.svs';

}
function showthick2() {
document.getElementById('pathXLviewer').src = '../../standalone.html?slide=images/'+virtualslideDirectory+'/'+virtualslidePrefix+questionnum+'thick2.svs';

}

function showthin() {
document.getElementById('pathXLviewer').src = '../../standalone.html?slide=images/'+virtualslideDirectory+'/'+virtualslidePrefix+questionnum+'thin.svs';
}

function showthin2() {
document.getElementById('pathXLviewer').src = '../../standalone.html?slide=images/'+virtualslideDirectory+'/'+virtualslidePrefix+questionnum+'thin2.svs';
}

 