import { ExternalLink, Users, MapPin, Calendar, Rss } from 'lucide-react'

// Curated SA professional communities & events by field of study
const FIELDS = [
  {
    field: 'ICT & Computer Science',
    color: 'badge-success',
    communities: [
      { name: 'ZATech Slack', desc: 'South Africa\'s largest tech community — jobs, events, mentorship', url: 'https://zatech.co.za', type: 'Online community' },
      { name: 'PyConZA', desc: 'Annual Python conference for South African developers', url: 'https://za.pycon.org', type: 'Annual conference' },
      { name: 'WordCamp South Africa', desc: 'WordPress & web development meetups across SA cities', url: 'https://south-africa.wordcamp.org', type: 'Meetup series' },
      { name: 'ISACA South Africa', desc: 'IT governance, cybersecurity and audit professional community', url: 'https://engage.isaca.org/southafricachapter', type: 'Professional body' },
      { name: 'AWS User Group South Africa', desc: 'Cloud computing events and meetups in Johannesburg, Cape Town', url: 'https://www.meetup.com/awsugsa/', type: 'Meetup' },
      { name: 'GDG Johannesburg / Cape Town', desc: 'Google Developer Groups — talks, workshops, hackathons', url: 'https://gdg.community.dev/', type: 'Meetup' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=tech+software+developer&source=EVENTS&distance=100&country=ZA',
  },
  {
    field: 'Engineering',
    color: 'badge-warning',
    communities: [
      { name: 'ECSA – Engineering Council of SA', desc: 'Professional body for all engineering disciplines in SA', url: 'https://www.ecsa.co.za', type: 'Professional body' },
      { name: 'SAICE – Civil Engineering', desc: 'South African Institution of Civil Engineering events and CPD', url: 'https://www.saice.org.za', type: 'Professional body' },
      { name: 'SAIEE – Electrical Engineering', desc: 'South African Institute of Electrical Engineers', url: 'https://www.saiee.org.za', type: 'Professional body' },
      { name: 'SAIMME – Mechanical Engineering', desc: 'SA Institution of Mechanical and Mechatronic Engineers', url: 'https://www.saimeche.org.za', type: 'Professional body' },
      { name: 'Engineers Without Borders SA', desc: 'Community projects and networking for engineering students', url: 'https://www.ewb-sa.org', type: 'NGO / Community' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=engineering&source=EVENTS&distance=100&country=ZA',
  },
  {
    field: 'Business & Finance',
    color: 'badge-muted',
    communities: [
      { name: 'SAICA – Chartered Accountants', desc: 'South African Institute of Chartered Accountants events and CPD', url: 'https://www.saica.co.za', type: 'Professional body' },
      { name: 'CFA Society South Africa', desc: 'Investment and finance professional community, Johannesburg', url: 'https://www.cfasociety.org/southafrica', type: 'Professional body' },
      { name: 'Entrepreneurs Organisation (EO) SA', desc: 'Peer-to-peer learning network for entrepreneurs and founders', url: 'https://eonetwork.org/chapters/johannesburg/', type: 'Network' },
      { name: 'Silicon Cape', desc: 'Cape Town tech entrepreneurship ecosystem events', url: 'https://www.siliconcape.com', type: 'Community' },
      { name: 'SAICA Student Board', desc: 'Networking and CPD events specifically for accounting students', url: 'https://www.saica.co.za/students', type: 'Student body' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=business+entrepreneurship+finance&source=EVENTS&distance=100&country=ZA',
  },
  {
    field: 'Health Sciences',
    color: 'badge-danger',
    communities: [
      { name: 'HPCSA', desc: 'Health Professions Council of South Africa — licensing & CPD events', url: 'https://www.hpcsa.co.za', type: 'Professional body' },
      { name: 'SAMA – SA Medical Association', desc: 'Professional association for medical doctors in SA', url: 'https://www.samedical.org', type: 'Professional body' },
      { name: 'DENOSA – Nursing', desc: 'Democratic Nursing Organisation of South Africa', url: 'https://www.denosa.org.za', type: 'Professional body' },
      { name: 'PharmaSA Congress', desc: 'Annual pharmaceutical sciences conference for students & professionals', url: 'https://www.pharmasa.org', type: 'Annual conference' },
      { name: 'Students for Global Health SA', desc: 'Global health advocacy and networking for health science students', url: 'https://studentsforglobalhealth.org', type: 'Student community' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=health+medical+nursing&source=EVENTS&distance=100&country=ZA',
  },
  {
    field: 'Law',
    color: 'badge-muted',
    communities: [
      { name: 'Law Society of South Africa', desc: 'Professional body for attorneys; events and CPD', url: 'https://www.lssa.org.za', type: 'Professional body' },
      { name: 'GDE – General Bar Council', desc: 'Bar associations and advocate community events', url: 'https://www.thebar.co.za', type: 'Professional body' },
      { name: 'NADEL – SA Lawyers', desc: 'National Association of Democratic Lawyers networking events', url: 'https://www.nadel.co.za', type: 'Professional body' },
      { name: 'African Law Students Association', desc: 'Moot courts, networking, internship opportunities for law students', url: 'https://www.africanlawstudents.org', type: 'Student body' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=law+legal&source=EVENTS&distance=100&country=ZA',
  },
  {
    field: 'Creative Arts & Design',
    color: 'badge-success',
    communities: [
      { name: 'Design Indaba', desc: 'South Africa\'s premier design and creativity conference, Cape Town', url: 'https://www.designindaba.com', type: 'Annual conference' },
      { name: 'Loeries Creative Awards', desc: 'Annual celebration of African creative work; student awards included', url: 'https://www.loeries.com', type: 'Annual event' },
      { name: 'DSGN ZA Slack', desc: 'South African designers community — critiques, jobs, resources', url: 'https://www.designza.co.za', type: 'Online community' },
      { name: 'Open Design Cape Town', desc: 'Regular design talks and workshops in Cape Town', url: 'https://www.meetup.com/Open-Design-Cape-Town/', type: 'Meetup' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=design+creative+art&source=EVENTS&distance=100&country=ZA',
  },
  {
    field: 'Education',
    color: 'badge-warning',
    communities: [
      { name: 'SACE – SA Council for Educators', desc: 'Professional body and CPD portal for teachers', url: 'https://www.sace.org.za', type: 'Professional body' },
      { name: 'NAPTOSA', desc: 'National Professional Teachers\' Organisation of SA — events & support', url: 'https://www.naptosa.org.za', type: 'Professional body' },
      { name: 'School of Education Alumni Networks', desc: 'Connect with education alumni at UCT, UP, Wits, SU and more', url: 'https://www.usaf.ac.za', type: 'Alumni networks' },
    ],
    meetupSearch: 'https://www.meetup.com/find/?keywords=education+teaching&source=EVENTS&distance=100&country=ZA',
  },
]

const TYPE_META = {
  'Professional body':  'badge-muted',
  'Annual conference':  'badge-success',
  'Meetup':             'badge-warning',
  'Meetup series':      'badge-warning',
  'Online community':   'badge-muted',
  'Student body':       'badge-success',
  'Community':          'badge-muted',
  'NGO / Community':    'badge-muted',
  'Network':            'badge-muted',
  'Alumni networks':    'badge-muted',
}

export default function NetworkingEvents() {
  return (
    <div className="space-y-8">
      <div className="border-b border-stone-300 pb-8">
        <p className="section-label mb-3">Network</p>
        <h1 className="page-title">Networking & Events</h1>
        <p className="page-sub">Professional communities, conferences and meetups by field of study — start building your network now.</p>
      </div>

      {/* Intro callout */}
      <div className="border border-stone-300 px-6 py-5 grid sm:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <Users size={16} className="opacity-50 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold mb-1">Join communities early</div>
            <p className="text-xs text-stone-500 leading-relaxed">Student members are welcome in most professional bodies and often get free or discounted access.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar size={16} className="opacity-50 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold mb-1">Attend conferences</div>
            <p className="text-xs text-stone-500 leading-relaxed">Many SA conferences offer student passes. Great for meeting professionals and finding bursary sponsors.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Rss size={16} className="opacity-50 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-semibold mb-1">Find local meetups</div>
            <p className="text-xs text-stone-500 leading-relaxed">Each section below has a "Find more on Meetup.com" link filtered to that field and South Africa.</p>
          </div>
        </div>
      </div>

      {/* Field sections */}
      {FIELDS.map(({ field, color, communities, meetupSearch }) => (
        <div key={field}>
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-sm uppercase tracking-widest">{field}</h2>
              <span className={`badge ${color}`}>{communities.length} resources</span>
            </div>
            <a
              href={meetupSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-2xs uppercase tracking-widest text-stone-500 hover:text-ink transition-colors border border-stone-300 px-3 py-1.5"
            >
              <MapPin size={11} /> Find more on Meetup.com <ExternalLink size={10} />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-stone-300">
            {communities.map(({ name, desc, url, type }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-stone-100 p-5 hover:bg-stone-200 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="font-semibold text-sm leading-snug">{name}</div>
                  <span className={`badge ${TYPE_META[type] || 'badge-muted'} flex-shrink-0`}>{type}</span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 text-2xs uppercase tracking-widest mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Visit <ExternalLink size={10} />
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      <div className="border border-stone-300 px-5 py-4 text-xs text-stone-500 leading-relaxed">
        <strong className="text-stone-700">Note:</strong> Event dates and community activity vary. Always check the linked website for current schedules.
        Know of a great SA networking resource we missed? Share it with other students in the <strong className="text-stone-700">Student Experiences</strong> section.
      </div>
    </div>
  )
}
