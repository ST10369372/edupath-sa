const LEVEL_TO_MARK = {
  1: 22,
  2: 32,
  3: 40,
  4: 54,
  5: 67,
  6: 80,
  7: 92,
}

const SUBJECT_ALIASES = [
  ['English First Additional Language', ['english first additional language', 'english first add language', 'english fal', 'eng fal']],
  ['English Home Language', ['english home language', 'english hl', 'eng hl']],
  ['Afrikaans First Additional Language', ['afrikaans first additional language', 'afrikaans first add language', 'afrikaans fal', 'afr fal']],
  ['Afrikaans Home Language', ['afrikaans home language', 'afrikaans hl', 'afr hl']],
  ['Mathematical Literacy', ['mathematical literacy', 'maths literacy', 'math literacy', 'math lit']],
  ['Engineering Graphics & Design', ['engineering graphics and design', 'engineering graphics', 'egd']],
  ['Computer Applications Technology', ['computer applications technology', 'computer applications', 'cat']],
  ['Agricultural Sciences', ['agricultural sciences', 'agricultural science', 'agri sciences']],
  ['Physical Sciences', ['physical sciences', 'physical science', 'phys sciences', 'phys science']],
  ['Life Sciences', ['life sciences', 'life science', 'life sci']],
  ['Life Orientation', ['life orientation', 'life orient', 'lo']],
  ['Information Technology', ['information technology']],
  ['Consumer Studies', ['consumer studies']],
  ['Hospitality Studies', ['hospitality studies']],
  ['Business Studies', ['business studies']],
  ['Dramatic Arts', ['dramatic arts']],
  ['Civil Technology', ['civil technology']],
  ['Electrical Technology', ['electrical technology']],
  ['Mechanical Technology', ['mechanical technology']],
  ['Visual Arts', ['visual arts']],
  ['Zulu Home Language', ['isizulu', 'zulu home language', 'zulu first additional language', 'zulu fal']],
  ['Xhosa Home Language', ['isixhosa', 'xhosa home language', 'xhosa first additional language', 'xhosa fal']],
  ['Sotho Home Language', ['sesotho', 'sotho home language', 'sotho first additional language', 'sotho fal']],
  ['Sepedi Home Language', ['sepedi', 'sesotho sa leboa', 'northern sotho']],
  ['Setswana Home Language', ['setswana', 'tswana home language', 'tswana first additional language', 'tswana fal']],
  ['Siswati Home Language', ['siswati', 'swati home language', 'swati first additional language', 'swati fal']],
  ['Tshivenda Home Language', ['tshivenda', 'venda home language', 'venda first additional language', 'venda fal']],
  ['itsonga Home Language', ['itsonga', 'tsonga home language', 'tsonga first additional language', 'tsonga fal']],
  ['Ndebele Home Language', ['isindebele', 'ndebele home language', 'ndebele first additional language', 'ndebele fal']],
  ['Mathematics', ['mathematics', 'maths', 'math']],
  ['Accounting', ['accounting']],
  ['Economics', ['economics']],
  ['Geography', ['geography']],
  ['History', ['history']],
  ['Tourism', ['tourism']],
  ['Music', ['music']],
]

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function findSubject(line) {
  const normalized = ` ${normalize(line)} `
  for (const [subject, aliases] of SUBJECT_ALIASES) {
    if (aliases.some(alias => normalized.includes(` ${normalize(alias)} `))) return subject
  }
  return null
}

function getMark(line) {
  const numbers = [...line.matchAll(/\b(?:100|[1-9]?\d)\s*%?/g)]
    .map(match => ({
      value: Number.parseInt(match[0], 10),
      percent: match[0].includes('%'),
    }))
    .filter(item => item.value <= 100)
  const percentage = numbers.find(item => item.percent)
  const plausibleMark = numbers.find(item => item.value >= 20)
  const lowMark = numbers.find(item => item.value >= 8)
  const mark = percentage || plausibleMark || lowMark
  if (mark) return mark.value

  const level = [...numbers].reverse().find(item => item.value >= 1 && item.value <= 7)
  if (level && (numbers.length === 1 || /\b(level|nsc|achievement)\b/i.test(line))) {
    return LEVEL_TO_MARK[level.value]
  }
  return null
}

export function parseReportCardText(text) {
  const subjects = new Map()
  const lines = text.split(/\r?\n/).map(line => line.trim())
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const subject = findSubject(line)
    let mark = subject ? getMark(line) : null
    if (subject && mark === null) {
      for (const followingLine of lines.slice(index + 1, index + 3)) {
        if (!followingLine || findSubject(followingLine)) break
        const candidate = getMark(followingLine)
        if (candidate !== null) {
          mark = candidate
          break
        }
      }
    }
    if (subject && mark !== null && !subjects.has(subject)) {
      subjects.set(subject, { subject, mark })
    }
  }
  return [...subjects.values()]
}
