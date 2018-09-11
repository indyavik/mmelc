/**
* This is the abstract console.log file
*
* @author: Christopher Chestnut 03/09/2014
*/
if (typeof pxl === 'undefined' || pxl == null) { pxl = {}; };
/**
 * Create  a  fallback  console  to  prevent  errors  on  browsers  which  do  not  have  a  console.
 *
 * @method nullfunction
 * @return nothing
 */
var nullfunction = function (msg) {};
/**
 * Does the check to see if the browser supports console.log if 
 * it does not then use the null function above
 *
 * @method pxl.console
 * @return either windows.log or null function
 */
pxl.console = (window.console ? window.console.log : nullfunction);