// $ node index.js
// visit http://localhost:3000/


const express = require('express');
const app = express()                        //фреймворк для веб-приложений
var sqlite3 = require('sqlite3') //база данных о подключенных клиентах
const port = 3000;                           //порт
var server = require('http').createServer(app);  //сервер
var io = require('socket.io')(server);    //работа с сокетами

//для 0.9.x:
//var io = require('socket.io')(http);
//для 1.xx:
//var io = require('socket.io').listen(http);


var async = require('async');                //асинхронность
var path = require('path');
var dateFormat = require('dateformat');

var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies

// Using the .html extension instead of having to name the views as *.ejs
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//подключаем подпапку coverage
app.use(express.static('views'));      //в том числе подключение css
app.set('views',__dirname + '/views'); 

// global params
var specialization =[];
var hospital_id = 0;
var doctor_id = 5;
var patient_id;
var selected_date = new Date(2003, 5, 23);


//отображение данных для пользователя
app.get('/', function (req, res) {
});

//обработка сообщений от клиента 
io.on('connection', function(client) {  
    console.log('Client connected...');

    //обработка выбора поликлинике
    client.on('get_specialties', function(data) {
		hospital_id = data;
		getSpecialization(hospital_id);
		client.emit( 'send_specialties' );
    }); //client.on()
	
	//запрос на часы визитов при выборе доктора
    client.on('get_doctor_visits', function(data) {
		doctor_id  = data.doctor_id;
        //console.log(doctor_id);
		var data_visits = getDoctorVisits();
 		
		sleep(1000).then(() => {
			//console.log(data_visits);
			client.emit( 'send_visits', data_visits );
		});
    }); //client.on()

	//запрос на выбранную дату в календаре
    client.on('get_data_visits', function(data) {
 		selected_date  = data;
		var data_visits = getDoctorVisits();
		
		sleep(1000).then(() => {
			//console.log(data_visits);
			client.emit( 'send_visits', data_visits );
		});

    }); //client.on()

    //добавление пациента в расписание доктора
    client.on('insert_visit', function(data) {
        var visit_doctor_temp = data.doctor;
        var visit_time = dateFormat(data.time, "yyyy-mm-dd hh:MM:00");
		//console.log(data.time);
		//console.log(visit_time);
		var arrDoctor = visit_doctor_temp.split(" ");
		var doctor_firstname = arrDoctor[0].trim();
		var doctor_lastname = arrDoctor[1].trim();
		var patient_firstname = data.patient_firstname;
		var patient_lastname = data.patient_lastname;
		var patient_id;

		createPatient(patient_firstname, patient_lastname);
		
		sleep(1000).then(() => {
			var str_query = "SELECT  id FROM patient where firstname = \'" + patient_firstname + "\' and lastname = \'" + patient_lastname + "\'";
			const { exec } = require('child_process');
			exec('sqlite3 db.sqlite \"' + str_query + '\"', (err, stdout, stderr) => {
				if (err) {
					console.log("invalid sql request");
					return;
				}
				patient_id = stdout.replace("\r\n", "");
			});
			
			sleep(1000).then(() => {
				var str_query ="INSERT OR IGNORE INTO doctor_visits(doctor_id, patient_id, visit_date) values(" + doctor_id + ", " + patient_id + ", \'" +visit_time+ "\')";
				exec('sqlite3 db.sqlite \"' + str_query + '\"', (err, stdout, stderr) => {
					if (err) {
						console.log("invalid sql request");
						return;
					}
				});
				
				sleep(1000).then(() => {
					selected_date  = visit_time;
					var data_visits = getDoctorVisits();
					sleep(1000).then(() => {
						client.emit( 'send_visits', data_visits );
					});
				});
				
			});
		});

    }); //client.on()
	
}); //io.on()


//создатьпациента
function createPatient(firstname, lastname) { 
     async.series([
        function(callback) {
            var db = new sqlite3.Database('db.sqlite');
            db.serialize(function() {
                db.run(`INSERT OR IGNORE INTO patient(firstname, lastname, age) VALUES(?,?,?);`,  [firstname, lastname, 20], function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    db.close();
                });
            });
            callback();
        },

        function(callback) {
            callback();
        }
    ], 
    function(err) { 
    });

}


//список специлистов, которые есть в поликлинике
function getDoctorVisits() { 
    doctor_times = [];

	var dayStart=dateFormat(selected_date, "yyyy-mm-dd 00:00:00");
	var dayEnd=dateFormat(selected_date, "yyyy-mm-dd 23:59:59");
	var	str_query = "SELECT patient.lastname, doctor_visits.visit_date FROM doctor_visits \
JOIN patient ON patient.id = doctor_visits.patient_id \
where visit_date  >= Datetime(\'" + dayStart + "\') and visit_date <= Datetime(\'" + dayEnd + "\') \
and doctor_id = " + doctor_id;	
	//console.log(str_query);
	
    var db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_READONLY);

    db.serialize(function() {
        db.all(str_query, function(err, rows) {
            //errors?
            if(err != null){
                console.log(err);
            }
			//console.log("length=", rows.length); 
            //save results
            rows.forEach(function(value)
            {
				//console.log(value);
                doctor_times.push(value);  
            });
        });

        db.close();
    });
    return doctor_times; 
}

//список специлистов, которые есть в поликлинике
function getSpecialization(hospital_id) { 
    specialization = [];

    //чтение базы данных
    var db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_READONLY);
    
    //serialize - вызовы обрабатываются последовательно
    db.serialize(function() {
		str_query = "SELECT DISTINCT s.id, s.name AS s_name FROM doctor d INNER JOIN specialization s ON d.special_id = s.id Where hospital_id = " + hospital_id;
        db.all(str_query, function(err, rows) {

            //errors?
            if(err != null){
                console.log(err);
            }

            //save results
            rows.forEach(function(value)
            {
				//console.log(value);
                specialization.push(value);  
            });
        });

        db.close();
    });
    return specialization; 
}


//создаем html-код на основе полученного дерева данных
function parseToHtml(data, is_dir) { 
    var s = Buffer.from('<ul class="jqueryTree" style="display: none;">', 'ascii');

	//отладка
    data.forEach(function (e) {
		//console.log(e.s_name);
    });

    data.forEach(function (element) {
        var ext = '';
        var temp;

        if (is_dir) {
            ext='directory collapsed';
			temp= '<li class="' + ext +'"><a href="#" rel="' + element.id + '">' + element.s_name +'</a></li>';
        }else {
            ext = 'file'
			arrResult = element.split("|");
			temp= '<li class="' + ext +'"><a href="#" rel="' + arrResult[0] + '">' + arrResult[1] + " " + arrResult[2] + '</a></li>';
        }

        var p = Buffer.from(temp, 'utf8');
        s = Buffer.concat([s,p]);
    });

    var p = Buffer.from('</ul></ul>', 'ascii');
    s = Buffer.concat([s,p]);

    return s.toString(); 
}

//обработка запроса на получение списка специальностей
app.post('/specialties', function(req, res){
    var specTree = parseToHtml(specialization, true);
    var obj = {};
    obj.tree = specTree;
    res.send(JSON.stringify(obj));
});

// sleep time expects milliseconds
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};

//обработка запроса на получение списка докторов, работающих по специальности
app.post('/doctors', function(req, res){
    doctors = [];
	
    var specialty = req.body.specialty;
	var str_query = "SELECT id, firstname, lastname FROM doctor where hospital_id = " + hospital_id + " and special_id = " + specialty;
	console.log(str_query);

	const { exec } = require('child_process');
	exec('sqlite3 db.sqlite \"' + str_query + '\"', (err, stdout, stderr) => {
		if (err) {
			// node couldn't execute the command
			console.log(`if (err)`);
			return;
		}

		var arrayOfResult = stdout.split("\r\n");
		arrayOfResult.forEach(function (e) {
			result = e.replace("\r\n", "");
			if (!result.isEmpty())
			{
				console.log(`if (!result.isEmpty())`);
				doctors.push(result); 
			}
			else
			{				console.log(`result.isEmpty()`);
		}
		});
		console.log(`stdout: ${stdout}`);
		console.log(`stderr: ${stderr}`);
	});
	
	var docTree;
	sleep(1000).then(() => {
		docTree = parseToHtml(doctors, false);
		//console.log(docTree);
		
		var obj = {};
		obj.tree = docTree; 
		res.send(JSON.stringify(obj));
	});


});

///////
server.listen(port);
