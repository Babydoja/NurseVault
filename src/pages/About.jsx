export default function About() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">About NurseVault and submission guidelines</h1>
      <p className="mt-3 text-slate">NurseVault collects past questions so Babcock University nursing students can revise with real examples. Past questions show how topics have been tested; they do not predict future exams.</p>
      <h2 className="mt-6 font-semibold">Before you submit</h2>
      <ul className="mt-2 list-disc pl-5 grid gap-1 text-slate">
        <li>Submit only questions you remember in your own words, or material you have permission to share.</li>
        <li>Include the course, level, semester and session.</li>
        <li>Mark the answer you believe is correct. Admins verify it before it is published.</li>
        <li>Do not upload copyrighted textbooks or restricted exam papers.</li>
      </ul>
    </div>
  )
}
