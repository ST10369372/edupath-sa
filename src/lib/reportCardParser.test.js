import test from 'node:test'
import assert from 'node:assert/strict'
import { parseReportCardText } from './reportCardParser.js'

test('recognises supported South African subject names and percentage marks', () => {
  assert.deepEqual(
    parseReportCardText('Mathematics 78%\nPhysical Sciences 64\nLife Orientation 81%'),
    [
      { subject: 'Mathematics', mark: 78 },
      { subject: 'Physical Sciences', mark: 64 },
      { subject: 'Life Orientation', mark: 81 },
    ],
  )
})

test('recognises common subject abbreviations without matching substrings', () => {
  assert.deepEqual(
    parseReportCardText('Math Lit 55%\nEnglish FAL 72%\nCAT 68%\nEducation total 90'),
    [
      { subject: 'Mathematical Literacy', mark: 55 },
      { subject: 'English First Additional Language', mark: 72 },
      { subject: 'Computer Applications Technology', mark: 68 },
    ],
  )
})

test('maps an explicitly labelled NSC level to the app mark estimate', () => {
  assert.deepEqual(
    parseReportCardText('Accounting NSC Level 6'),
    [{ subject: 'Accounting', mark: 80 }],
  )
})

test('maps an unlabelled single achievement level and common language subject names', () => {
  assert.deepEqual(
    parseReportCardText('IsiZulu 7\nTshivenda Home Language 5'),
    [
      { subject: 'Zulu Home Language', mark: 92 },
      { subject: 'Tshivenda Home Language', mark: 67 },
    ],
  )
})

test('recognises Life Orientation abbreviation and extra South African languages', () => {
  assert.deepEqual(
    parseReportCardText('LO 81%\nSepedi 6\nSetswana FAL 74%'),
    [
      { subject: 'Life Orientation', mark: 81 },
      { subject: 'Sepedi Home Language', mark: 80 },
      { subject: 'Setswana Home Language', mark: 74 },
    ],
  )
})

test('reads marks printed on the line after the subject', () => {
  assert.deepEqual(
    parseReportCardText('Mathematics\n78%\nPhysical Sciences\n64%'),
    [
      { subject: 'Mathematics', mark: 78 },
      { subject: 'Physical Sciences', mark: 64 },
    ],
  )
})

test('keeps the first valid mark for a subject and ignores subject-only text', () => {
  assert.deepEqual(
    parseReportCardText('Mathematics\nMathematics 73%\nMathematics 61%'),
    [{ subject: 'Mathematics', mark: 73 }],
  )
})
