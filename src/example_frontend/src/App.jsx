import React, { useState, useEffect } from 'react';
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { example_backend } from 'declarations/example_backend';
import './index.scss';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', school: 'IPRC-NGOMA' });
  const [editingStudent, setEditingStudent] = useState(null);

  const authClientPromise = AuthClient.create();

  const signIn = async () => {
    const authClient = await authClientPromise;
    const internetIdentityUrl = process.env.NODE_ENV === 'production'
      ? undefined
      : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`;

    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: () => resolve(undefined),
      });
    });

    const identity = authClient.getIdentity();
    updateIdentity(identity);
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    const authClient = await authClientPromise;
    await authClient.logout();
    updateIdentity(null);
    setIsLoggedIn(false);
  };

  const updateIdentity = (identity) => {
    if (identity) {
      setPrincipal(identity.getPrincipal());
      // Create Actor with HttpAgent
      const agent = new HttpAgent();
      const actor = Actor.createActor(example_backend, { agent: agent });
      example_backend.setActor(actor); // Set the actor for example_backend
    } else {
      setPrincipal(null);
      example_backend.setActor(null); // Clear the actor
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const authClient = await authClientPromise;
      const isAuthenticated = await authClient.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        updateIdentity(identity);
      }
    };

    checkLoginStatus();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsList = await example_backend.getStudents();
      console.log("Fetched students:", studentsList);
      setStudents(studentsList);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    console.log("Submitting student:", newStudent);

    try {
      if (editingStudent) {
        await example_backend.updateStudent(editingStudent.id, newStudent.firstName, newStudent.lastName, newStudent.school);
        console.log("Student updated successfully");
      } else {
        await example_backend.addStudent(newStudent.firstName, newStudent.lastName, newStudent.school);
        console.log("Student added successfully");
      }
      setNewStudent({ firstName: '', lastName: '', school: 'IPRC-NGOMA' });
      setShowAddStudentForm(false);
      setEditingStudent(null);
      fetchStudents(); // Fetch students after adding/updating a student
    } catch (error) {
      console.error("Failed to add/update student:", error);
    }
  };

  const handleEditStudent = (student) => {
    setNewStudent({ firstName: student.firstName, lastName: student.lastName, school: student.school });
    setEditingStudent(student);
    setShowAddStudentForm(true);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await example_backend.deleteStudent(studentId);
      console.log("Student deleted successfully");
      fetchStudents(); // Fetch students after deleting a student
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  };

  const handleFetchStudents = () => {
    fetchStudents();
    setShowAddStudentForm(false); // Close the add student form when fetching students
    setEditingStudent(null);
  };

  return (
    <main>
      <h1>Muhizi Samuel CRUD</h1>
      {isLoggedIn ? (
        <>
          <p>Welcome back, {principal ? principal.toString() : "User"}!</p>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={() => setShowAddStudentForm(true)}>Add New Student</button>
          <button onClick={handleFetchStudents}>View Students</button>
          <h2>Student List</h2>
          <ul>
            {students.map((student, index) => (
              <li key={index}>
                {student.firstName} {student.lastName} - {student.school}
                <button onClick={() => handleEditStudent(student)}>Edit</button>
                <button onClick={() => handleDeleteStudent(student.id)}>Delete</button>
              </li>
            ))}
          </ul>
          {showAddStudentForm && (
            <form onSubmit={handleAddStudent}>
              <label>
                First Name:
                <input
                  type="text"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                  required
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  required
                />
              </label>
              <label>
                School:
                <select
                  value={newStudent.school}
                  onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })}
                  required
                >
                  <option value="IPRC-NGOMA">IPRC-NGOMA</option>
                  <option value="IPRC-MUSANZE">IPRC-MUSANZE</option>
                  <option value="IPRC-TUMBA">IPRC-TUMBA</option>
                </select>
              </label>
              <button type="submit">{editingStudent ? "Update Student" : "Save Student"}</button>
            </form>
          )}
        </>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </main>
  );
}

export default App;
