#python create_db.py

import sqlite3
from datetime import datetime, date

conn = sqlite3.connect("db.sqlite",detect_types=sqlite3.PARSE_DECLTYPES) 
conn.execute("DROP TABLE IF EXISTS hospital")
conn.execute("DROP TABLE IF EXISTS specialization")
conn.execute("DROP TABLE IF EXISTS doctor")
conn.execute("DROP TABLE IF EXISTS patient")
conn.execute("DROP TABLE IF EXISTS doctor_visits")


#hospital
conn.execute("CREATE TABLE hospital(id integer primary key autoincrement, name text)")
conn.execute("INSERT INTO hospital(name) values ('HospitalA')")
conn.execute("INSERT INTO hospital(name) values ('HospitalB')")
conn.commit()

print("Table hospital")
cur = conn.cursor()
cur.execute("SELECT * FROM hospital")
for row in cur:
  print(row)
print("")

#specialization
conn.execute("CREATE TABLE specialization(id integer primary key autoincrement, name text)")
conn.execute("INSERT INTO specialization(name) values ('Surgeon')")
conn.execute("INSERT INTO specialization(name) values ('Therapist')")
conn.execute("INSERT INTO specialization(name) values ('Pediatrician')")
conn.execute("INSERT INTO specialization(name) values ('Dermatologist')")
conn.commit()

print("Table specialization")
cur.execute("SELECT * FROM specialization")
for row in cur:
  print(row)
print("")
  
#doctor
conn.execute("CREATE TABLE doctor (\
 id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, \
 firstname TEXT NOT NULL,\
 lastname TEXT NOT NULL,\
 phone_number TEXT NULL,\
 place TEXT NOT NULL,\
 special_id INTEGER NOT NULL,\
 hospital_id INTEGER NOT NULL,\
 FOREIGN KEY(special_id) REFERENCES specialization(id) \
 FOREIGN KEY(hospital_id) REFERENCES hospital(id))")
conn.execute("INSERT INTO doctor(firstname, lastname, place, special_id, hospital_id) values(?, ?, ?, ?, ?)", ("Adam","Smith", "Room1", 1, 1))
conn.execute("INSERT INTO doctor(firstname, lastname, place, special_id, hospital_id) values(?, ?, ?, ?, ?)", ("Bob","B.", "Room2", 2, 1))
conn.execute("INSERT INTO doctor(firstname, lastname, place, special_id, hospital_id) values(?, ?, ?, ?, ?)", ("Said","S.", "Room3", 3, 1))
conn.execute("INSERT INTO doctor(firstname, lastname, place, special_id, hospital_id) values(?, ?, ?, ?, ?)", ("Dmitriy","Ivanov", "Room4", 4, 1))

conn.execute("INSERT INTO doctor(firstname, lastname, place, special_id, hospital_id) values(?, ?, ?, ?, ?)", ("Kate","Midd", "Room1", 3, 2))
conn.execute("INSERT INTO doctor(firstname, lastname, place, special_id, hospital_id) values(?, ?, ?, ?, ?)", ("Nastya","West", "Room2", 3, 2))
conn.commit()

print("Table doctor")
cur.execute("SELECT * FROM doctor")
for row in cur:
  print(row)
print("")
  
hid = (1,);
cur.execute("SELECT * FROM doctor where hospital_id = ?", hid)
for row in cur:
  print(row)
print("")  

hid = (2,);
cur.execute("SELECT DISTINCT s.name AS s_name\
 FROM doctor d\
 INNER JOIN specialization s ON d.special_id = s.id\
 Where hospital_id = ?", hid)
for row in cur:
  print(row) 
print("")
  
 
#patient
conn.execute("CREATE TABLE patient(\
 id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\
 firstname TEXT NOT NULL UNIQUE,\
 lastname TEXT NOT NULL UNIQUE,\
 age INTEGER CHECK (age > 16),\
 phone_number TEXT NULL,\
 comment TEXT NULL)")
conn.execute("INSERT INTO patient(firstname, lastname, age, comment) values(?, ?, ?, ?)", ("Irina","Smirnova", 32, "headache"))
conn.commit()

#visits
conn.execute("CREATE TABLE doctor_visits (\
 doctor_id INTEGER NOT NULL,\
 patient_id INTEGER NOT NULL,\
 visit_date datetime UNIQUE,\
 FOREIGN KEY (doctor_id) REFERENCES doctor(id) \
 FOREIGN KEY (patient_id) REFERENCES patient(id))")
conn.execute("INSERT INTO doctor_visits(doctor_id, patient_id, visit_date) values(?, ?, ?)", (1,1, "2003-06-25 11:00:00"))
d = datetime(2003, 6, 25, 11, 15)
conn.execute("INSERT INTO doctor_visits(doctor_id, patient_id, visit_date) values(?, ?, ?)", (2,1, d))

d = datetime(2003, 6, 23, 11, 15)
conn.execute("INSERT INTO doctor_visits(doctor_id, patient_id, visit_date) values(?, ?, ?)", (5,1, d))

d = datetime(2003, 6, 23, 11, 30)
conn.execute("INSERT INTO doctor_visits(doctor_id, patient_id, visit_date) values(?, ?, ?)", (5,1, d))

d = datetime(2003, 6, 26, 11, 15)
conn.execute("INSERT INTO doctor_visits(doctor_id, patient_id, visit_date) values(?, ?, ?)", (6,1, d))

d = datetime(2003, 6, 26, 11, 30)
conn.execute("INSERT INTO doctor_visits(doctor_id, patient_id, visit_date) values(?, ?, ?)", (6,1, d))

conn.commit()

print("Table doctor_visits")
cur.execute("SELECT * FROM doctor_visits")
for row in cur:
  print(row)

cur.execute("SELECT doctor.lastname, patient.lastname, doctor_visits.visit_date \
 FROM doctor_visits \
 JOIN doctor ON doctor.id = doctor_visits.doctor_id \
 JOIN patient ON patient.id = doctor_visits.patient_id")
for row in cur:
  print(row)

# sqlite3 db.sqlite "SELECT patient.lastname, doctor_visits.visit_date FROM doctor_visits JOIN patient ON patient.id = doctor_visits.patient_id"
'''
cmd:
sqlite3 db.sqlite "SELECT * FROM doctor_visits 
where visit_date  >= Datetime('2003-06-23 00:00:00') and visit_date <= Datetime('2003-06-23 23:59:59') 
and doctor_id = 5"

sqlite3 db.sqlite "SELECT patient.lastname, doctor_visits.visit_date 
 FROM doctor_visits 
 JOIN patient ON patient.id = doctor_visits.patient_id
 where visit_date  >= Datetime('2003-06-23 00:00:00') and visit_date <= Datetime('2003-06-23 23:59:59') 
and doctor_id = 5"
'''


conn.close()