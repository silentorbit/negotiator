"use strict";

// Used in both background and page

//return whether the domain contain a leading wildcard
function isWild(domain: string) {
    if (domain.length == 0)
        return false;
    return domain.indexOf("*") == 0;
}

//return domain without leading wildcard
function withoutWild(domain: string) {
    if (isWild(domain))
        return domain.substring(1);
    else
        return domain;
}


//Choices for random User-Agent
var uaPlatform = ["Windows", "X11", "Macintosh"];
//, "iPad", "iPhone" 
var uaArch = ["Linux x86_64", "Linux i686", "Linux i586", "FreeBSD i386", "Intel Mac OS X 10.5", "Intel Mac OS X 10_5_8", "Intel Mac OS X 10_6_3", "PPC Mac OS X 10.5", "Windows NT 5.1", "Windows NT 5.2", "Windows NT 6.0", "Windows NT 6.1"];
//, "CPU iPhone OS 3_2 like Mac OS X", "CPU OS 3_2 like Mac OS X" 
var uaLang = ["ab", "aa", "af", "ak", "sq", "am", "ar", "an", "hy", "as", "av", "ae", "ay", "az", "bm", "ba", "eu", "be", "bn", "bh", "bi", "bjn", "bs", "br", "bg", "my", "ca", "ch", "ce", "ny", "zh", "cv", "kw", "co", "cr", "hr", "cs", "da", "day", "dv", "nl", "dz", "en", "eo", "et", "ee", "fo", "fj", "fi", "fr", "ff", "gl", "ka", "de", "el", "gn", "gu", "ht", "ha", "he", "hz", "hi", "ho", "hu", "ia", "id", "ie", "ga", "ig", "ik", "io", "is", "it", "iu", "ja", "jv", "kl", "kn", "kr", "ks", "kk", "km", "ki", "rw", "ky", "kv", "kg", "ko", "ku", "kj", "la", "lb", "lg", "li", "ln", "lo", "lt", "lu", "lv", "gv", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mh", "mn", "na", "nv", "nb", "nd", "ne", "ng", "nn", "no", "ii", "nr", "oc", "oj", "cu", "om", "or", "os", "pa", "pi", "fa", "pl", "ps", "pt", "qu", "rm", "rn", "ro", "ru", "sa", "sc", "sd", "se", "sm", "sg", "sr", "gd", "sn", "si", "sk", "sl", "so", "st", "es", "su", "sw", "ss", "sv", "ta", "te", "tg", "th", "ti", "bo", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty", "ug", "uk", "ur", "uz", "ve", "vi", "vo", "wa", "cy", "wo", "fy", "xh", "yi", "yo", "za", "zu"];
//, "AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B314"
var uaEngine = ["AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0", "AppleWebKit/533.16 (KHTML, like Gecko) Version/4.1", "AppleWebKit/533.4 (KHTML, like Gecko) Version/4.1", "AppleWebKit/531.22.7 (KHTML, like Gecko) Version/4.0.5 ", "AppleWebKit/528.16 (KHTML, like Gecko) Version/4.0 ", "Gecko/20100401", "Gecko/20121223", "Gecko/2008092313", "Gecko/20100614", "Gecko/20100625", "Gecko/20100403", "Gecko/20100401", "Gecko/20100404", "Gecko/20100401", "Gecko/20100101", "Gecko/20100115", "Gecko/20091215", "Gecko/20090612", "Gecko/20090624", "AppleWebKit/534.2 (KHTML, like Gecko)", "AppleWebKit/534.1 (KHTML, like Gecko)", "AppleWebKit/533.2 (KHTML, like Gecko)", "AppleWebKit/533.3 (KHTML, like Gecko)"];
var uaBrowser = ["Safari/533.16", "Safari/533.4", "Safari/533.3", "Safari/534.1", "Safari/534.2", "Safari/528.16", "Firefox/4.0 (.NET CLR 3.5.30729)", "Firefox/3.5", "Firefox/3.6", "Firefox/3.5", "Firefox/3.5.6", "Chrome/6.0.428.0", "Chrome/6.0.422.0", "Chrome/6.0", "Chrome/5.0.357.0"];
var uaOS = ["Fedora/3.5.9-2.fc12 Firefox/3.5.9", "Ubuntu/8.04 (hardy)", "Ubuntu/9.10 (karmic)", "Ubuntu/12.04", "Gentoo", "Ubuntu/10.04 (lucid)", "Fedora/3.6.3-4.fc13", "SUSE/3.6.3-1.1", "", "", ""];

function getRandom(list: string[]) {
    var index = Math.floor(Math.random() * list.length);
    return list[index];
}

function getRandomUserAgent() {
    return "Mozilla/5.0 (" + getRandom(uaPlatform) + "; U; " + getRandom(uaArch) + "; " + getRandom(uaLang) + ") " + getRandom(uaEngine) + " " + getRandom(uaBrowser) + " " + getRandom(uaOS);
}

//Keep a few parameters to allow login to google accounts
var ua = navigator.userAgent;
var userAgent = ua.match(/^([^ ]*)/g) + " (X) " +
    (ua.match(/(AppleWebKit[^ ]*)/g) || "") + " (KHTML, like Gecko) " +
    (ua.match(/(Chrome[^ ]*)/g) || "");
userAgent = userAgent.replace("  ", " ");

function RemoveAllChildren(tag: HTMLElement) {
    while (tag.firstChild)
        tag.removeChild(tag.firstChild);
}
