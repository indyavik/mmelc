function calculate_completion() {
    //get current user 

    var current_user = JSON.parse(localStorage.getItem('logged_in'))
        //console.log(current_user)
    var user_data = JSON.parse(localStorage.getItem(current_user)).units_completed //"units_completed":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[]}}"
        //console.log(user_data)

    var current_location = localStorage.getItem('current_location').split('_') //["4", "2", "slide06.html"]
  var slide_pointer = current_location[0]  +'_'+ current_location[1] 
  

    for (var key in user_data) {

        if (user_data.hasOwnProperty(key)) {

            var m = key
                //console.log('m is:' + key)
                //check if this module is completed. 
            var mod_config = JSON.parse(localStorage.getItem('module_config'))

            if (key !== '6') {
                var total_units = mod_config['mods']['Module-' + m]['conf']
                var completed_units = user_data[m]

                if (Object.keys(total_units).length == completed_units.length) {

                    //module complete. 
                    console.log('completed module: ' + 'Module-' + m)

                    document.getElementById('Module-' + m + '-side').innerHTML = "&#10003;";
                }




                for (var i = 0; i < completed_units.length; i++) {
                    var to_change = m + '_' + completed_units[i]

                    console.log('completed units:' + to_change)

                    document.getElementById(to_change).innerHTML = "&#10003;";
                }

                 document.getElementById(slide_pointer).innerHTML = "&#187;" 



            }

        }
    }
} //calculate completion. 

function update_units(current_module, current_unit) {

    //update the user object with unit completed info. 
    //alert('mod ' + current_module + ' unit ' + current_unit); 
    var current_user = localStorage.getItem('logged_in');
    //alert('got logged_in ' + current_user);
    var current_user_data = JSON.parse(localStorage.getItem(JSON.parse(current_user)));
    //alert('got user data ' + current_user_data);
    // alert(('goNext-main-2.js:' + current_user_data));



    if (typeof(current_user_data) === 'object' && (current_user_data !== null)) {

        if (current_user_data['units_completed'][current_module].indexOf(current_unit.toString()) == -1) {



            current_user_data['units_completed'][current_module].push(current_unit.toString())

        }

        console.log("completed unit/module: " + (JSON.stringify(current_user_data['units_completed'][current_module])));

        //units_to_update.push(current_unit.toString());

        localStorage.setItem(JSON.parse(current_user), JSON.stringify(current_user_data))

        // update_on_disk(current_user + '.txt', current_user_data)
        update_on_disk(JSON.parse(current_user) + '.txt', current_user_data)
    }

} //update_units

function get_titles() {

    //get the title of current module and unit from conf file 

    var mods_title = {

        '0': "Course introduction, Software Setup and Tutorial, and Pre-Test",
        '1': "Module One: Introduction to Malaria",
        '2': "Module Two: Blood Collection, Preparation and Staining of Blood Films",
        '3': "Module Three: Blood Film Examination",
        '4': "Module Four: Non-Microscopic Methods for the Detection of Malaria Parasites and Diagnosis of Malaria",
        '5': "Module Five: Laboratory Quality Management Systems",
        '7': "Post-Test",
        '100': "Pilot Evaluation Survey"

    }

    var current_page = localStorage.getItem('current_location'); //5_0_slide02.html
    var els = current_page.split('_')
    var mod = 'Module-' + els[0]
    var unit = els[1]
    var current_slide = els[1]; //alert(localStorage.getItem('module_config'));
    var mod_config = JSON.parse(localStorage.getItem('module_config'));
    var sequence = mod_config['mods'][mod]['conf'][unit]['page_sequence']

    var module_name = mods_title[els[0]]
    var unit_name = mod_config['mods'][mod]['conf'][unit].title

    console.log(module_name + " : " + unit_name)

    var total = sequence.length
    var x = sequence.indexOf(current_page) + 1

    console.log(x + '-of-' + total)

    if(module_name == undefined) module_name = 'Module-8'

    return ({ 'module_title': module_name, 'unit_title': unit_name, 'currentSlidex': x, 'numberSlidesy': total })



} // get_titles 



function openNav() {
    document.getElementById("mySidenav").style.width = "375px";
    calculate_completion()

}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}


function create_page_path(page) {
    //5_1_slide53.html or "Module-1.html" ( if asking to load module page.)
    //console.log("create_path_path -->;" + page); 
    if (page.indexOf('Module') > -1) {
        var els = page.split('.')
        return els[0] + '/' + page
    } else {
        var els = page.split('_');
        return "Module-" + els[0] + '/' + els[1] + '/' + page
    }

} //create_page_path

function get_next_page(current_page, signal) {
    //signal = 'next' -> given a current page "5_1_slide03.html" returns the next page in sequence "5_1_slide04.html"
    //signal = 'prev' -> given a current page "5_1_slide04.html" returns the previous page in sequence "5_1_slide03.html"
    //signal ='home' -> returns the first page of the module/unit combo 
    //if the current_page is not found, the first page in the module is returned. (same as home above.)

    //remove #sign from the current page if any. 

    console.log('get_next_page signal' + signal)

    var current_page = current_page.replace('#', '');

    var els = current_page.split('_');
    var els = current_page.split('_');
    var current_module = 'Module-' + els[0]
    var current_unit = els[1]
    var current_slide = els[2]

    console.log('next page -->' + current_page)
    console.log('next page current module -->' + current_module)
    console.log('next page current module -->' + current_unit)

    var mod_config = JSON.parse(localStorage.getItem('module_config'));
    //load from file. 

    if (!mod_config) {

        jQuery.ajaxSetup({ async: false }); //required to avoind async status code check issues 

        var jq = $.get(go_to_page); //alert(jq.status);

        if (jq.status == 200) {
            var mod_config = jq.responseText;
            localStorage.setItem('module_config', mod_config);

        } else {
            alert("configuration file not found. please contact the administrator");
            return;

        }

    }

    var sequence = mod_config['mods'][current_module]['conf'][current_unit]['page_sequence']

    console.log(sequence);
    //console.log(sequence.length); 
    //console.log('get_next_page --> current_page is set as :' + current_page);

    var current_index = sequence.indexOf(current_page);

    if (current_index == -1) {
        //page doesn't exist. increment and try again. 
        alert('page not found');
        return false;

    }
    console.log('get_next_page --> current_index :' + current_index)

    if (signal == 'next') {

        if (current_index < sequence.length - 1) {
            //alert (sequence[current_index + 1])
            return sequence[current_index + 1]
        } else { alert('This is the last page of this section.'); return false; }

    }

    if (signal == 'prev') {
        if (current_index > 0) {
            //alert (sequence[current_index + 1])
            return sequence[current_index - 1]
        } else { alert('This is the first page of this section. Please use the menu to navigate to previous sections.'); return false; }

    }

    if (signal == 'home') {
        return sequence[0]

    }
    console.log("get_next_page " + current_page + " : seems to be the last page")
    return false;


} //get_next_page

function page_exists(page) {
    //returns page data if page is found. returns false if not. 
    jQuery.ajaxSetup({ async: false }); //required to avoind async status code check issues 
    var path = create_page_path(page);
    var jq = $.get(path);
    if (jq.status == 200) {
        return jq.responseText

    } else { return false; }

} //page exists 

function loadFooterNav(page) {
    //5_1_slide03.html
    //console.log("load footer nav --> " + page)

    if (page.indexOf('Module') > -1) {
        //return nothing as "looks like loading Module-1.html"
        var footerNav = '<span>units: to be loaded here</span>';
        $("#wrap-footer-menu").html(footerNav);
        return;
    }

    var els = page.split('_');
    //alert(els)

    var module_name = 'Module-' + els[0];
    var unit_name = els[1];

    //alert(unit_name);

    var module_conf = JSON.parse(localStorage.getItem('module_config'))['mods'][module_name]
    var footerNav = module_conf['conf'][unit_name]['footerNav'];
    //alert(footerNav);
    //check if pxl file, and change nav menu accordingly:
    if (page.indexOf('_pxl_') > -1) {
        // string replace: </span><select id="footer_selector" to </span><br><select id="footer_selector" style="max-width:100%"
        // nevermind about width; can adjust easily on page.
        footerNav = footerNav.replace('</span><select id="footer_selector"', '</span><br><select id="footer_selector"');
    }
    //alert(footerNav);
    $("#wrap-footer-menu").html(footerNav);
    $("#footer_selector").val(page);
    $("select option[value= page]").attr("selected", "selected");



}


function jumpTo() {

    var target = document.getElementById("footer_selector").value;

    if (target.indexOf("_pxl_") > -1) {

        template = 'home_pxl.html'

        console.log("nav_to target next page:" + target)

        //just to make sure current i-frame gets cleared. use jquery remove 

        $("#content-right").remove();

        window.location.replace(template + '?loadPage=' + target)

    } else {

        load_page(target);

    }



}

function nav_to(signal) {

    //gets the current page and signal, and gets next page to load and calls the load 
    var current_page = localStorage.getItem('current_location'); //5_0_slide02.html
    //alert(current_page);
    if (!current_page) current_page = '0_0_slide01.html'
    var target = get_next_page(current_page, signal);
    console.log("nav_to target next page:" + target)
    load_page(target);

}

function load_page_menu(target) {
    //document.getElementsByClassName("closebtn").click();
    document.querySelector('.closebtn').click();
    load_page(target);

}

function checkProtected(go_to_loc) {
    //go_to_loc = 08_01_slide01.html 
    //get module 
    var module = go_to_loc.split('_')[0]



    if (module == '87' && sessionStorage.getItem('certification_user_logged_in') == null) {

        window.location.replace('home_protected.html?message=noLogin')

    } //check protected 
}

function load_admin_page()
{
	window.location.replace('admin_actions.html')
}

function load_page(page, template) {
    //load config file. 
    //get the right module...unit, and path
    //gothere
    //set the variables in session storage.

    console.log('load_page : page is: ' + page)

    var root = "/content/"
    var current_page = localStorage.getItem('current_location')
    if (!current_page) current_page = '0_0_slide01.html'

    var current_template = 'home.html'
    var next_template = 'home.html'

    if (current_page.indexOf("_pxl_") > -1) current_template = 'home_pxl.html'
    if (page.indexOf("_pxl_") > -1) next_template = 'home_pxl.html'

    /*
        if(current_page.includes("_pxl_")) current_template = 'home_pxl.html'
        if(page.includes("_pxl_")) next_template = 'home_pxl.html'
    */
    checkProtected(page)

    var go_to_page = create_page_path(page) // "Module-5/1/5_1_slide53.html" 


    //check whether go_to_page exists - if doesn't exist, skip ahead 2 times. else raise error. 

    var count = 0;

    while (count < 3 && page) {

        var check_page = page_exists(page); //check_page has actual page data or false. 
        if (check_page) {
            count = 5;
            //alert(slide_num) ;
        } else {
            alert(page + " : not found..trying next page")
            count = count + 1; // increment by 1
            //page = get_next_page(page, 'next') //page may be false.
            //increment the page 0_0_slide01.html --> 0_0_slide01
            var el = page.split('.')[0].split('_')
            var slide = el[2]
            var mod = el[0]
            var unit = el[1]
            var slide_no = Number(slide.slice(-1)) //1
            var next_slide_no = slide_no + 1;
            var next_page = mod + '_' + unit + '_' + slide.slice(0, -1) + next_slide_no.toString() + '.html'

            alert("next page is : " + next_page);
            page = next_page

        }
    }

    //console.log("check_page --->" + check_page)

    if (check_page) {

        //alert(check_page);
        //else load the check page. 

        if (current_template == 'home_pxl.html') {

            if (next_template == current_template) {
                $("#header1").show();
                $("#content-right").remove();
                $("#content-right").html(check_page);
                $("#pxl_left").appendTo("#content-left");

                //append counter box to the content right. 
                //alert("adding box");
                //$("#box").appendTo("#content-right");

                localStorage.setItem('current_location', page);
                loadFooterNav(page);
                alert(unit_title + 'pxl to pxl line 424');
            } else {
                window.location = 'home.html?loadPage=' + page;
                $("#header1").show();
                $("#footer").show();
                $("#content-inner").html(check_page);
                localStorage.setItem('current_location', page);
                loadFooterNav(page);
                //var info = get_titles();
                //var module_title = info['module_title'];
                //var unit_title = info['unit_title'];
                //var currentSlidex = info['currentSlidex'];
                //var numberSlidesy = info['numberSlidesy'];//alert(currentSlidex + ' ' + numberSlidesy + 'pxl to non-pxl line 439');
                //alert(numberSlidesy);
                //document.getElementById("display_current").textContent  =  'Currently on slide ' + currentSlidex + ' of ' + numberSlidesy;
                //alert('Currently on slide ' + currentSlidex + ' of ' + numberSlidesy);
                //document.getElementById("moduleTitle").textContent = module_title;
                //document.getElementById("unitTitle").textContent = unit_title;
                //alert(unit_title + 'pxl to non-pxl line 443');
                //document.getElementById("navBar").style.display = "inline-block";

            }


        } //if currently at home_pxl 

        if (current_template == 'home.html') {

            if (next_template == current_template) {

                $("#header1").show();
                $("#footer").show();
                $("#content-inner").html(check_page);
                localStorage.setItem('current_location', page);
                loadFooterNav(page);
                //close the side nav if open.

                // document.getElementById("display_current").textContent  =  create_page_path(page) + '(' + x_of_y() + ')';

                var info = get_titles()
                var module_title = info['module_title']
                var unit_title = info['unit_title']
                var currentSlidex = info['currentSlidex']
                var numberSlidesy = info['numberSlidesy']

                document.getElementById("display_current").textContent = currentSlidex + ' of ' + numberSlidesy;
                document.getElementById("moduleTitle").textContent = module_title;
                document.getElementById("unitTitle").textContent = unit_title;
                document.getElementById("navBar").style.display = "inline-block";
                document.getElementById("onSlide").style.display = "inline-block";

            } else {
                window.location = 'home_pxl.html?loadPage=' + page
                localStorage.setItem('current_location', page);
                //                 var info = get_titles()
                //   var module_title = info['module_title']
                //   var unit_title = info['unit_title']
                //   var currentSlidex = info['currentSlidex']
                //   var numberSlidesy = info['numberSlidesy']

                //document.getElementById("display_current").textContent  =  'Currently on slide ' + currentSlidex + ' of ' + numberSlidesy;
                //document.getElementById("moduleTitle").textContent = module_title;
                //document.getElementById("unitTitle").textContent = unit_title;

                loadFooterNav(page);
            }


        } //if currently at home.html  

        //check if navigation should be hidden (if Unit name contains "Test" or "End of Module".  If currentSlidex = 1, it's first page so maybe keep "next" button enabled.
        var info = get_titles()
        var module_title = info['module_title']
        var unit_title = info['unit_title']
        var currentSlidex = info['currentSlidex']
        var numberSlidesy = info['numberSlidesy']
            //if(page.indexOf("_pxl_") > -1 ) next_template = 'home_pxl.html'
        if (unit_title.indexOf("Test") > -1 || unit_title.indexOf("Assessment") > -1) {
            if ((currentSlidex > 1 && currentSlidex != 12 && currentSlidex != (numberSlidesy - 1)) || currentSlidex == 11) {
                //this depends on there being 10 multiple choice questions, one intro slide, and an ending slide that can be clicked through.  But post-module assessments have 10 questions and only the last slide is clicked through.
                document.getElementById('nextPageButton').style.display = 'none';
                //alert('not a navigable page - alert from main-2.js');
            } else {
                document.getElementById('nextPageButton').style.display = 'initial';
                //alert('can only navigate forward - alert from main-2.js');
            }
            document.getElementById('previousPageButton').style.display = 'none';
            document.getElementById('wrap-footer-menu').style.display = 'none';
        } else if (unit_title.indexOf("Feedback") > -1) {
            if (currentSlidex > 1) {
                document.getElementById('nextPageButton').style.display = 'none';

            } else { document.getElementById('nextPageButton').style.display = 'initial'; }
            document.getElementById('previousPageButton').style.display = 'none';
            document.getElementById('wrap-footer-menu').style.display = 'none';
        } else { //unhide
            document.getElementById('nextPageButton').style.display = 'initial';
            document.getElementById('previousPageButton').style.display = 'initial';
            document.getElementById('wrap-footer-menu').style.display = 'initial';
        }


    } //if check page. 
    else { alert('page not found') };

    // if(!check_page) { alert('Check page sequence - there is a problem'); return false ; }

    /*

        if(!template) next_template = 'home.html' ; 

        //get current template from session or top of the page.

        if(next_template == current_template) {
            //simply load the page
        }

        else {
            // you must load the new template. 
        }

    */


} //load_page


function load_module_home(page) {

    window.location = 'home.html?loadPage=' + page;
    return;

} //load_module_home

function goHome(signal) {
    //signal = 'module' or 'unit'
    var current_page = localStorage.getItem('current_location');
    var els = current_page.split('_');
    var current_module = Number(els[0]);
    var current_unit = Number(els[1]);

    if (signal == 'module') {
        var goto_page = 'Module-' + current_module + '.html';
        load_module_home(goto_page);
    } else {
        //unit. 
        //var next_unit = (current_unit + 1).toString()
        var mod_config = JSON.parse(localStorage.getItem('module_config'));
        var goto_page = mod_config['mods']['Module-' + current_module]['conf'][current_unit.toString()]['page_sequence'][0];
        //alert(next_page)
        //var next_page = current_module + '_' +  next_unit + '_slide01.html'
        //console.log("go_next signal = unit next_page:" + next_page )
        load_page(goto_page);
    }


}

function goNext(signal) {
    //signal = 'module' or 'unit'. Record the 
    var current_page = localStorage.getItem('current_location') //1_1_slide10.html
    var els = current_page.split('_')
    var current_module = Number(els[0])
    var current_unit = Number(els[1])

    if (signal == 'module') {
        var next = current_module + 1;
        if (next == 6) next += 1;
        var next_module = next.toString()
        var next_page = 'Module-' + next_module + '.html'
        update_units(current_module, current_unit)
        load_module_home(next_page)

    } else if (signal == 'unit') {
        //unit. 
        var next_unit = (current_unit + 1).toString()
        var mod_config = JSON.parse(localStorage.getItem('module_config'));
        var next_page = mod_config['mods']['Module-' + current_module]['conf'][next_unit]['page_sequence'][0]

        //update the user object. 

        update_units(current_module, current_unit)

        load_page(next_page)
    } else {
        //feedback
        var next = 100;
        //if (next == 6) next +=1; 
        var next_module = next.toString()
        var next_page = 'Module-' + next_module + '.html'
        update_units(current_module, current_unit)
        load_module_home(next_page)
    }



} //function goNext

function findCorrectAnswer(tbleId, chkVal) {

    var usrAns = tbleId + ':' + chkVal[0].id;

    var ansArray = [
        '1_3_slide03:r2', '1_3_slide04:r3', '1_3_slide05:r2', '1_3_slide06:r2', '1_3_slide07:r1',
        '1_3_slide08:r2', '1_3_slide09:r2', '1_3_slide10:r2', '1_3_slide11:r2', '1_3_slide12:r2',

        '2_5_slide02:r1', '2_5_slide03:r3', '2_5_slide04:r3', '2_5_slide05:r3', '2_5_slide06:r3',
        '2_5_slide07:r4', '2_5_slide08:r1', '2_5_slide09:r4', '2_5_slide10:r2', '2_5_slide11:r1',

        '3_8_slide02:r2', '3_8_slide03:r2', '3_8_slide04:r4', '3_8_slide05:r4', '3_8_slide06:r2',
        '3_8_slide07:r1', '3_8_slide08:r1', '3_8_slide09:r2', '3_8_slide10:r4', '3_8_slide11:r4',

        '4_3_slide02:r1', '4_3_slide03:r3', '4_3_slide04:r4', '4_3_slide05:r4', '4_3_slide06:r4',
        '4_3_slide07:r3', '4_3_slide08:r2', '4_3_slide09:r3', '4_3_slide10:r2', '4_3_slide11:r3',

        '5_4_slide03:r2', '5_4_slide04:r3', '5_4_slide05:r1', '5_4_slide06:r2', '5_4_slide07:r1',
        '5_4_slide08:r3', '5_4_slide09:r2', '5_4_slide10:r2', '5_4_slide11:r4', '5_4_slide12:r1',

        //'6_0_slide03:r1','6_0_slide04:r2','6_0_slide05:r4','6_0_slide06:r4','6_0_slide07:r1',
        //'6_0_slide08:r1', '6_0_slide09:r2','6_0_slide10:r1','6_0_slide11:r1','6_0_slide12:r4',

        //'7_0_slide03:r1','7_0_slide04:r1', '7_0_slide05:r3','7_0_slide06:r4','7_0_slide07:r1',
        //'7_0_slide08:r3','7_0_slide09:r3','7_0_slide10:r1', '7_0_slide11:r1','7_0_slide12:r4',

    ];


    // console.log(usrAns);
    // console.log(ansArray);
    var res = jQuery.inArray(usrAns, ansArray);

    if (res != -1) {
        //Answer correct
        // alert("correct answer");
        $(".alert").show();
    } else {
        //Wrong Answer
        //  alert("wrong answer");
        $(".alert2").show();
    }

} //find correct answer. 

function submitButtonDisplay() {
    $(".button_id").show();

}




function nav_to_pxl(signal) {

    //gets the current page and signal, and gets next page to load and calls the load 
    var current_page = localStorage.getItem('current_location'); //5_0_slide02.html
    //alert(current_page);
    if (!current_page) current_page = '0_0_slide01.html'
    var target = get_next_page(current_page, signal); //returns the full page 
    var template = 'home.html'
    if (target.indexOf("_pxl_") > -1) template = 'home_pxl.html'

    console.log("nav_to target next page:" + target)

    //just to make sure current i-frame gets cleared. use jquery remove 
    $("#content-right").remove();

    window.location.replace(template + '?loadPage=' + target)

    //window.location = template + '?loadPage=' + page 


}


function saveMCQanswer(questionId, chkVal) {
    var usrAns = chkVal[0].id;
    var usrAns = usrAns[1]; //Second part (answer id is r1, r2, r3, r4; just want number)
    localStorage.setItem(questionId, usrAns); //questionId is e.g. assessmentMCQ1, preMCQ10, postMCQ4
    //Go to next page
    nav_to('next');
}

function generateTestFeedback(MCQtestname, numMCQs, PXLtestname, numPXLs) {
    //alert('generateTestFeedback ran');
    //For Pre- and Post- test, give answers at end of exam.  This is called at end of exam, displays a score for each section of exam (MCQ and virtual slides).
    //MCQtestname is prefix of questionID: preMCQ, postMCQ
    //PXLtestname is "preq" or "postq"; need to make sure this doesn't cause problems if switching between exams.

    var mcCorrect = 0;
    var isCorrect = '';
    var incomplete = 0;
    var all_user_answers = {};

    if (MCQtestname == 'preMCQ') {
        //pre test
        var correctAnswers = '1244112114';
    } else {
        //post test
        var correctAnswers = '1134133132';
    }

    for (i = 1; i <= numMCQs; i++) {
        var userAnswer = localStorage.getItem(MCQtestname + i.toString());
        all_user_answers[MCQtestname + i.toString()] = userAnswer;
        if (userAnswer === null) { incomplete = 1; };
        if (userAnswer == correctAnswers[i - 1]) {
            mcCorrect++;
            isCorrect = isCorrect + '1';
        } else { isCorrect = isCorrect + '0'; }
    }

    var reportScore = 0;
    var allReports = '';
    for (i = 1; i <= numPXLs; i++) {
        var reportName = PXLtestname + i.toString();
        var reportAnswerName = MCQtestname + i.toString();
        var userReport = localStorage.getItem(reportName); //This is an (up to) 10-digit number that needs to be parsed.
        //alert(reportName+userReport);
        //alert(userReport);
        if (userReport === null) { incomplete = 1; };
        var thisReportScore = getSingleReportScoreAndFeedback(userReport, reportName);
        //thisReportScore = thisReportScore[0];
        reportScore = reportScore + thisReportScore.thisScore;
        allReports = allReports + '<b>Slide ' + i.toString() + ': </b><br>' + thisReportScore.thisReport + '<br><br><br>';

        //alert(reportScore);
        all_user_answers[reportName] = userReport;
        var current_user = localStorage.getItem('logged_in');
        var user_data = JSON.parse(localStorage.getItem(JSON.parse(current_user)))

    }

    //get current date 
    var now = new Date();
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    //var date = (now.getMonth() + 1 ) + "/" +  now.getDate() + "/" + now.getFullYear() + " " 
    var date = monthNames[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear() + ", " + now.toTimeString().substring(0, 8);
    //insert scores into user file mcCorrect -> pretestMCQscores OR posttestMCQscores; reportScore -> pretestVSscores or posttestVSscores.
    if (MCQtestname == 'preMCQ') {
        //pre test
        //var correctAnswers = '1244112114';

        user_data.pretestMCQscores.push(mcCorrect)
        user_data.pretestVSscores.push(reportScore)
        user_data.pretestcompletiondatetime.push(date)

        localStorage.setItem(JSON.parse(current_user), JSON.stringify(user_data))
        update_on_disk(JSON.parse(current_user) + '.txt', user_data)

    } else {
        //post test
        //var correctAnswers = '1134133114';

        user_data.posttestMCQscores.push(mcCorrect)
        user_data.posttestVSscores.push(reportScore)
        user_data.posttestcompletiondatetime.push(date)

        localStorage.setItem(JSON.parse(current_user), JSON.stringify(user_data))
        update_on_disk(JSON.parse(current_user) + '.txt', user_data)


    }

    all_user_answers["username"] = current_user;
    all_user_answers["timestamp"] = now.valueOf();
    //update_on_disk(JSON.parse(current_user) + '_' + now.valueOf(), all_user_answers); //now handling saving data in submit_data_to_server
    //try to send all_user_answers to server:
    submit_data_to_server('user_test_data_object', all_user_answers);
    //alert('submitted');

    //alert(JSON.stringify(all_user_answers));
    //alert('mcCorrect=' + mcCorrect.toString());
    //alert('reportScore = ' + reportScore.toString());
    return {
        mcCorrect: mcCorrect,
        reportScore: reportScore,
        isCorrect: isCorrect,
        allReports: allReports,
        incomplete: incomplete
    };
}

function getSingleReportScoreAndFeedback(userReport, reportName) {
    //output a score and feedback.  Based on Answer key within this function.
    //parse user's answer
    //alert('getSingleReportScoreAndFeedback ran');
    var quantitation = Math.floor(userReport / 10000); //should be between 0 and 999999
    userReport = userReport - quantitation * 10000; //now should be 4 digit number between 0 and 2^13.
    userReportBinary = userReport.toString(2); //Now an up-to-13-digit binary number in string format
    //alert(userReportBinary);
    //alert(userReportBinary.length.toString());
    //Pad to 13 digits: 
    for (ii = userReportBinary.length; ii < 13; ii++) {
        userReportBinary = '0' + userReportBinary;
    }
    //alert('line506');
    var parasiteText = '';
    var Pfe = 0;
    var Pve = 0;
    var Pme = 0;
    var Poe = 0;
    var nmps = 0;
    //alert('line512');
    if (userReportBinary.substring(0, 1) == '1') { //MPS
        Pf = userReportBinary.substring(1, 4);
        if (Pf != '000') {
            parasiteText = parasiteText + '<i>Plasmodium falciparum</i> ';
            Pfe = 1;
            switch (Pf) {
                case '100':
                    parasiteText = parasiteText + 'trophozoites seen. ';
                    break;
                case '010':
                    parasiteText = parasiteText + 'schizonts seen. ';
                    break;
                case '001':
                    parasiteText = parasiteText + 'gametocytes seen. ';
                    break;
                case '110':
                    parasiteText = parasiteText + 'trophozoites and schizonts seen. ';
                    break;
                case '101':
                    parasiteText = parasiteText + 'trophozoites and gametocytes seen. ';
                    break;
                case '011':
                    parasiteText = parasiteText + 'schizonts and gametocytes seen. ';
                    break;
                case '111':
                    parasiteText = parasiteText + 'trophozoites, schizonts, and gametocytes seen. ';
                    break;
            }
        }
        Pv = userReportBinary.substring(4, 7);
        if (Pv != '000') {
            parasiteText = parasiteText + '<i>Plasmodium vivax</i> ';
            Pve = 1;
            switch (Pv) {
                case '100':
                    parasiteText = parasiteText + 'trophozoites seen. ';
                    break;
                case '010':
                    parasiteText = parasiteText + 'schizonts seen. ';
                    break;
                case '001':
                    parasiteText = parasiteText + 'gametocytes seen. ';
                    break;
                case '110':
                    parasiteText = parasiteText + 'trophozoites and schizonts seen. ';
                    break;
                case '101':
                    parasiteText = parasiteText + 'trophozoites and gametocytes seen. ';
                    break;
                case '011':
                    parasiteText = parasiteText + 'schizonts and gametocytes seen. ';
                    break;
                case '111':
                    parasiteText = parasiteText + 'trophozoites, schizonts, and gametocytes seen. ';
                    break;
            }
        }
        Pm = userReportBinary.substring(7, 10);
        if (Pm != '000') {
            parasiteText = parasiteText + '<i>Plasmodium malariae</i> ';
            Pme = 1;
            switch (Pm) {
                case '100':
                    parasiteText = parasiteText + 'trophozoites seen. ';
                    break;
                case '010':
                    parasiteText = parasiteText + 'schizonts seen. ';
                    break;
                case '001':
                    parasiteText = parasiteText + 'gametocytes seen. ';
                    break;
                case '110':
                    parasiteText = parasiteText + 'trophozoites and schizonts seen. ';
                    break;
                case '101':
                    parasiteText = parasiteText + 'trophozoites and gametocytes seen. ';
                    break;
                case '011':
                    parasiteText = parasiteText + 'schizonts and gametocytes seen. ';
                    break;
                case '111':
                    parasiteText = parasiteText + 'trophozoites, schizonts, and gametocytes seen. ';
                    break;
            }
        }
        Po = userReportBinary.substring(10, 13);
        if (Po != '000') {
            parasiteText = parasiteText + '<i>Plasmodium ovale</i> ';
            Poe = 1;
            switch (Po) {
                case '100':
                    parasiteText = parasiteText + 'trophozoites seen. ';
                    break;
                case '010':
                    parasiteText = parasiteText + 'schizonts seen. ';
                    break;
                case '001':
                    parasiteText = parasiteText + 'gametocytes seen. ';
                    break;
                case '110':
                    parasiteText = parasiteText + 'trophozoites and schizonts seen. ';
                    break;
                case '101':
                    parasiteText = parasiteText + 'trophozoites and gametocytes seen. ';
                    break;
                case '011':
                    parasiteText = parasiteText + 'schizonts and gametocytes seen. ';
                    break;
                case '111':
                    parasiteText = parasiteText + 'trophozoites, schizonts, and gametocytes seen. ';
                    break;
            }
        }
        parasiteText = parasiteText + quantitation.toString() + ' asexual parasites per microlitre.';

    } else { //NMPS
        parasiteText = 'No malaria parasites seen.';
        nmps = 1;
    }

    var thisScore = 0;
    var speciesScore = 0;
    var quantScore = 0;
    var thisReport = 'You reported: <b>' + parasiteText + '</b>';
    //alert('line581');
    //get correct report and calculate score
    switch (reportName) {
        case 'preq1': //
            var correctQuant = 5800;
            //alert('case1');
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue"><i>P. vivax</i> trophozoites, schizonts, and gametocytes seen, 5800 parasites/microlitre. </font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisScore = 5;
                thisReport = thisReport + 'Out of a total of 10 possible points: <br>You correctly marked the sample as containing parasites (5 points). <br>';
                if (Pve == 1) {
                    speciesScore = 3;
                    thisReport = thisReport + 'You correctly identified <i>P.v</i> parasites (3 points). ';
                    if (Pfe + Pme + Poe > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else {
                    thisReport = thisReport + 'But you incorrectly identified the species (0 points out of 3 possible). ';
                }
                if (quantitation >= 0.75 * correctQuant && quantitation <= 1.25 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 25% of the true value (2 points).';
                    quantScore = 2;
                } else if (quantitation >= 0.5 * correctQuant && quantitation <= 1.5 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 50% of the true value, but not within 25% (1 point out of 2 possible).';
                    quantScore = 1;
                } else {
                    thisReport = thisReport + '<br>Your Quantitation was not within 50% of the true value (0 points out of 2 possible). ';
                    //quantScore = 0;
                }
            } else {
                thisReport = thisReport + 'NMPS is incorrect (0 points out of 10 possible).';
            }


            break;

        case 'preq2': //
            var correctQuant = 5300;
            //alert('case1');
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue"><i>P. falciparum</i> trophozoites seen, 5300 parasites/microlitre. </font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisScore = 5;
                thisReport = thisReport + 'Out of a total of 10 possible points: <br>You correctly marked the sample as containing parasites (5 points). <br>';
                if (Pfe == 1) {
                    speciesScore = 3;
                    thisReport = thisReport + 'You correctly identified <i>P.f.</i> parasites (3 points). ';
                    if (Pme + Pve + Poe > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else {
                    thisReport = thisReport + 'But you incorrectly identified the species (0 points out of 3 possible). ';
                }
                if (quantitation >= 0.75 * correctQuant && quantitation <= 1.25 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 25% of the true value (2 points).';
                    quantScore = 2;
                } else if (quantitation >= 0.5 * correctQuant && quantitation <= 1.5 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 50% of the true value, but not within 25% (1 point out of 2 possible).';
                    quantScore = 1;
                } else {
                    thisReport = thisReport + '<br>Your Quantitation was not within 50% of the true value (0 points out of 2 possible). ';
                    //quantScore = 0;
                }
            } else {
                thisReport = thisReport + 'NMPS is incorrect (0 points out of 10 possible).';
            }


            break;

        case 'preq3':
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue">No malaria parasites seen.</font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisReport = thisReport + 'You incorrectly marked the sample as containing parasites (0 points out of 5 possible). ';
            } else {
                thisReport = thisReport + 'You correctly marked the sample as NMPS (5 points).';
                thisScore = 5;
            }
            break;
        case 'preq4':
            var correctQuant = 12000;
            var correctQuant2 = 50000;
            //alert('case1');
            thisReport = thisReport + '<br>Our report for this sample is:   <font color="blue"><em>P. malariae</em> trophozoites, schizonts, and gametocytes seen, 12000 asexual parasites/microlitre. </font><br>  Note: This is an example where quantitation using the thick film resulted in much higher count than using the thin film.  We used the thin film for the above report, but using the thick film we calculate roughly 50000 parasites/microlitre!  The discrepancy seems to be due to a low white blood cell density. The score calculated for this sample gives credit as long as you are within range of either of these values. <br>';
            //check that MPS:
            if (nmps == 0) {
                thisScore = 5;
                thisReport = thisReport + 'Out of a total of 10 possible points: <br>You correctly marked the sample as containing parasites (5 points). <br>';
                if (Pme == 1) {
                    speciesScore = 3;
                    thisReport = thisReport + 'You correctly identified <i>P.m.</i> parasites (3 points). ';
                    if (Pfe + Pve + Poe > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else {
                    thisReport = thisReport + 'But you incorrectly identified the species (0 points out of 3 possible). ';
                }
                if (quantitation >= 0.75 * correctQuant && quantitation <= 1.25 * correctQuant2) {
                    thisReport = thisReport + '<br>Your Quantitation was within 25% of the true value (2 points).';
                    quantScore = 2;
                } else if (quantitation >= 0.5 * correctQuant && quantitation <= 1.5 * correctQuant2) {
                    thisReport = thisReport + '<br>Your Quantitation was within 50% of the true value, but not within 25% (1 point out of 2 possible).';
                    quantScore = 1;
                } else {
                    thisReport = thisReport + '<br>Your Quantitation was not within 50% of the true value (0 points out of 2 possible). ';
                    //quantScore = 0;
                }
            } else {
                thisReport = thisReport + 'NMPS is incorrect (0 points out of 10 possible).';
            }


            break;

        case 'postq1': //P. malariae trophozoites, schizonts, and gametocytes seen, 880 asexual parasites/microlitre.
            //Note: Gametocytes are difficult to distinguish from mature trophozoites in this sample, so you do not lose points for not reporting gametocytes.
            var correctQuant = 880;
            //alert('case1');
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue"><i>Plasmodium malariae</i> trophozoites, schizonts, and gametocytes seen. Total 880 asexual parasites/microlitre. </font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisScore = 5;
                thisReport = thisReport + 'Out of a total of 10 possible points: <br>You correctly marked the sample as containing parasites (5 points). <br>';
                if (Pme == 1) {
                    speciesScore = 3;
                    thisReport = thisReport + 'You correctly identified <i>P.m.</i> parasites (3 points). ';
                    if (Pfe + Pve + Poe > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else {
                    thisReport = thisReport + 'But you incorrectly identified the species (0 points out of 3 possible). ';
                }
                if (quantitation >= 0.75 * correctQuant && quantitation <= 1.25 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 25% of the true value (2 points).';
                    quantScore = 2;
                } else if (quantitation >= 0.5 * correctQuant && quantitation <= 1.5 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 50% of the true value, but not within 25% (1 point out of 2 possible).';
                    quantScore = 1;
                } else {
                    thisReport = thisReport + '<br>Your Quantitation was not within 50% of the true value (0 points out of 2 possible). ';
                    //quantScore = 0;
                }
            } else {
                thisReport = thisReport + 'NMPS is incorrect (0 points out of 10 possible).';
            }


            break;
        case 'postq2': //P. falciparum trophozoites and gametocytes, and P. ovale trophozoites and gametocytes seen; total 9540 trophozoites/microlitre. 
            var correctQuant = 9540;
            //alert('case2');
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue"><i>P. falciparum</i> trophozoites and gametocytes, and <i>P. ovale</i> trophozoites and gametocytes seen; total 9540 trophozoites/microlitre. </font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisScore = 5;
                thisReport = thisReport + 'Out of a total of 10 possible points: <br>You correctly marked the sample as containing parasites (5 points). <br>';
                if (Pfe == 1 && Poe == 1) {
                    speciesScore = 3;
                    thisReport = thisReport + 'You correctly identified <i>P.f.</i> and <i>P.o.</i> parasites (3 points). ';
                    if (Pme + Pve > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else if (Pfe == 1 || Poe == 1) {
                    thisReport = thisReport + 'You identified one of the two species present (2 points out of 3 possible). ';
                    speciesScore = 2;
                    if (Pme + Pve > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else {
                    thisReport = thisReport + 'But you incorrectly identified the species (0 points out of 3 possible).';
                }
                if (quantitation >= 0.75 * correctQuant && quantitation <= 1.25 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 25% of the true value (2 points).';
                    quantScore = 2;
                } else if (quantitation >= 0.5 * correctQuant && quantitation <= 1.5 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 50% of the true value, but not within 25% (1 point out of 2 possible).';
                    quantScore = 1;
                } else {
                    thisReport = thisReport + '<br>Your Quantitation was not within 50% of the true value (0 points out of 2 possible). ';
                    //quantScore = 0;
                }
            } else {
                thisReport = thisReport + 'NMPS is incorrect (0 points out of 10 possible).';
            }

            break;
        case 'postq3': //NMPS
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue">No malaria parasites seen.</font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisReport = thisReport + 'You incorrectly marked the sample as containing parasites (0 points out of 5 possible). ';
            } else {
                thisReport = thisReport + 'You correctly marked the sample as NMPS (5 points).';
                thisScore = 5;
            }

            break;
        case 'postq4': //P. vivax trophozoites seen, 4000 parasites/microlitre. 
            var correctQuant = 4000;
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue"><i>P. vivax</i> trophozoites seen, 4000 parasites/microlitre. </font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisScore = 5;
                thisReport = thisReport + 'Out of a total of 10 possible points: <br>You correctly marked the sample as containing parasites (5 points). <br>';
                if (Pve == 1) {
                    speciesScore = 3;
                    thisReport = thisReport + 'You correctly identified <i>P.v.</i> parasites (3 points). ';
                    if (Pfe + Pme + Poe > 0) {
                        speciesScore = speciesScore - 1;
                        thisReport = thisReport + 'But you incorrectly identified other species as being present (-1 point). ';
                    }
                } else {
                    thisReport = thisReport + 'But you incorrectly identified the species (0 points out of 3 possible). ';
                }
                if (quantitation >= 0.75 * correctQuant && quantitation <= 1.25 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 25% of the true value (2 points).';
                    quantScore = 2;
                } else if (quantitation >= 0.5 * correctQuant && quantitation <= 1.5 * correctQuant) {
                    thisReport = thisReport + '<br>Your Quantitation was within 50% of the true value, but not within 25% (1 point out of 2 possible).';
                    quantScore = 1;
                } else {
                    thisReport = thisReport + '<br>Your Quantitation was not within 50% of the true value (0 points out of 2 possible). ';
                    //quantScore = 0;
                }
            } else {
                thisReport = thisReport + 'NMPS is incorrect (0 points out of 10 possible).';
            }


            break;
        case 'postq5': //NMPS
            thisReport = thisReport + '<br>Our report for this sample is: <font color="blue">No malaria parasites seen.</font><br>';
            //check that MPS:
            if (nmps == 0) {
                thisReport = thisReport + 'You incorrectly marked the sample as containing parasites (0 points out of 5 possible). ';
            } else {
                thisReport = thisReport + 'You correctly marked the sample as NMPS (5 points).';
                thisScore = 5;
            }

            break;
    }
    thisScore = thisScore + speciesScore + quantScore;
    //blehReport = reportName + ' ' + thisReport;
    //alert(blehReport);
    return {
        thisScore: thisScore,
        thisReport: thisReport
    };
}


function compileMCQ(MCQidArray) {
    //Turn array of MCQ answers (1,2,3,4) into a short string OR 10 digit number (to be converted to code)
}


//feb 19th. vikas added functions


function capture_survey_result() {

    //get the object 
    var x = document.getElementsByTagName("input");

    var survey_results = JSON.parse(localStorage.getItem('survey_results')) //returns an object

    //alert(survey_results)

    if (!survey_results) survey_results = {}


    for (i = 0; i < x.length; i++) {


        var elem = x[i]


        if (elem.type == 'checkbox' || elem.type == 'radio') {


            if (elem.checked) {

                console.log(elem.name + ':' + elem.value)

                survey_results[elem.name] = elem.value


            }





        } //if type 'checkbox'
        else {

            if (elem.name !== '') {

                console.log(elem.name + ':' + elem.value)

                survey_results[elem.name] = elem.value

            }

        }



    }

    //grab text areas using jquery. 

    $('textarea').each(function() {

        var value = $(this).val();
        var name = $(this).attr('name');
        //console.log(name + ':' + value) ;

        survey_results[name] = value


    });

    //alert(JSON.stringify(survey_results))

    localStorage.setItem('survey_results', JSON.stringify(survey_results));


    nav_to('next');



} //capture survey results


function show_test_report(test_type, output_table) {

    var current_user = localStorage.getItem('logged_in')
    var user_data = JSON.parse(localStorage.getItem(JSON.parse(current_user)))
        //test_type = pretest or posttest 

    var date_list = 'posttestcompletiondatetime';
    var correct_ans = 'posttestMCQscores';
    var report_ans = 'posttestVSscores';

    if (test_type == 'pretest') {

        var date_list = 'pretestcompletiondatetime';
        var correct_ans = 'pretestMCQscores';
        var report_ans = 'pretestVSscores';
    }

    //get results 

    var dates = user_data[date_list]
    var correct = user_data[correct_ans]
    var vsreport = user_data[report_ans]
        //create table 
    var total = [];

    //alert(correct);
    var table = document.getElementById(output_table);

    //alert(table)

    //table.setAttribute("class", "login_table") ; 

    //var counter = 0; 

    //3 rows 4 columns will be added. 

    var rows = correct.length // i.e. 3
    var columns = 4 // i.e, 4 

    for (var i = 0; i < rows; ++i) {

        var row = document.createElement('tr');
        //row.setAttribute("class", "results_rows"); 
        total[i] = correct[i] + vsreport[i];
        //for (var j = i*columns ; j < j + columns ; ++j) {

        for (var j = 0; j < columns; ++j) {
            if (j == 0) data_list = dates;
            if (j == 1) data_list = correct;
            if (j == 2) data_list = vsreport;
            if (j == 3) data_list = total;

            var txt = data_list[i]

            var tds = document.createElement('td');
            tds.setAttribute("class", "results-td");

            var new_td = row.appendChild(tds);

            //new_td.style.height ="50px"; 

            //if (j%2 !=0) new_td.style.backgroundColor = "grey";
            //if (j%2 ==0) new_td.style.backgroundColor = "cream";

            /*
            console.log("i%2 :" + i%2)
            tds.style.removeProperty('backgroundColor');
            if (i%2 !=0) row.style.backgroundColor = "grey";
            if (i%2 == 0) row.style.backgroundColor = "yellow";
            */


            row.cells[j].appendChild(document.createTextNode(txt));



        } //for inner


        table.appendChild(row);

    } //for outer

} //function show test results 

function submit_data_to_server(data_type, data_object) {

    //data_type = 'user_data' , 'feedback_survey' , 'certification_test' , pre_test, post_data

    //data_object - > a JSON object containing the data load that needs to be set to the serve. 

    if (data_object == null || typeof data_object !== 'object') {
        if (data_type == "survey_response") { alert('An error occurred - please save the result file to your computer and send via email later.'); };
        return;
    }

    data_object = JSON.stringify(data_object);

    var endpoint = data_type;
    var current_user = localStorage.getItem('logged_in')
    var now = new Date();

    //alert(current_user);
    //alert(JSON.parse(current_user));

    var url_endpoint = 'http://mmelc.vestigesystems.com/deviceData';

    var load = { 'user': JSON.parse(current_user), 'data_load': data_object, 'data_type': data_type }

    //alert(JSON.stringify(load));

    $.ajax({

        type: 'GET',

        url: url_endpoint,
        //url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds', //bad ur for tets 

        dataType: 'jsonp',
        data: load,

        success: function(data) {
            update_on_disk('sentdata/' + JSON.parse(current_user) + now.valueOf(), load);
            console.log("success: " + JSON.stringify(load))
            if (data_type == "survey_response") { alert('Thank you, your feedback has been received!'); };


        },

        error: function(data) {

            update_on_disk('unreceiveddata/' + JSON.parse(current_user) + now.valueOf(), load);
            console.log("submit_data_error: " + JSON.stringify(load))
            if (data_type == "survey_response") { alert('An error occurred - please save the result file to your computer and send via email later.'); };


        }



    });

} //submit_data_to_server



function create_cert_ans_key_to_submit() {

range1 =10;
range2= 5;

var range01 = [1,2,3,4,5,6,7,8,9,10]
var range02 = [1,2,3,4,5]

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

for (a = 0; a < qs.length; a++) {
  var an = localStorage.getItem(qs[a]);
  ans.push(an);
}

return [qs, ans];
  
} // create_cert_ans

function submit_cert_ans_to_server(anskey) {


  $.ajax({
    type: 'GET',
    //url: 'http://githubbadge.appspot.com/badge/torvalds',
    url: 'http://githubbbadpspot-bad-url-test.com/badge/toralds',
    //url: 'http://mmelc.vestigesystems.com/submitcert', 
    dataType: 'jsonp',
    data: anskey, 

    success: function(json) {
       // var result = json.user.login 

       //alert("live results from server:" + json.status + ':' + json.result);

       alert("success")
              
    },

    error: function(){
      //alert('please note down following key to get your results:  ' + 'USER ID:  '+ load.test_taker_user_id
            // + '  Answer Key :' + load.answer_key);

      //window.location.href = "/content/posttest_protected/results.html"; 

      alert('errror')


    }

});

}//  submit_cert to server


function return_to_last(){
	
var current_user = JSON.parse(localStorage.getItem('logged_in'))
        
var user_data = JSON.parse(localStorage.getItem(current_user))

var last_page = user_data.last_visited_page

if(last_page){

load_page(last_page)


}

else {

alert('nothing to do');

}

}// return_to_last
