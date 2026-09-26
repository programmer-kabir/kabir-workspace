var siteCatalyst = (function () {
    var s_adobe = typeof window !== 'undefined' && window.s_adobe ? window.s_adobe : null;

    function setPageName(hash) {
        if (s_adobe) {
            var pageURL = _getBasePageURL() + ((hash != null) ? hash : "");
            pageURL = pageURL.replace(/\.html/, "");
            pageURL = pageURL.replace("#", "/");
            s_adobe.s_URL = pageURL;
            s_adobe.s_URLSplit = s_adobe.s_URL.split("/");
            s_adobe.pageName = s_adobe.s_URLSplit.join(":");
            s_adobe.channel = "Creative Cloud Learn";
            /* Set Language Locale */
            if (s_adobe.s_URLSplit[1] != "creative-cloud") {
                s_adobe.prop4 = s_adobe.s_URLSplit[1];
            }
            else {
                s_adobe.prop4 = "en_us";
            }
        }
    }

    function trackCustomLink(linkNameSuffix, linkElement) {
        if (s_adobe) {
            var linkName = s_adobe.pageName + ":" + linkNameSuffix + "_click";
            s_adobe.linkTrackVars = "prop1,prop3,prop4,prop5,prop14,channel";
            s_adobe.tl(((linkElement != null) ? linkElement : true), "o", linkName);
        }
    }

    function trackPageView() {
        if (s_adobe) {
            s_adobe.t();
        }
    }

    function _getBasePageURL() {
        var pageURL = location.hostname + ((location.pathname.charAt(0) == '/') ? location.pathname : '/' + location.pathname);
        if (pageURL.substring(pageURL.lastIndexOf('/') + 1) == "") pageURL = pageURL +  "index.html";
        return pageURL;
    }

    return {
        setPageName: setPageName,
        trackCustomLink: trackCustomLink,
        trackPageView: trackPageView
    };
})();
