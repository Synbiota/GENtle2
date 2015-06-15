// http://stackoverflow.com/a/24120935
function placeTextWithEllipsis(textObj,textString,width){
    textObj.textContent=textString;

    //ellipsis is needed
    if (textObj.getSubStringLength(0,textString.length)>=width){
        for (var x=textString.length-3;x>0;x-=3){
            if (textObj.getSubStringLength(0,x)<=width){
                textObj.textContent=textString.substring(0,x)+" \u2026";
                return;
            }
        }
        textObj.textContent="\u2026"; //can't place at all
    }
}

export default placeTextWithEllipsis;