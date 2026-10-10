
import express from "express";

const app = express();
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
const PORT = 4000;

// Parse incoming JSON request bodies.
app.use(express.json());

// Temporary data stored in memory.
const students = [
  { id: 1, name: "Alice", department: "Software Engineering" },
  { id: 2, name: "David", department: "Computer Engineering" },
  { id: 3, name: "Grace", department: "Software Engineering" },
];

// Route 1: Retrieve all students.
app.get("/api/v1/students", (req, res) => {
  res.status(200).json(students);
});

// Route 2: Retrieve one student by ID.
app.get("/api/v1/students/:id", (req, res) => {
  const id = Number(req.params.id);

  const student = students.find((student) => student.id === id);

  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  return res.status(200).json(student);
});

// Route 3: Filter students by department.
app.get("/api/v1/students/search", (req, res) => {
  const department = req.query.department;

  if (typeof department !== "string") {
    return res.status(400).json({
      message: "Provide a department query parameter",
    });
  }

  const results = students.filter(
    (student) =>
      student.department.toLowerCase() === department.toLowerCase()
  );

  return res.status(200).json(results);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});