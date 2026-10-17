// Mock data. Replace with Supabase queries in Phase 2/3.
export const levels = ['100','200','300','400','500']
export const semesters = ['First','Second']
export const sessions = ['2021/2022','2022/2023','2023/2024','2024/2025']
export const questions = [
 {id:1,course:'NSG 211',title:'Fundamentals of Nursing',level:'200',semester:'First',session:'2023/2024',topic:'Vital signs',text:'Which of the following is the normal adult resting pulse rate range?',options:['40–60 bpm','60–100 bpm','100–120 bpm','120–140 bpm'],answer:1,verified:true,source:'Student recall'},
 {id:2,course:'NSG 211',title:'Fundamentals of Nursing',level:'200',semester:'First',session:'2022/2023',topic:'Infection control',text:'The single most effective measure for preventing hospital-acquired infection is:',options:['Wearing gloves always','Hand hygiene','Isolation of all patients','Routine antibiotics'],answer:1,verified:true,source:'Lecturer-approved'},
 {id:3,course:'ANA 201',title:'Human Anatomy',level:'200',semester:'Second',session:'2023/2024',topic:'Cardiovascular',text:'Which chamber of the heart pumps oxygenated blood into the aorta?',options:['Right atrium','Right ventricle','Left atrium','Left ventricle'],answer:3,verified:false,source:'Student recall'},
 {id:4,course:'PHS 201',title:'Human Physiology',level:'200',semester:'Second',session:'2024/2025',topic:'Renal',text:'The functional unit of the kidney is the:',options:['Nephron','Neuron','Alveolus','Sarcomere'],answer:0,verified:true,source:'Student recall'}]
export const courses = [...new Map(questions.map(q=>[q.course,q])).values()]
export const materials = [
 {id:1,title:'Fundamentals of Nursing: revision notes',course:'NSG 211',type:'PDF',size:'1.2 MB'},
 {id:2,title:'Anatomy diagrams summary',course:'ANA 201',type:'PDF',size:'3.4 MB'}]
export const submissions = [
 {id:1,course:'NSG 211',text:'State two signs of hypovolaemic shock.',by:'Student A',session:'2024/2025'},
 {id:2,course:'PHS 201',text:'Define cardiac output.',by:'Student B',session:'2024/2025'}]
