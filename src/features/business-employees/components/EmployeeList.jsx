export function EmployeeList({ employees = [] }) {
  return (
    <ul>
      {employees.map((employee) => (
        <li key={employee.userId}>{employee.email}</li>
      ))}
    </ul>
  )
}
