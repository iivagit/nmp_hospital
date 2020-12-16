    var socket = io.connect('http://localhost:3000');

    $(document).ready( function() {

        //обработка выбора госпиталя
		$("input[name='hospital_choice']").change(function(){
            //alert($(this).val());
			var data = $(this).val()
			socket.emit('get_specialties', data); //получить специльности, которые есть в госпитале
        });   
	
        //отображение списка специальностей 
        $('#JQueryModule').fileTree({
             expandSpeed: 1000,
             collapseSpeed: 1000,
        });   
	
		//календарь
		YUI().use('calendar', 'datatype-date', 'cssbutton',  function(Y) {
			var calendar = new Y.Calendar({
			  contentBox: "#mycalendar",
			  width:'340px',
			  showPrevMonth: false,
			  showNextMonth: false,
			  date: new Date(2003,05,25)}).render();

			// Get a reference to Y.DataType.Date
			var dtdate = Y.DataType.Date;

			// Listen to calendar's selectionChange event.
			calendar.on("selectionChange", function (ev) {

			// Get the date 
			var newDate = ev.newSelection[0];
			Y.one("#selected_date").setHTML(dtdate.format(newDate));
			socket.emit('get_data_visits', newDate); //получить расписание доктора
			});
		});
		
		//запись пациента
		$('#click_record').click(function(e){
			e.preventDefault();
			var sel_time = $("#selected_time").text();
			var sel_doctor = $("#selected_doctor").text();
			
			var patient_firstname = document.getElementById('patient_firstname').value;
			var patient_lastname = document.getElementById('patient_lastname').value;
			
			if(isEmpty(patient_firstname) || isEmpty(patient_lastname))
			{
				alert("Введите имя и фамилию")
			} 
			else
			{
				var data = {};
				data.time = sel_time;
				data.doctor = sel_doctor;
				data.patient_firstname = patient_firstname;
				data.patient_lastname = patient_lastname;
				
				socket.emit('insert_visit', data); //получить специльности, которые есть в госпитале		});         
			}
			
		}); 
	}); //$(document).ready

	//получение нового списка специальностей для поликлиники
    socket.on('send_specialties', function() {
		$('#JQueryModule').fileTree({
             expandSpeed: 1000,
             collapseSpeed: 1000,
		});   
	});
	
	//получение списка визитов
    socket.on('send_visits', function(data_visits) {
		document.getElementById("visit-table-id").style.display = "block";
		$("#visit-table-id tr").remove(); 
		
		//шаблон для визитов
		var sel_d = $("#selected_date").text();

		var d = new Date(sel_d);
		d.setHours(10);
		var curr_date = d.getDate();
		var curr_month = d.getMonth() + 1;
		var curr_year = d.getFullYear();
		var is_busy;
		
		for (var num = 0; num < 8; num++) {
			is_busy = false;
			d.setMinutes(d.getMinutes() + 15);
			var curr_hour = d.getHours();
			var curr_min = d.getMinutes();
			var formated_date = curr_year + "-" + curr_month + "-" + curr_date + " " + curr_hour + ":" + curr_min;
			var patient;
			
			for (var row in data_visits) {
				var d_visit = new Date(data_visits[row].visit_date);
				if (d.valueOf() == d_visit.valueOf()) {
					is_busy = true;
					patient = data_visits[row].lastname;
				}
			}
			
			if (is_busy)
				$('#visit-table-id').append('<tr class="row" bgcolor="#444444"><td>'+formated_date +'</td><td>'+ patient +'</td></tr>');
			else
				$('#visit-table-id').append('<tr class="row"><td style="min-width:50px">'+ formated_date +'</td><td td style="min-width:50px"></td></tr>');
		}
		
		var table = document.getElementById("visit-table-id");
		var rows = table.getElementsByTagName("tr");
		for (i = 1; i < rows.length; i++) {
        var row = table.rows[i];
        row.onclick = function(myrow){
                          return function() { 
							var color = myrow.getAttribute("bgcolor");
							var cell = myrow.getElementsByTagName("td")[0];
							var id = cell.innerHTML;
							//alert("id:" + id);
							if (color == null) document.getElementById("selected_time").textContent = $(this).text();
                      };
                  }(row);
		}
	});

	function getDoctorVisits(doctor_id) {
		var theResponse = null;
		var data = {};
		data.doctor_id = doctor_id;
		socket.emit('get_doctor_visits', data);
	}

	function isEmpty(str) {
		return (!str || 0 === str.length);
	}