const express = require("express");
const app = express();
const fs = require("fs");
const Joi = require("joi");

//const students = require("./students.json");

app.use(express.json());
// For read students data
const studentsData = fs.readFileSync("./students.json");
const students = JSON.parse(studentsData);

// Endpoint to display all students
app.get("/students", (req, res) => {
  res.send(students.map((student) => student["nom"]));
});

// Endpoint to add new student
app.post("/students", (req, res) => {
  const schema = Joi.object({
    nom: Joi.string().required(),
    classe: Joi.string().required(),
    modules: Joi.array().items(
      Joi.object({
        module: Joi.string().required(),
        note: Joi.number().integer().min(0).max(20).required(),
      })
    ),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    res.status(400).send(result.error.details[0].message);
    return;
  }

  const newStudent = req.body;
  newStudent.moyenne = calculateAverage(newStudent.modules);
  students.push(newStudent);
  saveStudentsData(students);

  res.send(newStudent);
});

// Endpoint to display student by name
app.get("/students/:nom", 
(req, res) => {
  const student = students.find ( (s) => s["nom"] === req.params.nom );

  if (!student) {
    res.status(404).send("Étudiant non trouvé");
    return;
  }

  res.send(student);
});
// Endpoint pour modifier les notes d'un étudiant
app.put('/students/:nom', function(req, res) {
  const nom = req.params.nom;
  const newStudent = req.body;

  // read in the JSON data
  const data = fs.readFileSync('students.json');
  const students = JSON.parse(data);

  // find the student with the matching name and update their data
  const index = students.findIndex(s => s.nom === nom);
  if (index !== -1) {
    students[index] = newStudent;

    // write the modified data back to the file
    fs.writeFileSync('students.json', JSON.stringify(students));

    res.send(`Student ${nom} updated successfully.`);
  } else {
    res.status(404).send(`Student ${nom} not found.`);
  }
});

// Endpoint for delete student
app.delete("/students/:nom", (req, res) => {
  const studentIndex = students.findIndex((s) => s["nom"] === req.params.nom);

  if (studentIndex === -1) {
    res.status(404).send("Étudiant non trouvé");
    return;
  }
  students.splice(studentIndex, 1);
  saveStudentsData(students);

  res.send("Étudiant supprimé");
});

// Endpoint to display the average of all students
app.get("/students/:nom/moyenne", (req, res) => {
  const totalModules = students.reduce((acc, student) => {
    return acc + student["modules"].length;
  }, 0);

  const totalNotes = students.reduce((acc, student) => {
    return (
      acc +
      student["modules"].reduce((acc, module) => {
        return acc + module["note"];
      }, 0)
    );
  }, 0);

  const moyenne = totalNotes / totalModules;

  res.send({ moyenne });
});

// Endpoint to display best and worst note
app.get("/students/best-worst/moy", (req, res) => {
  const bestWorstNotes = students.map((student) => {
    const bestNote = Math.max(...student.modules.map((m) => m["note"]));
    const worstNote = Math.min(...student.modules.map((m) => m["note"]));
    return {
      nom: student.nom,
      meilleur: bestNote,
      pire: worstNote,
    };
  });

  res.send(bestWorstNotes);
});

function calculateAverage(modules) {
  const totalNotes = modules.reduce((acc, module) => {
    return acc + module["note"];
  }, 0);

  return totalNotes / modules.length;
}

function saveStudentsData(data) {
  fs.writeFileSync("./students.json", JSON.stringify(data));
}

const port = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log("app work");
});