/** BJC-CURRICULUM
 * sets up a BJC curriculum page -- either local or external.
 * Uses jquery, jquery-ui.
 * This is borrowed from UCCP APCSA work
 */
// TODO: These need to be moved to a better place:
// These are common strings that need not be build and should be reused!
bjc.goMain = 'Go to Main Course Page';
// &#8230; is ellipsis
bjc.clickNav = 'Click here to navigate&#8230; &nbsp;&nbsp;';
bjc.bootstrapSep = '<li class="divider list_item" role="presentation"></li>';
bjc.bootstrapCaret = '<span class="caret"></span>';

bjc.file = "";
bjc.step = NaN;
bjc.url_list = new Array();


bjc.secondarySetUp = function() {
    
    bjc.setupTitle();

    // fix snap links so they run snap
    $("a.run").each(function(i) {
        $(this).attr("target", "_blank");
        $(this).attr('href', bjc.getSnapRunURL(this.getAttribute('href')));
    });

    // make the vocab box if necessary
    if ($("span.vocab").length > 0) {
        if ($("div.vocab").length == 0) {
            // it might already exist, in order to have a 'topX' class inserted.
            $("#full").append('<div class="vocab"></div>');
        }
        var vocabDiv = $("div.vocab");
        $("span.vocab").each(function(i) {
            if (!(this.getAttribute('term'))) {
                this.setAttribute('term', this.innerHTML)
            }
            vocabDiv.append('<a href="' + bjc.rootURL +
                '/glossary/view.html?term=' + this.getAttribute('term')
                + '" target="_vocab">' + this.getAttribute('term') + '</a>');
        });
    }

    // make the help box if necessary
    var helpSpans = $("span.help");
    if (helpSpans.length > 0) {
        $("#full").append('<div class="help"></div>');
        var helpDiv = $("div.help");
        helpSpans.each(function(i) {
            if (!(this.getAttribute('topic'))) {
                this.setAttribute('topic', this.innerHTML)
            };
            helpDiv.append('<p><a href="' + bjc.rootURL + '/help/view.html?topic=' + this.getAttribute('topic')
            + '" target="_help">' + this.getAttribute('topic') + '</a></p>');
        });
    }

    // move anything that belongs in to the margin there, if necessary
    // these are the 4 class of divs that matter.
    var marginSelector = ["div.key", "div.warning", "div.help", "div.vocab"];
    if ($(marginSelector.join(',')).length > 0) {
        // add the two columns.
        $('#full').wrapInner('<div id="mainCol"></div>').prepend(
            '<div id="marginCol"></div>');
        // this moves the divs over.  Perhaps it could do some smarter ordering
        // always put vocab at the bottom, for instance.
        var marginCol = $("#marginCol").get(0);
        $.each(marginSelector, function(i, divclass) {
            $(divclass).appendTo(marginCol);
        });
    }

    // Get the topic file and step from the URL
    bjc.step = parseInt(getParameterByName("step"));
    var topicFile = getParameterByName("topic");

    // We don't have a topic file, so we should exit.
    if (topicFile === "" || isNaN(bjc['step'])) {
        return;
    }
    
    if (getParameterByName("step") === "") {
        // TODO -- this shouldn't happen, but we could intelligently find 
        // which step this should be
    }
    
    if (typeof topicFile == "object") {
        bjc.file = topicFile[1];
    } else {
        bjc.file = topicFile;
    }
    
    $.ajax({
        url : bjc.rootURL + "/topic/" + bjc.file,
        type : "GET",
        dataType : "text",
        cache : true, // cache the topic page.
        success: bjc.processLinks
    });
}; // close secondarysetup();

/** 
 *  Processes just the hyperlinked elements in the topic file,
 *  and creates navigation buttons.
 *  FIXME: This should share code with BJC topic!
 */
bjc.processLinks = function(data, ignored1, ignored2) {
    var hidden = [];
    var hiddenString = "";
    
    // URL Options
    var temp = window.location.search.substring(1).split("&");
    
    for (var i = 0; i < temp.length; i++) {
        var param = temp[i].split("="); // param = [OPTION, VALUE]
        if (param[0].substring(0, 2) == "no" && param[1] == "true") {
            hidden.push(param[0].substring(2));
            hiddenString += ("&" + temp[i]);
        }
    } // end for loop
    
    // TODO: Refactor multiple vars...
    var textLength = 35;
    var course = getParameterByName("course");
    var lines = data.split("\n");
    var num = 0;
    var url = document.URL;
    var list = $(document.createElement("ul")).attr(
        {'class': 'dropdown-menu dropdown-menu-right', 
         'role' : "menu",  'aria-labelledby' : "Topic-Navigation-Meu"});
    var text;
    var list_item;
    
    for (var i = 0; i < lines.length; i++) {
        var line = bjc.stripComments($.trim(lines[i]));
        
        // Skip is this line is hidden in URL params.
        var used = hidden.indexOf(line.slice(0, line.indexOf(":"))) === -1;
        if (!used) continue;
        
        // Line is a title.
        if (line.indexOf("title:") !== -1) {
            /* Create a link back to the main topic. */
            url = bjc.rootURL + "/topic/topic.html?topic=" + bjc.file +
                  hiddenString + "&course=" + course;
            
            text = line.slice(line.indexOf(":") + 1);
            text = bjc.truncate($.trim(text), textLength);
            
            // Create a special Title link and add a separator.
            text = "<span class='main-topic-link'>" + text + "</span>";
            list_item = bjc.dropdownItem(text, url);
            // Note: Add to top of list!
            list.prepend(bjc.bootstrapSep);
            list.prepend(list_item);
            
            continue;
        }
        
        // TODO:  Check if we have a title for this link?
        // If we don't have a link, skip this line.
        var hasLink = line.indexOf("[") !== -1 && line.indexOf("]") !== -1;
        if (!hasLink) {
            continue; 
        }
        
        // Grab the link title between : and [ 
        text = line.slice(line.indexOf(":") + 1, line.indexOf("["));
        text = bjc.truncate($.trim(text), textLength);
        // Grab the link betweem [ and ]
        url = (line.slice(line.indexOf("[") + 1, line.indexOf("]")));
        
        // Content References an external resource
        if (url.indexOf("http") !== -1) {
            url = bjc.rootURL + "/admin/empty-curriculum-page.html" +
                 "?" + "src=" +  url + "&" + "topic=" + bjc.file +
                 "&step=" + num + "&title=" + text + hiddenString +
                 "&course=" + course;
        } else {
            if (url.indexOf(bjc.rootURL) === -1 && url.indexOf("..") === -1) {
                url = bjc.rootURL + (url[0] === "/" ? '' : "/") + url;
            }
            //TODO: Does this matter?
            url += url.indexOf("?") !== -1 ? "&" : "?";
            url += "topic=" + bjc.file + "&step=" + num + hiddenString;
            url += "&course=" + course;
        }
        
        bjc.url_list.push(url);
        
        // Make the current step have an arrow in the dropdown menu
        if (num === bjc.step) {
            text = "<span class='current-step-link'>" + text + "</span>";
        }

        list_item = bjc.dropdownItem(text, url);
        list.append(list_item);
        num += 1;
    } // end for loop
    
    if (course !== "") {
        if (course.indexOf("http://") === -1) {
            course = bjc.rootURL + "/course/" + course;
        }
        text = "<span class='course-link-list'>" + bjc.goMain + "</span>";      
        list_item = bjc.dropdownItem(text, course);
        list.prepend(list_item);
    }

    // Setup the nav button links and build the dropdown.
    bjc.setButtonURLs();
    bjc.buildDropdown();
    var dropdown = $('.top-nav .nav-btns .dropdown');
    dropdown.append(list);
    
    if (document.URL.indexOf("empty-curriculum-page.html") !== -1) {
        bjc.addFrame();
    }

    bjc.indicateProgress(bjc.url_list.length, bjc.step);

} // end processLinks()


// Create an iframe when loading from an empty curriculum page
// Used for embedded content. (Videos, books, etc)
bjc.addFrame = (function() {
    var source = getParameterByName("src");
    
    $("#full").append('<a href=' + source + 
        ' target="_">Open page in new window</a><br /><br />');
    $("#full").append('<div id="cont"></div>');
    
    var frame = $(document.createElement("iframe")).attr(
        {'src': source, 'class': 'step_frame'} );
    
    $("#cont").append(frame);
});

// Setup the entire page title. This includes creating any HTML elements.
// This should be called EARLY in the load process!
bjc.setupTitle = function() {
    if (typeof bjc.titleSet !== 'undefined' && bjc.titleSet) {
        return;
    }
    // Create #full before adding stuff.
    if ($("#full").length === 0) {
        $(document.body).wrapInner('<div id="full"></div>');
    }
    
    // Work around when things are oddly loaded...
    if ($('.top-nav').length !== 0) {
        $('.top-nav').remove();
    }
    
    // Create the header section and nav buttons
    bjc.createTitleNav();
    
    // create Title tag, yo
    if (getParameterByName("title") != "") {
        document.title = decodeURIComponent(getParameterByName("title"));
    }
    
    // Set the header title to the page title.
    var titleText = document.title;
    if (titleText) { // && $(".header").length === 0 // this shouldn't happen.
        $('.header').html(titleText);
        // I don't think this does anything. If nothing breaks I'll remove it.
        // if (getParameterByName("title") != "") {
        //     $(".header").html(titleText);
        // }
    }
    
    // FIXME -- should just be in css...?
    document.body.style.marginTop = "0";
    // Clean up document title if it contains HTML
    document.title = $(".header").text();
    
    bjc.titleSet = true;
}

// Create the 'sticky' title header at the top of each page.
bjc.createTitleNav = function() {
    var topHTML = "<div class='top-nav'><div class='header'></div></div>",
        botHTML = "<div class='full-bottom-bar'><div class='bottom-nav " +
                      "btn-group'></div></div>",
        navHTML = "<div class='nav-btns btn-group'></div>",
        topNav = $('.top-nav'),
        botNav = $('.full-bottom-bar'),
        buttons = "<a class='btn btn-default backbutton arrow'>&larr;</a>" +
                   "<a class='btn btn-default forwardbutton arrow'>&rarr;</a>";
    
    if (topNav.length === 0) {
        $(document.body).prepend(topHTML);
        topNav = $('.top-nav');
        topNav.append(navHTML);
    }
    
    // Don't add anything else if we don't know the step...
    if (isNaN(bjc.step)) {
        return;
    }

    if (botNav.length === 0) {
        $(document.body).append(botHTML);
        botNav = $('.full-bottom-bar');
        //botNav.append(navHTML);
    }
        
    var forward = $('.forwardbutton'),
        back   = $('.backbutton');
        
    var buttonsExist = forward.length === 2 && back.length === 2;
    
    if (!buttonsExist && !isNaN(bjc.step)) {
        $('.nav-btns').append(buttons);
        $('.bottom-nav').append(buttons);
    }
};

// Create the navigation dropdown
bjc.buildDropdown = function() {
    var dropwon, list_header, nav_text;
    // Container div for the whole menu (title + links)
    dropdown = $(document.createElement("div")).attr(
        {'class': 'dropdown inline'});
    
    // span not completely necessary, but might help with width issues.
    nav_text = $(document.createElement('span')).html(bjc.clickNav);
    
    // build the list header
    list_header = $(document.createElement("div")).attr(
        {'class': 'btn btn-default dropdown-toggle list_header',
         'type' : 'button', 'data-toggle' : "dropdown" }); 
    list_header.append(nav_text);
    list_header.append(bjc.bootstrapCaret);
    
    // Add Header to dropdown 
    dropdown.append(list_header);
    
    // Insert into the top div AFTER the backbutton.
    dropdown.insertAfter($('.top-nav .nav-btns .backbutton'));
}

/** Build an item for the navigation dropdown
 *  Takes in TEXT and a URL and reutrns a list item to be added
 *  too an existing dropdown */
bjc.dropdownItem = function(text, url) {
    var link, item;
    // li container
    item = $(document.createElement("li")).attr(
        {'class': 'list_item', 'role' : 'presentation'});
    link = $(document.createElement("a")).attr(
        {'href': url, 'role' : 'menuitem'});
    link.html(text);
    item.append(link);
    return item;
}

// Create the Forward and Backward buttons, properly disabling them when needed
bjc.setButtonURLs = function() {
    // No dropdowns for places that don't have a step.
    if (isNaN(bjc.step)) {
        return;
    }
    
    var forward = $('.forwardbutton'),
        back    = $('.backbutton');
        
    var buttonsExist = forward.length === 2 && back.length === 2;
    
    if (!buttonsExist) {
        bjc.createTitleNav();
        // Grab the freshly minted buttons. MMM, tasty!
        forward = $('.forwardbutton');
        back    = $('.backbutton');
    }
    
    // Disable the back button
    if (bjc.step === 0) {
        back.each(function(i, item) {
            $(this).addClass('disabled');
            $(this).attr('href', '#')
        });
    } else {
        back.each(function(i, item) {
            $(this).removeClass('disabled');
            $(this).attr('href', bjc.url_list[bjc.step - 1])
            $(this).click(bjc.goBack);
        });
    }
    
    // Disable the forward button
    if (bjc.step >= bjc.url_list.length - 1) {
        forward.each(function(i, item) {
            $(this).addClass('disabled');
            $(this).attr('href', '#')
        });
    } else {
        forward.each(function(i, item) {
            $(this).removeClass('disabled');
            $(this).attr('href', bjc.url_list[bjc.step + 1])
            $(this).click(bjc.goForward);
        });
    }
};

bjc.goBack = function() {
    window.location.href = bjc.url_list[bjc.step - 1];
};

bjc.goForward = function() {
    window.location.href = bjc.url_list[bjc.step + 1];
};

/* Hides the dropdown when a user clicks somewhere else. 
 * CURRENTLY BUGGY AND UNUSED... Do we need this still?
 */
// bjc.navDropdownToggle = function() {
//     var list_header = $('.list_header'),
//         caret = '<span class="caret"></span>',
//         close_state = "Click here to navigate...   " + caret,
//         open_state = "Click anywhere to close...   " + caret;
//     if (list_header.html() === close_state) {
//         list_header.html(open_state);
//     } else {
//         list_header.html(close_state);
//     }
// };

/* Create an event to collapse dropdown menu when mouse is clicked anywhere */
$('html').click(function(event) {
    //bjc.navDropdownToggle();
});

/** Positions an image along the bottom of the lab page, signifying progress.
 *  numSteps is the total number of steps in the lab
 *  currentStep is the number of the current step
 *  totalWidth is the width of the entire bottom bar
 *  buttonWidth is the combined width of the two nav buttons.
 */
bjc.indicateProgress = function(numSteps, currentStep) {
    var totalWidth = $(".full-bottom-bar").width(),
        buttons = $('.bottom-nav').width(),
        width = totalWidth - buttons,
        result; // result stores left-offset of background image.

    if (currentStep < numSteps - 1) {
        result = (currentStep * (width / (numSteps - 1)) + 1) / totalWidth;
        // Result is always a min of 1%.
        result = (result < .01) ? 1 : result * 100;
        result = result + "%";
    } else {
        var picWidth = $(".full-bottom-bar").css("background-size");
        picWidth = Number(picWidth.slice(0, picWidth.indexOf("px")));
        // the 4 is just to add a bit of space
        result = width - picWidth - 4 + "px"; 
    }
    
    result = result + " 2px";
    $(".full-bottom-bar").css("background-position", result);
};

// Setup the nav and parse the topic file. 
$(document).ready(bjc.secondarySetUp);

