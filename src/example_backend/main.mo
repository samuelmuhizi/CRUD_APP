import Array "mo:base/Array";

actor {
  stable var students : [Student] = [];

  public type Student = {
    id : Nat;
    firstName : Text;
    lastName : Text;
    school : Text;
  };

  var nextId : Nat = 0;

  public query func getStudents() : async [Student] {
    return students;
  };

  public func addStudent(firstName : Text, lastName : Text, school : Text) : async () {
    let newStudent : [Student] = [{ id = nextId; firstName; lastName; school }];
    students := Array.append(students, newStudent);
    nextId += 1;
  };

  public func deleteStudent(id : Nat) : async () {
    students := Array.filter<Student>(students, func(student : Student) : Bool {
      student.id != id;
    });
  };

  public func updateStudent(id : Nat, newFirstName : Text, newLastName : Text, newSchool : Text) : async () {
    students := Array.map<Student, Student>(students, func(student : Student) : Student {
      if (student.id == id) {
        { id = student.id; firstName = newFirstName; lastName = newLastName; school = newSchool }
      } else {
        student;
      }
    });
  };
};
