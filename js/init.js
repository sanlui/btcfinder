//Hook up the tweet display

$(document).ready(function() {
                           
    $(".countdown").countdown({
                date: "25 July 2025 18:30:00",
                format: "on"
            },
            
            function() {
                // callback function
            });

}); 
