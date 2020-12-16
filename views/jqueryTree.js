if(jQuery) (function($){
    $.extend($.fn, {

        fileTree: function(o, h) {
            // Defaults
            if( !o ) var o = {};
            if( o.folderEvent == undefined ) o.folderEvent = 'click';
            if( o.expandSpeed == undefined ) o.expandSpeed= 500;
            if( o.collapseSpeed == undefined ) o.collapseSpeed= 500;
            if( o.expandEasing == undefined ) o.expandEasing = null;
            if( o.collapseEasing == undefined ) o.collapseEasing = null;
            if( o.loadMessage == undefined ) o.loadMessage = 'Loading...';

            $(this).each( function() {
                
				//отображение дерева специалистов
                function showTree(c, tree) {
                    $(c).addClass('wait');
                    $(".jqueryTree.start").remove();

                        $(c).find('.start').html('');
                        $(c).removeClass('wait').append(tree);
						$(c).find('UL:hidden').slideDown({ duration: o.expandSpeed, easing: o.expandEasing });
                        //отображаем дерево
                        bindTree(c);
                } //function showTree()


                function bindTree(t) {

                    //раскрытие/скрытие вложенных файлов
                    $(t).find('LI A').bind(o.folderEvent, function() {
                        if( $(this).parent().hasClass('directory') ) {
                            if( $(this).parent().hasClass('collapsed') ) {
							//alert('collapsed');
                                // Expand
                                $(this).parent().find('UL').remove(); // cleanup
								var specialty = $(this).attr('rel');
								var doctors = getDoctors(specialty);
								//alert(doctors);
								showTree( $(this).parent(), doctors );
                                $(this).parent().removeClass('collapsed').addClass('expanded');
                            } else {
							//alert('expanded');
                                // Collapse
                                $(this).parent().find('UL').slideUp({ duration: o.collapseSpeed, easing: o.collapseEasing });
                                $(this).parent().removeClass('expanded').addClass('collapsed');
                            }
							
                        } else if( $(this).parent().hasClass('file') ) {
							document.getElementById("selected_doctor").textContent = $(this).text();

							//запрос на часы записи доктора
							var doctor = $(this).attr('rel');
							getDoctorVisits(doctor);
                        } else {
                            h($(this).attr('rel'));
                        }
                        return false;
                    });
                    // Prevent A from triggering the # on non-click events
                    if( o.folderEvent.toLowerCase != 'click' ) $(t).find('LI A').bind('click', function() { return false; });
                }


                //запрос к серверу, получение списка специалистов в поликлинике
                function getSpecialties() {
                    var theResponse = null;
                    var data = {};

                     $.ajax({
                        type: 'POST',
                        data: JSON.stringify(data),
                        contentType: 'application/json',
                        url: 'http://localhost:3000/specialties', 
                        dataType: "html",                       
                        async: false,
                        success: function(data) {
                            var parseData = JSON.parse(data); 
                            var tree = parseData["tree"]
                            theResponse = tree;
                        }
                    }); //$.ajax()
                    return theResponse;
                }

                function getDoctors(specialty) {
                    var theResponse = null;
                    var data = {};
					data.specialty = specialty;

                    $.ajax({
                        type: 'POST',
                        data: JSON.stringify(data),
                        contentType: 'application/json',
                        url: 'http://localhost:3000/doctors', 
                        dataType: "html",                       
                        async: false,
                        success: function(data) {
                            var parseData = JSON.parse(data); 
                            var tree = parseData["tree"]
                            theResponse = tree;
                        }
                    }); //$.ajax()
                    return theResponse;
                }

                $(this).html('<ul class="jqueryTree start"><li class="wait">' + o.loadMessage + '<li></ul>');
				var specialties = getSpecialties();
				showTree( $(this), specialties );

            }); //$(this).each()

        } //fileTree: function()
    });
})(jQuery);
