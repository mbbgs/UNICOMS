// services/csvService.js
const fs = require('fs');
const { parse } = require('fast-csv');
const { generate } = require('../utils/helpers.js')

/**
 * Reads a CSV file and returns an array of student objects.
 * Expected CSV headers: name,email,password,matric,department
 */
async function parseStudentCSV(filePath) {
  const students = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true, trim: true }))
      .on('error', reject)
      .on('data', (row) => {
        students.push({
          userId: generate(11),
          name: row.name,
          email: row.email,
          password: row.password,
          matric: row.matric,
          faculty: row.faculty,
          department: row.department,
          role: 'Student'
        });
      })
      .on('end', () => resolve(students));
  });
}

module.exports = {
  parseStudentCSV
};