/* cookie helper functions for future usage. not being used currently (using session or local storage) */

/*

New functions written in Feb 2017


*/

function aggregate_result(mcq, pxl){

  //mcq --> number of multiple choice questions 
  //pxl --> number or pxl questions 

  //get normal questions 

  var mcq_ans = ''
  var short_pxl_ans =''


  for ( i = 1 ; i < mcq + 1 ; i ++){


    var str = 'assessmentMCQ' + i.toString()
    var ans = localStorage.getItem(str)
    mcq_ans+= ans


  }

    for ( i = 1; i < pxl + 1 ;  i ++){

    var pxstr = 'assessment' + i.toString()
    var pxans = localStorage.getItem(pxstr)
    //convert each pxl answer to short base 32 and add to long string seprated with '-'

   short_pxl_ans+= '-'
   short_pxl_ans+= parseInt(pxans).toString(32) 

  

  }

  //MCQ convert to base 32 short-hand.
  var short_mcq_ans = parseInt(mcq_ans).toString(32)

  var full_result_key = short_mcq_ans + short_pxl_ans


  //console.log(mcq_ans)
  console.log(short_mcq_ans)
  console.log( short_pxl_ans)
  console.log( full_result_key)

  return(full_result_key)


}


//New function ends. 

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return false ;
}





function log_out_test_area(){
  //destroy cookie. save old record just for once. ?

  localStorage.removeItem('certification_user_logged_in');
  window.location.href="/content/index.html";

}

function check_login_certificate_test(){
  //check login and initiate key routines on every page

  var user = localStorage.getItem('certification_user_logged_in');

  if(!user) {

    alert("you are not logged in. please log in first")

    window.location.href="/content/certify.html";

    return;

  }

  //else run following key routines. 

  alert("welcome " + user);


  load_aside(); //load menu for test area 

}

function capture_answers(){
  //create a json object in cookie and write answers. 
  //{test_id:'', 'answers': {'q1':1, 'q2':2, ...............}} //use append. 
  //note: question_ids are sorted. 

        var qs = document.getElementsByClassName("questions"); // []
        var question_ids = []; 

        //var is_answer = getCookie('answers');
        var is_answer = sessionStorage.getItem('answers'); 

        if(!is_answer) {
          var answer_sheet = {} ; 
        }

        else {
          var answer_sheet = JSON.parse(is_answer);
        }

          
        var answer_list = [] ; //simple sequence of answers. 
        for (var i=0; i< qs.length; i++) {

       //console.log(qs[i])
       var q = qs[i];
       question_ids.push(q.getAttribute('name'));


        }

        for (var i in question_ids) { 

        //console.log(x[i])

        var q = question_ids[i]; 
        //var a =  document.querySelector("input[name="+q+"]:checked").getAttribute('ans')
        var a = document.querySelector("input[name="+q+"]:checked");
       
        //if(a) console.log(a.getAttribute('ans')) ; 
        if(!a) {
          alert('please answer all questions. Missing question:' + q); 
  
          //continue;

          return false;

        }

        answer_sheet[q] = a.getAttribute('ans');

        //answer_list.push(a.getAttribute('ans'));



   }
   //save answer sheet to the session store. 
   sessionStorage.setItem('answers', JSON.stringify(answer_sheet) ); 
   //setCookie('answers', JSON.stringify(answer_sheet)); 
   return answer_sheet;


}

function create_answers(res) { //input as answer_sheet that is an object.

  //returns an object with test_id and array of answers in sorted order 

  var test_id = parseInt(document.getElementsByName("certification")[0].getAttribute('id'))//"101" --> 101

  var res_1 =[] ; 

  for(var i = 1; i < Object.keys(res).length +1 ; i++){

     var a = (res['Q'+i]);
     if (a === undefined) a = '0' 
     res_1.push(a) ;
  }

  var ans = parseInt(res_1.toString().replace(/,/g, '')); //2111111111


  var part_3_ans = sessionStorage.getItem('part3_answers') ; 

  var part3_shortCodeAnswer = JSON.parse(part_3_ans)['shortCodeAnswer'] ; 

  var answer_key = test_id.toString(32) + '-' +  ans.toString(32) + '-' + part3_shortCodeAnswer; //full answer with part 3

  var user = localStorage.getItem('certification_user_logged_in');

  if (!user) var user = 'testUser-maincert.js' ; 

  var results =  {'test_taker_user_id':user, 'test_id': test_id, 'answers' : ans, 'answer_key': answer_key}

  //setCookie('results', JSON.stringify(results)); 

  sessionStorage.setItem('results', JSON.stringify(results));

  return results;
  
}


function test_complete(num_questions) {

  //var load =  create_answers(capture_answers()); 

  var n = (num_questions? num_questions : 0);  // if num_question is not supplied. this is zero.

  var check = capture_answers(); //returns the saved answers.

 // var next = window.location.href = "/content/posttest_protected/display_results.html" ; 

  
  if(!check || n > Object.keys(check).length ){

    alert("please attempt all the questions first") ;

    return; 

  }

  var load =  create_answers(check); 


  $.ajax({
    type: 'GET',
    //url: 'http://githubbadge.appspot.com/badge/torvalds',
    url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds',
    //url: 'http://vestigesystems.com:5000/jsonp', 
    dataType: 'jsonp',
    data: load, 

    success: function(json) {
       // var result = json.user.login 

       alert("live results from server:" + json.status + ':' + json.result);
              
    },

    error: function(){
      //alert('please note down following key to get your results:  ' + 'USER ID:  '+ load.test_taker_user_id
            // + '  Answer Key :' + load.answer_key);

      window.location.href = "/content/posttest_protected/results.html"; 


    }

});

 } //function verify_results_connected() 

 function load_aside(){
  var which_module = location.pathname.split("/")[2] ; 

  var except_page = location.pathname.split("/")[3] ; //page where a different aside needs to place

  alert(except_page);


   // if (except_page == 'posttest1_2.html' || except_page == 'posttest1.html' ){

     if (except_page !== 'posttest1_3.html'){

    aside_file = "/content/include_templates/aside_certification.html" ; 

    $.get(aside_file, function(data) {
      $("#aside").html(data); 
      });
    }



 }//load_aside 

//run the function



function save_and_next(next_page){
  /*
  * save answers and move to the next page/question. 
  *example next_page = 'posttest1_2.html'
  *
  */

  var check = capture_answers(); //returns the saved answers.

  //alert(check);

  var next = next_page; 

  if(check) window.location.href = "/content/posttest_protected/"+ next; 

}

//must be the last thing to run. 

//check_login_certificate_test(); // 

function display_results() {


    //document.getElementById("demo").inn
    
    //var ans_sheet = {'1': "a", '2': "b", '3': "c", '4': "d", '5': "d", '6': "c", '7': "b", '8': "a", '9': "a", '10': "b"} ;

//displays the result on a new page. layout = printer friendly. 
      var user = localStorage.getItem('certification_user_logged_in');
      //if(!user) window.location.href="/content/certify.html";

      var map = {'1' : 'a', '2' : 'b' , '3' : 'c', '4' : 'd'} ; 

      var ans = JSON.parse(sessionStorage.getItem('results')); //

      document.getElementById('test_user_id').innerHTML = "User Name :  " + ans.test_taker_user_id; 
      document.getElementById('test_id').innerHTML = "Test ID : " + ans.test_id;
      document.getElementById('ans_key').innerHTML = "Test Answer Key : " + ans.answer_key; // short key

      var answers = String(ans.answers); 

      var ans_sheet = {} 

      for (var i = 0, len = answers.length; i < len; i++) {

         ans_sheet[String(i+1)] = map[answers[i]] ; 

        }
    

    var len = Object.keys(ans_sheet).length ; 
    //alert(ans_sheet['1']) ;
    var columns = 5 ;
    var rows = Math.ceil(10/columns); 

    var table = document.getElementById("results-table");

    //alert(table)

    //table.setAttribute("class", "login_table") ; 

    //var counter = 0; 

    for (var i = 0; i < rows ; ++i) {

      var row = document.createElement('tr'); 
      //row.setAttribute("class", "results_rows"); 

      //for (var j = i*columns ; j < j + columns ; ++j) {

      for (var j = 0 ; j < columns ; ++j) {

        var tds = document.createElement('td') ; 
        tds.setAttribute("class", "results-td") ; 

        var new_td = row.appendChild(tds);

        //new_td.style.height ="50px"; 

        if (j%2 !=0) new_td.style.backgroundColor = "grey";
        if (j%2 ==0) new_td.style.backgroundColor = "cream";

        var index = j + ( i*columns) + 1;  //questions don't start from  0. so 1 is added. 

        var text_ans = ans_sheet[String(index)]; 

        var text = "" ;
        if (text_ans) var text = 'Q ' + index + ':   ' +  text_ans.toUpperCase() ; 
        
        //var text = 'i: ' + i + ' j: ' + (j) + 'index:' +  index; 
 

        row.cells[j].appendChild(document.createTextNode(text));



      }//for inner


    table.appendChild(row);
    
    }//for outer


    } //function display results 


    function id_html(id) {
      //simply return the inner html 
      var elem_id = id ; 
      var elem = document.getElementById(id).innerHTML ; 

      if (elem) return elem ; 
    }


load_aside();