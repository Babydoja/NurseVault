// Plain-language template. Replace CONTACT, and have someone qualified review it before launch.
const CONTACT = 'your-email@example.com'
export default function Privacy() {
  const h = 'mt-6 font-semibold'
  return (
    <div className="max-w-2xl text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Privacy and terms</h1>
      <h2 className={h}>What we collect</h2>
      <p className="mt-1 text-slate">Your name, email address, level, your practice results, the questions you save, and the questions or reports you submit. Passwords are handled by our authentication provider and are never visible to us.</p>
      <h2 className={h}>How it is used</h2>
      <p className="mt-1 text-slate">To run your account, show your progress, and review the content you submit. We do not sell your data. Administrators can see names and submissions; contributors see submission content for review. Your practice results are visible to you.</p>
      <h2 className={h}>Where it is stored</h2>
      <p className="mt-1 text-slate">In a managed database and file storage service (Supabase). You can ask us to delete your account and data at any time.</p>
      <h2 className={h}>Using NurseVault</h2>
      <ul className="mt-1 list-disc pl-5 text-slate">
        <li>Materials are for your personal revision and may not be resold or redistributed.</li>
        <li>Submit questions in your own words, or material you have permission to share. Do not submit copyrighted textbooks or restricted exam papers.</li>
        <li>Answers are marked as verified only after review. Unverified answers may be wrong, so check with your lecturers and textbooks.</li>
        <li>Past questions show how topics have been tested. They do not predict future exams, and NurseVault is not affiliated with the university's examination office.</li>
        <li>We may remove content or accounts that break these rules.</li>
      </ul>
      <h2 className={h}>Contact and takedown requests</h2>
      <p className="mt-1 text-slate">If you believe content here should not be shared, or you want your data deleted, email {CONTACT}.</p>
    </div>
  )
}
